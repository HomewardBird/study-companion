import { IconArrowsMaximize, IconArrowUp, IconMinus, IconSettings, IconWorldWww } from '@tabler/icons-react'
import { createMessage, type Message, type MessageToolCallPart } from '@shared/types'
import { useEffect, useRef, useState } from 'react'
import { rendererApplication } from '@/app/renderer-application'
import Markdown from '@/components/Markdown'
import { useSessionTranscript } from '@/hooks/useSessionPresentation'
import { getWebSearchConfigurationIssue } from '@/packages/web-search/configuration-issue'
import { lastUsedModelStore, useLastUsedModelStore } from '@/stores/lastUsedModelStore'
import { submitNewUserMessage } from '@/stores/session/messages'
import { useSessionActivity } from '@/stores/sessionActivityStore'
import { settingsStore, useSettingsStore } from '@/stores/settingsStore'
import { uiStore } from '@/stores/uiStore'
import { getMessageText } from '@/utils/message'

const QUICK_SESSION_KEY = 'study-quick-session-id'
const QUICK_WEB_KEY = 'study-quick-web-enabled'
const SEARCH_CONTEXT_ENTRY = /\n(\d+)\.\s+(.+)\n(https?:\/\/\S+)\n([^\n]*)/g

type QuickSource = { title: string; url: string }
let quickSessionPromise: Promise<string> | null = null

function getDefaultModel() {
  const settings = settingsStore.getState().getSettings()
  if (settings.defaultChatModel) {
    return {
      provider: settings.defaultChatModel.provider,
      modelId: settings.defaultChatModel.model,
    }
  }
  return lastUsedModelStore.getState().chat
}

function storeQuickSessionId(sessionId: string) {
  try {
    localStorage.setItem(QUICK_SESSION_KEY, sessionId)
  } catch {
    // localStorage can be unavailable in restricted environments.
  }
}

function collectSources(messages: Message[]): QuickSource[] {
  let lastUserIndex = -1
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') {
      lastUserIndex = index
      break
    }
  }
  const relevant = lastUserIndex >= 0 ? messages.slice(lastUserIndex) : messages

  const sources: QuickSource[] = []
  const seen = new Set<string>()
  const addSource = (title: string, url: string) => {
    const trimmedUrl = url.trim()
    if (!/^https?:\/\//i.test(trimmedUrl) || seen.has(trimmedUrl)) {
      return
    }
    seen.add(trimmedUrl)
    sources.push({ title: title.trim() || trimmedUrl, url: trimmedUrl })
  }

  for (const message of relevant) {
    for (const part of message.contentParts) {
      if (part.type === 'tool-call') {
        const toolPart = part as MessageToolCallPart
        if (toolPart.toolName !== 'web_search' || toolPart.state !== 'result') {
          continue
        }
        const result = toolPart.result as { searchResults?: Array<{ title?: unknown; link?: unknown }> } | undefined
        if (!Array.isArray(result?.searchResults)) {
          continue
        }
        for (const item of result.searchResults) {
          if (typeof item.title === 'string' && typeof item.link === 'string') {
            addSource(item.title, item.link)
          }
        }
        continue
      }
      if (message.role !== 'system') {
        continue
      }
      const text = getMessageText(message, false, false)
      if (!text.includes('<WEB_SEARCH_RESULTS>')) {
        continue
      }
      for (const block of text.split(/\n(?=\d+\.\s)/)) {
        const lines = block.trim().split('\n')
        const title = lines[0]?.replace(/^\d+\.\s*/, '') ?? ''
        const url = lines.find((line) => /^https?:\/\//i.test(line.trim())) ?? ''
        if (title && url) {
          addSource(title, url)
        }
      }
    }
  }

  return sources.slice(0, 6)
}

async function createQuickSession() {
  const model = getDefaultModel()
  const prompt = settingsStore.getState().defaultPrompt || ''
  const session = await rendererApplication.sessions.createSession(
    {
      name: '快问',
      type: 'chat',
      messages: prompt ? [createMessage('system', prompt)] : [],
      settings: model ? { ...model } : {},
    },
    undefined
  )
  storeQuickSessionId(session.id)
  return session.id
}

async function ensureQuickSession() {
  if (quickSessionPromise) {
    return quickSessionPromise
  }
  quickSessionPromise = (async () => {
    let existingId = ''
    try {
      existingId = localStorage.getItem(QUICK_SESSION_KEY) || ''
    } catch {
      existingId = ''
    }
    if (existingId) {
      const existing = await rendererApplication.sessions.getSessionHeader(existingId).catch(() => null)
      if (existing) {
        return existingId
      }
    }
    return createQuickSession()
  })()
  try {
    return await quickSessionPromise
  } catch (error) {
    quickSessionPromise = null
    throw error
  }
}

function QuickMessage({ message, generating }: { message: Message; generating: boolean }) {
  const text = getMessageText(message, false, false).trim()
  if (!text) {
    return null
  }
  if (message.role === 'user') {
    return <div className="quick-user">{text}</div>
  }
  if (message.role !== 'assistant') {
    return null
  }
  return (
    <div className="quick-answer">
      <Markdown className="quick-markdown" generating={generating}>
        {text}
      </Markdown>
    </div>
  )
}

export default function QuickApp() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [webEnabled, setWebEnabled] = useState(() => {
    try {
      return localStorage.getItem(QUICK_WEB_KEY) === '1'
    } catch {
      return false
    }
  })
  const defaultChatModel = useSettingsStore((state) => state.defaultChatModel)
  const lastUsedChat = useLastUsedModelStore((state) => state.chat)
  const modelReady = Boolean(defaultChatModel || lastUsedChat)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const activity = useSessionActivity(sessionId ?? '')
  const transcript = useSessionTranscript(sessionId, 'tail')
  const generating = activity === 'generating'

  useEffect(() => {
    let cancelled = false
    void ensureQuickSession()
      .then((id) => {
        if (!cancelled) setSessionId(id)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '无法创建对话')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const focus = () => inputRef.current?.focus()
    focus()
    const unsubscribe = window.electronAPI?.onWindowShow?.(focus)
    return unsubscribe
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        void window.electronAPI?.invoke('quick:hide')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [transcript.messages, generating])

  const send = async () => {
    const text = input.trim()
    if (!text || sending || generating) {
      return
    }
    setError('')
    const model = getDefaultModel()
    if (!model) {
      setError('请先配置模型')
      return
    }
    if (webEnabled) {
      const webSearch = settingsStore.getState().getSettings().extension.webSearch
      const issue = getWebSearchConfigurationIssue({
        provider: webSearch.provider,
        tavilyApiKey: webSearch.tavilyApiKey,
        bochaApiKey: webSearch.bochaApiKey,
        queritApiKey: webSearch.queritApiKey,
        searxngBaseUrl: webSearch.searxngBaseUrl,
      })
      if (issue) {
        setError('请先在 设置 → 联网搜索 中填写 API Key')
        return
      }
    }
    setInput('')
    setSending(true)
    try {
      const id = await ensureQuickSession()
      if (!sessionId) {
        setSessionId(id)
      }
      uiStore.getState().setSessionWebBrowsing(id, webEnabled)
      await submitNewUserMessage(id, {
        newUserMsg: createMessage('user', text),
        needGenerating: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const toggleWeb = () => {
    setWebEnabled((previous) => {
      const next = !previous
      try {
        localStorage.setItem(QUICK_WEB_KEY, next ? '1' : '0')
      } catch {
        // Ignore storage restrictions.
      }
      if (sessionId) {
        uiStore.getState().setSessionWebBrowsing(sessionId, next)
      }
      return next
    })
  }

  const expand = () => {
    void window.electronAPI?.invoke('quick:expand', sessionId)
  }

  const openSettings = () => {
    void window.electronAPI?.invoke('quick:open-settings')
  }

  const messages = transcript.messages.filter((message) => message.role === 'user' || message.role === 'assistant')
  const sources = collectSources(transcript.messages)

  return (
    <div className="quick-root">
      <div className="quick-shell">
        <div className="quick-titlebar">
          <span className="quick-title">学习伴侣</span>
          <div className="quick-title-actions">
            <button type="button" className="quick-icon-button" title="展开" onClick={expand}>
              <IconArrowsMaximize size={15} stroke={1.8} />
            </button>
            <button
              type="button"
              className="quick-icon-button"
              title="隐藏"
              onClick={() => void window.electronAPI?.invoke('quick:hide')}
            >
              <IconMinus size={15} stroke={1.8} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="quick-messages">
          {messages.length === 0 ? (
            <div className="quick-empty">直接问，讲到你懂为止。</div>
          ) : (
            messages.map((message) => (
              <QuickMessage
                key={message.id}
                message={message}
                generating={generating && message === messages[messages.length - 1]}
              />
            ))
          )}
          {sources.length > 0 && (
            <div className="quick-sources">
              <div className="quick-sources-title">来源</div>
              {sources.map((source) => (
                <button
                  key={source.url}
                  type="button"
                  className="quick-source"
                  title={source.url}
                  onClick={() => void window.electronAPI?.invoke('openLink', source.url)}
                >
                  {source.title}
                </button>
              ))}
            </div>
          )}
          {generating && (
            <div className="quick-thinking">{webEnabled ? '正在联网搜索并组织讲解…' : '正在组织讲解…'}</div>
          )}
        </div>

        <div className="quick-composer">
          {!modelReady && (
            <button type="button" className="quick-setup" onClick={openSettings}>
              <IconSettings size={14} stroke={1.8} />
              尚未配置模型，点此设置
            </button>
          )}
          {error && <div className="quick-error">{error}</div>}
          <div className="quick-input-row">
            <button
              type="button"
              className={`quick-web-toggle${webEnabled ? ' is-active' : ''}`}
              title={webEnabled ? '联网搜索已开启' : '联网搜索已关闭'}
              aria-pressed={webEnabled}
              onClick={toggleWeb}
            >
              <IconWorldWww size={16} stroke={1.8} />
            </button>
            <textarea
              ref={inputRef}
              className="quick-input"
              value={input}
              rows={1}
              placeholder={modelReady ? '问一个问题…' : '先在设置里填入 API Key'}
              disabled={!modelReady}
              onChange={(event) => {
                setInput(event.currentTarget.value)
                const el = event.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`
              }}
              onCompositionStart={() => {
                composingRef.current = true
              }}
              onCompositionEnd={() => {
                composingRef.current = false
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || composingRef.current || event.nativeEvent.isComposing) {
                  return
                }
                event.preventDefault()
                void send()
              }}
            />
            <button
              type="button"
              className="quick-send"
              title="发送"
              disabled={!modelReady || !input.trim() || sending || generating}
              onClick={() => void send()}
            >
              <IconArrowUp size={17} stroke={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

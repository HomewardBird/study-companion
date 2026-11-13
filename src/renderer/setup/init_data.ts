import { DEFAULT_SYSTEM_PROMPT } from '@chatbox/core/domain/settings'
import { SessionHeaderSchema } from '@shared/types'
import { rendererApplication, sessionRepository } from '@/app/renderer-application'
import {
  defaultSessionsForCN,
  defaultSessionsForEN,
  legacyStudyModeSessionIds,
  STUDY_PROMPT_MARKER,
} from '@/packages/initial_data'
import platform from '@/platform'
import { settingsStore } from '@/settings-runtime'
import { getMetaStorage, getSessionMeta } from '@/stores/sessionHelpers'
import { getMessageText } from '@/utils/message'
import { createSessionMetaRecordsFromLegacyList } from '@/utils/session-utils'
import { LEGACY_DEFAULT_SYSTEM_PROMPTS, legacyStudyModePrompts } from './legacy_prompts'

export async function initData() {
  await initSessionsIfNeeded()
}

async function removeLegacyStudyModes() {
  const metaStorage = await getMetaStorage()
  const removed: string[] = []

  for (const id of legacyStudyModeSessionIds) {
    const existing = await sessionRepository.getSessionHeader(id).catch(() => null)
    if (!existing) continue
    try {
      await sessionRepository.deleteSession(id)
      removed.push(id)
    } catch (error) {
      console.warn(`[init_data] failed to remove legacy study mode ${id}:`, error)
    }
  }

  if (removed.length > 0) {
    await metaStorage.deleteMany(removed)
  }
}

async function upgradeDefaultSessionPrompts(defaultSessions: typeof defaultSessionsForCN) {
  for (const session of defaultSessions) {
    const existing = await sessionRepository.getSessionHeader(session.id).catch(() => null)
    if (!existing) continue

    const page = await rendererApplication.sessions
      .readSessionTranscriptWindow({ sessionId: session.id, limit: 4, origin: 'head' })
      .catch(() => null)
    if (!page) continue

    const systemRow = page.messages.find(({ message }) => message.role === 'system')
    if (!systemRow) continue
    const currentPrompt = getMessageText(systemRow.message, false, false)
    if (currentPrompt.includes(STUDY_PROMPT_MARKER)) continue
    if (currentPrompt !== legacyStudyModePrompts[session.id]) continue

    const nextSystemMessage = session.messages.find((message) => message.role === 'system')
    const nextPrompt = nextSystemMessage ? getMessageText(nextSystemMessage, false, false) : ''
    if (!nextPrompt) continue

    try {
      await rendererApplication.sessions.setSessionSystemPrompt(session.id, nextPrompt)
    } catch (error) {
      console.warn(`[init_data] failed to upgrade prompt for ${session.id}:`, error)
    }
  }
}

function upgradeDefaultPromptSetting() {
  const { defaultPrompt, setSettings } = settingsStore.getState()
  if (!defaultPrompt || defaultPrompt === DEFAULT_SYSTEM_PROMPT) return
  if (!LEGACY_DEFAULT_SYSTEM_PROMPTS.includes(defaultPrompt)) return
  setSettings({ defaultPrompt: DEFAULT_SYSTEM_PROMPT })
}

export async function ensureDefaultSessions() {
  upgradeDefaultPromptSetting()
  await removeLegacyStudyModes()

  const lang = await platform.getLocale().catch(() => 'en')
  const defaultSessions = lang.startsWith('zh') ? defaultSessionsForCN : defaultSessionsForEN
  const missing: typeof defaultSessions = []

  for (const session of defaultSessions) {
    const existing = await sessionRepository.getSessionHeader(session.id).catch(() => null)
    if (!existing) {
      missing.push(session)
    }
  }

  if (missing.length > 0) {
    for (const session of missing) {
      await sessionRepository.createSessionRows(SessionHeaderSchema.parse(session), session.messages)
    }

    const metaStorage = await getMetaStorage()
    const records = createSessionMetaRecordsFromLegacyList(missing.map(getSessionMeta))
    await metaStorage.createMany(records)
  }

  await upgradeDefaultSessionPrompts(defaultSessions)
}

async function initSessionsIfNeeded() {
  const metaStorage = await getMetaStorage()
  const total = await metaStorage.getAllTotal()
  if (total > 0) {
    return
  }

  const lang = await platform.getLocale().catch(() => 'en')
  const defaultSessions = lang.startsWith('zh') ? defaultSessionsForCN : defaultSessionsForEN

  for (const session of defaultSessions) {
    await sessionRepository.createSessionRows(SessionHeaderSchema.parse(session), session.messages)
  }

  const records = createSessionMetaRecordsFromLegacyList(defaultSessions.map(getSessionMeta))

  await metaStorage.createMany(records)
}

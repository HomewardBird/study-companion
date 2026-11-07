import { getDefaultInterfaceColors } from '../../theme-colors'
import { DEFAULT_ENABLED_BUILTIN_SKILL_NAMES } from '../../types/skills'
import { type DocumentParserConfig, type Settings, Theme } from './settings-schema'

export const DEFAULT_SYSTEM_PROMPT = `你是我的学习陪伴助手，主要帮助我学习高中课程和计算机入门。

回答要求：
- 先用一两句话给结论，再按需要展开；解释用通俗语言，不堆术语。
- 数学公式用 LaTeX，代码用带语言标记的代码块。
- 不要替我写作业、作文或项目报告；用提问、提示和分步引导帮我自己想出来。
- 我明确说“直接讲”时，再给完整解法。
- 回答保持简洁，删除与问题无关的内容。
- 当我说“记住”，或出现值得长期保留的偏好、目标、错题时，用 Markdown 列出候选记忆，标注置信度与来源，等我确认。
- 当系统提供了联网搜索结果时，优先依据结果回答，并在相关句末附上来源链接；没有用上结果或没有搜到可靠信息时，明确说明“未核实”，不要编造来源。`

export interface SettingsHostDefaults {
  isDesktopLike: boolean
}

export function getDefaultDocumentParser(host: SettingsHostDefaults): DocumentParserConfig {
  return host.isDesktopLike ? { type: 'local' } : { type: 'chatbox-ai' }
}

/**
 * Returns the exact historical initial snapshot without importing the broader
 * defaults module (which also initializes UUID/provider dependencies).
 */
export function createDefaultSettings(): Settings {
  return {
    showWordCount: false,
    showTokenCount: false,
    showTokenUsed: false,
    showModelName: false,
    showMessageTimestamp: false,
    showFirstTokenLatency: false,
    showAvatar: true,
    hideSystemPromptMessage: true,
    messageLayout: 'bubble',
    autoScrollNewMessagesToTop: false,
    userAvatarKey: '',
    defaultAssistantAvatarKey: '',
    backgroundImageKey: '',
    backgroundImageOpacity: 0.16,
    theme: Theme.System,
    interfaceColors: getDefaultInterfaceColors(),
    interfaceColorPresets: [],
    language: 'zh-Hans',
    fontSize: 14,
    spellCheck: true,
    defaultPrompt: DEFAULT_SYSTEM_PROMPT,
    allowReportingAndTracking: true,
    hasExpiredLicense: false,
    chatboxAIDesktopPromptDismissed: false,
    enableMarkdownRendering: true,
    enableLaTeXRendering: true,
    enableMermaidRendering: true,
    injectDefaultMetadata: true,
    autoPreviewArtifacts: false,
    autoCollapseCodeBlock: true,
    pasteLongTextAsAFile: true,
    autoGenerateTitle: true,
    autoCompaction: true,
    compactionThreshold: 0.75,
    pauseOnToolCallLimit: true,
    autoLaunch: true,
    autoUpdate: true,
    betaUpdate: false,
    defaultEmbeddingModel: undefined,
    defaultRerankModel: undefined,
    shortcuts: {
      quickToggle: 'Ctrl+Alt+Space',
      inputBoxFocus: 'mod+i',
      inputBoxWebBrowsingMode: 'mod+e',
      newChat: 'mod+n',
      newPictureChat: '',
      sessionListNavNext: 'mod+tab',
      sessionListNavPrev: 'mod+shift+tab',
      sessionListNavTargetIndex: 'mod',
      messageListRefreshContext: 'mod+shift+n',
      dialogOpenSearch: 'mod+k',
      inputBoxSendMessage: 'Enter',
      inputBoxSendMessageWithoutResponse: 'Ctrl+Enter',
      optionNavUp: 'up',
      optionNavDown: 'down',
      optionSelect: 'enter',
    },
    extension: {
      webSearch: {
        provider: 'tavily',
        tavilyApiKey: '',
        bochaApiKey: '',
        queritApiKey: '',
        queritMaxResults: 5,
        queritTimeRange: 'none',
        searxngBaseUrl: '',
      },
      knowledgeBase: {
        models: {
          embedding: undefined,
          rerank: undefined,
        },
      },
      // Kept unset until an older persisted snapshot is migrated.
      documentParser: undefined,
    },
    mcp: {
      servers: [],
      enabledBuiltinServers: [],
    },
    skills: {
      enabledSkillNames: [...DEFAULT_ENABLED_BUILTIN_SKILL_NAMES],
      translationEnabled: true,
      builtinDefaultsInitialized: true,
      appliedDefaultBuiltinSkillNames: [...DEFAULT_ENABLED_BUILTIN_SKILL_NAMES],
    },
  }
}

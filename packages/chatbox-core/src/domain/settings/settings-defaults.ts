import { getDefaultInterfaceColors } from '../../theme-colors'
import { DEFAULT_ENABLED_BUILTIN_SKILL_NAMES } from '../../types/skills'
import { type DocumentParserConfig, type Settings, Theme } from './settings-schema'

export const DEFAULT_SYSTEM_PROMPT = `# 角色
你是面向中国高中生的学习助手，覆盖高中各科和计算机入门。目标是帮学生真正学会，而不是替学生完成作业。

# 回答深度
默认档：先用一两句话给结论，再给关键思路，不展开完整推导。
深入档：学生说“讲透 / 为什么 / 推导 / 一步一步 / 举个反例 / 再来一题”时，按“直觉→定义→推导→例子→易错点”展开。
直接档：学生说“直接给答案 / 赶时间”时，给答案和关键步骤，最后补一句“要不要讲为什么”。
问题指代不清或信息不全时，先问一个最关键的问题，不要猜。

# 教学方式
先判断卡点：概念不清、方法不会、计算失误，还是审题遗漏。
用提问和提示引导，一次只推进一小步；学生连续卡住两次，再给可执行的下一步。
不代写作业、作文或报告；可以给提纲、检查清单、逐段反馈。鼓励要具体到“哪一步对、哪一步错”，不说“你很棒”“加油”。

# 事实与格式
不确定就直说，并标明是推测；不编教材页码、真题年份、作者或论文，无法核实时标注“凭记忆，需核对”。
数学公式用 LaTeX，代码用带语言标记的代码块。
默认用短段落，先结论后理由；只有步骤、对比、清单才用列表，不写开场客套。
当系统提供联网搜索结果时，优先依据结果回答，并在相关句末附来源链接；没搜到可靠信息就明说“未核实”。
当我说“记住”，或出现值得长期保留的偏好、目标、错题时，用 Markdown 列出候选记忆，标注置信度和来源，等我确认。

# 长对话
只把与当前问题相关的历史当依据；旧题默认已结束，除非我说“接着上一题”。
历史里有多道题，或问题含“刚才 / 上面 / 这个”等指代时，先用一句话确认你指的是哪道题；确认不了就先问。
不要因为历史里出现过相似题，就套用旧答案。

# 范例
<example>
学生：什么是动能？
助手：动能是物体因为运动而具有的能量，大小是 $\\frac12 mv^2$：质量越大、速度越快，动能越大；速度翻倍，动能变成四倍。你想先看它的推导，还是先做一道判断题？
</example>

<example>
学生：别直接给答案。为什么动量守恒？一步一步讲。
助手：先确认一下：你想弄懂的是“系统不受外力时，总动量为什么不变”。直觉上，碰撞时两个物体互相推，作用时间相同、力大小相等方向相反，所以彼此的动量变化正好抵消。由牛顿第三定律 $F_1=-F_2$，两边同乘作用时间 $\\Delta t$，就得到 $\\Delta p_1=-\\Delta p_2$。要注意动量是矢量，方向相反时要带负号。你可以先用这个思路检查碰撞前后总动量。
</example>`

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

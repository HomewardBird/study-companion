import { TestId } from '@shared/automation/testids'
import { Theme } from '@shared/types'
import {
  IconCategory,
  IconDatabase,
  IconKeyboard,
  IconListDetails,
  IconMessages,
  IconPalette,
  type IconProps,
} from '@tabler/icons-react'
import type { ElementType } from 'react'
import { useTranslation } from 'react-i18next'
import { useProviders } from '@/hooks/useProviders'
import { useSettingsStore } from '@/stores/settingsStore'

export type SettingsPageKey =
  | 'chatbox-ai'
  | 'provider'
  | 'default-models'
  | 'web-search'
  | 'mcp'
  | 'knowledge-base'
  | 'skills'
  | 'agent'
  | 'document-parser'
  | 'chat'
  | 'context'
  | 'appearance'
  | 'hotkeys'
  | 'data'
  | 'advanced'
  | 'about'

export interface SettingsNavItem {
  key: SettingsPageKey
  label: string
  /** Product names such as "MCP" and "Skills" are shown as-is. */
  noTranslate?: boolean
  icon: ElementType<IconProps>
  testId?: string
}

export interface SettingsNavGroup {
  title: string
  items: SettingsNavItem[]
}

/** Settings navigation shared by the desktop sidebar, the small-screen index and settings search. */
export function getSettingsNavGroups(): SettingsNavGroup[] {
  return [
    {
      title: 'Models',
      items: [
        { key: 'provider', label: 'Model Provider', icon: IconCategory },
        {
          key: 'default-models',
          label: 'Default Models',
          icon: IconListDetails,
          testId: TestId.settings.navDefaultModels,
        },
      ],
    },
    {
      title: 'Chat',
      items: [{ key: 'chat', label: 'Chat', icon: IconMessages, testId: TestId.settings.navChat }],
    },
    {
      title: 'App',
      items: [
        { key: 'appearance', label: 'Appearance', icon: IconPalette, testId: TestId.settings.navAppearance },
        { key: 'hotkeys', label: '快捷键与启动', icon: IconKeyboard },
        { key: 'data', label: 'Data & Backup', icon: IconDatabase, testId: TestId.settings.navData },
      ],
    },
  ]
}

/** Pages reached from a settings page rather than the navigation, mapped to their nav entry. */
const NESTED_PAGES: Record<string, SettingsPageKey> = {
  'app-icon': 'appearance',
  archive: 'data',
  general: 'appearance',
}

export function settingsNavKeyForSection(section: string | undefined): string | undefined {
  if (!section) return undefined
  return NESTED_PAGES[section] ?? section
}

export interface SettingsSearchEntry {
  /** Row anchor; the page itself when absent. */
  id?: string
  page: SettingsPageKey
  label: string
  labelOptions?: Record<string, unknown>
}

/**
 * Rows reachable from settings search, keyed by their English label. Pages are indexed too, so a
 * search for a page name lands on the page.
 */
export const SETTINGS_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  { page: 'chat', id: 'system-prompt', label: 'System prompt' },
  { page: 'chat', id: 'temperature', label: 'Temperature' },
  { page: 'chat', id: 'top-p', label: 'Top P' },
  { page: 'chat', id: 'stream', label: 'Stream output' },
  { page: 'chat', id: 'message-layout', label: 'Message layout' },
  { page: 'chat', id: 'markdown', label: 'Markdown Rendering' },
  { page: 'chat', id: 'latex', label: 'LaTeX Rendering' },
  { page: 'appearance', id: 'theme', label: 'Theme' },
  { page: 'appearance', id: 'language', label: 'Language' },
  { page: 'appearance', id: 'theme-color', label: 'Theme color' },
  { page: 'appearance', id: 'font-size', label: 'Font Size' },
  { page: 'data', id: 'recover-sessions', label: 'Recover Conversation List' },
  { page: 'data', id: 'export-data', label: 'Export Data' },
  { page: 'data', id: 'import-data', label: 'Import Backup' },
  { page: 'data', id: 'archived-chats', label: 'Archived Chats' },
]

/** Current value shown beside a page on the small-screen settings index. */
export function useSettingsNavMeta(): Partial<Record<SettingsPageKey, string>> {
  const { t } = useTranslation()
  const { providers } = useProviders()
  const theme = useSettingsStore((s) => s.theme)
  const defaultChatModelId = useSettingsStore((s) => s.defaultChatModel?.model)

  return {
    provider: providers.length > 0 ? String(t('{{count}} configured', { count: providers.length })) : undefined,
    'default-models': defaultChatModelId,
    appearance: String(
      theme === Theme.Dark ? t('Dark Mode') : theme === Theme.Light ? t('Light Mode') : t('Follow System')
    ),
  }
}

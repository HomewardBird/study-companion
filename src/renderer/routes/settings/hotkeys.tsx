import { createFileRoute } from '@tanstack/react-router'
import { SettingSwitchRow, SettingsPage, SettingsSection } from '@/components/settings/SettingsLayout'
import { ShortcutConfig } from '@/components/Shortcut'
import { useSettingsStore } from '@/stores/settingsStore'

export const Route = createFileRoute('/settings/hotkeys')({
  component: RouteComponent,
})

export function RouteComponent() {
  const shortcuts = useSettingsStore((state) => state.shortcuts)
  const autoLaunch = useSettingsStore((state) => state.autoLaunch)
  const setSettings = useSettingsStore((state) => state.setSettings)
  return (
    <SettingsPage title="快捷键与启动" description="在任何地方按快捷键呼出小窗；开机后可以完全静默驻留。">
      <SettingsSection title="启动">
        <SettingSwitchRow
          id="auto-launch"
          label="开机自动静默启动"
          description="开机后不显示主窗口，只在托盘运行；按快捷键呼出小窗。"
          checked={autoLaunch}
          onChange={(checked) => setSettings({ autoLaunch: checked })}
        />
      </SettingsSection>
      <SettingsSection title="快捷键">
        <ShortcutConfig shortcuts={shortcuts} setShortcuts={(shortcuts) => setSettings({ shortcuts })} />
      </SettingsSection>
    </SettingsPage>
  )
}

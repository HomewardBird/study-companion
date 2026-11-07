import { Flex, Image, NavLink, Stack, Text } from '@mantine/core'
import { TestId } from '@shared/automation/testids'
import { IconPlus, type IconProps, IconSearch, IconSettings } from '@tabler/icons-react'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useRef } from 'react'
import Divider from './components/common/Divider'
import { ICON_SIZE, ICON_STROKE_WIDTH } from './components/common/IconButton'
import { ScalableIcon } from './components/common/ScalableIcon'
import { useAppTitleBarHeight } from './components/layout/AppTitleBar'
import SessionList from './components/session/SessionList'
import { useIsSmallScreen, useSidebarWidth } from './hooks/useScreenChange'
import { navigateToSettings } from './modals/settings-navigation'
import { getSidebarModalSx } from './sidebar-drawer'
import icon from './static/icon.png'
import { useUIStore } from './stores/uiStore'

export default function Sidebar() {
  const navigate = useNavigate()
  const showSidebar = useUIStore((s) => s.showSidebar)
  const setShowSidebar = useUIStore((s) => s.setShowSidebar)
  const setOpenSearchDialog = useUIStore((s) => s.setOpenSearchDialog)
  const sessionListViewportRef = useRef<HTMLDivElement>(null)
  const sidebarWidth = useSidebarWidth()
  const isSmallScreen = useIsSmallScreen()
  const titleBarHeight = useAppTitleBarHeight()

  const closeOnSmallScreen = useCallback(() => {
    if (isSmallScreen) setShowSidebar(false)
  }, [isSmallScreen, setShowSidebar])

  const handleOpenSearch = useCallback(() => {
    setOpenSearchDialog(true, true)
    closeOnSmallScreen()
  }, [closeOnSmallScreen, setOpenSearchDialog])

  const handleCreateNewSession = useCallback(() => {
    navigate({ to: '/' })
    closeOnSmallScreen()
  }, [navigate, closeOnSmallScreen])

  return (
    <SwipeableDrawer
      anchor="left"
      variant={isSmallScreen ? 'temporary' : 'persistent'}
      open={showSidebar}
      onClose={() => setShowSidebar(false)}
      onOpen={() => setShowSidebar(true)}
      ModalProps={{ keepMounted: true, disableEnforceFocus: true, sx: getSidebarModalSx(showSidebar) }}
      sx={{
        '& .MuiDrawer-paper': {
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          border: 0,
          boxSizing: 'border-box',
          width: isSmallScreen ? '75vw' : sidebarWidth,
          maxWidth: '75vw',
          ...(titleBarHeight
            ? { top: `calc(var(--mobile-safe-area-inset-top, 0px) + ${titleBarHeight}px)`, height: 'auto', bottom: 0 }
            : {}),
        },
      }}
      PaperProps={{ sx: { overflowY: 'initial', ...(isSmallScreen ? { width: '75vw' } : {}) } }}
    >
      <Stack
        data-testid={TestId.sidebar.root}
        h="100%"
        gap={0}
        pt={titleBarHeight ? 0 : 'var(--mobile-safe-area-inset-top, 0px)'}
        pb="var(--mobile-safe-area-inset-bottom, 0px)"
        className="relative"
      >
        {isSmallScreen && (
          <Flex
            align="center"
            gap="xs"
            px="md"
            py="sm"
            onClick={handleCreateNewSession}
            className="cursor-pointer"
          >
            <Image src={icon} w={20} h={20} />
            <Text span c="chatbox-primary" fz={16} lh="24px" fw={600} truncate>
              学习伴侣
            </Text>
          </Flex>
        )}
        {!isSmallScreen && <Flex h="xs" />}

        <Stack gap={2} px="xs" pb="xs" className="shrink-0">
          {!isSmallScreen && <NewChatButton onClick={handleCreateNewSession} />}
          <SidebarNavRow
            testId={TestId.sidebar.search}
            label="搜索"
            icon={IconSearch}
            onClick={handleOpenSearch}
          />
        </Stack>

        <SessionList sessionListViewportRef={sessionListViewportRef} />

        <Stack gap="xs" px="xs" pb="xs">
          <Divider />
          <SidebarNavRow
            testId={TestId.sidebar.settingsTrigger}
            label="设置"
            icon={IconSettings}
            onClick={() => {
              navigateToSettings()
              closeOnSmallScreen()
            }}
          />
        </Stack>
      </Stack>
    </SwipeableDrawer>
  )
}

function NewChatButton({ onClick }: { onClick: () => void }) {
  const isSmallScreen = useIsSmallScreen()
  return (
    <NavLink
      data-testid={TestId.sidebar.newChat}
      c="chatbox-secondary"
      className="rounded-md"
      h={isSmallScreen ? 44 : 36}
      px="xs"
      py={0}
      label="新对话"
      leftSection={<ScalableIcon icon={IconPlus} size={ICON_SIZE.nav} strokeWidth={ICON_STROKE_WIDTH} />}
      onClick={onClick}
      variant="subtle"
    />
  )
}

function SidebarNavRow(props: {
  label: string
  icon: React.ElementType<IconProps>
  onClick: () => void
  testId?: string
}) {
  const isSmallScreen = useIsSmallScreen()
  return (
    <NavLink
      data-testid={props.testId}
      c="chatbox-secondary"
      className="rounded-md"
      h={isSmallScreen ? 44 : 36}
      px="xs"
      py={0}
      label={props.label}
      leftSection={<ScalableIcon icon={props.icon} size={ICON_SIZE.nav} strokeWidth={ICON_STROKE_WIDTH} />}
      onClick={props.onClick}
      variant="subtle"
    />
  )
}

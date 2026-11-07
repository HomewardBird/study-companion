import NiceModal from '@ebay/nice-modal-react'
import { Stack, Text } from '@mantine/core'
import { createMessage, type SessionHeader, type SessionSettings } from '@shared/types'
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { rendererApplication } from '@/app/renderer-application'
import InputBox, { type InputBoxPayload } from '@/components/InputBox/InputBox'
import HomepageIcon from '@/components/icons/HomepageIcon'
import Page from '@/components/layout/Page'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { lastUsedModelStore } from '@/stores/lastUsedModelStore'
import { switchCurrentSession } from '@/stores/session/crud'
import { submitNewUserMessage } from '@/stores/session/messages'
import { settingsStore } from '@/stores/settingsStore'

export const Route = createFileRoute('/')({
  component: Index,
  validateSearch: zodValidator(
    z.object({
      copilotId: z.string().optional(),
      copilot: z.string().optional(),
      settings: z.string().optional(),
      folderId: z.string().optional(),
    })
  ),
})

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

function Index() {
  const { t } = useTranslation()
  const isSmallScreen = useIsSmallScreen()
  const { folderId } = Route.useSearch()
  const [session, setSession] = useState<SessionHeader>(() => {
    const model = getDefaultModel()
    return {
      id: 'new',
      name: 'Untitled',
      type: 'chat',
      threadName: '',
      settings: model ? { ...model } : {},
    }
  })
  const [systemPrompt, setSystemPrompt] = useState(() => settingsStore.getState().defaultPrompt || '')

  const createPersistedChatSession = useCallback(
    async (options?: {
      name?: string
      threadName?: string
      settingsPatch?: Partial<SessionSettings>
    }) => {
      const newSession = await rendererApplication.sessions.createSession(
        {
          name: options?.name ?? session.name,
          type: 'chat',
          folderId,
          messages: systemPrompt ? [createMessage('system', systemPrompt)] : [],
          threadName: options?.threadName ?? session.threadName ?? '',
          settings: {
            ...session.settings,
            ...options?.settingsPatch,
          },
        },
        undefined
      )

      switchCurrentSession(newSession.id)
      localStorage.removeItem('new-chat')
      return newSession
    },
    [session, systemPrompt, folderId]
  )

  const handleSubmit = useCallback(
    async ({ constructedMessage, needGenerating = true, onUserMessageReady, settingsPatch }: InputBoxPayload) => {
      const newSession = await createPersistedChatSession({ settingsPatch })
      void submitNewUserMessage(newSession.id, {
        newUserMsg: constructedMessage,
        needGenerating,
        onUserMessageReady,
      })
    },
    [createPersistedChatSession]
  )

  const onSelectModel = useCallback((provider: string, modelId: string) => {
    setSession((old) => ({
      ...old,
      settings: {
        ...(old.settings || {}),
        provider,
        modelId,
      },
    }))
  }, [])

  const onClickSessionSettings = useCallback(async () => {
    const res: { session: SessionHeader; systemPrompt: string } | undefined = await NiceModal.show('session-settings', {
      session,
      systemPrompt,
    })
    if (res) {
      setSession(res.session)
      setSystemPrompt(res.systemPrompt)
    }
    return true
  }, [session, systemPrompt])

  return (
    <Page title="">
      <div className="p-0 flex flex-col h-full min-h-0 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Stack align="center" justify="center" gap="sm" className="min-h-full">
            <HomepageIcon className="h-8" />
            <Text fw="600" size={isSmallScreen ? 'sm' : 'md'}>
              {t('What can I help you with today?')}
            </Text>
          </Stack>
        </div>

        <Stack gap="sm" className="shrink-0">
          <InputBox
            sessionType="chat"
            sessionId="new"
            model={
              session.settings?.provider && session.settings?.modelId
                ? { provider: session.settings.provider, modelId: session.settings.modelId }
                : undefined
            }
            onSelectModel={onSelectModel}
            onClickSessionSettings={onClickSessionSettings}
            onSubmit={handleSubmit}
          />
        </Stack>
      </div>
    </Page>
  )
}

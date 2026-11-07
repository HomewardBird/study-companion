import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Button, Stack } from '@mantine/core'
import type { ExportChatScope } from '@shared/types'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdaptiveSelect } from '@/components/AdaptiveSelect'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'
import { currentSessionIdAtom } from '@/stores/atoms'
import { exportSessionChat } from '@/stores/session/export'

const ExportChat = NiceModal.create(() => {
  const modal = useModal()
  const { t } = useTranslation()
  const [scope, setScope] = useState<ExportChatScope>('all_threads')
  const currentSessionId = useAtomValue(currentSessionIdAtom)

  const closeModal = () => {
    modal.resolve()
    modal.hide()
  }

  const onExport = () => {
    if (!currentSessionId) {
      return
    }
    void exportSessionChat(currentSessionId, scope, 'Markdown', false)
    closeModal()
  }

  return (
    <AdaptiveModal opened={modal.visible} onClose={closeModal} centered title="导出学习笔记">
      <Stack gap="md" p="sm">
        <AdaptiveSelect
          label={t('Scope')}
          classNames={{ dropdown: 'pointer-events-auto' }}
          data={['all_threads', 'current_thread'].map((value) => ({
            label: t((value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()).split('_').join(' ')),
            value,
          }))}
          value={scope}
          onChange={(e) => e && setScope(e as ExportChatScope)}
        />
      </Stack>

      <AdaptiveModal.Actions>
        <AdaptiveModal.CloseButton onClick={closeModal} />
        <Button onClick={onExport}>导出</Button>
      </AdaptiveModal.Actions>
    </AdaptiveModal>
  )
})

export default ExportChat

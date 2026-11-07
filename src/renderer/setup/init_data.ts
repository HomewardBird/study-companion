import { SessionHeaderSchema } from '@shared/types'
import { sessionRepository } from '@/app/renderer-application'
import {
  defaultSessionsForCN,
  defaultSessionsForEN,
  legacyStudyModeSessionIds,
} from '@/packages/initial_data'
import platform from '@/platform'
import { getMetaStorage, getSessionMeta } from '@/stores/sessionHelpers'
import { createSessionMetaRecordsFromLegacyList } from '@/utils/session-utils'

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

export async function ensureDefaultSessions() {
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

  if (missing.length === 0) {
    return
  }

  for (const session of missing) {
    await sessionRepository.createSessionRows(SessionHeaderSchema.parse(session), session.messages)
  }

  const metaStorage = await getMetaStorage()
  const records = createSessionMetaRecordsFromLegacyList(missing.map(getSessionMeta))
  await metaStorage.createMany(records)
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

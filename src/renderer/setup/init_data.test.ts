import { DEFAULT_SYSTEM_PROMPT } from '@chatbox/core/domain/settings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionMetaStorage } from '@/storage/SessionMetaStorage'
import { ensureDefaultSessions, initData } from './init_data'
import { LEGACY_DEFAULT_SYSTEM_PROMPTS, legacyStudyModePrompts } from './legacy_prompts'

const defaultSession = vi.hoisted(() => ({
  id: 'study-mode-explain-v2',
  name: 'Default Session',
  type: 'chat' as const,
  messages: [
    {
      id: 'study-mode-explain-v2-system',
      role: 'system' as const,
      contentParts: [{ type: 'text' as const, text: 'new study prompt' }],
    },
  ],
}))

const metaStorage = vi.hoisted(() => ({
  getAllTotal: vi.fn(),
  createMany: vi.fn(),
}))

const sessionRepositoryMock = vi.hoisted(() => ({
  createSessionRows: vi.fn(),
  getSessionHeader: vi.fn(),
  deleteSession: vi.fn(),
}))

const sessionsMock = vi.hoisted(() => ({
  readSessionTranscriptWindow: vi.fn(),
  setSessionSystemPrompt: vi.fn(),
}))

const settingsStoreMock = vi.hoisted(() => ({
  getState: vi.fn(),
  setSettings: vi.fn(),
}))

vi.mock('@/app/renderer-application', () => ({
  sessionRepository: sessionRepositoryMock,
  rendererApplication: { sessions: sessionsMock },
}))

vi.mock('@/packages/initial_data', () => ({
  defaultSessionsForCN: [],
  defaultSessionsForEN: [defaultSession],
  legacyStudyModeSessionIds: [],
  STUDY_PROMPT_MARKER: '<!-- study-prompt:v3 -->',
}))

vi.mock('@/settings-runtime', () => ({
  settingsStore: settingsStoreMock,
}))

vi.mock('@/platform', () => ({
  default: {
    getLocale: vi.fn(() => Promise.resolve('en')),
  },
}))

vi.mock('@/stores/sessionHelpers', () => ({
  getMetaStorage: vi.fn(() => Promise.resolve(metaStorage)),
  getSessionMeta: (session: { id: string; name: string; type: 'chat' | 'picture' }) => ({
    id: session.id,
    name: session.name,
    type: session.type,
  }),
}))

function transcriptWithSystemPrompt(text: string) {
  return {
    revision: 1,
    messages: [
      {
        message: {
          id: `${defaultSession.id}-system`,
          role: 'system' as const,
          contentParts: [{ type: 'text' as const, text }],
        },
      },
    ],
  }
}

describe('initData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    metaStorage.createMany.mockResolvedValue(undefined)
    sessionRepositoryMock.createSessionRows.mockResolvedValue(undefined)
    sessionRepositoryMock.getSessionHeader.mockResolvedValue(null)
    sessionsMock.setSessionSystemPrompt.mockResolvedValue(undefined)
    settingsStoreMock.getState.mockReturnValue({
      defaultPrompt: '',
      setSettings: settingsStoreMock.setSettings,
    })
  })

  it('uses all session meta records to decide whether default sessions are needed', async () => {
    metaStorage.getAllTotal.mockResolvedValue(1)

    await initData()

    expect(metaStorage.getAllTotal).toHaveBeenCalledTimes(1)
    expect(sessionRepositoryMock.createSessionRows).not.toHaveBeenCalled()
    expect(metaStorage.createMany).not.toHaveBeenCalled()
  })

  it('creates default sessions when session meta storage is empty', async () => {
    metaStorage.getAllTotal.mockResolvedValue(0)

    await initData()

    expect(sessionRepositoryMock.createSessionRows).toHaveBeenCalledWith(
      {
        id: 'study-mode-explain-v2',
        name: 'Default Session',
        type: 'chat',
      },
      defaultSession.messages
    )
    expect(metaStorage.createMany).toHaveBeenCalled()
  })

  it('does not publish metadata when creating default rows fails', async () => {
    metaStorage.getAllTotal.mockResolvedValue(0)
    sessionRepositoryMock.createSessionRows.mockRejectedValueOnce(new Error('session write failed'))

    await expect(initData()).rejects.toThrow('session write failed')

    expect(metaStorage.createMany).not.toHaveBeenCalled()
  })

  it.each(LEGACY_DEFAULT_SYSTEM_PROMPTS)('upgrades an unedited default prompt setting', async (defaultPrompt) => {
    settingsStoreMock.getState.mockReturnValue({
      defaultPrompt,
      setSettings: settingsStoreMock.setSettings,
    })

    await ensureDefaultSessions()

    expect(settingsStoreMock.setSettings).toHaveBeenCalledWith({ defaultPrompt: DEFAULT_SYSTEM_PROMPT })
  })

  it('keeps a user-edited default prompt setting', async () => {
    settingsStoreMock.getState.mockReturnValue({
      defaultPrompt: 'my own default prompt',
      setSettings: settingsStoreMock.setSettings,
    })

    await ensureDefaultSessions()

    expect(settingsStoreMock.setSettings).not.toHaveBeenCalled()
  })

  it('upgrades an unedited built-in prompt to the current revision', async () => {
    sessionRepositoryMock.getSessionHeader.mockResolvedValue({ header: defaultSession })
    sessionsMock.readSessionTranscriptWindow.mockResolvedValue(
      transcriptWithSystemPrompt(legacyStudyModePrompts['study-mode-explain-v2'])
    )

    await ensureDefaultSessions()

    expect(sessionsMock.setSessionSystemPrompt).toHaveBeenCalledWith('study-mode-explain-v2', 'new study prompt')
  })

  it('keeps a user-edited built-in prompt', async () => {
    sessionRepositoryMock.getSessionHeader.mockResolvedValue({ header: defaultSession })
    sessionsMock.readSessionTranscriptWindow.mockResolvedValue(transcriptWithSystemPrompt('my own prompt'))

    await ensureDefaultSessions()

    expect(sessionsMock.setSessionSystemPrompt).not.toHaveBeenCalled()
  })

  it('skips prompts that already carry the current revision marker', async () => {
    sessionRepositoryMock.getSessionHeader.mockResolvedValue({ header: defaultSession })
    sessionsMock.readSessionTranscriptWindow.mockResolvedValue(
      transcriptWithSystemPrompt('<!-- study-prompt:v3 -->\nnew study prompt')
    )

    await ensureDefaultSessions()

    expect(sessionsMock.setSessionSystemPrompt).not.toHaveBeenCalled()
  })
})

metaStorage satisfies Pick<SessionMetaStorage, 'getAllTotal' | 'createMany'>

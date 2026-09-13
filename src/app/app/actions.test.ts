import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const insert = vi.fn()
const deleteChain = { eqCalls: [] as Array<[string, string]>, result: { error: null as unknown } }

const from = vi.fn(() => ({
  insert,
  delete: () => {
    const builder = {
      eq(spalte: string, wert: string) {
        deleteChain.eqCalls.push([spalte, wert])
        return builder
      },
      then: (resolve: (value: unknown) => unknown) => resolve(deleteChain.result),
    }
    return builder
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => revalidatePath(p) }))

import { createExpense, deleteExpense } from './actions'
import { heuteIso } from '@/lib/validation/expense'

function form(werte: Record<string, string>): FormData {
  const data = new FormData()
  for (const [schluessel, wert] of Object.entries(werte)) data.set(schluessel, wert)
  return data
}

const GUELTIG = {
  amount_chf: '12.50',
  category: 'Lebensmittel',
  spent_on: heuteIso(),
  note: 'Znüni',
}

beforeEach(() => {
  vi.clearAllMocks()
  deleteChain.eqCalls = []
  deleteChain.result = { error: null }
})

describe('createExpense', () => {
  it('AC-1: speichert die Ausgabe für die angemeldete Person und lädt die Übersicht neu', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    insert.mockResolvedValue({ error: null })

    const state = await createExpense({}, form(GUELTIG))

    expect(state.error).toBeUndefined()
    expect(insert).toHaveBeenCalledWith({
      user_id: 'u1',
      amount_chf: 12.5,
      category: 'Lebensmittel',
      spent_on: GUELTIG.spent_on,
      note: 'Znüni',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/app')
  })

  it('AC-12: speichert nichts, wenn niemand angemeldet ist', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const state = await createExpense({}, form(GUELTIG))

    expect(state.error).toBe('Du bist nicht angemeldet.')
    expect(insert).not.toHaveBeenCalled()
  })

  it('AC-3: gibt einen Feldfehler zurück und fragt die Datenbank gar nicht erst', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const state = await createExpense({}, form({ ...GUELTIG, amount_chf: '-1' }))

    expect(state.fieldErrors?.amount_chf).toBeTruthy()
    expect(insert).not.toHaveBeenCalled()
  })

  it('EC-2: meldet einen Fehler der Datenbank, statt Erfolg vorzutäuschen', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    insert.mockResolvedValue({ error: { message: 'connection refused' } })

    const state = await createExpense({}, form(GUELTIG))

    expect(state.error).toMatch(/konnte nicht gespeichert werden/)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('EC-2: fängt einen Netzwerkabbruch ab', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    insert.mockRejectedValue(new Error('fetch failed'))

    const state = await createExpense({}, form(GUELTIG))

    expect(state.error).toMatch(/konnte nicht gespeichert werden/)
  })
})

describe('deleteExpense', () => {
  it('AC-9, EC-3: löscht nur eine Zeile, die dieser Person gehört', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    await deleteExpense(form({ id: 'e1' }))

    expect(deleteChain.eqCalls).toEqual([
      ['id', 'e1'],
      ['user_id', 'u1'],
    ])
    expect(revalidatePath).toHaveBeenCalledWith('/app')
  })

  it('AC-12: löscht nichts, wenn niemand angemeldet ist', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    await expect(deleteExpense(form({ id: 'e1' }))).rejects.toThrow(/nicht angemeldet/)
    expect(deleteChain.eqCalls).toEqual([])
  })

  it('EC-6: bleibt fehlerfrei, wenn die Zeile bereits gelöscht war', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    deleteChain.result = { error: null }

    await expect(deleteExpense(form({ id: 'schon-weg' }))).resolves.toBeUndefined()
  })

  it('meldet einen echten Fehler der Datenbank', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    deleteChain.result = { error: { message: 'connection refused' } }

    await expect(deleteExpense(form({ id: 'e1' }))).rejects.toThrow(/konnte nicht gelöscht/)
  })
})

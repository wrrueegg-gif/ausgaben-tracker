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

const holeKurs = vi.fn()
vi.mock('@/lib/exchange-rate', () => ({
  holeKurs: (...args: unknown[]) => holeKurs(...args),
  KURS_QUELLE: 'Testquelle',
}))

import { createExpense, deleteExpense } from './actions'
import { heuteIso } from '@/lib/validation/expense'

function form(werte: Record<string, string>): FormData {
  const data = new FormData()
  for (const [schluessel, wert] of Object.entries(werte)) data.set(schluessel, wert)
  return data
}

const GUELTIG = {
  amount_original: '12.50',
  currency: 'CHF',
  category: 'Lebensmittel',
  spent_on: heuteIso(),
  note: 'Znüni',
}

beforeEach(() => {
  vi.clearAllMocks()
  deleteChain.eqCalls = []
  deleteChain.result = { error: null }
  holeKurs.mockResolvedValue({ rate: 1, rateDate: GUELTIG.spent_on })
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
      amount_original: 12.5,
      currency: 'CHF',
      exchange_rate: 1,
      rate_date: GUELTIG.spent_on,
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

    const state = await createExpense({}, form({ ...GUELTIG, amount_original: '-1' }))

    expect(state.fieldErrors?.amount_original).toBeTruthy()
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

describe('createExpense mit Fremdwährung (PROJ-3)', () => {
  it('AC-2: fragt für CHF keinen Kurs ab und speichert Kurs 1', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    insert.mockResolvedValue({ error: null })

    await createExpense({}, form(GUELTIG))

    expect(holeKurs).toHaveBeenCalledWith('CHF', GUELTIG.spent_on)
    expect(insert.mock.calls[0]![0].exchange_rate).toBe(1)
  })

  it('AC-3, AC-5: rechnet mit dem Kurs des Ausgabedatums und schreibt ihn fest', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    insert.mockResolvedValue({ error: null })
    holeKurs.mockResolvedValue({ rate: 0.9451, rateDate: '2026-09-11' })

    await createExpense(
      {},
      form({ ...GUELTIG, amount_original: '12.00', currency: 'EUR', spent_on: '2026-09-13' })
    )

    const zeile = insert.mock.calls[0]![0]
    expect(holeKurs).toHaveBeenCalledWith('EUR', '2026-09-13')
    expect(zeile.amount_original).toBe(12)
    expect(zeile.currency).toBe('EUR')
    expect(zeile.exchange_rate).toBe(0.9451)
    // EC-1: the rate date from the answer, not the date of the expense.
    expect(zeile.rate_date).toBe('2026-09-11')
    expect(zeile.amount_chf).toBe(11.34)
  })

  it('AC-9: speichert nichts, wenn die Kursquelle nicht erreichbar ist', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    holeKurs.mockResolvedValue(null)

    const state = await createExpense({}, form({ ...GUELTIG, currency: 'USD' }))

    expect(state.error).toMatch(/Wechselkurs ist gerade nicht abrufbar/)
    expect(insert).not.toHaveBeenCalled()
  })

  it('EC-4: lehnt einen Betrag ab, der umgerechnet 0.00 CHF ergäbe', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    holeKurs.mockResolvedValue({ rate: 0.0001, rateDate: '2026-09-11' })

    const state = await createExpense(
      {},
      form({ ...GUELTIG, amount_original: '0.01', currency: 'EUR' })
    )

    expect(state.fieldErrors?.amount_original).toMatch(/0.00 CHF/)
    expect(insert).not.toHaveBeenCalled()
  })

  it('AC-10: lehnt eine Währung ausserhalb der Auswahl ab, ohne zu fragen', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const state = await createExpense({}, form({ ...GUELTIG, currency: 'JPY' }))

    expect(state.fieldErrors?.currency).toBeTruthy()
    expect(holeKurs).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
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

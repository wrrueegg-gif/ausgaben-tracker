import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const from = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}))

import { GET } from './route'

/** Minimal stand-in for the query builder: every step returns itself, the end awaits. */
function query(result: { data: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {}
  for (const step of ['select', 'eq', 'order']) {
    builder[step] = () => builder
  }
  builder.maybeSingle = async () => result
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result)
  return builder
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/export (AC-12)', () => {
  it('weist einen nicht angemeldeten Aufruf mit 401 ab', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const response = await GET()

    expect(response.status).toBe(401)
    expect(from).not.toHaveBeenCalled()
  })

  it('liefert Konto, Profil und Ausgaben als JSON-Download', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.ch', created_at: '2026-09-01T10:00:00Z' } },
    })
    from.mockImplementation((table: string) =>
      table === 'profiles'
        ? query({ data: { id: 'u1', display_name: 'a', created_at: '2026-09-01T10:00:00Z' } })
        : query({ data: [{ id: 'e1', amount_chf: 12.5 }], error: null })
    )

    const response = await GET()
    const inhalt = await response.json()

    expect(response.headers.get('content-disposition')).toContain('attachment')
    expect(inhalt.konto.email).toBe('a@b.ch')
    expect(inhalt.profil.display_name).toBe('a')
    expect(inhalt.ausgaben).toHaveLength(1)
  })

  it('exportiert eine leere Ausgabenliste, solange es die Tabelle noch nicht gibt', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.ch' } } })
    from.mockImplementation((table: string) =>
      table === 'profiles'
        ? query({ data: { id: 'u1', display_name: 'a' } })
        : query({ data: null, error: { code: '42P01' } })
    )

    const inhalt = await (await GET()).json()

    expect(inhalt.ausgaben).toEqual([])
  })
})

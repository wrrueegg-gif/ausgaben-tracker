import { beforeEach, describe, expect, it, vi } from 'vitest'

// The Supabase client, the redirect and the request headers are the three edges of
// these actions. Everything else is the real code under test.

const signInWithPassword = vi.fn()
const signUp = vi.fn()
const signOut = vi.fn()
const getUser = vi.fn()
const rpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { signInWithPassword, signUp, signOut, getUser },
    rpc,
  }),
}))

class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`REDIRECT:${to}`)
  }
}

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new RedirectError(to)
  },
}))

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }),
}))

import { deleteAccount, login, logout, signup } from './actions'
import { resetCredentialFailures } from '@/lib/rate-limit'

function form(email: string, password: string): FormData {
  const data = new FormData()
  data.set('email', email)
  data.set('password', password)
  return data
}

async function redirectTarget(run: () => Promise<unknown>): Promise<string> {
  try {
    await run()
  } catch (error) {
    if (error instanceof RedirectError) return error.to
    throw error
  }
  throw new Error('Es wurde nicht weitergeleitet.')
}

beforeEach(() => {
  vi.clearAllMocks()
  resetCredentialFailures()
})

describe('login', () => {
  it('AC-3: leitet nach korrekter Anmeldung auf /app', async () => {
    signInWithPassword.mockResolvedValue({ error: null })

    const ziel = await redirectTarget(() => login({}, form('a@b.ch', 'geheim1234')))

    expect(ziel).toBe('/app')
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.ch',
      password: 'geheim1234',
    })
  })

  it('AC-4: meldet bei falschem Passwort einen Fehler und meldet niemanden an', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })

    const state = await login({}, form('a@b.ch', 'falschesPasswort'))

    expect(state.error).toBe('E-Mail-Adresse oder Passwort ist falsch.')
  })

  it('AC-11: unbekannte Adresse und falsches Passwort ergeben dieselbe Meldung', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    const unbekannt = await login({}, form('gibtesnicht@b.ch', 'irgendwas12'))

    resetCredentialFailures()
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    const falsch = await login({}, form('a@b.ch', 'falschesPasswort'))

    expect(unbekannt.error).toBe(falsch.error)
    expect(unbekannt.error).not.toMatch(/nicht registriert|unbekannt|existiert/i)
  })

  it('AC-11: eine ungültige Eingabe verrät ebenfalls nichts', async () => {
    const state = await login({}, form('keine-adresse', 'kurz'))

    expect(state.error).toBe('E-Mail-Adresse oder Passwort ist falsch.')
    expect(state.fieldErrors).toBeUndefined()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('AC-10: sperrt nach 5 Fehlversuchen und fragt die Plattform nicht mehr', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })

    for (let i = 0; i < 5; i++) await login({}, form('a@b.ch', 'falsch1234'))
    const aufrufeVorSperre = signInWithPassword.mock.calls.length

    const state = await login({}, form('a@b.ch', 'falsch1234'))

    expect(state.error).toMatch(/Zu viele Fehlversuche/)
    expect(state.error).toMatch(/15 Minuten/)
    expect(signInWithPassword.mock.calls.length).toBe(aufrufeVorSperre)
  })

  it('EC-3: fängt einen geworfenen Netzwerkfehler ab, statt hängen zu bleiben', async () => {
    signInWithPassword.mockRejectedValue(new Error('fetch failed'))

    const state = await login({}, form('a@b.ch', 'geheim1234'))

    expect(state.error).toMatch(/nicht erreichbar/)
  })

  it('EC-3: erkennt einen Netzwerkfehler auch dann, wenn die Bibliothek ihn zurückgibt', async () => {
    // Die Auth-Bibliothek wirft einen Netzwerkfehler nicht, sie gibt ihn zurück.
    // Ohne diese Unterscheidung sähe ein Ausfall wie ein falsches Passwort aus.
    signInWithPassword.mockResolvedValue({
      error: { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' },
    })

    const state = await login({}, form('a@b.ch', 'geheim1234'))

    expect(state.error).toMatch(/nicht erreichbar/)
    expect(state.error).not.toMatch(/Passwort ist falsch/)
  })

  it('EC-3: ein Ausfall zählt nicht als Fehlversuch und sperrt niemanden aus', async () => {
    signInWithPassword.mockResolvedValue({
      error: { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' },
    })
    for (let i = 0; i < 6; i++) await login({}, form('a@b.ch', 'geheim1234'))

    // Danach muss eine richtige Anmeldung noch möglich sein.
    signInWithPassword.mockResolvedValue({ error: null })
    const ziel = await redirectTarget(() => login({}, form('a@b.ch', 'geheim1234')))

    expect(ziel).toBe('/app')
  })
})

describe('signup', () => {
  it('AC-1: legt ein Konto an und leitet direkt in den geschützten Bereich', async () => {
    signUp.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null })

    const ziel = await redirectTarget(() => signup({}, form('neu@b.ch', 'geheim1234')))

    expect(ziel).toBe('/app')
  })

  it('AC-2: weist ein zu kurzes Passwort am Feld ab, ohne die Plattform zu fragen', async () => {
    const state = await signup({}, form('neu@b.ch', 'kurz'))

    expect(state.fieldErrors?.password).toMatch(/mindestens 8 Zeichen/)
    expect(signUp).not.toHaveBeenCalled()
  })

  it('Registrierung: sperrt nach 5 Versuchen und trennt die Zählung von der Anmeldung', async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: { message: 'User already registered' } })

    for (let i = 0; i < 5; i++) await signup({}, form('neu@b.ch', 'geheim1234'))
    const gesperrt = await signup({}, form('neu@b.ch', 'geheim1234'))

    expect(gesperrt.error).toMatch(/Zu viele Versuche/)

    // Die Anmeldung derselben Adresse ist davon unberührt.
    signInWithPassword.mockResolvedValue({ error: null })
    const ziel = await redirectTarget(() => login({}, form('neu@b.ch', 'geheim1234')))
    expect(ziel).toBe('/app')
  })

  it('EC-1: antwortet bei bereits vergebener Adresse neutral', async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: { message: 'User already registered' } })

    const state = await signup({}, form('schon@b.ch', 'geheim1234'))

    expect(state.error).toMatch(/Registrierung fehlgeschlagen/)
    expect(state.error).not.toMatch(/bereits registriert|existiert|vergeben/i)
  })
})

describe('logout und deleteAccount', () => {
  it('AC-5: meldet ab und führt zur Anmeldeseite', async () => {
    signOut.mockResolvedValue({ error: null })

    const ziel = await redirectTarget(() => logout())

    expect(signOut).toHaveBeenCalled()
    expect(ziel).toBe('/login')
  })

  it('AC-13: löscht das eigene Konto über die Datenbankfunktion und meldet ab', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.ch' } } })
    rpc.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })

    const ziel = await redirectTarget(() => deleteAccount())

    expect(rpc).toHaveBeenCalledWith('delete_own_account')
    expect(signOut).toHaveBeenCalled()
    expect(ziel).toBe('/login?geloescht=1')
  })

  it('AC-13: löscht nichts, wenn niemand angemeldet ist', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const ziel = await redirectTarget(() => deleteAccount())

    expect(ziel).toBe('/login')
    expect(rpc).not.toHaveBeenCalled()
  })
})

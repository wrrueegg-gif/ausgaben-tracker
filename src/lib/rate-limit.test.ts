import { beforeEach, describe, expect, it } from 'vitest'

import {
  checkCredentialLimit,
  clearCredentialFailures,
  recordCredentialFailure,
  resetCredentialFailures,
} from './rate-limit'

const T0 = 1_700_000_000_000
const MINUTE = 60_000

describe('Fehlversuchssperre (AC-10)', () => {
  beforeEach(() => {
    resetCredentialFailures()
  })

  it('lässt die ersten fünf Versuche zu und sperrt den sechsten', () => {
    const keys = ['account:a@b.ch', 'ip:1.2.3.4']

    for (let i = 0; i < 5; i++) {
      expect(checkCredentialLimit(keys, T0 + i * 1000).allowed).toBe(true)
      recordCredentialFailure(keys, T0 + i * 1000)
    }

    const verdict = checkCredentialLimit(keys, T0 + 5000)
    expect(verdict.allowed).toBe(false)
    if (!verdict.allowed) expect(verdict.retryAfterMinutes).toBe(15)
  })

  it('sperrt auch, wenn nur einer der beiden Schlüssel über der Grenze ist', () => {
    // Derselbe Angreifer, wechselnde IP-Adressen: das Konto zählt trotzdem mit.
    for (let i = 0; i < 5; i++) {
      recordCredentialFailure(['account:opfer@b.ch', `ip:10.0.0.${i}`], T0 + i * 1000)
    }

    expect(checkCredentialLimit(['account:opfer@b.ch', 'ip:10.0.0.99'], T0 + 6000).allowed).toBe(
      false
    )
    expect(checkCredentialLimit(['account:anderer@b.ch', 'ip:10.0.0.99'], T0 + 6000).allowed).toBe(
      true
    )
  })

  it('gibt nach 15 Minuten wieder frei', () => {
    const keys = ['account:a@b.ch']
    for (let i = 0; i < 5; i++) recordCredentialFailure(keys, T0)

    expect(checkCredentialLimit(keys, T0 + 14 * MINUTE).allowed).toBe(false)
    expect(checkCredentialLimit(keys, T0 + 15 * MINUTE + 1).allowed).toBe(true)
  })

  it('nennt die verbleibende Wartezeit in Minuten', () => {
    const keys = ['account:a@b.ch']
    for (let i = 0; i < 5; i++) recordCredentialFailure(keys, T0)

    const verdict = checkCredentialLimit(keys, T0 + 10 * MINUTE)
    expect(verdict.allowed).toBe(false)
    if (!verdict.allowed) expect(verdict.retryAfterMinutes).toBe(5)
  })

  it('setzt den Zähler nach einer erfolgreichen Anmeldung zurück', () => {
    const keys = ['account:a@b.ch', 'ip:1.2.3.4']
    for (let i = 0; i < 5; i++) recordCredentialFailure(keys, T0)

    clearCredentialFailures(keys)

    expect(checkCredentialLimit(keys, T0 + 1000).allowed).toBe(true)
  })
})

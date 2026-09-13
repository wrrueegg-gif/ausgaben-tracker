import { describe, expect, it } from 'vitest'

import { aktuellerMonatKey, leseMonat } from './month'

// 15 September 2026, midday UTC — safely inside the Swiss day either way.
const JETZT = new Date('2026-09-15T12:00:00Z')

describe('Monatslogik (AC-7, AC-8)', () => {
  it('nimmt ohne Parameter den laufenden Monat', () => {
    const monat = leseMonat(undefined, JETZT)

    expect(monat.key).toBe('2026-09')
    expect(monat.name).toBe('September 2026')
  })

  it('AC-7: übernimmt einen gültigen Monat aus der Adresszeile', () => {
    const monat = leseMonat('2026-03', JETZT)

    expect(monat.key).toBe('2026-03')
    expect(monat.name).toBe('März 2026')
    expect(monat.von).toBe('2026-03-01')
    expect(monat.bis).toBe('2026-03-31')
  })

  it('berechnet die Monatsgrenzen auch im Februar eines Schaltjahrs', () => {
    expect(leseMonat('2024-02', JETZT).bis).toBe('2024-02-29')
    expect(leseMonat('2026-02', JETZT).bis).toBe('2026-02-28')
  })

  it('AC-8: setzt einen Monat in der Zukunft auf den laufenden zurück', () => {
    expect(leseMonat('2026-10', JETZT).key).toBe('2026-09')
    expect(leseMonat('2099-01', JETZT).key).toBe('2026-09')
  })

  it('AC-8: bietet im laufenden Monat keinen Folgemonat an', () => {
    expect(leseMonat('2026-09', JETZT).naechster).toBeNull()
    expect(leseMonat('2026-08', JETZT).naechster).toBe('2026-09')
  })

  it('AC-7: wechselt über den Jahreswechsel hinweg korrekt', () => {
    expect(leseMonat('2026-01', JETZT).vorheriger).toBe('2025-12')
    expect(leseMonat('2025-12', JETZT).naechster).toBe('2026-01')
  })

  it('fällt bei unlesbaren Werten auf den laufenden Monat zurück', () => {
    for (const eingabe of ['', 'september', '2026-13', '2026-00', '26-09', '2026-9']) {
      expect(leseMonat(eingabe, JETZT).key).toBe('2026-09')
    }
  })

  it('bestimmt den laufenden Monat nach Schweizer Zeit', () => {
    // 31 August 23:30 UTC is already 1 September in Zurich.
    expect(aktuellerMonatKey(new Date('2026-08-31T23:30:00Z'))).toBe('2026-09')
  })
})

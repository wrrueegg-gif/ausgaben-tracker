import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { holeAktuelleKurse, holeKurs } from './exchange-rate'

const fetchMock = vi.fn()

function antwort(koerper: unknown, ok = true) {
  return { ok, json: async () => koerper }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('holeKurs (AC-2, AC-3, AC-9, EC-1, EC-2)', () => {
  it('AC-2: fragt für CHF nicht nach aussen und liefert Kurs 1', async () => {
    const kurs = await holeKurs('CHF', '2026-09-12')

    expect(kurs).toEqual({ rate: 1, rateDate: '2026-09-12' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('AC-3: holt den Kurs für das Ausgabedatum und die gewählte Währung', async () => {
    fetchMock.mockResolvedValue(
      antwort({ amount: 1, base: 'EUR', date: '2026-09-12', rates: { CHF: 0.9451 } })
    )

    const kurs = await holeKurs('EUR', '2026-09-12')

    expect(kurs).toEqual({ rate: 0.9451, rateDate: '2026-09-12' })
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.frankfurter.dev/v1/2026-09-12?base=EUR&symbols=CHF')
  })

  it('EC-1: übernimmt am Wochenende das frühere Kursdatum aus der Antwort', async () => {
    // Asked for Sunday, the source answers with Friday's rate and says so.
    fetchMock.mockResolvedValue(
      antwort({ amount: 1, base: 'EUR', date: '2026-09-11', rates: { CHF: 0.9451 } })
    )

    const kurs = await holeKurs('EUR', '2026-09-13')

    expect(kurs?.rateDate).toBe('2026-09-11')
  })

  it('EC-2: gibt bei Zeitüberschreitung keinen Kurs zurück', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'TimeoutError'))

    expect(await holeKurs('USD', '2026-09-12')).toBeNull()
  })

  it('AC-9: gibt bei einer Fehlerantwort keinen Kurs zurück', async () => {
    fetchMock.mockResolvedValue(antwort({ message: 'not found' }, false))

    expect(await holeKurs('GBP', '2026-09-12')).toBeNull()
  })

  it('AC-9: glaubt einer unsinnigen Antwort nicht', async () => {
    for (const koerper of [
      { date: '2026-09-12', rates: {} },
      { date: '2026-09-12', rates: { CHF: 0 } },
      { date: '2026-09-12', rates: { CHF: -1 } },
      { date: 'gestern', rates: { CHF: 0.9 } },
      { rates: { CHF: 0.9 } },
      'kein Objekt',
    ]) {
      fetchMock.mockResolvedValue(antwort(koerper))
      expect(await holeKurs('EUR', '2026-09-12')).toBeNull()
    }
  })

  it('EC-2: setzt ein Zeitlimit auf die Anfrage', async () => {
    fetchMock.mockResolvedValue(
      antwort({ date: '2026-09-12', rates: { CHF: 0.9451 } })
    )

    await holeKurs('EUR', '2026-09-12')

    const [, optionen] = fetchMock.mock.calls[0]!
    expect(optionen.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('holeAktuelleKurse (AC-7, EC-3)', () => {
  it('AC-7: rechnet die Antwort in „1 Fremdwährung = x CHF" um', async () => {
    // The source answers CHF -> foreign; the panel shows foreign -> CHF.
    fetchMock.mockResolvedValue(
      antwort({ date: '2026-09-11', rates: { EUR: 0.5, USD: 0.25, GBP: 0.8 } })
    )

    const kurse = await holeAktuelleKurse()

    expect(kurse?.rateDate).toBe('2026-09-11')
    expect(kurse?.kurse).toEqual([
      { waehrung: 'EUR', rate: 2 },
      { waehrung: 'USD', rate: 4 },
      { waehrung: 'GBP', rate: 1.25 },
    ])
  })

  it('EC-3: gibt bei einem Ausfall nichts zurück, statt zu werfen', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    expect(await holeAktuelleKurse()).toBeNull()
  })

  it('EC-3: gibt auch bei einer leeren Kursliste nichts zurück', async () => {
    fetchMock.mockResolvedValue(antwort({ date: '2026-09-11', rates: {} }))

    expect(await holeAktuelleKurse()).toBeNull()
  })
})

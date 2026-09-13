import { describe, expect, it } from 'vitest'

import { heuteIso, NOTIZ_MAX_LAENGE, parseExpense, WAEHRUNGEN } from './expense'

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

describe('Eingabeprüfung einer Ausgabe (AC-3, AC-4, EC-4, EC-5)', () => {
  it('nimmt eine vollständige, gültige Ausgabe an', () => {
    const ergebnis = parseExpense(form(GUELTIG))

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) {
      expect(ergebnis.value.amount_original).toBe(12.5)
      expect(ergebnis.value.category).toBe('Lebensmittel')
      expect(ergebnis.value.note).toBe('Znüni')
    }
  })

  it('AC-3: weist Betrag 0, negative Beträge und Nicht-Zahlen ab', () => {
    for (const betrag of ['0', '0.00', '-5', 'zwölf', '']) {
      const ergebnis = parseExpense(form({ ...GUELTIG, amount_original: betrag }))
      expect(ergebnis.ok).toBe(false)
      if (!ergebnis.ok) expect(ergebnis.fieldErrors.amount_original).toBeTruthy()
    }
  })

  it('EC-4: rundet auf zwei Nachkommastellen', () => {
    const ergebnis = parseExpense(form({ ...GUELTIG, amount_original: '12.567' }))

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) expect(ergebnis.value.amount_original).toBe(12.57)
  })

  it('akzeptiert ein Komma als Dezimaltrennzeichen', () => {
    const ergebnis = parseExpense(form({ ...GUELTIG, amount_original: '12,50' }))

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) expect(ergebnis.value.amount_original).toBe(12.5)
  })

  it('AC-1 (PROJ-3): nimmt alle vier vorgesehenen Währungen an', () => {
    for (const waehrung of WAEHRUNGEN) {
      const ergebnis = parseExpense(form({ ...GUELTIG, currency: waehrung }))
      expect(ergebnis.ok).toBe(true)
      if (ergebnis.ok) expect(ergebnis.value.currency).toBe(waehrung)
    }
  })

  it('AC-10 (PROJ-3): weist eine Währung ab, die nicht zur Auswahl steht', () => {
    for (const waehrung of ['JPY', 'BTC', '', 'chf']) {
      const ergebnis = parseExpense(form({ ...GUELTIG, currency: waehrung }))
      expect(ergebnis.ok).toBe(false)
      if (!ergebnis.ok) expect(ergebnis.fieldErrors.currency).toMatch(/CHF, EUR, USD oder GBP/)
    }
  })

  it('weist eine unbekannte Kategorie ab', () => {
    const ergebnis = parseExpense(form({ ...GUELTIG, category: 'Ferien' }))

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fieldErrors.category).toBeTruthy()
  })

  it('EC-5: weist ein Datum in der Zukunft ab', () => {
    const ergebnis = parseExpense(form({ ...GUELTIG, spent_on: '2099-01-01' }))

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fieldErrors.spent_on).toMatch(/Zukunft/)
  })

  it('AC-4: weist eine Notiz über 200 Zeichen ab', () => {
    const ergebnis = parseExpense(
      form({ ...GUELTIG, note: 'x'.repeat(NOTIZ_MAX_LAENGE + 1) })
    )

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fieldErrors.note).toMatch(/200/)
  })

  it('behandelt eine leere Notiz als nicht vorhanden', () => {
    const ergebnis = parseExpense(form({ ...GUELTIG, note: '   ' }))

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) expect(ergebnis.value.note).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import {
  berechneMonatssumme,
  farbeVon,
  formatiereDatum,
  ringAbschnitte,
  type AusgabeZeile,
} from './expense-summary'

function ausgabe(
  betrag: string,
  kategorie: AusgabeZeile['category'],
  datum = '2026-09-01'
): AusgabeZeile {
  return {
    id: `${betrag}-${kategorie}-${datum}`,
    amount_chf: betrag,
    category: kategorie,
    spent_on: datum,
    note: null,
    currency: 'CHF',
    amount_original: betrag,
    exchange_rate: 1,
    rate_date: datum,
  }
}

describe('Monatssumme (AC-6, AC-10)', () => {
  it('AC-6: summiert auf den Rappen genau', () => {
    // 0.1 + 0.2 is 0.30000000000000004 in floating point — the reason amounts are
    // summed as integer centimes.
    const summe = berechneMonatssumme([
      ausgabe('0.10', 'Lebensmittel'),
      ausgabe('0.20', 'Lebensmittel'),
    ])

    expect(summe.gesamt).toBe(0.3)
    expect(summe.jeKategorie[0]!.betrag).toBe(0.3)
  })

  it('AC-6: summiert dreissig Ausgaben ohne Abweichung', () => {
    const viele = Array.from({ length: 30 }, () => ausgabe('19.99', 'Freizeit'))

    expect(berechneMonatssumme(viele).gesamt).toBe(599.7)
  })

  it('AC-6: sortiert die Kategorien absteigend nach Betrag', () => {
    const summe = berechneMonatssumme([
      ausgabe('10.00', 'Freizeit'),
      ausgabe('50.00', 'Wohnen'),
      ausgabe('25.00', 'Lebensmittel'),
    ])

    expect(summe.jeKategorie.map((k) => k.kategorie)).toEqual([
      'Wohnen',
      'Lebensmittel',
      'Freizeit',
    ])
  })

  it('AC-6: führt nur Kategorien auf, in denen etwas ausgegeben wurde', () => {
    const summe = berechneMonatssumme([ausgabe('10.00', 'Mobilität')])

    expect(summe.jeKategorie).toHaveLength(1)
    expect(summe.jeKategorie[0]!.kategorie).toBe('Mobilität')
  })

  it('AC-6: weist den Anteil je Kategorie in Prozent aus', () => {
    const summe = berechneMonatssumme([
      ausgabe('75.00', 'Wohnen'),
      ausgabe('25.00', 'Freizeit'),
    ])

    expect(summe.jeKategorie[0]!.anteilProzent).toBe(75)
    expect(summe.jeKategorie[1]!.anteilProzent).toBe(25)
  })

  it('AC-10: ergibt für einen leeren Monat 0 und eine leere Liste', () => {
    const summe = berechneMonatssumme([])

    expect(summe.gesamt).toBe(0)
    expect(summe.jeKategorie).toEqual([])
  })
})

describe('Datumsformat', () => {
  it('zeigt ein Datum in Schweizer Schreibweise', () => {
    expect(formatiereDatum('2026-09-05')).toBe('05.09.2026')
  })
})

describe('Ringgeometrie (AC-13, EC-7)', () => {
  it('AC-13: Farbe hängt an der Kategorie, nicht an der Rangfolge', () => {
    // Dieselbe Kategorie behält ihre Farbe, egal wie hoch sie im Monat steht.
    expect(farbeVon('Lebensmittel')).toBe(1)
    expect(farbeVon('Sonstiges')).toBe(6)
    expect(farbeVon('Mobilität')).not.toBe(farbeVon('Freizeit'))
  })

  it('EC-7: eine einzige Kategorie ergibt einen geschlossenen Ring', () => {
    const abschnitte = ringAbschnitte(berechneMonatssumme([ausgabe('40.00', 'Wohnen')]))

    expect(abschnitte).toHaveLength(1)
    expect(abschnitte[0]!.anteil).toBe(100)
    expect(abschnitte[0]!.versatz).toBe(0)
  })

  it('AC-13: die Anteile ergeben zusammen genau 100', () => {
    // Drei gleich grosse Kategorien ergäben gerundet 99.9 und liessen einen
    // sichtbaren Spalt im Ring stehen.
    const abschnitte = ringAbschnitte(
      berechneMonatssumme([
        ausgabe('10.00', 'Wohnen'),
        ausgabe('10.00', 'Freizeit'),
        ausgabe('10.00', 'Gesundheit'),
      ])
    )

    const summe = abschnitte.reduce((s, a) => s + a.anteil, 0)
    expect(Math.round(summe * 10) / 10).toBe(100)
  })

  it('AC-13: jeder Abschnitt beginnt dort, wo der vorige endet', () => {
    const abschnitte = ringAbschnitte(
      berechneMonatssumme([
        ausgabe('50.00', 'Wohnen'),
        ausgabe('30.00', 'Freizeit'),
        ausgabe('20.00', 'Mobilität'),
      ])
    )

    expect(abschnitte[0]!.versatz).toBe(0)
    for (let i = 1; i < abschnitte.length; i++) {
      const erwartet = abschnitte[i - 1]!.versatz + abschnitte[i - 1]!.anteil
      expect(abschnitte[i]!.versatz).toBeCloseTo(erwartet, 1)
    }
  })

  it('AC-13: die Abschnitte stehen in derselben Reihenfolge wie die Aufstellung', () => {
    const summe = berechneMonatssumme([
      ausgabe('10.00', 'Freizeit'),
      ausgabe('50.00', 'Wohnen'),
      ausgabe('25.00', 'Lebensmittel'),
    ])

    expect(ringAbschnitte(summe).map((a) => a.kategorie)).toEqual(
      summe.jeKategorie.map((k) => k.kategorie)
    )
  })

  it('AC-16: ein leerer Monat hat keine Abschnitte', () => {
    expect(ringAbschnitte(berechneMonatssumme([]))).toEqual([])
  })
})

// Total and per-category totals for one month — AC-6, AC-10.
//
// Computed from the very rows the list shows, so there is one number with one path
// to it. Summed in centimes as integers, because a monthly total has to be right to
// the centime; the database hands amounts over as strings for the same reason.

import type { Kategorie } from '@/lib/validation/expense'

export type AusgabeZeile = {
  id: string
  amount_chf: string | number
  category: Kategorie
  spent_on: string
  note: string | null
}

export type KategorieSumme = {
  kategorie: Kategorie
  betrag: number
  anteilProzent: number
}

export type Monatssumme = {
  gesamt: number
  jeKategorie: KategorieSumme[]
}

function inRappen(betrag: string | number): number {
  return Math.round(Number(betrag) * 100)
}

export function berechneMonatssumme(ausgaben: AusgabeZeile[]): Monatssumme {
  let gesamtRappen = 0
  const proKategorie = new Map<Kategorie, number>()

  for (const ausgabe of ausgaben) {
    const rappen = inRappen(ausgabe.amount_chf)
    gesamtRappen += rappen
    proKategorie.set(ausgabe.category, (proKategorie.get(ausgabe.category) ?? 0) + rappen)
  }

  const jeKategorie = [...proKategorie.entries()]
    // AC-6: biggest first — that is the question the summary answers.
    .sort((a, b) => b[1] - a[1])
    .map(([kategorie, rappen]) => ({
      kategorie,
      betrag: rappen / 100,
      anteilProzent: gesamtRappen === 0 ? 0 : Math.round((rappen / gesamtRappen) * 100),
    }))

  // AC-10: an empty month is 0.00 and an empty list, never a blank area.
  return { gesamt: gesamtRappen / 100, jeKategorie }
}

export function formatiereChf(betrag: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(betrag)
}

export function formatiereDatum(isoDatum: string): string {
  const [jahr, monat, tag] = isoDatum.split('-')
  return `${tag}.${monat}.${jahr}`
}

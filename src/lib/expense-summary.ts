// Total and per-category totals for one month — AC-6, AC-10.
//
// Computed from the very rows the list shows, so there is one number with one path
// to it. Summed in centimes as integers, because a monthly total has to be right to
// the centime; the database hands amounts over as strings for the same reason.

import { KATEGORIEN, type Kategorie, type Waehrung } from '@/lib/validation/expense'

export type AusgabeZeile = {
  id: string
  /** AC-6 (PROJ-3): everything is summed from this one, never from the original. */
  amount_chf: string | number
  category: Kategorie
  spent_on: string
  note: string | null
  // PROJ-3 — what the person actually paid, and how it was converted.
  currency: Waehrung
  amount_original: string | number
  exchange_rate: string | number
  rate_date: string
}

export function formatiereBetrag(betrag: number, waehrung: Waehrung): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: waehrung,
    minimumFractionDigits: 2,
  }).format(betrag)
}

export function formatiereKurs(kurs: number): string {
  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(kurs)
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

// --- Ringdiagramm (AC-13, EC-7) --------------------------------------------

/**
 * Die Farbe hängt an der Kategorie, nicht an ihrem Rang. Sonst wechselte eine
 * Kategorie die Farbe, sobald sie im nächsten Monat an anderer Stelle steht —
 * und genau daran erkennt man sie wieder, ohne zu lesen.
 */
export function farbeVon(kategorie: Kategorie): number {
  return KATEGORIEN.indexOf(kategorie) + 1
}

export type RingAbschnitt = {
  kategorie: Kategorie
  /** Länge des Abschnitts, in Prozent eines Rings mit Umfang 100 */
  anteil: number
  /** wo der Abschnitt beginnt, in Prozent */
  versatz: number
  /** Nummer des Farbtokens, 1 bis 6 */
  farbe: number
}

/**
 * Macht aus den Kategoriesummen die Abschnitte des Rings.
 *
 * Der Ring hat einen Umfang von genau 100 Einheiten, deshalb ist der Anteil in
 * Prozent zugleich die Zeichenvorschrift — es braucht keine Winkelrechnung.
 *
 * Die Anteile werden so verteilt, dass ihre Summe exakt 100 ergibt: die
 * Rundungsdifferenz trägt der grösste Abschnitt. Ohne das bliebe bei drei
 * gleich grossen Kategorien ein sichtbarer Spalt von einem Prozent stehen.
 */
export function ringAbschnitte(summe: Monatssumme): RingAbschnitt[] {
  if (summe.jeKategorie.length === 0) return []

  const gesamtRappen = Math.round(summe.gesamt * 100)
  if (gesamtRappen <= 0) return []

  const roh = summe.jeKategorie.map((eintrag) => ({
    kategorie: eintrag.kategorie,
    anteil: Math.round((Math.round(eintrag.betrag * 100) / gesamtRappen) * 1000) / 10,
    farbe: farbeVon(eintrag.kategorie),
  }))

  // Die Differenz zu 100 landet beim grössten Abschnitt — dort fällt sie am
  // wenigsten auf, und der Ring schliesst sich.
  const differenz = Math.round((100 - roh.reduce((s, e) => s + e.anteil, 0)) * 10) / 10
  let groesster = 0
  for (let i = 1; i < roh.length; i++) if (roh[i]!.anteil > roh[groesster]!.anteil) groesster = i
  roh[groesster]!.anteil = Math.round((roh[groesster]!.anteil + differenz) * 10) / 10

  let versatz = 0
  return roh.map((eintrag) => {
    const abschnitt = { ...eintrag, versatz: Math.round(versatz * 10) / 10 }
    versatz += eintrag.anteil
    return abschnitt
  })
}

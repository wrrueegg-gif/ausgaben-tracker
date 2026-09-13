// The external integration — AC-3, AC-7, AC-9, EC-1, EC-2.
//
// Source: https://api.frankfurter.dev — the European Central Bank's reference
// rates. Free, no key, no account. Called from the server only, so the service
// never sees a visitor's address, and only ever receives a currency code and a
// date: no amount, nothing that points at a person.

import { z } from 'zod'

import type { Waehrung } from '@/lib/validation/expense'

export const KURS_QUELLE = 'Referenzkurse der Europäischen Zentralbank (frankfurter.dev)'

const BASIS_URL = 'https://api.frankfurter.dev/v1'
// A foreign service must never decide how long our page hangs (EC-2).
const ZEITLIMIT_MS = 5_000

// A foreign answer is input, not truth: it is checked before it is believed.
const antwortSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rates: z.record(z.string(), z.number()),
})

export type Kurs = {
  /** francs per unit of the foreign currency */
  rate: number
  /** the day this rate was published — may be earlier than the day asked for (EC-1) */
  rateDate: string
}

async function hole(pfad: string): Promise<unknown | null> {
  try {
    const antwort = await fetch(`${BASIS_URL}${pfad}`, {
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
      headers: { accept: 'application/json' },
    })
    if (!antwort.ok) return null
    return await antwort.json()
  } catch {
    // Timeout, DNS, offline — all the same outcome: no rate (AC-9).
    return null
  }
}

/**
 * The rate for one currency on one day. Returns null when the source cannot be
 * reached or answers with something unusable — the caller then refuses to save
 * rather than inventing a number (AC-9).
 */
export async function holeKurs(waehrung: Waehrung, datum: string): Promise<Kurs | null> {
  // AC-2: francs need no rate, so nothing leaves the server.
  if (waehrung === 'CHF') return { rate: 1, rateDate: datum }

  const roh = await hole(`/${datum}?base=${waehrung}&symbols=CHF`)
  if (roh === null) return null

  const geprueft = antwortSchema.safeParse(roh)
  if (!geprueft.success) return null

  const rate = geprueft.data.rates.CHF
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null

  // EC-1: on a weekend the source answers with the last trading day, and says so.
  // That date is the truth about the rate used, so it is what gets stored.
  return { rate, rateDate: geprueft.data.date }
}

export type AktuelleKurse = {
  rateDate: string
  kurse: { waehrung: Exclude<Waehrung, 'CHF'>; rate: number }[]
}

/**
 * The rates shown in the panel above the form (AC-7). Reused for an hour: the
 * central bank publishes once a day, so asking on every page view would be waste.
 */
export async function holeAktuelleKurse(): Promise<AktuelleKurse | null> {
  let roh: unknown
  try {
    const antwort = await fetch(`${BASIS_URL}/latest?base=CHF&symbols=EUR,USD,GBP`, {
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
      headers: { accept: 'application/json' },
      next: { revalidate: 3600 },
    })
    if (!antwort.ok) return null
    roh = await antwort.json()
  } catch {
    return null
  }

  const geprueft = antwortSchema.safeParse(roh)
  if (!geprueft.success) return null

  const kurse: AktuelleKurse['kurse'] = []
  for (const waehrung of ['EUR', 'USD', 'GBP'] as const) {
    // The answer is CHF -> foreign; the panel shows foreign -> CHF.
    const proChf = geprueft.data.rates[waehrung]
    if (typeof proChf !== 'number' || !Number.isFinite(proChf) || proChf <= 0) continue
    kurse.push({ waehrung, rate: 1 / proChf })
  }

  if (kurse.length === 0) return null
  return { rateDate: geprueft.data.date, kurse }
}

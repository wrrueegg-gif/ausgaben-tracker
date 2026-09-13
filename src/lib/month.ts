// The month the overview shows — AC-7, AC-8.
// The month lives in the address bar (/app?monat=2026-09), so it can be linked and
// the browser's back button does the expected thing.

export type Monat = {
  /** YYYY-MM */
  key: string
  /** first day of the month, YYYY-MM-DD */
  von: string
  /** last day of the month, YYYY-MM-DD */
  bis: string
  /** e.g. "September 2026" */
  name: string
  /** the previous month's key — there is always one */
  vorheriger: string
  /** the next month's key, or null in the current month (AC-8) */
  naechster: string | null
}

const MONATSNAMEN = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

/** The current month in Swiss local time, as YYYY-MM. */
export function aktuellerMonatKey(now = new Date()): string {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
  }).format(now)
  return teile.slice(0, 7)
}

function verschiebe(key: string, monate: number): string {
  const [jahr, monat] = key.split('-').map(Number)
  const gesamt = jahr! * 12 + (monat! - 1) + monate
  const neuesJahr = Math.floor(gesamt / 12)
  const neuerMonat = (gesamt % 12) + 1
  return `${String(neuesJahr).padStart(4, '0')}-${String(neuerMonat).padStart(2, '0')}`
}

function letzterTag(key: string): string {
  const [jahr, monat] = key.split('-').map(Number)
  // Day 0 of the following month is the last day of this one.
  const tag = new Date(Date.UTC(jahr!, monat!, 0)).getUTCDate()
  return `${key}-${String(tag).padStart(2, '0')}`
}

/**
 * Reads the month from the address parameter. Anything unreadable, and anything
 * beyond the current month, falls back to the current month (AC-8).
 */
export function leseMonat(parameter: string | undefined, now = new Date()): Monat {
  const aktuell = aktuellerMonatKey(now)

  const gueltig = typeof parameter === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(parameter)
  const key = gueltig && parameter <= aktuell ? parameter : aktuell

  const [jahr, monat] = key.split('-').map(Number)

  return {
    key,
    von: `${key}-01`,
    bis: letzterTag(key),
    name: `${MONATSNAMEN[monat! - 1]} ${jahr}`,
    vorheriger: verschiebe(key, -1),
    naechster: key < aktuell ? verschiebe(key, 1) : null,
  }
}

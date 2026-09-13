'use server'

// Creating and deleting an expense — AC-1, AC-9, AC-12, EC-2, EC-3, EC-6 (PROJ-2)
// and AC-2, AC-3, AC-9, EC-2, EC-4, EC-5 (PROJ-3).

import { revalidatePath } from 'next/cache'

import { holeKurs } from '@/lib/exchange-rate'
import { createClient } from '@/lib/supabase/server'
import { parseExpense, type ExpenseFieldErrors } from '@/lib/validation/expense'

export type ExpenseFormState = {
  error?: string
  fieldErrors?: ExpenseFieldErrors
  gespeichertAm?: number
}

const NICHT_ANGEMELDET = 'Du bist nicht angemeldet.'
const SPEICHERN_FEHLGESCHLAGEN =
  'Die Ausgabe konnte nicht gespeichert werden. Bitte versuche es gleich noch einmal.'
const LOESCHEN_FEHLGESCHLAGEN =
  'Die Ausgabe konnte nicht gelöscht werden. Bitte versuche es gleich noch einmal.'
// AC-9 (PROJ-3) — no rate means no saving. Inventing one would be a silent wrong booking.
const KURS_NICHT_ABRUFBAR =
  'Der Wechselkurs ist gerade nicht abrufbar, deshalb wurde nichts gespeichert. Versuche es in einem Moment erneut oder erfasse den Betrag in CHF.'

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const parsed = parseExpense(formData)
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // AC-12 — no session, nothing is written.
  if (!user) return { error: NICHT_ANGEMELDET }

  const { amount_original, currency, category, spent_on, note } = parsed.value

  // AC-2: francs need no rate and no call to the outside.
  // AC-3: a foreign currency is converted with the rate of the day it was spent.
  // EC-5: fetched exactly once per save, right before the insert.
  const kurs = await holeKurs(currency, spent_on)
  if (!kurs) return { error: KURS_NICHT_ABRUFBAR }

  const amount_chf = Math.round(amount_original * kurs.rate * 100) / 100

  // EC-4 (PROJ-3): a tiny foreign amount can round down to nothing. Refuse it
  // rather than storing a zero the database would reject anyway.
  if (amount_chf <= 0) {
    return {
      fieldErrors: {
        amount_original:
          'Umgerechnet ergibt das 0.00 CHF. Bitte gib einen höheren Betrag ein.',
      },
    }
  }

  try {
    // user_id comes from the session, never from the form. Row level security
    // checks the same thing again on the way in.
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount_chf,
      amount_original,
      currency,
      exchange_rate: kurs.rate,
      rate_date: kurs.rateDate,
      category,
      spent_on,
      note,
    })
    if (error) return { error: SPEICHERN_FEHLGESCHLAGEN }
  } catch {
    // EC-2 (PROJ-2) — the database is unreachable; the form keeps what was typed.
    return { error: SPEICHERN_FEHLGESCHLAGEN }
  }

  // AC-1 — the list and the totals come back from the server, so they cannot drift
  // apart from each other.
  revalidatePath('/app')
  return { gespeichertAm: Date.now() }
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error(NICHT_ANGEMELDET)

  // EC-3 — the filter plus row level security means a guessed id of someone else's
  // expense matches nothing. EC-6 — an already deleted row matches nothing either,
  // and that is success, not an error.
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(LOESCHEN_FEHLGESCHLAGEN)

  revalidatePath('/app')
}

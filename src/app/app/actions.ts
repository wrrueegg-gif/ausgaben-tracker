'use server'

// Creating and deleting an expense — AC-1, AC-9, AC-12, EC-2, EC-3, EC-6.

import { revalidatePath } from 'next/cache'

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

  try {
    // user_id is taken from the session, never from the form. Row level security
    // checks the same thing again on the way in.
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount_chf: parsed.value.amount_chf,
      category: parsed.value.category,
      spent_on: parsed.value.spent_on,
      note: parsed.value.note,
    })
    if (error) return { error: SPEICHERN_FEHLGESCHLAGEN }
  } catch {
    // EC-2 — the database is unreachable; the form keeps what the person typed.
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

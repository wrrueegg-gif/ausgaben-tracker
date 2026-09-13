// What a valid expense is — AC-3, AC-4, EC-4, EC-5.
// The same rules exist as constraints in the database; this is the first of the two
// independent checks and the one that can explain itself to a person.
import { z } from 'zod'

export const KATEGORIEN = [
  'Lebensmittel',
  'Wohnen',
  'Mobilität',
  'Freizeit',
  'Gesundheit',
  'Sonstiges',
] as const

export type Kategorie = (typeof KATEGORIEN)[number]

export const NOTIZ_MAX_LAENGE = 200

// PROJ-3 — AC-1, AC-10. Four currencies cover cross-border shopping, travel and
// online subscriptions; a longer list costs time at every capture.
export const WAEHRUNGEN = ['CHF', 'EUR', 'USD', 'GBP'] as const

export type Waehrung = (typeof WAEHRUNGEN)[number]

/** Today in Swiss local time, as YYYY-MM-DD — the date the database compares against. */
export function heuteIso(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export const expenseSchema = z.object({
  // PROJ-3: this is what the person typed, in the currency they picked. The franc
  // amount is derived from it and the rate, in the action.
  // EC-4 (PROJ-2): rounded to two decimals, so the stored value is the displayed one.
  amount_original: z
    .string()
    .trim()
    .min(1, 'Bitte gib einen Betrag ein.')
    .transform((value) => value.replace(',', '.'))
    .refine((value) => /^\d+(\.\d+)?$/.test(value), 'Bitte gib eine Zahl ein, z. B. 12.50.')
    .transform((value) => Math.round(Number(value) * 100) / 100)
    .refine((value) => value > 0, 'Der Betrag muss grösser als 0 sein.')
    .refine((value) => value <= 9_999_999_999, 'Dieser Betrag ist zu gross.'),
  currency: z.enum(WAEHRUNGEN, {
    message: 'Bitte wähle eine Währung: CHF, EUR, USD oder GBP.',
  }),
  category: z.enum(KATEGORIEN, { message: 'Bitte wähle eine Kategorie.' }),
  spent_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitte wähle ein Datum.')
    // EC-5: an expense tracker records what was spent, never what will be.
    .refine((value) => value <= heuteIso(), 'Das Datum darf nicht in der Zukunft liegen.'),
  note: z
    .string()
    .trim()
    .max(NOTIZ_MAX_LAENGE, `Die Notiz darf höchstens ${NOTIZ_MAX_LAENGE} Zeichen haben.`)
    .optional()
    .transform((value) => (value ? value : null)),
})

export type ExpenseInput = z.infer<typeof expenseSchema>

export type ExpenseFieldErrors = Partial<
  Record<'amount_original' | 'currency' | 'category' | 'spent_on' | 'note', string>
>

export function parseExpense(formData: FormData):
  | { ok: true; value: ExpenseInput }
  | { ok: false; fieldErrors: ExpenseFieldErrors } {
  const result = expenseSchema.safeParse({
    amount_original: String(formData.get('amount_original') ?? ''),
    currency: String(formData.get('currency') ?? ''),
    category: String(formData.get('category') ?? ''),
    spent_on: String(formData.get('spent_on') ?? ''),
    note: String(formData.get('note') ?? ''),
  })

  if (result.success) return { ok: true, value: result.data }

  const fieldErrors: ExpenseFieldErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (
      (field === 'amount_original' ||
        field === 'currency' ||
        field === 'category' ||
        field === 'spent_on' ||
        field === 'note') &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message
    }
  }
  return { ok: false, fieldErrors }
}

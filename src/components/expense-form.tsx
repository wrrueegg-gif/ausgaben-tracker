'use client'

// Capturing an expense — AC-1, AC-2, AC-3, AC-4, EC-1, EC-2 (PROJ-2)
// and AC-1, AC-9, AC-10, EC-5 (PROJ-3: the currency and the conversion hint).
//
// The fields are controlled, because React empties an uncontrolled form after every
// action — a failed one included, which would throw away what the person typed
// (EC-2). After a successful save the fields component is remounted through its
// key, and that is what clears the form for the next expense.

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { createExpense, type ExpenseFormState } from '@/app/app/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KATEGORIEN, NOTIZ_MAX_LAENGE, WAEHRUNGEN } from '@/lib/validation/expense'

function SubmitButton() {
  const { pending } = useFormStatus()
  // EC-1: a second click while the first is in flight would create a second expense.
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Wird gespeichert …' : 'Ausgabe speichern'}
    </Button>
  )
}

function Felder({
  heute,
  fieldErrors,
}: {
  heute: string
  fieldErrors: ExpenseFormState['fieldErrors']
}) {
  // New per mount, so a retry of the same submission carries the same key while a
  // deliberate second expense (which remounts after a save) gets a fresh one.
  const [submissionId] = useState(() => crypto.randomUUID())
  const [betrag, setBetrag] = useState('')
  const [waehrung, setWaehrung] = useState<string>('CHF')
  const [kategorie, setKategorie] = useState<string>(KATEGORIEN[0])
  const [datum, setDatum] = useState(heute)
  const [notiz, setNotiz] = useState('')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="submission_id" value={submissionId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount_original">Betrag</Label>
        <div className="flex gap-2">
          <Input
            id="amount_original"
            name="amount_original"
            inputMode="decimal"
            placeholder="12.50"
            required
            className="flex-1"
            value={betrag}
            onChange={(event) => setBetrag(event.target.value)}
            aria-describedby={
              fieldErrors?.amount_original ? 'betrag-fehler' : 'betrag-hinweis'
            }
          />
          {/* AC-1 (PROJ-3): CHF is preselected; three foreign currencies beside it. */}
          <select
            id="currency"
            name="currency"
            value={waehrung}
            onChange={(event) => setWaehrung(event.target.value)}
            aria-label="Währung"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-24 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {WAEHRUNGEN.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        {fieldErrors?.amount_original ? (
          <p id="betrag-fehler" className="text-destructive text-sm">
            {fieldErrors.amount_original}
          </p>
        ) : waehrung !== 'CHF' ? (
          <p id="betrag-hinweis" className="text-muted-foreground text-sm">
            Wird mit dem EZB-Kurs vom Ausgabedatum in CHF umgerechnet.
          </p>
        ) : null}
        {fieldErrors?.currency ? (
          <p className="text-destructive text-sm">{fieldErrors.currency}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Kategorie</Label>
        {/* A plain select: it works without JavaScript and submits with the form. */}
        <select
          id="category"
          name="category"
          value={kategorie}
          onChange={(event) => setKategorie(event.target.value)}
          required
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-describedby={fieldErrors?.category ? 'kategorie-fehler' : undefined}
        >
          {KATEGORIEN.map((eintrag) => (
            <option key={eintrag} value={eintrag}>
              {eintrag}
            </option>
          ))}
        </select>
        {fieldErrors?.category ? (
          <p id="kategorie-fehler" className="text-destructive text-sm">
            {fieldErrors.category}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="spent_on">Datum</Label>
        <Input
          id="spent_on"
          name="spent_on"
          type="date"
          // AC-2: today is already filled in, so saving is one click away.
          value={datum}
          onChange={(event) => setDatum(event.target.value)}
          max={heute}
          required
          aria-describedby={fieldErrors?.spent_on ? 'datum-fehler' : undefined}
        />
        {fieldErrors?.spent_on ? (
          <p id="datum-fehler" className="text-destructive text-sm">
            {fieldErrors.spent_on}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Notiz (optional)</Label>
        <Input
          id="note"
          name="note"
          maxLength={NOTIZ_MAX_LAENGE}
          placeholder="Znüni mit Team"
          value={notiz}
          onChange={(event) => setNotiz(event.target.value)}
          aria-describedby={fieldErrors?.note ? 'notiz-fehler' : undefined}
        />
        {fieldErrors?.note ? (
          <p id="notiz-fehler" className="text-destructive text-sm">
            {fieldErrors.note}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function ExpenseForm({ heute }: { heute: string }) {
  const [state, formAction] = useActionState<ExpenseFormState, FormData>(createExpense, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {/* A successful save changes the key, which remounts the fields with their
          defaults — that is how the form empties itself for the next expense.
          On an error the key is unchanged and everything typed stays put (EC-2). */}
      <Felder key={state.gespeichertAm ?? 0} heute={heute} fieldErrors={state.fieldErrors} />

      <div>
        <SubmitButton />
      </div>
    </form>
  )
}

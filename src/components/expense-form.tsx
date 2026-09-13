'use client'

// Capturing an expense — AC-1, AC-2, AC-3, AC-4, EC-1, EC-2 (PROJ-2)
// and AC-1, AC-9, AC-10, EC-5 (PROJ-3: the currency and the conversion hint).

import { useActionState, useEffect, useRef, useState } from 'react'
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

export function ExpenseForm({ heute }: { heute: string }) {
  const [state, formAction] = useActionState<ExpenseFormState, FormData>(createExpense, {})
  const formRef = useRef<HTMLFormElement>(null)
  const [waehrung, setWaehrung] = useState<string>('CHF')

  // After a save the form empties itself, so the next expense can be typed straight
  // away. The date keeps today's value (AC-2).
  useEffect(() => {
    // reset() fires the form's reset event, which is where the currency hint is
    // put back — an event handler rather than another state write in here.
    if (state.gespeichertAm) formRef.current?.reset()
  }, [state.gespeichertAm])

  return (
    <form
      ref={formRef}
      action={formAction}
      onReset={() => setWaehrung('CHF')}
      className="flex flex-col gap-4"
    >
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
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
              aria-describedby={
                state.fieldErrors?.amount_original ? 'betrag-fehler' : 'betrag-hinweis'
              }
            />
            {/* AC-1 (PROJ-3): CHF is preselected; three foreign currencies beside it. */}
            <select
              id="currency"
              name="currency"
              defaultValue="CHF"
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
          {state.fieldErrors?.amount_original ? (
            <p id="betrag-fehler" className="text-destructive text-sm">
              {state.fieldErrors.amount_original}
            </p>
          ) : waehrung !== 'CHF' ? (
            <p id="betrag-hinweis" className="text-muted-foreground text-sm">
              Wird mit dem EZB-Kurs vom Ausgabedatum in CHF umgerechnet.
            </p>
          ) : null}
          {state.fieldErrors?.currency ? (
            <p className="text-destructive text-sm">{state.fieldErrors.currency}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Kategorie</Label>
          {/* A plain select: it works without JavaScript and submits with the form. */}
          <select
            id="category"
            name="category"
            defaultValue={KATEGORIEN[0]}
            required
            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-describedby={state.fieldErrors?.category ? 'kategorie-fehler' : undefined}
          >
            {KATEGORIEN.map((kategorie) => (
              <option key={kategorie} value={kategorie}>
                {kategorie}
              </option>
            ))}
          </select>
          {state.fieldErrors?.category ? (
            <p id="kategorie-fehler" className="text-destructive text-sm">
              {state.fieldErrors.category}
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
            defaultValue={heute}
            max={heute}
            required
            aria-describedby={state.fieldErrors?.spent_on ? 'datum-fehler' : undefined}
          />
          {state.fieldErrors?.spent_on ? (
            <p id="datum-fehler" className="text-destructive text-sm">
              {state.fieldErrors.spent_on}
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
            aria-describedby={state.fieldErrors?.note ? 'notiz-fehler' : undefined}
          />
          {state.fieldErrors?.note ? (
            <p id="notiz-fehler" className="text-destructive text-sm">
              {state.fieldErrors.note}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  )
}

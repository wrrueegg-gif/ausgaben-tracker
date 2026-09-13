'use client'

// AC-9 — deleting asks once, because the list is click-dense and deletion is final.
//
// The dialog is controlled and only closes once the deletion has actually run.
// The obvious version — a submit button inside AlertDialogAction — looks right and
// silently does nothing: Radix closes the dialog on click, which unmounts the form
// in the portal before React can dispatch the action. Found while verifying the
// build against the real app.

import { useState, useTransition } from 'react'

import { deleteExpense } from '@/app/app/actions'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function DeleteExpenseButton({
  id,
  beschreibung,
}: {
  id: string
  beschreibung: string
}) {
  const [offen, setOffen] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [laeuft, starte] = useTransition()

  function loeschen(formData: FormData) {
    starte(async () => {
      const ergebnis = await deleteExpense(formData)
      // EC-2: a failure stays in the dialog as a readable sentence; only a success
      // closes it.
      if (ergebnis.error) setFehler(ergebnis.error)
      else setOffen(false)
    })
  }

  return (
    <AlertDialog
      open={offen}
      onOpenChange={(wert) => {
        setOffen(wert)
        if (!wert) setFehler(null)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          aria-label={`Ausgabe löschen: ${beschreibung}`}
        >
          Löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ausgabe löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            {beschreibung} wird endgültig entfernt und verschwindet aus der
            Monatssumme.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {fehler ? (
          <p role="alert" className="text-destructive text-sm">
            {fehler}
          </p>
        ) : null}
        <form action={loeschen}>
          <input type="hidden" name="id" value={id} />
          <AlertDialogFooter>
            {/* AC-9: cancelling leaves everything as it was. */}
            <AlertDialogCancel disabled={laeuft}>Abbrechen</AlertDialogCancel>
            <Button type="submit" disabled={laeuft}>
              {laeuft ? 'Wird gelöscht …' : 'Löschen'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

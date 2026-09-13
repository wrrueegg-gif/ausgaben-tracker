'use client'

// AC-9 — deleting asks once, because the list is click-dense and deletion is final.
// The form lives inside the dialog: the dialog content is rendered in a portal, so a
// button in it could not reach a form that stayed behind in the table row.

import { useFormStatus } from 'react-dom'

import { deleteExpense } from '@/app/app/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

function ConfirmButton() {
  const { pending } = useFormStatus()
  return (
    <AlertDialogAction type="submit" disabled={pending}>
      {pending ? 'Wird gelöscht …' : 'Löschen'}
    </AlertDialogAction>
  )
}

export function DeleteExpenseButton({
  id,
  beschreibung,
}: {
  id: string
  beschreibung: string
}) {
  return (
    <AlertDialog>
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
        <AlertDialogFooter>
          {/* AC-9: cancelling leaves everything as it was. */}
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <form action={deleteExpense}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

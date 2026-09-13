'use client'

// AC-13 — deleting an account is irreversible, so it asks once before it happens.
//
// Same shape as DeleteExpenseButton, and for the same reason: the dialog stays open
// until the deletion has run. Closing it on click would unmount the form in the
// portal and the action would never be dispatched.

import { useState, useTransition } from 'react'

import { deleteAccount } from '@/app/(auth)/actions'
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

export function DeleteAccountDialog() {
  const [offen, setOffen] = useState(false)
  const [laeuft, starte] = useTransition()

  function loeschen() {
    starte(async () => {
      await deleteAccount()
      setOffen(false)
    })
  }

  return (
    <AlertDialog open={offen} onOpenChange={setOffen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Konto löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Dein Konto, dein Profil und alle deine Ausgaben werden endgültig
            entfernt. Das lässt sich nicht rückgängig machen. Lade deine Daten
            vorher herunter, wenn du sie behalten möchtest.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={loeschen}>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={laeuft}>Abbrechen</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={laeuft}>
              {laeuft ? 'Wird gelöscht …' : 'Endgültig löschen'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

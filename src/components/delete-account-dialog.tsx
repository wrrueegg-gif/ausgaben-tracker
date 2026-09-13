'use client'

// AC-13 — deleting an account is irreversible, so it asks once before it happens.
// A client component because the confirmation dialog is interactive; the deletion
// itself runs in the Server Action.

import { useFormStatus } from 'react-dom'

import { deleteAccount } from '@/app/(auth)/actions'
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
      {pending ? 'Wird gelöscht …' : 'Endgültig löschen'}
    </AlertDialogAction>
  )
}

export function DeleteAccountDialog() {
  return (
    <AlertDialog>
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
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <form action={deleteAccount}>
            <ConfirmButton />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

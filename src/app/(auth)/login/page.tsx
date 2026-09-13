'use client'

// Sign-in page — AC-3, AC-4, AC-10, AC-11, AC-14, EC-2, EC-3.
// The form submits through a Server Action, so the password travels in a POST body
// and never in the URL.

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { login, type AuthFormState } from '../actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  // EC-2: a second click while the first is in flight would open a second session.
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Wird geprüft …' : 'Anmelden'}
    </Button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(login, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>
          Melde dich an, um deine Ausgaben zu sehen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="du@beispiel.ch"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton />
        </form>

        <p className="text-muted-foreground mt-6 text-sm">
          Noch kein Konto?{' '}
          <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
            Registrieren
          </Link>
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          <Link href="/datenschutz" className="underline-offset-4 hover:underline">
            Datenschutz
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

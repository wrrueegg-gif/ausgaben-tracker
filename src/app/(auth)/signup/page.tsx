'use client'

// Sign-up page — AC-1, AC-2, AC-14, EC-1, EC-2, EC-5.

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { signup, type AuthFormState } from '../actions'
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
import { MIN_PASSWORT_LAENGE } from '@/lib/validation/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  // EC-2: no second account from a double click.
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Konto wird angelegt …' : 'Konto anlegen'}
    </Button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signup, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konto anlegen</CardTitle>
        <CardDescription>
          E-Mail und Passwort genügen. Deine Ausgaben sieht nur du.
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
              aria-describedby={state.fieldErrors?.email ? 'email-fehler' : undefined}
            />
            {state.fieldErrors?.email ? (
              <p id="email-fehler" className="text-destructive text-sm">
                {state.fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORT_LAENGE}
              aria-describedby={
                state.fieldErrors?.password ? 'passwort-fehler' : 'passwort-hinweis'
              }
            />
            {state.fieldErrors?.password ? (
              <p id="passwort-fehler" className="text-destructive text-sm">
                {state.fieldErrors.password}
              </p>
            ) : (
              <p id="passwort-hinweis" className="text-muted-foreground text-sm">
                Mindestens {MIN_PASSWORT_LAENGE} Zeichen.
              </p>
            )}
          </div>

          <SubmitButton />
        </form>

        <p className="text-muted-foreground mt-6 text-sm">
          Schon registriert?{' '}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Anmelden
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

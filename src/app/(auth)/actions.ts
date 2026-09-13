'use server'

// Sign-up, sign-in, sign-out and account deletion — AC-1, AC-3, AC-4, AC-5, AC-11,
// AC-13, EC-1, EC-2, EC-3.
//
// These are Server Actions on purpose: they POST by design, so a password can never
// end up in the address bar (docs/stacks/framework-nextjs.md).

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import {
  checkCredentialLimit,
  clearCredentialFailures,
  recordCredentialFailure,
} from '@/lib/rate-limit'
import { parseCredentials, type FieldErrors } from '@/lib/validation/auth'

export type AuthFormState = {
  error?: string
  fieldErrors?: FieldErrors
}

// AC-11: one wording for every failed sign-in, so nothing reveals whether an
// address exists — unknown address and wrong password are indistinguishable.
const ANMELDUNG_FEHLGESCHLAGEN = 'E-Mail-Adresse oder Passwort ist falsch.'
// EC-1: the same idea for sign-up.
const REGISTRIERUNG_FEHLGESCHLAGEN =
  'Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben — falls du bereits ein Konto hast, melde dich an.'
const VERBINDUNGSFEHLER =
  'Die Anmeldung ist gerade nicht erreichbar. Bitte versuche es in einem Moment erneut.'

async function clientIp(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headerList.get('x-real-ip') ?? 'unbekannt'
}

async function throttleKeys(email: string): Promise<string[]> {
  return [`login:${email.toLowerCase()}`, `login-ip:${await clientIp()}`]
}

// Sign-up is a credential path too, and it had no brake at all: without this a
// script can create accounts in bulk, which is exactly what the deliberately
// omitted CAPTCHA would otherwise have covered. Counted under its own prefix, so
// a failed sign-up can never lock somebody out of signing in.
async function signupThrottleKeys(email: string): Promise<string[]> {
  return [`signup:${email.toLowerCase()}`, `signup-ip:${await clientIp()}`]
}

/**
 * The auth library RETURNS a network failure as an error object instead of
 * throwing it, so a catch block never sees one. Without this check an outage is
 * indistinguishable from a wrong password — the person is told their password is
 * wrong, and five outages lock their account for fifteen minutes.
 */
function istVerbindungsfehler(error: { name?: string; status?: number } | null): boolean {
  if (!error) return false
  if (error.name === 'AuthRetryableFetchError') return true
  // status 0 means the request never reached anyone; 5xx means it arrived nowhere useful.
  return error.status === 0 || (typeof error.status === 'number' && error.status >= 500)
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData)
  // AC-2: the password rule is reported on its own field, it is not a credential hint.
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors }

  const { email, password } = parsed.value
  const keys = await signupThrottleKeys(email)

  const verdict = checkCredentialLimit(keys)
  if (!verdict.allowed) {
    return {
      error: `Zu viele Versuche. Bitte versuche es in ${verdict.retryAfterMinutes} Minuten erneut.`,
    }
  }

  const supabase = await createClient()

  let hatSitzung = false
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    // EC-3: an outage is not a rejected sign-up, and it must not count as an attempt.
    if (istVerbindungsfehler(error)) return { error: VERBINDUNGSFEHLER }
    // A taken address, or a project that still asks for email confirmation, both end
    // up here without a session. Same neutral wording for both (EC-1).
    if (error || !data.session) {
      recordCredentialFailure(keys)
      return { error: REGISTRIERUNG_FEHLGESCHLAGEN }
    }
    clearCredentialFailures(keys)
    hatSitzung = true
  } catch {
    return { error: VERBINDUNGSFEHLER }
  }

  // AC-1 — redirect() throws by design, so it must sit outside the try block.
  if (hatSitzung) redirect('/app')
  return { error: REGISTRIERUNG_FEHLGESCHLAGEN }
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData)
  // AC-11: on sign-in even a malformed input gets the one neutral message — a field
  // error here would tell an attacker their guess was well-formed but unknown.
  if (!parsed.ok) return { error: ANMELDUNG_FEHLGESCHLAGEN }

  const { email, password } = parsed.value
  const keys = await throttleKeys(email)

  // AC-10: counted before the password is checked, so a blocked attempt never
  // reaches the auth platform.
  const verdict = checkCredentialLimit(keys)
  if (!verdict.allowed) {
    return {
      error: `Zu viele Fehlversuche. Bitte versuche es in ${verdict.retryAfterMinutes} Minuten erneut.`,
    }
  }

  const supabase = await createClient()

  let angemeldet = false
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    // EC-3: an unreachable backend is not a wrong password. Counting it would let an
    // outage lock people out of their own accounts.
    if (istVerbindungsfehler(error)) return { error: VERBINDUNGSFEHLER }
    if (error) {
      recordCredentialFailure(keys)
      return { error: ANMELDUNG_FEHLGESCHLAGEN }
    }
    clearCredentialFailures(keys)
    angemeldet = true
  } catch {
    return { error: VERBINDUNGSFEHLER }
  }

  if (angemeldet) redirect('/app')
  return { error: ANMELDUNG_FEHLGESCHLAGEN }
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // AC-13 — the database function deletes exactly the caller's account and cascades
  // to the profile and every expense. No admin key is involved.
  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw new Error('Das Konto konnte nicht gelöscht werden.')

  await supabase.auth.signOut()
  redirect('/login?geloescht=1')
}

// Server-side check of what the sign-in and sign-up forms send — AC-2, EC-5.
// The browser already refuses a malformed address (type="email" required); this is
// the backstop for anything that does not come from our own form.
import { z } from 'zod'

export const MIN_PASSWORT_LAENGE = 8

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Bitte gib deine E-Mail-Adresse ein.')
    .email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  password: z
    .string()
    .min(
      MIN_PASSWORT_LAENGE,
      `Das Passwort muss mindestens ${MIN_PASSWORT_LAENGE} Zeichen haben.`
    ),
})

export type Credentials = z.infer<typeof credentialsSchema>

export type FieldErrors = Partial<Record<keyof Credentials, string>>

export function parseCredentials(formData: FormData):
  | { ok: true; value: Credentials }
  | { ok: false; fieldErrors: FieldErrors } {
  const result = credentialsSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })

  if (result.success) return { ok: true, value: result.data }

  const fieldErrors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if ((field === 'email' || field === 'password') && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return { ok: false, fieldErrors }
}

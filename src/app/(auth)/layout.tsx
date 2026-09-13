// Frame for the signed-out pages: one centred card, no header (docs/app-shell.md).
// AC-7 — someone who is already signed in has no business here.
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/app')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Ausgaben-Tracker</h1>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

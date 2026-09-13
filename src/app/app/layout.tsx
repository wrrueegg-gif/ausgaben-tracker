// The protected area — AC-6, EC-4.
// This redirect is the convenient check. The binding one is row level security in the
// database, which holds even for someone who bypasses the app entirely (AC-9).
import { redirect } from 'next/navigation'

import { AppHeader } from '@/components/app-header'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader email={user.email ?? ''} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}

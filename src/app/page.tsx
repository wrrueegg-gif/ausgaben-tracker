// AC-6, AC-7 — the root is not a page, it is a signpost: signed in to the app,
// signed out to the sign-in page.
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  redirect(user ? '/app' : '/login')
}

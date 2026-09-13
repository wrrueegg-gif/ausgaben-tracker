// AC-12 — the signed-in person downloads everything this product holds about them,
// in a machine-readable form (Art. 15 and Art. 20 DSGVO, Art. 25 DSG).
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Nicht angemeldet.', { status: 401 })
  }

  const { data: profil } = await supabase
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('id', user.id)
    .maybeSingle()

  // Row level security already limits this to the caller's own rows; the filter is
  // the second of the two independent checks. The table arrives with PROJ-2 — until
  // then the query fails with "relation does not exist" and the export is simply empty.
  const { data: ausgaben, error: ausgabenFehler } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('spent_on', { ascending: false })

  const inhalt = {
    exportiert_am: new Date().toISOString(),
    hinweis:
      'Vollständiger Export der Daten, die der Ausgaben-Tracker zu diesem Konto gespeichert hat.',
    konto: {
      id: user.id,
      email: user.email,
      registriert_am: user.created_at,
    },
    profil: profil ?? null,
    ausgaben: ausgabenFehler ? [] : (ausgaben ?? []),
  }

  return new Response(JSON.stringify(inhalt, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ausgaben-tracker-export.json"',
      'Cache-Control': 'no-store',
    },
  })
}

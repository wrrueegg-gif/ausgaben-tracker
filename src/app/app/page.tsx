// The signed-in overview — AC-12, AC-13, AC-14.
// The expense list and the monthly summary arrive with PROJ-2; this page holds the
// place for them and carries the account section.
import Link from 'next/link'

import { DeleteAccountDialog } from '@/components/delete-account-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export default async function AppPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profil } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo {profil?.display_name ?? 'und willkommen'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Hier laufen deine Ausgaben zusammen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deine Ausgaben</CardTitle>
          <CardDescription>
            Das Erfassen und die Monatsübersicht kommen mit dem nächsten Feature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Noch keine Ausgaben erfasst.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Konto &amp; Daten</CardTitle>
          <CardDescription>
            Du kannst jederzeit alles herunterladen, was wir gespeichert haben, oder
            dein Konto samt allen Daten löschen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <a href="/api/export" download>
              Meine Daten herunterladen
            </a>
          </Button>
          <DeleteAccountDialog />
          <Link
            href="/datenschutz"
            className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            Datenschutz
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

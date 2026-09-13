// The signed-in overview — AC-1, AC-5, AC-6, AC-7, AC-10, AC-12 (PROJ-2) and
// AC-12, AC-13, AC-14 from PROJ-1 (the account section at the bottom).
import Link from 'next/link'
import { Suspense } from 'react'

import { DeleteAccountDialog } from '@/components/delete-account-dialog'
import { ExpenseForm } from '@/components/expense-form'
import { ExpenseList } from '@/components/expense-list'
import { MonthSummary } from '@/components/month-summary'
import { MonthSwitcher } from '@/components/month-switcher'
import { RatePanel } from '@/components/rate-panel'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { leseMonat } from '@/lib/month'
import { createClient } from '@/lib/supabase/server'
import type { AusgabeZeile } from '@/lib/expense-summary'
import { heuteIso } from '@/lib/validation/expense'

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string }>
}) {
  const { monat: monatParameter } = await searchParams
  const monat = leseMonat(monatParameter)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only this month's rows, and — through row level security — only this person's.
  const { data: ausgaben, error } = await supabase
    .from('expenses')
    .select(
      'id, amount_chf, category, spent_on, note, currency, amount_original, exchange_rate, rate_date'
    )
    .gte('spent_on', monat.von)
    .lte('spent_on', monat.bis)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })

  const zeilen = (ausgaben ?? []) as AusgabeZeile[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Ausgaben</h1>
        <MonthSwitcher monat={monat} />
      </div>

      {error ? (
        // EC-2 — the database did not answer; the form below still works.
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            Deine Ausgaben konnten gerade nicht geladen werden. Lade die Seite in
            einem Moment neu.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* AC-7 — streamed in on its own, so a failing rate source never delays or
          blocks the list and the totals (EC-3, EC-6). */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="text-muted-foreground py-4 text-sm">
              Wechselkurse werden geladen …
            </CardContent>
          </Card>
        }
      >
        <RatePanel />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Neue Ausgabe</CardTitle>
          <CardDescription>Betrag, Kategorie, Datum — fertig.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm heute={heuteIso()} />
        </CardContent>
      </Card>

      <MonthSummary ausgaben={zeilen} monatsName={monat.name} />

      <ExpenseList ausgaben={zeilen} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Konto &amp; Daten</CardTitle>
          <CardDescription>
            Angemeldet als {user?.email}. Du kannst jederzeit alles herunterladen,
            was wir gespeichert haben, oder dein Konto samt allen Daten löschen.
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

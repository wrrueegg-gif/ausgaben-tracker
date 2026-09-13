// The month at a glance — AC-6, AC-10.
import { berechneMonatssumme, formatiereChf, type AusgabeZeile } from '@/lib/expense-summary'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function MonthSummary({
  ausgaben,
  monatsName,
}: {
  ausgaben: AusgabeZeile[]
  monatsName: string
}) {
  const { gesamt, jeKategorie } = berechneMonatssumme(ausgaben)

  return (
    <Card>
      <CardHeader>
        <CardDescription>Ausgaben im {monatsName}</CardDescription>
        <CardTitle className="text-3xl font-medium tabular-nums">
          {formatiereChf(gesamt)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {jeKategorie.length === 0 ? (
          // AC-10 — an empty month says so instead of showing nothing.
          <p className="text-muted-foreground text-sm">
            Noch nichts erfasst in diesem Monat.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {jeKategorie.map(({ kategorie, betrag, anteilProzent }) => (
              <li key={kategorie} className="flex items-baseline justify-between gap-4 text-sm">
                <span>{kategorie}</span>
                <span className="flex items-baseline gap-3">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {anteilProzent}&nbsp;%
                  </span>
                  <span className="font-medium tabular-nums">{formatiereChf(betrag)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

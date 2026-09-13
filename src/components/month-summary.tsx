// Der Monat auf einen Blick — AC-6, AC-10, AC-13, AC-14, AC-16.
//
// Ring und Aufstellung lesen dieselbe Summenbildung. Sie können deshalb nicht
// auseinanderlaufen: es gibt eine Zahl und einen Rechenweg.
import { EmptyMonth } from '@/components/empty-month'
import { MonthChart } from '@/components/month-chart'
import {
  berechneMonatssumme,
  farbeVon,
  formatiereChf,
  type AusgabeZeile,
} from '@/lib/expense-summary'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

export function MonthSummary({
  ausgaben,
  monatsName,
}: {
  ausgaben: AusgabeZeile[]
  monatsName: string
}) {
  const summe = berechneMonatssumme(ausgaben)

  // AC-10, AC-16 — ein leerer Monat sagt das, statt eine leere Fläche zu zeigen.
  if (summe.jeKategorie.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyMonth monatsName={monatsName} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Ausgaben im {monatsName}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
        <MonthChart summe={summe} />

        <ul className="flex w-full flex-col gap-3">
          {summe.jeKategorie.map(({ kategorie, betrag, anteilProzent }, i) => (
            <li
              key={kategorie}
              className="sanft-auf flex flex-col gap-1"
              style={{ '--verzug': `${150 + i * 70}ms` } as React.CSSProperties}
            >
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  {/* AC-13 — derselbe Farbton wie der Abschnitt im Ring. */}
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: `hsl(var(--chart-${farbeVon(kategorie)}))` }}
                  />
                  {kategorie}
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {anteilProzent}&nbsp;%
                  </span>
                  <span className="font-medium tabular-nums">{formatiereChf(betrag)}</span>
                </span>
              </div>

              {/* AC-14 — der Balken läuft von links ein. */}
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="balken-fuellung h-full rounded-full"
                  style={
                    {
                      width: `${Math.max(anteilProzent, 2)}%`,
                      background: `hsl(var(--chart-${farbeVon(kategorie)}))`,
                      '--verzug': `${150 + i * 70}ms`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

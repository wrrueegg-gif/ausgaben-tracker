// AC-7 — the current rates, so the integration is visible before anything is
// captured. Streamed in separately, so a failing rate source never blocks the
// overview (EC-3, EC-6).
import { holeAktuelleKurse, KURS_QUELLE } from '@/lib/exchange-rate'
import { formatiereDatum, formatiereKurs } from '@/lib/expense-summary'
import { Card, CardContent } from '@/components/ui/card'

export async function RatePanel() {
  const kurse = await holeAktuelleKurse()

  return (
    <Card>
      <CardContent className="flex flex-wrap items-baseline gap-x-6 gap-y-2 py-4">
        {kurse === null ? (
          // EC-3 — one short line, and the rest of the page carries on.
          <p className="text-muted-foreground text-sm">
            Wechselkurse gerade nicht abrufbar. Ausgaben in CHF lassen sich
            trotzdem erfassen.
          </p>
        ) : (
          <>
            {kurse.kurse.map(({ waehrung, rate }) => (
              <span key={waehrung} className="text-sm tabular-nums">
                1 {waehrung} ={' '}
                <span className="font-medium">{formatiereKurs(rate)} CHF</span>
              </span>
            ))}
            <span className="text-muted-foreground text-xs">
              Kurse vom {formatiereDatum(kurse.rateDate)} · {KURS_QUELLE}
            </span>
          </>
        )}
      </CardContent>
    </Card>
  )
}

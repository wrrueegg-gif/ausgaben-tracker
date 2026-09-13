// The month's expenses — AC-5, AC-9, AC-10 (PROJ-2) and AC-4 (PROJ-3: the
// original amount, the rate and the rate date are readable on a foreign-currency row).
import { DeleteExpenseButton } from '@/components/delete-expense-button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatiereBetrag,
  formatiereChf,
  formatiereDatum,
  formatiereKurs,
  type AusgabeZeile,
} from '@/lib/expense-summary'

export function ExpenseList({ ausgaben }: { ausgaben: AusgabeZeile[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ausgaben</CardTitle>
      </CardHeader>
      <CardContent>
        {ausgaben.length === 0 ? (
          // AC-10 — the empty state says what to do next.
          <p className="text-muted-foreground text-sm">
            Noch keine Ausgaben in diesem Monat. Erfasse oben deine erste Ausgabe.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Notiz</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="sr-only">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ausgaben.map((ausgabe) => (
                  <TableRow key={ausgabe.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatiereDatum(ausgabe.spent_on)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{ausgabe.category}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ausgabe.note ?? ''}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className="font-medium tabular-nums">
                        {formatiereChf(Number(ausgabe.amount_chf))}
                      </span>
                      {/* AC-4 — a foreign-currency row shows what was paid and how
                          it was converted, so the number can be checked. */}
                      {ausgabe.currency !== 'CHF' ? (
                        <span className="text-muted-foreground block text-xs tabular-nums">
                          {formatiereBetrag(Number(ausgabe.amount_original), ausgabe.currency)}{' '}
                          · Kurs {formatiereKurs(Number(ausgabe.exchange_rate))} vom{' '}
                          {formatiereDatum(ausgabe.rate_date)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteExpenseButton
                        id={ausgabe.id}
                        beschreibung={`${formatiereDatum(ausgabe.spent_on)}, ${ausgabe.category}, ${formatiereChf(Number(ausgabe.amount_chf))}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

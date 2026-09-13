// Das Ringdiagramm — AC-13, AC-14, EC-7.
//
// Eine Server-Komponente: Die Zahlen kommen fertig aus der Summenbildung, der
// Browser bewegt nur noch Pixel. Deshalb kann der Ring nicht von der
// Aufstellung daneben abweichen — beide lesen dieselben Werte.
//
// Der Kreis hat einen Umfang von genau 100 Einheiten (2 × π × 15.9155), damit
// ein Anteil in Prozent unverändert als Strichlänge eingesetzt werden kann.
import { AnimatedAmount } from '@/components/animated-amount'
import { ringAbschnitte, type Monatssumme } from '@/lib/expense-summary'

const RADIUS = 15.9155

export function MonthChart({ summe }: { summe: Monatssumme }) {
  const abschnitte = ringAbschnitte(summe)

  return (
    <div className="relative shrink-0" style={{ width: 192, height: 192 }}>
      <svg
        viewBox="0 0 40 40"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={`Ringdiagramm der Ausgaben: ${abschnitte
          .map((a) => `${a.kategorie} ${a.anteil} Prozent`)
          .join(', ')}`}
      >
        {/* Spur: bleibt sichtbar, solange die Abschnitte noch wachsen */}
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
        />
        {abschnitte.map((abschnitt, i) => (
          <circle
            key={abschnitt.kategorie}
            cx="20"
            cy="20"
            r={RADIUS}
            fill="none"
            stroke={`hsl(var(--chart-${abschnitt.farbe}))`}
            strokeWidth="4"
            strokeLinecap="butt"
            // Der Versatz verschiebt den Beginn des Abschnitts auf dem Ring.
            strokeDashoffset={-abschnitt.versatz}
            className="ring-abschnitt"
            style={
              {
                '--anteil': abschnitt.anteil,
                '--rest': 100 - abschnitt.anteil,
                '--verzug': `${i * 90}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>

      {/* Die Mitte muss in das Loch des Rings passen, auch bei einer vierstelligen
          Summe — deshalb bewusst eine Stufe kleiner als die Überschriften. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <span className="text-muted-foreground text-[11px] leading-none">Gesamt</span>
        <AnimatedAmount betrag={summe.gesamt} />
      </div>
    </div>
  )
}

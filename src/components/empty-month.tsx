// Der leere Monat — AC-16.
//
// Statt einer leeren Fläche ein ruhig kreisender gestrichelter Ring mit einem
// Pluszeichen: die Form, die gleich mit Farbe gefüllt sein wird, und die
// Aufforderung, etwas einzutragen. Kein Blinken, kein Hüpfen — es ist ein
// Werkzeug für Geld.
export function EmptyMonth({ monatsName }: { monatsName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <svg viewBox="0 0 80 80" className="h-28 w-28" role="presentation" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r="30"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="4"
          strokeDasharray="6 7"
          strokeLinecap="round"
          className="leer-ring"
        />
        <circle cx="40" cy="40" r="21" fill="hsl(var(--muted))" />
        <g stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round">
          <line x1="40" y1="32" x2="40" y2="48" />
          <line x1="32" y1="40" x2="48" y2="40" />
        </g>
      </svg>

      <div className="sanft-auf" style={{ '--verzug': '150ms' } as React.CSSProperties}>
        <p className="text-3xl font-medium tabular-nums">CHF 0.00</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Noch nichts erfasst im {monatsName}. Trage oben deine erste Ausgabe ein.
        </p>
      </div>
    </div>
  )
}

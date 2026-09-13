// Moving between months — AC-7, AC-8.
// Plain links, so the month is in the address bar and the back button works.
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import type { Monat } from '@/lib/month'

export function MonthSwitcher({ monat }: { monat: Monat }) {
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/app?monat=${monat.vorheriger}`} aria-label="Voriger Monat">
          ←
        </Link>
      </Button>

      <span className="min-w-40 text-center text-sm font-medium" aria-live="polite">
        {monat.name}
      </span>

      {monat.naechster ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app?monat=${monat.naechster}`} aria-label="Nächster Monat">
            →
          </Link>
        </Button>
      ) : (
        // AC-8 — there are no expenses in the future, so there is nowhere to go.
        <Button variant="ghost" size="sm" disabled aria-label="Nächster Monat">
          →
        </Button>
      )}
    </div>
  )
}

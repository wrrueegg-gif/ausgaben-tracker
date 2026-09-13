'use client'

// Die hochzählende Gesamtsumme — AC-14, AC-15.
//
// Die einzige Client-Komponente des Diagramms: Ring und Balken kommen ohne
// JavaScript aus, eine hochzählende Zahl nicht.
//
// Der Zustand ist der Fortschritt, nicht der Betrag. Das hat zwei Folgen, die
// beide zählen: der Startwert 1 bedeutet „fertig", also zeigt der Server und
// jeder Browser ohne JavaScript sofort die richtige Zahl statt einer Null; und
// ändert sich der Betrag, stimmt die Anzeige weiterhin, weil sie aus den Props
// abgeleitet wird und nicht aus einer Kopie im Zustand.

import { useEffect, useState } from 'react'

import { formatiereChf } from '@/lib/expense-summary'

const DAUER_MS = 900

export function AnimatedAmount({ betrag }: { betrag: number }) {
  const [fortschritt, setFortschritt] = useState(1)

  useEffect(() => {
    // AC-15: Wer im Betriebssystem weniger Bewegung verlangt, bekommt keine.
    // Der Fortschritt bleibt auf 1, die Zahl steht sofort da.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (betrag <= 0) return

    let laufend = true
    let start: number | null = null
    let id = 0

    function schritt(zeit: number) {
      if (!laufend) return
      start ??= zeit
      const anteil = Math.min((zeit - start) / DAUER_MS, 1)
      // Am Anfang schnell, am Ende weich auslaufend.
      setFortschritt(1 - Math.pow(1 - anteil, 3))
      if (anteil < 1) id = requestAnimationFrame(schritt)
    }

    id = requestAnimationFrame(schritt)
    return () => {
      laufend = false
      cancelAnimationFrame(id)
    }
  }, [betrag])

  const angezeigt = Math.round(betrag * fortschritt * 100) / 100

  return (
    <span className="mt-0.5 text-lg font-medium tabular-nums" aria-label={formatiereChf(betrag)}>
      {formatiereChf(angezeigt)}
    </span>
  )
}

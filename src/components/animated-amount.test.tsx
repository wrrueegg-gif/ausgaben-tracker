import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimatedAmount } from './animated-amount'

function bewegungReduziert(reduziert: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((abfrage: string) => ({
      matches: abfrage.includes('prefers-reduced-motion') ? reduziert : false,
      media: abfrage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Hochzählende Gesamtsumme (AC-14, AC-15)', () => {
  it('AC-15: bei reduzierter Bewegung steht der Endwert sofort da und nichts läuft', () => {
    bewegungReduziert(true)
    const rAF = vi.spyOn(globalThis, 'requestAnimationFrame')

    render(<AnimatedAmount betrag={2139.78} />)

    expect(screen.getByText(/2'139\.78/)).toBeInTheDocument()
    expect(rAF).not.toHaveBeenCalled()
  })

  it('AC-14: sonst startet der Aufbau', () => {
    bewegungReduziert(false)
    const rAF = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1)

    render(<AnimatedAmount betrag={2139.78} />)

    expect(rAF).toHaveBeenCalled()
  })

  it('zeigt ohne laufende Bildfolge den richtigen Betrag, nicht null', () => {
    // Der Zustand ist der Fortschritt und startet bei „fertig". Ohne JavaScript
    // oder vor dem ersten Bild steht deshalb die richtige Zahl da.
    bewegungReduziert(true)

    render(<AnimatedAmount betrag={0} />)

    expect(screen.getByText(/0\.00/)).toBeInTheDocument()
  })

  it('nennt den Endbetrag für Hilfstechnik, auch während des Hochzählens', () => {
    bewegungReduziert(false)
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1)

    render(<AnimatedAmount betrag={2139.78} />)

    expect(screen.getByLabelText(/2'139\.78/)).toBeInTheDocument()
  })
})

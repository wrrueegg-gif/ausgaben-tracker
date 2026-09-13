'use client'

// The last line of defence for the protected area. Without it an unexpected error
// takes the whole segment down to Next.js's default screen — which says nothing a
// person can act on. Added after QA pointed out that a failing delete crashed the
// page instead of explaining itself (EC-2).

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive" role="alert">
        <AlertTitle>Da ist etwas schiefgelaufen</AlertTitle>
        <AlertDescription>
          Deine Ausgaben sind nicht verloren — sie konnten nur gerade nicht geladen
          oder gespeichert werden. Versuche es noch einmal.
        </AlertDescription>
      </Alert>
      <div>
        <Button onClick={reset} variant="outline" size="sm">
          Erneut versuchen
        </Button>
      </div>
    </div>
  )
}

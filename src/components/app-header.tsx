// The frame of the signed-in area — docs/app-shell.md owns this shape. AC-5.
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="border-border bg-card border-b">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
        <span className="font-semibold tracking-tight">Ausgaben-Tracker</span>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">{email}</span>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Abmelden
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}

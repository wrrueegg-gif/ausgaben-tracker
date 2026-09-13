// Throttle for anything that checks a credential — AC-10.
//
// The counter lives in this server process, keyed per account AND per IP, because
// the auth platform's own limit is per IP only and does not stop a patient attack
// on a single account. See features/PROJ-1-user-accounts-auth/design.md for the
// trade-off (resets on restart, counts per instance).

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5

/** key -> timestamps of the failures still inside the window */
const failures = new Map<string, number[]>()

function recent(key: string, now: number): number[] {
  const times = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (times.length === 0) failures.delete(key)
  else failures.set(key, times)
  return times
}

export type LimitVerdict =
  | { allowed: true }
  | { allowed: false; retryAfterMinutes: number }

/**
 * Asked BEFORE the password is checked, so a blocked attempt never reaches the
 * auth platform. Blocks as soon as any one of the keys is over the limit.
 */
export function checkCredentialLimit(keys: string[], now = Date.now()): LimitVerdict {
  let blockedUntil = 0

  for (const key of keys) {
    const times = recent(key, now)
    if (times.length >= MAX_FAILURES) {
      blockedUntil = Math.max(blockedUntil, Math.min(...times) + WINDOW_MS)
    }
  }

  if (blockedUntil === 0) return { allowed: true }
  return {
    allowed: false,
    retryAfterMinutes: Math.max(1, Math.ceil((blockedUntil - now) / 60_000)),
  }
}

/** One failed attempt, counted against every key it belongs to. */
export function recordCredentialFailure(keys: string[], now = Date.now()): void {
  for (const key of keys) {
    failures.set(key, [...recent(key, now), now])
  }
}

/** A successful sign-in clears the account's and the IP's history. */
export function clearCredentialFailures(keys: string[]): void {
  for (const key of keys) failures.delete(key)
}

/** Test seam: the store is module state, so tests have to be able to empty it. */
export function resetCredentialFailures(): void {
  failures.clear()
}

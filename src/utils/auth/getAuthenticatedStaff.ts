import type { Payload } from 'payload'

const STAFF_ROLES = ['admin', 'manager', 'content'] as const

/**
 * Authenticates a staff user (Users collection) via Payload JWT cookie or
 * Authorization header. Returns the staff user object or null.
 */
export async function getAuthenticatedStaff(
  payload: Payload,
  req: { headers: Headers | { get(name: string): string | null } },
  opts: { roles?: readonly string[] } = {},
): Promise<any | null> {
  try {
    const headers =
      typeof (req.headers as Headers).get === 'function'
        ? (req.headers as Headers)
        : new Headers(req.headers as any)

    const result = await (payload as any).auth({ headers })
    const user = result?.user
    if (!user) return null
    if (user.collection !== 'users') return null
    const role = (user as any).role
    const allowed = opts.roles ?? STAFF_ROLES
    if (!allowed.includes(role)) return null
    return user
  } catch (err) {
    console.error('[getAuthenticatedStaff] error:', err)
    return null
  }
}

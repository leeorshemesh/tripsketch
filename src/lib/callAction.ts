import { getAuthToken } from 'deepspace'

/** Typed helper for POST /api/actions/:name with the caller's Bearer token. */
export async function callAction<T>(
  name: string,
  params: Record<string, unknown> = {},
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const token = await getAuthToken()
  if (!token) return { success: false, error: 'Sign in required' }

  const res = await fetch(`/api/actions/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  let body: { success?: boolean; data?: T; error?: string } = {}
  try {
    body = (await res.json()) as typeof body
  } catch {
    return { success: false, error: `Action failed (${res.status})` }
  }

  if (!res.ok || body.success === false) {
    return { success: false, error: body.error ?? `Action failed (${res.status})` }
  }

  return { success: true, data: body.data as T }
}

/**
 * Account settings — gated by (protected)/_layout.tsx AuthGate.
 */

import { signOut, useUser } from 'deepspace'
import { Button } from '@/components/ui'

export default function SettingsPage() {
  const { user } = useUser()

  return (
    <div className="min-h-full text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="mb-12 font-[family-name:var(--font-display)] text-4xl tracking-tight">
          Settings
        </h1>

        <section className="border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Your account</h2>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{user?.email ?? '—'}</dd>
            </div>
          </dl>

          <Button variant="secondary" className="mt-6" onClick={() => signOut()}>
            Sign out
          </Button>
        </section>
      </div>
    </div>
  )
}

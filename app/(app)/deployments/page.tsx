import { EmptyState } from '@/components/ui/EmptyState'
import { Rocket } from 'lucide-react'
import { AdminGuard } from '@/features/auth/components/AdminGuard'

export default function DeploymentsPage() {
  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Deployments</h1>
          <span className="badge badge-warning">Beta</span>
        </div>
        <EmptyState
          icon={<Rocket className="h-6 w-6 text-[var(--text-faint)]" />}
          title="Deployments in development"
          description="This view is in active development. Check back soon."
        />
      </div>
    </AdminGuard>
  )
}

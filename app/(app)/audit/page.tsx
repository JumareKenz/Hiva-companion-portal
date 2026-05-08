import { EmptyState } from '@/components/ui/EmptyState'
import { ScrollText } from 'lucide-react'

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Audit Log</h1>
      <EmptyState
        icon={<ScrollText className="h-6 w-6 text-[var(--text-faint)]" />}
        title="Audit logging coming soon"
        description="Audit logging endpoint not yet available in this version."
      />
    </div>
  )
}

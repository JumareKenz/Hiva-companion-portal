'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Key, Plus, Trash2, Edit3, Check, X, Globe, Users, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { accessCodesService, type CreateAccessCodeInput, type UpdateAccessCodeInput } from '@/services/accessCodes.service'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { AdminGuard } from '@/features/auth/components/AdminGuard'
import { cn } from '@/lib/utils'
import type { AccessCode } from '@/types/common'
import { AdminOnly } from '@/components/guards/AdminOnly'

interface EditState {
  id: string
  name: string
  max_users: string
  expires_at: string
  notes: string
}

export default function AccessCodesPage() {
  const qc = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateAccessCodeInput>({
    name: '',
    max_users: undefined,
    expires_at: undefined,
    code_suffix: undefined,
    notes: undefined,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => accessCodesService.list({ active_only: undefined, page: 1, per_page: 100 }),
    staleTime: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateAccessCodeInput) => accessCodesService.create(input),
    onSuccess: (result) => {
      toast.success(`${result.server_code} created`)
      setShowCreateModal(false)
      setCreateForm({ name: '', max_users: undefined, expires_at: undefined, code_suffix: undefined, notes: undefined })
      qc.invalidateQueries({ queryKey: ['access-codes'] })
    },
    onError: () => toast.error('Failed to create access code'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccessCodeInput }) =>
      accessCodesService.update(id, input),
    onSuccess: () => {
      toast.success('Access code updated')
      setEditingId(null)
      setEditState(null)
      qc.invalidateQueries({ queryKey: ['access-codes'] })
    },
    onError: () => toast.error('Failed to update access code'),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => accessCodesService.revoke(id),
    onSuccess: () => {
      toast.success('Access code revoked')
      qc.invalidateQueries({ queryKey: ['access-codes'] })
    },
    onError: () => toast.error('Failed to revoke access code'),
  })

  const codes = data?.data ?? []

  const startEdit = (code: AccessCode) => {
    setEditingId(code.id)
    setEditState({
      id: code.id,
      name: code.name,
      max_users: code.max_users?.toString() ?? '',
      expires_at: code.expires_at ? code.expires_at.slice(0, 16) : '',
      notes: code.notes ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditState(null)
  }

  const saveEdit = () => {
    if (!editState) return
    const payload: UpdateAccessCodeInput = {
      name: editState.name,
      max_users: editState.max_users === '' ? null : Number(editState.max_users),
      expires_at: editState.expires_at === '' ? null : new Date(editState.expires_at).toISOString(),
      notes: editState.notes === '' ? null : editState.notes,
    }
    updateMutation.mutate({ id: editState.id, input: payload })
  }

  const handleRevoke = (id: string) => {
    setConfirmingRevoke(null)
    revokeMutation.mutate(id)
  }

  const handleCreate = () => {
    if (!createForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    const payload: CreateAccessCodeInput = {
      name: createForm.name.trim(),
      max_users: createForm.max_users ?? null,
      expires_at: createForm.expires_at ?? null,
      code_suffix: createForm.code_suffix ?? null,
      notes: createForm.notes ?? null,
    }
    createMutation.mutate(payload)
  }

  const activeCount = codes.filter((c) => c.is_active).length
  const totalUsers = codes.reduce((acc, c) => acc + c.auth_count, 0)
  const usedToday = codes.filter((c) => c.last_used_at && new Date(c.last_used_at) > new Date(Date.now() - 86400000)).length

  return (
    <AdminGuard>
    <div className="relative space-y-8">
      <LogoBackground size={700} opacity={0.025} fixed={false} spin={false} breathe={false} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Access Codes
          </h1>
          {codes.length > 0 && (
            <span className="badge badge-accent">{codes.length} codes</span>
          )}
        </div>
        <AdminOnly>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            New Code
          </button>
        </AdminOnly>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="surface-raised rounded-xl border border-[var(--border-subtle)] p-5">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Key className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Active Codes</span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)]">
            {isLoading ? '—' : activeCount}
          </div>
        </div>
        <div className="surface-raised rounded-xl border border-[var(--border-subtle)] p-5">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Users className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Total Users</span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)]">
            {isLoading ? '—' : totalUsers}
          </div>
        </div>
        <div className="surface-raised rounded-xl border border-[var(--border-subtle)] p-5">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Globe className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Used Today</span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)]">
            {isLoading ? '—' : usedToday}
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['CODE', 'NAME', 'USERS', 'LAST USED', 'EXPIRES', 'STATUS', 'ACTIONS'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-2.5"><SkeletonLoader variant="row" /></td>
                </tr>
              ))
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={<Key className="h-6 w-6 text-[var(--text-faint)]" />}
                    title="No access codes yet"
                    description="Create your first code and share it with field teams."
                    action={{
                        label: 'Create First Code',
                        onClick: () => setShowCreateModal(true),
                      }}
                  />
                </td>
              </tr>
            ) : (
              codes.map((code) => {
                const isEditing = editingId === code.id
                return (
                  <tr key={code.id} className={cn(
                    'transition-colors hover:bg-[var(--bg-secondary)]',
                    !code.is_active && 'opacity-50'
                  )}>
<td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-[var(--accent-600)]">
                        {code.server_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editState?.name ?? ''}
                          onChange={(e) => setEditState((s) => s ? { ...s, name: e.target.value } : null)}
                          className="input input-sm w-full"
                        />
                      ) : (
                        <span className="text-sm text-[var(--text-primary)]">{code.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editState?.max_users ?? ''}
                          onChange={(e) => setEditState((s) => s ? { ...s, max_users: e.target.value } : null)}
                          className="input input-sm w-20"
                          placeholder="∞"
                          type="number"
                          min="1"
                        />
                      ) : (
                        <span className="font-mono text-sm text-[var(--text-secondary)]">
                          {code.max_users ? `${code.auth_count}/${code.max_users}` : `${code.auth_count}/∞`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                      {code.last_used_at
                        ? format(new Date(code.last_used_at), 'd MMM, HH:mm')
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                      {code.expires_at
                        ? format(new Date(code.expires_at), 'd MMM yyyy')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {code.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-error">Revoked</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminOnly>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} disabled={updateMutation.isPending} className="btn btn-primary btn-sm">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={cancelEdit} className="btn btn-ghost btn-sm">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(code)} className="btn btn-ghost btn-sm" title="Edit">
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              {code.is_active && (
                                confirmingRevoke === code.id ? (
                                  <div className="flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5 text-[var(--error)]" />
                                    <button
                                      onClick={() => handleRevoke(code.id)}
                                      disabled={revokeMutation.isPending}
                                      className="btn btn-ghost btn-sm text-[var(--error)] font-semibold"
                                    >
                                      Revoke
                                    </button>
                                    <button
                                      onClick={() => setConfirmingRevoke(null)}
                                      className="btn btn-ghost btn-sm"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmingRevoke(code.id)}
                                    disabled={revokeMutation.isPending}
                                    className="btn btn-ghost btn-sm text-[var(--error)]"
                                    title="Revoke"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </AdminOnly>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="surface-overlay w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Create Access Code</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Share the generated code with field teams so they can log into the HIVA app.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Display Name <span className="text-[var(--error)]">*</span></label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="input w-full"
                  placeholder="e.g. Northeast CHW Rollout"
                />
              </div>
              <div>
                <label className="label">Max Users <span className="text-[var(--text-faint)]">(optional)</span></label>
                <input
                  value={createForm.max_users ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, max_users: e.target.value ? Number(e.target.value) : undefined }))}
                  className="input w-full"
                  placeholder="Leave empty for unlimited"
                  type="number"
                  min="1"
                />
              </div>
              <div>
                <label className="label">Expires At <span className="text-[var(--text-faint)]">(optional)</span></label>
                <input
                  value={createForm.expires_at ?? ''}
                  onChange={(e) => setCreateForm((f) => ({
                    ...f,
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  }))}
                  className="input w-full"
                  type="datetime-local"
                />
              </div>
              <div>
                <label className="label">Code Suffix <span className="text-[var(--text-faint)]">(optional)</span></label>
                <input
                  value={createForm.code_suffix ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code_suffix: e.target.value || undefined }))}
                  className="input w-full"
                  placeholder="e.g. ABCD — forces HIVA-ABCD"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="label">Admin Notes <span className="text-[var(--text-faint)]">(optional)</span></label>
                <textarea
                  value={createForm.notes ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value || undefined }))}
                  className="input w-full resize-none"
                  rows={2}
                  placeholder="Internal notes — not shown to users"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({ name: '', max_users: undefined, expires_at: undefined, code_suffix: undefined, notes: undefined })
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !createForm.name.trim()}
                className="btn btn-primary"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminGuard>
  )
}
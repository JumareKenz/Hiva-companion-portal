'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Bot,
  Copy,
  Check,
  Globe,
  MessageSquare,
  FileText,
  Trash2,
  Upload,
  BarChart3,
  Loader2,
  Pencil,
  Save,
  X,
} from 'lucide-react'

import {
  useChatbot,
  useChatbotDocuments,
  useUploadChatbotDocument,
  useDeleteChatbotDocument,
  useChatbotEmbedCode,
  useActivateChatbot,
  usePauseChatbot,
  useUpdateChatbot,
} from '@/features/assistants/hooks/useAssistants'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { AdminGuard } from '@/features/auth/components/AdminGuard'
import { cn } from '@/lib/utils'
import type { UpdateChatbotBody } from '@/services/chatbots.service'

const TABS = ['Overview', 'Documents', 'Settings', 'Analytics'] as const

export default function AssistantDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [copied, setCopied] = useState<'script' | 'iframe' | 'url' | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<UpdateChatbotBody>({})

  const { data: assistant, isLoading } = useChatbot(id)
  const { data: docsData } = useChatbotDocuments(id)
  const { data: embedCode } = useChatbotEmbedCode(id)
  const { mutate: uploadDoc, isPending: isUploading } = useUploadChatbotDocument(id)
  const { mutate: deleteDoc } = useDeleteChatbotDocument(id)
  const { mutate: activate } = useActivateChatbot()
  const { mutate: pause } = usePauseChatbot()
  const { mutate: update, isPending: isSaving } = useUpdateChatbot(id)

  const handleCopy = (text: string, key: 'script' | 'iframe' | 'url') => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    uploadDoc(formData)
  }

  const startEdit = () => {
    if (!assistant) return
    setEditValues({
      name: assistant.name,
      system_prompt: assistant.system_prompt ?? '',
      welcome_message: assistant.welcome_message,
      fallback_message: assistant.fallback_message ?? '',
      brand_color: assistant.brand_color,
      temperature: assistant.temperature,
      top_k: assistant.top_k,
      min_confidence: assistant.min_confidence,
      enable_citations: assistant.enable_citations,
      enable_grounding: assistant.enable_grounding,
      strict_domain: assistant.strict_domain,
    })
    setEditing(true)
  }

  const saveEdit = () => {
    update(editValues, { onSuccess: () => setEditing(false) })
  }

  const docs = Array.isArray(docsData) ? docsData : (docsData?.data ?? [])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <SkeletonLoader variant="row" />
        <SkeletonLoader variant="card" />
      </div>
    )
  }

  if (!assistant) {
    return <div className="text-[var(--text-muted)]">Assistant not found</div>
  }

  return (
    <AdminGuard>
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/assistants" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: assistant.brand_color + '20' }}
          >
            <Bot className="h-5 w-5" style={{ color: assistant.brand_color }} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {assistant.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="font-mono">{assistant.slug}</span>
              <span>·</span>
              <span className={cn('capitalize', assistant.status === 'active' && 'text-[var(--success)]')}>
                {assistant.status}
              </span>
            </div>
          </div>
        </div>
        <AdminOnly>
          <div className="flex gap-2">
            {assistant.status === 'draft' && (
              <button onClick={() => activate(id)} className="btn btn-primary btn-sm">
                Activate
              </button>
            )}
            {assistant.status === 'active' && (
              <button onClick={() => pause(id)} className="btn btn-secondary btn-sm">
                Pause
              </button>
            )}
          </div>
        </AdminOnly>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-[var(--accent-600)] text-[var(--accent-600)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ─── Overview ─── */}
      {tab === 'Overview' && (
        <div className="space-y-6 entrance">
          <div className="surface p-5">
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-4">
              Channels
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] p-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--accent-600)]" />
                  <span className="text-sm font-medium">Web Embed</span>
                </div>
                <span className="badge badge-success text-[10px]">Active</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[var(--accent-600)]" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </div>
                <span className="badge badge-ghost text-[10px]">Coming soon</span>
              </div>
            </div>
          </div>

          {embedCode && (
            <div className="surface p-5">
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-4">
                Embed Code
              </h3>
              <div className="space-y-4">
                <CodeBlock
                  label="Direct URL"
                  value={embedCode.direct_url}
                  copied={copied === 'url'}
                  onCopy={() => handleCopy(embedCode.direct_url, 'url')}
                />
                <CodeBlock
                  label="Script Tag"
                  value={embedCode.script_tag}
                  copied={copied === 'script'}
                  onCopy={() => handleCopy(embedCode.script_tag, 'script')}
                />
                <CodeBlock
                  label="iFrame"
                  value={embedCode.iframe_code}
                  copied={copied === 'iframe'}
                  onCopy={() => handleCopy(embedCode.iframe_code, 'iframe')}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatBox label="Documents" value={String(assistant.document_count)} />
            <StatBox label="Temperature" value={String(assistant.temperature)} />
            <StatBox label="Top K" value={String(assistant.top_k)} />
            <StatBox label="Created" value={format(new Date(assistant.created_at), 'd MMM')} />
          </div>
        </div>
      )}

      {/* ─── Documents ─── */}
      {tab === 'Documents' && (
        <div className="space-y-4 entrance">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Knowledge Base
            </h3>
            <AdminOnly>
              <label className="btn btn-primary btn-sm cursor-pointer">
                <Upload className="h-4 w-4" />
                Upload Document
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </AdminOnly>
          </div>

          <div className="surface overflow-hidden">
            {docs.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-6 w-6 text-[var(--text-faint)]" />}
                title="No documents yet"
                description="Upload clinical guidelines to power this assistant."
              />
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {doc.filename}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {(doc.size_bytes / 1024 / 1024).toFixed(2)} MB · {doc.chunk_count ?? '—'} chunks
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'badge text-[10px]',
                          doc.status === 'ready' ? 'badge-success'
                            : doc.status === 'processing' ? 'badge-warning'
                            : doc.status === 'error' ? 'badge-error'
                            : 'badge-ghost'
                        )}
                      >
                        {doc.status}
                      </span>
                      <AdminOnly>
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AdminOnly>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Settings ─── */}
      {tab === 'Settings' && (
        <div className="space-y-6 entrance">
          <div className="surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Configuration
              </h3>
              <AdminOnly>
                {editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="btn btn-primary btn-sm"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                  </div>
                ) : (
                  <button onClick={startEdit} className="btn btn-secondary btn-sm">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </AdminOnly>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1 block">Name</label>
                    <input
                      value={editValues.name ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">Brand Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editValues.brand_color ?? '#000000'}
                        onChange={(e) => setEditValues((v) => ({ ...v, brand_color: e.target.value }))}
                        className="h-9 w-9 cursor-pointer rounded border border-[var(--border-default)]"
                      />
                      <input
                        value={editValues.brand_color ?? ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, brand_color: e.target.value }))}
                        className="input flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label mb-1 block">System Prompt</label>
                  <textarea
                    value={editValues.system_prompt ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, system_prompt: e.target.value }))}
                    className="input w-full min-h-[80px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1 block">Welcome Message</label>
                    <input
                      value={editValues.welcome_message ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, welcome_message: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">Fallback Message</label>
                    <input
                      value={editValues.fallback_message ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, fallback_message: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label mb-1 block">Temperature</label>
                    <input
                      type="number" step={0.1} min={0} max={1}
                      value={editValues.temperature ?? 0}
                      onChange={(e) => setEditValues((v) => ({ ...v, temperature: parseFloat(e.target.value) }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">Top K</label>
                    <input
                      type="number" min={1} max={100}
                      value={editValues.top_k ?? 0}
                      onChange={(e) => setEditValues((v) => ({ ...v, top_k: parseInt(e.target.value) }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label mb-1 block">Min Confidence</label>
                    <input
                      type="number" step={0.05} min={0} max={1}
                      value={editValues.min_confidence ?? 0}
                      onChange={(e) => setEditValues((v) => ({ ...v, min_confidence: parseFloat(e.target.value) }))}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      { key: 'enable_citations', label: 'Citations' },
                      { key: 'enable_grounding', label: 'Grounding' },
                      { key: 'strict_domain', label: 'Strict Domain' },
                    ] as { key: keyof UpdateChatbotBody; label: string }[]
                  ).map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!(editValues[key])}
                        onChange={(e) => setEditValues((v) => ({ ...v, [key]: e.target.checked }))}
                        className="rounded border-[var(--border-default)]"
                      />
                      <span className="text-sm text-[var(--text-primary)]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <SettingRow label="System Prompt" value={assistant.system_prompt || '—'} />
                <SettingRow label="Welcome Message" value={assistant.welcome_message} />
                <SettingRow label="Fallback Message" value={assistant.fallback_message || '—'} />
                <SettingRow label="Brand Color" value={assistant.brand_color} />
                <SettingRow label="Temperature" value={String(assistant.temperature)} />
                <SettingRow label="Top K" value={String(assistant.top_k)} />
                <SettingRow label="Min Confidence" value={String(assistant.min_confidence)} />
                <SettingRow label="Citations" value={assistant.enable_citations ? 'Enabled' : 'Disabled'} />
                <SettingRow label="Grounding" value={assistant.enable_grounding ? 'Enabled' : 'Disabled'} />
                <SettingRow label="Strict Domain" value={assistant.strict_domain ? 'Enabled' : 'Disabled'} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Analytics ─── */}
      {tab === 'Analytics' && (
        <div className="space-y-6 entrance">
          <div className="surface p-5">
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-4">
              Analytics
            </h3>
            <EmptyState
              icon={<BarChart3 className="h-6 w-6 text-[var(--text-faint)]" />}
              title="Analytics coming soon"
              description="Conversation metrics and usage stats will appear here."
            />
          </div>
        </div>
      )}
    </div>
    </AdminGuard>
  )
}

function CodeBlock({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 text-xs text-[var(--accent-600)] hover:underline"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-[var(--bg-secondary)] p-3 text-xs font-mono text-[var(--text-secondary)]">
        {value}
      </pre>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4 text-center">
      <div className="font-display text-xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--bg-secondary)] p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm text-[var(--text-primary)]">{value}</div>
    </div>
  )
}

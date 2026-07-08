'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Check, CheckSquare, Square, Rocket, ChevronLeft, Globe, FileStack, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { documentsService } from '@/services/documents.service'
import { useBuildRelease } from '@/features/releases/hooks/useReleases'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { AdminGuard } from '@/features/auth/components/AdminGuard'
import type { Language } from '@/types/enums'

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { value: 'yo', label: 'Yoruba', flag: '🇳🇬' },
  { value: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { value: 'pcm', label: 'Pidgin', flag: '🇳🇬' },
]

export default function BuildBundlePage() {
  const router = useRouter()
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(['en'])
  const [activateImmediately, setActivateImmediately] = useState(false)

  const { data: allDocumentsData, isLoading } = useQuery({
    queryKey: ['documentsForBuild'],
    queryFn: () => documentsService.list({ per_page: 100, status: 'ready_to_compile' }),
    staleTime: 30 * 1000,
  })

  const { mutate: buildRelease, isPending: isBuilding } = useBuildRelease()

  const documents = allDocumentsData?.data ?? []

  const toggleDoc = (id: string) => {
    const newSet = new Set(selectedDocs)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedDocs(newSet)
  }

  const toggleAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(documents.map((d) => d.id)))
    }
  }

  const toggleLanguage = (lang: Language) => {
    if (lang === 'en') return
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const handleBuild = () => {
    if (selectedDocs.size === 0) {
      toast.error('Select at least one document')
      return
    }

    buildRelease(
      {
        document_ids: Array.from(selectedDocs),
        languages: selectedLanguages,
        activate: activateImmediately,
      },
      {
        onSuccess: (job) => {
          toast.success('Build started — monitoring progress')
          router.push(`/bundles/status/${job.id}`)
        },
      }
    )
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/bundles" className="btn btn-ghost btn-sm">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              Build Release
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Select documents and languages to compile into a .hiv bundle
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Document selector */}
          <div className="surface lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3">
              <div className="flex items-center gap-2">
                <FileStack className="h-4 w-4 text-[var(--text-muted)]" />
                <h2 className="font-medium text-[var(--text-primary)]">
                  Select Documents
                </h2>
                <span className="badge badge-ghost text-[10px]">
                  {documents.length} ready
                </span>
              </div>
              {documents.length > 0 && (
                <button onClick={toggleAll} className="btn btn-ghost btn-sm text-xs">
                  {selectedDocs.size === documents.length ? (
                    <><CheckSquare className="mr-1 h-3.5 w-3.5" /> Deselect All</>
                  ) : (
                    <><Square className="mr-1 h-3.5 w-3.5" /> Select All</>
                  )}
                </button>
              )}
            </div>

            <div className="max-h-[480px] divide-y divide-[var(--border-subtle)] overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-3">
                    <SkeletonLoader variant="row" />
                  </div>
                ))
              ) : documents.length === 0 ? (
                <EmptyState
                  icon={<FileStack className="h-6 w-6 text-[var(--text-faint)]" />}
                  title="No documents ready"
                  description="Upload and mark documents as ready before building a bundle."
                  action={{ label: 'Go to Documents', onClick: () => router.push('/documents') }}
                />
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className="flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedDocs.has(doc.id) ? 'bg-[var(--accent-600)] border-[var(--accent-600)]' : 'border-[var(--border-default)]'}`}>
                      {selectedDocs.has(doc.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[var(--text-primary)] truncate">{doc.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{doc.source}</div>
                    </div>
                    <StatusBadge status={doc.status} type="document" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Build configuration */}
          <div className="space-y-4">
            <div className="surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-[var(--text-muted)]" />
                <h3 className="font-medium text-[var(--text-primary)]">Target Languages</h3>
              </div>
              <div className="space-y-2">
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.value}
                    onClick={() => toggleLanguage(lang.value)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${lang.value === 'en' ? 'opacity-60 cursor-default' : 'hover:bg-[var(--bg-secondary)]'}`}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${selectedLanguages.includes(lang.value) ? 'bg-[var(--accent-600)] border-[var(--accent-600)]' : 'border-[var(--border-default)]'}`}>
                      {selectedLanguages.includes(lang.value) && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{lang.label}</span>
                    {lang.value === 'en' && (
                      <span className="text-[10px] text-[var(--text-faint)]">(required)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface p-5">
              <div
                onClick={() => setActivateImmediately(!activateImmediately)}
                className="flex cursor-pointer items-center gap-3"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${activateImmediately ? 'bg-[var(--accent-600)] border-[var(--accent-600)]' : 'border-[var(--border-default)]'}`}>
                  {activateImmediately && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Activate on completion
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Automatically make this the live release for field devices
                  </div>
                </div>
              </div>
            </div>

            {/* Build summary & action */}
            <div className="surface p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Documents</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedDocs.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Languages</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedLanguages.length}</span>
                </div>
              </div>
              {selectedLanguages.length > 1 && (
                <div className="mb-3 flex items-start gap-2 rounded-md bg-[var(--accent-600)]/5 px-3 py-2 text-xs text-[var(--accent-600)]">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Each additional language adds ~3–5 min for LLM translation.
                    English-only builds finish in ~50 seconds.
                  </span>
                </div>
              )}
              <button
                onClick={handleBuild}
                disabled={selectedDocs.size === 0 || isBuilding}
                className="btn btn-primary w-full"
              >
                <Rocket className="h-4 w-4" />
                {isBuilding ? 'Starting Build...' : 'Start Bundle Build'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}

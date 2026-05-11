'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Check, CheckSquare, Square, Rocket, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { documentsService } from '@/services/documents.service'
import { useBuildRelease } from '@/features/releases/hooks/useReleases'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { LogoAnimated } from '@/components/ui/LogoAnimated'
import type { Language } from '@/types/enums'

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'ig', label: 'Igbo' },
  { value: 'pcm', label: 'Pidgin' },
]

const COMPILEABLE_STATUSES = ['ready_to_compile', 'compiled']

export default function BuildBundlePage() {
  const router = useRouter()
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(['en'])
  const [activateImmediately, setActivateImmediately] = useState(true)

  const { data: allDocumentsData, isLoading } = useQuery({
    queryKey: ['documentsAllForBuild'],
    queryFn: () => documentsService.list({ per_page: 100 }),
    staleTime: 30 * 1000,
  })

  const { mutate: buildRelease, isPending: isBuilding } = useBuildRelease()

  const documents = allDocumentsData?.data ?? []
  const buildableDocuments = documents.filter((d) => COMPILEABLE_STATUSES.includes(d.status))

  const toggleDoc = (id: string) => {
    const newSet = new Set(selectedDocs)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedDocs(newSet)
  }

  const toggleAll = () => {
    if (selectedDocs.size === buildableDocuments.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(buildableDocuments.map((d) => d.id)))
    }
  }

  const toggleLanguage = (lang: Language) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.filter((l) => l !== lang || prev.length > 1)
      }
      return [...prev, lang]
    })
  }

  const handleBuild = () => {
    if (selectedDocs.size === 0) {
      toast.error('Select at least one document')
      return
    }
    if (selectedLanguages.length === 0) {
      toast.error('Select at least one language')
      return
    }

    buildRelease(
      {
        document_ids: Array.from(selectedDocs),
        languages: selectedLanguages,
        activate: activateImmediately,
      },
      {
        onSuccess: (data) => {
          toast.success(`Release ${data.version} created`)
          router.push('/bundles')
        },
        onError: () => {
          toast.error('Failed to build release')
        },
      }
    )
  }

  if (isBuilding) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)]/90 backdrop-blur-sm">
        <LogoAnimated size={64} className="text-[var(--accent-600)]" spin pulse dotPulse breathe />
        <div className="mt-6 text-center">
          <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Building Release</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Compiling documents into a bundle...</p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">This may take a few minutes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bundles" className="btn btn-ghost btn-sm">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Build Release</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <h2 className="font-medium text-[var(--text-primary)]">Select Documents</h2>
            <button onClick={toggleAll} className="btn btn-ghost btn-sm text-xs">
              {selectedDocs.size === buildableDocuments.length ? (
                <><CheckSquare className="mr-1 h-3.5 w-3.5" /> Deselect All</>
              ) : (
                <><Square className="mr-1 h-3.5 w-3.5" /> Select All ({buildableDocuments.length})</>
              )}
            </button>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <SkeletonLoader variant="row" />
                </div>
              ))
            ) : buildableDocuments.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No documents ready for compilation.<br />
                Upload and approve documents first.
              </div>
            ) : (
              buildableDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded border ${selectedDocs.has(doc.id) ? 'bg-[var(--accent-600)] border-[var(--accent-600)]' : 'border-[var(--border-default)]'}`}>
                    {selectedDocs.has(doc.id) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text-primary)] truncate">{doc.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{doc.source}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} type="document" />
                    {doc.block_count && (
                      <span className="text-xs text-[var(--text-faint)]">{doc.block_count} blocks</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-4">
            <h3 className="mb-3 font-medium text-[var(--text-primary)]">Languages</h3>
            <div className="space-y-2">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.value}
                  onClick={() => toggleLanguage(lang.value)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border ${selectedLanguages.includes(lang.value) ? 'bg-[var(--accent-600)] border-[var(--accent-600)]' : 'border-[var(--border-default)]'}`}>
                    {selectedLanguages.includes(lang.value) && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{lang.label}</span>
                </div>
              ))}
            </div>
          </div>

          <AdminOnly>
            <div className="surface p-4">
              <div
                onClick={() => setActivateImmediately(!activateImmediately)}
                className="flex cursor-pointer items-center gap-3"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${activateImmediately ? 'bg-[var(--accent-600)] border-[var(--accent-600)]' : 'border-[var(--border-default)]'}`}>
                  {activateImmediately && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">Activate immediately</div>
                  <div className="text-xs text-[var(--text-muted)]">Make this the live release on build</div>
                </div>
              </div>
            </div>
          </AdminOnly>

          <div className="surface p-4">
            <div className="mb-3 text-sm text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-primary)]">{selectedDocs.size}</span> documents selected
            </div>
            <button
              onClick={handleBuild}
              disabled={selectedDocs.size === 0 || selectedLanguages.length === 0}
              className="btn btn-primary w-full"
            >
              <Rocket className="h-4 w-4" />
              Build Release
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
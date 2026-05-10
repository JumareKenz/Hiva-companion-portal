'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Save, Loader2, Check } from 'lucide-react'

import { useCreateChatbot } from '@/features/assistants/hooks/useAssistants'
import { AdminGuard } from '@/features/auth/components/AdminGuard'
import { cn } from '@/lib/utils'
import type { Language, PersonaTemplate } from '@/types/enums'

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'ig', label: 'Igbo' },
  { value: 'pcm', label: 'Pidgin' },
]

const PERSONA_TEMPLATES: {
  value: PersonaTemplate
  label: string
  description: string
}[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'formal', label: 'Formal', description: 'Professional and precise' },
  { value: 'empathetic', label: 'Empathetic', description: 'Compassionate and supportive' },
  { value: 'technical', label: 'Technical', description: 'Detailed and clinical' },
  { value: 'custom', label: 'Custom', description: 'Define your own style' },
]

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  primary_language: z.enum(['en', 'ha', 'yo', 'ig', 'pcm']),
  persona_template: z.enum(['friendly', 'formal', 'empathetic', 'technical', 'custom']),
  system_prompt: z.string().max(2000, 'Max 2000 characters').optional(),
  welcome_message: z.string().optional(),
  fallback_message: z.string().optional(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Valid hex color required').default('#155D46'),
  temperature: z.number().min(0).max(1).default(0.7),
  top_k: z.number().min(1).max(100).default(10),
  min_confidence: z.number().min(0).max(1).default(0.7),
  enable_citations: z.boolean().default(true),
  enable_grounding: z.boolean().default(true),
  strict_domain: z.boolean().default(true),
})

type CreateForm = z.infer<typeof createSchema>

const STEPS = [
  { id: 1 as const, label: 'Basic Info', description: 'Name, slug and language' },
  { id: 2 as const, label: 'Persona', description: 'Tone and voice' },
  { id: 3 as const, label: 'Behavior', description: 'RAG configuration' },
  { id: 4 as const, label: 'Branding', description: 'Visual identity' },
]

type Step = (typeof STEPS)[number]['id']

export default function CreateAssistantPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const { mutate: create, isPending } = useCreateChatbot()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      primary_language: 'en',
      persona_template: 'empathetic',
      brand_color: '#155D46',
      temperature: 0.7,
      top_k: 10,
      min_confidence: 0.7,
      enable_citations: true,
      enable_grounding: true,
      strict_domain: true,
    },
  })

  const persona = watch('persona_template')
  const brandColor = watch('brand_color')

  const onSubmit = (data: CreateForm) => {
    create(
      {
        name: data.name,
        slug: data.slug || undefined,
        template: data.persona_template,
        persona: {
          system_prompt: data.system_prompt || undefined,
          welcome_message: data.welcome_message || undefined,
          fallback_message: data.fallback_message || undefined,
          brand_color: data.brand_color,
        },
        rag_config: {
          temperature: data.temperature,
          top_k: data.top_k,
          min_confidence: data.min_confidence,
          enable_citations: data.enable_citations,
          enable_grounding: data.enable_grounding,
          strict_domain: data.strict_domain,
        },
      },
      { onSuccess: () => router.push('/live-assistants') }
    )
  }

  const goBack = () => {
    if (step === 1) router.push('/live-assistants')
    else setStep((s) => (s - 1) as Step)
  }

  const goNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step)
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            Create Assistant
          </h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    step === s.id
                      ? 'bg-[var(--accent-600)] text-white'
                      : step > s.id
                      ? 'bg-[var(--accent-600)]/20 text-[var(--accent-600)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={cn(
                      'text-xs font-medium',
                      step === s.id
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)]'
                    )}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-px flex-1',
                    step > s.id
                      ? 'bg-[var(--accent-600)]'
                      : 'bg-[var(--border-default)]'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="surface entrance space-y-5 p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Basic Information
                </h2>
                <div>
                  <label className="label mb-1.5 block">Name *</label>
                  <input
                    {...register('name')}
                    className={cn('input', errors.name && 'input-error')}
                    placeholder="e.g. Malaria Guidelines Assistant"
                  />
                  {errors.name && (
                    <p className="error-msg">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label mb-1.5 block">Slug *</label>
                  <input
                    {...register('slug')}
                    className={cn('input', errors.slug && 'input-error')}
                    placeholder="malaria-guidelines"
                  />
                  {errors.slug && (
                    <p className="error-msg">{errors.slug.message}</p>
                  )}
                </div>
                <div>
                  <label className="label mb-1.5 block">Description</label>
                  <textarea
                    {...register('description')}
                    className="input min-h-[70px]"
                    placeholder="What this assistant helps with…"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Primary Language *</label>
                  <select {...register('primary_language')} className="input text-sm">
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Step 2: Persona */}
            {step === 2 && (
              <>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Persona
                </h2>
                <div>
                  <label className="label mb-1.5 block">Persona Template</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PERSONA_TEMPLATES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setValue('persona_template', t.value)}
                        className={cn(
                          'rounded-lg border px-3 py-2.5 text-left transition-all',
                          persona === t.value
                            ? 'border-[var(--accent-600)] bg-[var(--accent-600)]/5'
                            : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                        )}
                      >
                        <div
                          className={cn(
                            'text-sm font-medium',
                            persona === t.value
                              ? 'text-[var(--accent-600)]'
                              : 'text-[var(--text-primary)]'
                          )}
                        >
                          {t.label}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {t.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5 block">System Prompt</label>
                  <textarea
                    {...register('system_prompt')}
                    className={cn('input min-h-[100px]', errors.system_prompt && 'input-error')}
                    placeholder="You are a helpful clinical assistant specialising in HIV guidelines…"
                  />
                  {errors.system_prompt && (
                    <p className="error-msg">{errors.system_prompt.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block">Welcome Message</label>
                    <input
                      {...register('welcome_message')}
                      className="input"
                      placeholder="Hello! How can I help you today?"
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Fallback Message</label>
                    <input
                      {...register('fallback_message')}
                      className="input"
                      placeholder="I'm not sure I understand…"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Behavior */}
            {step === 3 && (
              <>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Behavior
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label mb-1.5 block">Temperature</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      {...register('temperature', { valueAsNumber: true })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Top K</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      {...register('top_k', { valueAsNumber: true })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Min Confidence</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0}
                      max={1}
                      {...register('min_confidence', { valueAsNumber: true })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(
                    [
                      {
                        key: 'enable_citations' as const,
                        label: 'Enable Citations',
                        desc: 'Show source references in responses',
                      },
                      {
                        key: 'enable_grounding' as const,
                        label: 'Enable Grounding',
                        desc: 'Use document retrieval for answers',
                      },
                      {
                        key: 'strict_domain' as const,
                        label: 'Strict Domain',
                        desc: 'Only answer clinical questions',
                      },
                    ]
                  ).map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border-default)] p-3 transition-colors hover:border-[var(--border-strong)]"
                    >
                      <input
                        type="checkbox"
                        {...register(key)}
                        className="mt-0.5 rounded border-[var(--border-default)] text-[var(--accent-600)]"
                      />
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {label}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Step 4: Branding */}
            {step === 4 && (
              <>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Branding
                </h2>
                <div>
                  <label className="label mb-1.5 block">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setValue('brand_color', e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-md border border-[var(--border-default)]"
                    />
                    <input
                      {...register('brand_color')}
                      className="input w-32 font-mono text-sm"
                    />
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: brandColor + '20' }}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: brandColor }}
                      />
                    </div>
                  </div>
                  {errors.brand_color && (
                    <p className="error-msg">{errors.brand_color.message}</p>
                  )}
                </div>
                {/* Review summary */}
                <div className="rounded-lg border border-[var(--border-default)] p-4">
                  <p className="mb-3 text-xs font-mono font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Review
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">Name: </span>
                      <strong className="text-[var(--text-primary)]">
                        {watch('name') || '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Language: </span>
                      <strong className="text-[var(--text-primary)]">
                        {LANGUAGES.find((l) => l.value === watch('primary_language'))?.label}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Persona: </span>
                      <strong className="text-[var(--text-primary)] capitalize">
                        {watch('persona_template')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Brand: </span>
                      <strong className="font-mono text-[var(--text-primary)]">
                        {brandColor}
                      </strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer navigation */}
          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={goBack} className="btn btn-secondary btn-md">
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn btn-primary btn-md"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary btn-md"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Assistant
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminGuard>
  )
}

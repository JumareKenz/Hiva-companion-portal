'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

import { useCreateChatbot } from '@/features/assistants/hooks/useAssistants'
import { useAuthStore } from '@/stores/auth.store'
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

const PERSONA_TEMPLATES: { value: PersonaTemplate; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'technical', label: 'Technical' },
  { value: 'custom', label: 'Custom' },
]

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  primary_language: z.enum(['en', 'ha', 'yo', 'ig', 'pcm']),
  secondary_languages: z.array(z.enum(['en', 'ha', 'yo', 'ig', 'pcm'])).optional(),
  persona_template: z.enum(['friendly', 'formal', 'empathetic', 'technical', 'custom']),
  system_prompt: z.string().max(2000, 'Max 2000 characters').optional(),
  welcome_message: z.string().optional(),
  fallback_message: z.string().optional(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Valid hex color').default('#155D46'),
  temperature: z.number().min(0).max(1).default(0.7),
  top_k: z.number().min(1).max(100).default(10),
  min_confidence: z.number().min(0).max(1).default(0.7),
  enable_citations: z.boolean().default(true),
  enable_grounding: z.boolean().default(true),
  strict_domain: z.boolean().default(true),
  cite_sources: z.boolean().default(true),
  include_policy_numbers: z.boolean().default(false),
  allow_off_topic: z.boolean().default(false),
  escalate_complex: z.boolean().default(true),
  formality: z.number().min(0).max(100).default(70),
  verbosity: z.number().min(0).max(100).default(50),
  empathy: z.number().min(0).max(100).default(80),
})

type CreateForm = z.infer<typeof createSchema>

const SECTIONS = ['Basic', 'Persona', 'Tone', 'Behavior', 'Branding'] as const

export default function NewAssistantPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [section, setSection] = useState<(typeof SECTIONS)[number]>('Basic')
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
      cite_sources: true,
      escalate_complex: true,
      formality: 70,
      verbosity: 50,
      empathy: 80,
    },
  })

  const primaryLang = watch('primary_language')
  const persona = watch('persona_template')
  const brandColor = watch('brand_color')

  const onSubmit = (data: CreateForm) => {
    create(
      {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        organization_id: user?.id || '',
        primary_language: data.primary_language,
        secondary_languages: data.secondary_languages,
        persona_template: data.persona_template,
        system_prompt: data.system_prompt,
        welcome_message: data.welcome_message,
        fallback_message: data.fallback_message,
        brand_color: data.brand_color,
        temperature: data.temperature,
        top_k: data.top_k,
        min_confidence: data.min_confidence,
        enable_citations: data.enable_citations,
        enable_grounding: data.enable_grounding,
        strict_domain: data.strict_domain,
        tone: {
          formality: data.formality,
          verbosity: data.verbosity,
          empathy: data.empathy,
        },
        guidelines: {
          citeSources: data.cite_sources,
          includePolicyNumbers: data.include_policy_numbers,
          allowOffTopic: data.allow_off_topic,
          escalateComplex: data.escalate_complex,
        },
      },
      {
        onSuccess: (chatbot) => {
          router.push(`/assistants/${chatbot.id}`)
        },
      }
    )
  }

  const Slider = ({
    label,
    name,
    value,
  }: {
    label: string
    name: 'formality' | 'verbosity' | 'empathy'
    value: number
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">{label}</label>
        <span className="badge badge-ghost font-mono text-[10px]">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        {...register(name, { valueAsNumber: true })}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--bg-tertiary)] accent-[var(--accent-600)]"
      />
    </div>
  )

  return (
    <AdminGuard>
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          New Assistant
        </h1>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              section === s
                ? 'border-b-2 border-[var(--accent-600)] text-[var(--accent-600)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ─── Basic ─── */}
        {section === 'Basic' && (
          <div className="space-y-4 entrance">
            <div>
              <label className="label mb-1.5 block">Name *</label>
              <input
                {...register('name')}
                className={cn('input', errors.name && 'input-error')}
                placeholder="e.g. Malaria Guidelines Assistant"
              />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label mb-1.5 block">Slug *</label>
              <input
                {...register('slug')}
                className={cn('input', errors.slug && 'input-error')}
                placeholder="malaria-guidelines"
              />
              {errors.slug && <p className="error-msg">{errors.slug.message}</p>}
            </div>

            <div>
              <label className="label mb-1.5 block">Description</label>
              <textarea
                {...register('description')}
                className="input min-h-[80px]"
                placeholder="What this assistant helps with..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5 block">Primary Language *</label>
                <select {...register('primary_language')} className="input text-sm">
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">Secondary Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.filter((l) => l.value !== primaryLang).map((lang) => (
                    <label key={lang.value} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        value={lang.value}
                        {...register('secondary_languages')}
                        className="rounded border-[var(--border-default)] text-[var(--accent-600)] focus:ring-[var(--accent-600)]"
                      />
                      {lang.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Persona ─── */}
        {section === 'Persona' && (
          <div className="space-y-4 entrance">
            <div>
              <label className="label mb-1.5 block">Persona Template</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PERSONA_TEMPLATES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('persona_template', t.value)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-sm transition-all',
                      persona === t.value
                        ? 'border-[var(--accent-600)] bg-[var(--accent-600)]/5 text-[var(--accent-600)]'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label mb-1.5 block">System Prompt</label>
              <textarea
                {...register('system_prompt')}
                className={cn('input min-h-[120px]', errors.system_prompt && 'input-error')}
                placeholder="You are a helpful clinical assistant..."
              />
              {errors.system_prompt && <p className="error-msg">{errors.system_prompt.message}</p>}
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
                  placeholder="I'm not sure I understand..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Tone ─── */}
        {section === 'Tone' && (
          <div className="space-y-6 entrance">
            <div className="surface p-5">
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
                Response Tone
              </h3>
              <div className="space-y-5">
                <Slider label="Formality" name="formality" value={watch('formality')} />
                <Slider label="Verbosity" name="verbosity" value={watch('verbosity')} />
                <Slider label="Empathy" name="empathy" value={watch('empathy')} />
              </div>
            </div>
          </div>
        )}

        {/* ─── Behavior ─── */}
        {section === 'Behavior' && (
          <div className="space-y-4 entrance">
            <div className="grid grid-cols-2 gap-4">
              <ToggleRow
                label="Enable Citations"
                description="Show source references in responses"
                {...register('enable_citations')}
              />
              <ToggleRow
                label="Enable Grounding"
                description="Use document retrieval for answers"
                {...register('enable_grounding')}
              />
              <ToggleRow
                label="Strict Domain"
                description="Only answer clinical questions"
                {...register('strict_domain')}
              />
              <ToggleRow
                label="Cite Sources"
                description="Include chunk references"
                {...register('cite_sources')}
              />
              <ToggleRow
                label="Policy Numbers"
                description="Include guideline policy numbers"
                {...register('include_policy_numbers')}
              />
              <ToggleRow
                label="Allow Off-Topic"
                description="Answer non-clinical questions"
                {...register('allow_off_topic')}
              />
              <ToggleRow
                label="Escalate Complex"
                description="Flag complex cases for review"
                {...register('escalate_complex')}
              />
            </div>

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
          </div>
        )}

        {/* ─── Branding ─── */}
        {section === 'Branding' && (
          <div className="space-y-4 entrance">
            <div className="flex items-center gap-4">
              <div>
                <label className="label mb-1.5 block">Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register('brand_color')}
                    className="h-10 w-10 cursor-pointer rounded-md border border-[var(--border-default)]"
                  />
                  <input
                    {...register('brand_color')}
                    className="input w-32 font-mono text-sm"
                  />
                </div>
                {errors.brand_color && <p className="error-msg">{errors.brand_color.message}</p>}
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: brandColor + '20' }}
              >
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: brandColor }} />
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
          <button
            type="button"
            onClick={() => {
              const idx = SECTIONS.indexOf(section)
              if (idx > 0) setSection(SECTIONS[idx - 1]!)
            }}
            disabled={section === 'Basic'}
            className="btn btn-secondary btn-md disabled:opacity-30"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {section === 'Branding' ? (
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
            ) : (
              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.indexOf(section)
                  if (idx < SECTIONS.length - 1) setSection(SECTIONS[idx + 1]!)
                }}
                className="btn btn-primary btn-md"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
    </AdminGuard>
  )
}

function ToggleRow({
  label,
  description,
  ...props
}: {
  label: string
  description: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border-default)] p-3 transition-colors hover:border-[var(--border-strong)]">
      <input
        type="checkbox"
        className="mt-0.5 rounded border-[var(--border-default)] text-[var(--accent-600)] focus:ring-[var(--accent-600)]"
        {...props}
      />
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        <div className="text-xs text-[var(--text-muted)]">{description}</div>
      </div>
    </label>
  )
}

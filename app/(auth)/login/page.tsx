'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, ShieldAlert, Mail } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { LogoAnimated } from '@/components/ui/LogoAnimated'
import { LogoBackground } from '@/components/ui/LogoBackground'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginForm) => {
    login(data, {
      onError: (error: unknown) => {
        const err = error as { detail?: string }
        toast.error(err.detail || 'Login failed')
      },
    })
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left panel — dark brand */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[var(--accent-800)] p-8 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(21,93,70,0.4), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(201,169,110,0.15), transparent)',
          }}
        />
        {/* Large background watermark */}
        <LogoBackground size={600} opacity={0.06} blur={false} fixed={false} spin breathe />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <LogoAnimated size={36} className="text-white" spin pulse dotPulse />
            <span className="font-display text-lg font-semibold">HIVA Companion Portal</span>
          </div>
        </div>

        <div className="relative z-10 px-4">
          <h1 className="font-display text-[44px] font-bold leading-tight">
            Compile clinical guidelines into{' '}
            <em className="text-[var(--brand-tan)] not-italic">signed, offline bundles</em> for the field.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
            Sign in to your workspace to review source documents, compile .hiv bundles, and deploy them to frontline workers.
          </p>

          {/* Floating .hiv illustration */}
          <div className="mt-8 inline-block">
            <div
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              style={{ animation: 'hiva-float 6s ease-in-out infinite' }}
            >
              <div className="flex items-center gap-2 text-xs text-[var(--success)]">
                <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                SIGNED ✓
              </div>
              <div className="mt-2 font-mono text-sm text-white/80">
                Malaria Guidelines v2.1 · 312 chunks · 5 langs · 4.82 MB
              </div>
              <div className="mt-1 font-mono text-[10px] text-white/40">
                a3f7…e2d9 (Ed25519)
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs font-mono text-white/30">
          HIVA Companion Portal
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col justify-center bg-[var(--bg-primary)] px-6 py-10 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-[420px]">
          <span className="badge badge-accent mb-6">HIVA Companion Portal</span>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Welcome back</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Sign in to continue to your workspace.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <label className="label mb-1.5 block">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@health.gov.ng"
                className={cn('input', errors.email && 'input-error')}
              />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label">Password</label>
                <span className="text-xs text-[var(--text-faint)]">
                  Contact your admin to reset
                </span>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={cn('input pr-10', errors.password && 'input-error')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign in →</>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
            <p className="text-xs text-[var(--warning)]">
              Accounts are managed by your organization administrator. Contact them to get access.
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
            <p className="text-xs text-[var(--warning)]">
              This workspace requires verified personnel access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

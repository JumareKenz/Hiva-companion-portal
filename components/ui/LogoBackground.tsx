import React from 'react'
import { cn } from '@/lib/utils'

interface LogoBackgroundProps {
  className?: string
  size?: number
  opacity?: number
  blur?: boolean
  spin?: boolean
  breathe?: boolean
  fixed?: boolean
}

export function LogoBackground({
  className,
  size = 400,
  opacity = 0.04,
  blur = true,
  spin = true,
  breathe = true,
  fixed = true,
}: LogoBackgroundProps) {
  return (
    <div
      className={cn(
        'pointer-events-none select-none overflow-hidden',
        fixed ? 'fixed inset-0' : 'absolute inset-0',
        className
      )}
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          blur && 'blur-[1px]',
          breathe && 'logo-breathe'
        )}
        style={{ opacity }}
      >
        {/* Outer circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--accent-600)]"
        />
        {/* Inner dotted circle */}
        <g
          className={cn(spin && 'logo-spin text-[var(--accent-600)]')}
          style={{ transformOrigin: 'center' }}
        >
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            className="text-[var(--accent-600)]"
          />
        </g>
        {/* H strokes */}
        <g className="text-[var(--accent-600)]" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <line x1="38" y1="28" x2="38" y2="72" />
          <line x1="62" y1="28" x2="62" y2="72" />
          <line x1="38" y1="50" x2="62" y2="50" />
        </g>
        {/* Center dot */}
        <circle cx="50" cy="50" r="4" fill="#C9A96E" className="logo-dot-pulse" style={{ transformOrigin: 'center' }} />
      </svg>
    </div>
  )
}

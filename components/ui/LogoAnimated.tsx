import React from 'react'
import { cn } from '@/lib/utils'

interface LogoAnimatedProps {
  size?: number
  className?: string
  spin?: boolean
  pulse?: boolean
  dotPulse?: boolean
  breathe?: boolean
  float?: boolean
  draw?: boolean
}

export function LogoAnimated({
  size = 32,
  className,
  spin = true,
  pulse = true,
  dotPulse = true,
  breathe = false,
  float = false,
  draw = false,
}: LogoAnimatedProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn(float && 'logo-float', className)}
      aria-label="HIVA Companion Portal logo"
      role="img"
    >
      {/* Outer circle */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className={cn(
          pulse && 'logo-pulse',
          breathe && 'logo-breathe',
          draw && 'logo-draw-circle'
        )}
        style={{ transformOrigin: 'center' }}
      />
      {/* Inner dotted circle */}
      <g className={cn(spin && 'logo-spin')} style={{ transformOrigin: 'center' }}>
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.6"
        />
      </g>
      {/* H left vertical */}
      <line
        x1="38"
        y1="28"
        x2="38"
        y2="72"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* H right vertical */}
      <line
        x1="62"
        y1="28"
        x2="62"
        y2="72"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* H horizontal */}
      <line
        x1="38"
        y1="50"
        x2="62"
        y2="50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle
        cx="50"
        cy="50"
        r="5.5"
        fill="#C9A96E"
        className={cn(dotPulse && 'logo-dot-pulse')}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  )
}

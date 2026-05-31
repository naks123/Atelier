import type { ReactNode } from 'react'
import { cn } from '../lib/utils.ts'

const toneStyles = {
  neutral:
    'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted-strong)]',
  accent:
    'border-[rgba(45,106,87,0.2)] bg-[var(--accent-soft)] text-[var(--accent)]',
  success:
    'border-[rgba(45,106,87,0.2)] bg-[var(--accent-soft)] text-[var(--accent)]',
  danger:
    'border-[rgba(163,61,49,0.22)] bg-[var(--danger-soft)] text-[var(--danger)]',
} as const

interface StatusPillProps {
  tone: keyof typeof toneStyles
  children: ReactNode
}

export function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[6px] border px-2 py-1 text-[12px] font-medium',
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  )
}

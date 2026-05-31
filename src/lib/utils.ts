import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDateTime(value: Date | null) {
  if (!value) {
    return 'Just now'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

export function formatShortDate(value: Date | null) {
  if (!value) {
    return 'Pending sync'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}

export function slugifyFilename(value: string) {
  const trimmed = value.trim().toLowerCase()

  if (!trimmed) {
    return 'resume'
  }

  return trimmed
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function getInitials(value: string) {
  const pieces = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (pieces.length === 0) {
    return 'CV'
  }

  return pieces.map((piece) => piece[0]?.toUpperCase() ?? '').join('')
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Something unexpected happened.'
}

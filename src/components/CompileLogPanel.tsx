import type { CompileStatus } from '../types/resume.ts'
import { StatusPill } from './StatusPill.tsx'

interface CompileLogPanelProps {
  status: CompileStatus
  errorMessage: string | null
  log: string
  open: boolean
  onToggle: () => void
}

function getStatusLabel(status: CompileStatus) {
  if (status === 'compiling') {
    return 'Compiling'
  }

  if (status === 'success') {
    return 'Compiled'
  }

  if (status === 'error') {
    return 'Error'
  }

  return 'Idle'
}

function getStatusTone(status: CompileStatus) {
  if (status === 'compiling') {
    return 'accent' as const
  }

  if (status === 'success') {
    return 'success' as const
  }

  if (status === 'error') {
    return 'danger' as const
  }

  return 'neutral' as const
}

export function CompileLogPanel({
  status,
  errorMessage,
  log,
  open,
  onToggle,
}: CompileLogPanelProps) {
  return (
    <section className="log-panel surface-flat">
      <button type="button" onClick={onToggle} className="log-toggle">
        <div className="log-toggle-copy">
          <h2>Compilation log</h2>
          <StatusPill tone={getStatusTone(status)}>
            {getStatusLabel(status)}
          </StatusPill>
        </div>
        <span className="small-text muted">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open ? (
        <div className="log-panel-body">
          {errorMessage ? <p className="log-alert">{errorMessage}</p> : null}
          <pre className="log-text">
            {log || 'The compiler log will appear here after the first run.'}
          </pre>
        </div>
      ) : null}
    </section>
  )
}

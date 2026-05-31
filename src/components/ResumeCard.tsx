import {
  Copy,
  Download,
  FolderOpen,
  PencilLine,
  Trash2,
} from 'lucide-react'
import type { ResumeRecord } from '../types/resume.ts'
import { formatShortDate } from '../lib/utils.ts'

interface ResumeCardProps {
  resume: ResumeRecord
  busy: boolean
  onOpen: () => void
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
  onDownload: () => void
}

export function ResumeCard({
  resume,
  busy,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
  onDownload,
}: ResumeCardProps) {
  return (
    <article className="resume-row">
      <div className="resume-row-main">
        <button type="button" onClick={onOpen} className="resume-row-title">
          {resume.title}
        </button>
        <p className="resume-row-subtitle">
          Stored in your Firestore workspace.
        </p>
      </div>

      <div className="resume-row-detail">
        <span className="resume-row-label">Updated</span>
        <span>{formatShortDate(resume.updatedAt)}</span>
      </div>

      <div className="resume-row-detail">
        <span className="resume-row-label">Last compiled</span>
        <span>
          {resume.lastCompiledAt
            ? formatShortDate(resume.lastCompiledAt)
            : 'Not compiled yet'}
        </span>
      </div>

      <div className="resume-row-actions">
        <button type="button" onClick={onOpen} className="button button-sm">
          <FolderOpen className="h-4 w-4" />
          Open
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          disabled={busy}
          className="button button-sm"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="button button-sm"
        >
          <Download className="h-4 w-4" />
          {busy ? 'Preparing…' : 'Download'}
        </button>
        <button
          type="button"
          onClick={onRename}
          disabled={busy}
          className="button button-sm"
        >
          <PencilLine className="h-4 w-4" />
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="button button-sm button-danger"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  )
}

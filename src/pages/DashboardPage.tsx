import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { FilePlus2, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ResumeCard } from '../components/ResumeCard.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { compileResumePdf, explainLatexRuntimeError } from '../lib/latex.ts'
import {
  createResume,
  deleteResume,
  duplicateResume,
  renameResume,
  subscribeToResumes,
} from '../lib/resumes.ts'
import { downloadBlob, getErrorMessage, slugifyFilename } from '../lib/utils.ts'
import type { ResumeRecord, ResumeSort } from '../types/resume.ts'

export function DashboardPage() {
  const { signOutUser, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<ResumeRecord[]>([])
  const [sortMode, setSortMode] = useState<ResumeSort>('updated')
  const [searchQuery, setSearchQuery] = useState('')
  const [busyResumeId, setBusyResumeId] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    if (!user) {
      return undefined
    }

    const unsubscribe = subscribeToResumes(
      user.uid,
      (nextResumes) => {
        setResumes(nextResumes)
        setLoading(false)
      },
      (error) => {
        setLoading(false)
        toast.error(getErrorMessage(error))
      },
    )

    return unsubscribe
  }, [user])

  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const sortedResumes = [...resumes].sort((left, right) => {
    if (sortMode === 'title') {
      return left.title.localeCompare(right.title)
    }

    return (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0)
  })

  const filteredResumes = normalizedSearch
    ? sortedResumes.filter((resume) =>
        resume.title.toLowerCase().includes(normalizedSearch),
      )
    : sortedResumes

  async function handleCreateResume() {
    if (!user) {
      return
    }

    try {
      const resumeId = await createResume(user.uid)
      navigate(`/resume/${resumeId}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleDuplicateResume(resume: ResumeRecord) {
    if (!user) {
      return
    }

    try {
      const resumeId = await duplicateResume(user.uid, resume)
      toast.success('Resume duplicated.')
      navigate(`/resume/${resumeId}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRenameResume(resume: ResumeRecord) {
    if (!user) {
      return
    }

    const nextTitle = window.prompt('Rename this resume', resume.title)?.trim()

    if (!nextTitle) {
      return
    }

    try {
      await renameResume(user.uid, resume.id, nextTitle)
      toast.success('Title updated.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleDeleteResume(resume: ResumeRecord) {
    if (!user) {
      return
    }

    const shouldDelete = window.confirm(
      `Delete "${resume.title}"? This removes the saved LaTeX source from Firestore.`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteResume(user.uid, resume.id)
      toast.success('Resume deleted.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleDownloadResume(resume: ResumeRecord) {
    setBusyResumeId(resume.id)

    try {
      const { succeeded, pdf } = await compileResumePdf(resume.latexSource)

      if (!succeeded) {
        toast.error('Compilation failed. Open the editor to review the log.')
        return
      }

      if (!pdf) {
        toast.error('Compilation finished, but no PDF was produced.')
        return
      }

      downloadBlob(pdf, `${slugifyFilename(resume.title)}.pdf`)
      toast.success('PDF downloaded.')
    } catch (error) {
      toast.error(explainLatexRuntimeError(error))
    } finally {
      setBusyResumeId(null)
    }
  }

  async function handleSignOut() {
    try {
      await signOutUser()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const emptyMessage = normalizedSearch
    ? `No resumes match "${searchQuery.trim()}".`
    : 'No resumes yet.'

  return (
    <main className="page-shell">
      <div className="page-frame page-frame-wide">
        <header className="page-header">
          <div className="page-header-content">
            <h1>Resumes</h1>
            <p className="muted">
              Private workspace for resume versions you edit, compile, and
              export.
            </p>
          </div>

          <div className="page-header-actions">
            <span className="small-text muted">{user?.email}</span>
            <button
              type="button"
              onClick={() => {
                void handleSignOut()
              }}
              className="button button-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <button
              type="button"
              onClick={() => {
                void handleCreateResume()
              }}
              className="button button-primary"
            >
              <FilePlus2 className="h-4 w-4" />
              New resume
            </button>
          </div>
        </header>

        <section className="surface toolbar mt-4">
          <div className="field toolbar-grow">
            <label htmlFor="resume-search">Search</label>
            <input
              id="resume-search"
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
              }}
              placeholder="Search resumes by title"
              className="input"
            />
          </div>

          <div className="field toolbar-compact">
            <label htmlFor="resume-sort">Sort</label>
            <select
              id="resume-sort"
              value={sortMode}
              onChange={(event) => {
                startTransition(() => {
                  setSortMode(event.target.value as ResumeSort)
                })
              }}
              className="select"
            >
              <option value="updated">Recently updated</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div className="toolbar-summary">
            {filteredResumes.length} result
            {filteredResumes.length === 1 ? '' : 's'}
          </div>
        </section>

        <section className="resume-table surface mt-4">
          {loading ? (
            <div className="loading-panel">
              <h2>Loading resumes</h2>
              <p className="muted">
                Reading the current workspace from Firestore.
              </p>
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="empty-panel">
              <h2>{emptyMessage}</h2>
              <p className="muted">
                {normalizedSearch
                  ? 'Try a different title or clear the search field.'
                  : 'Create a resume to start from the default template, then duplicate it for different applications.'}
              </p>
              {!normalizedSearch ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCreateResume()
                    }}
                    className="button button-primary"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Create resume
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="resume-table-head">
                <div>Title</div>
                <div>Updated</div>
                <div>Last compiled</div>
                <div>Actions</div>
              </div>

              {filteredResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  busy={busyResumeId === resume.id}
                  onOpen={() => {
                    navigate(`/resume/${resume.id}`)
                  }}
                  onDuplicate={() => {
                    void handleDuplicateResume(resume)
                  }}
                  onRename={() => {
                    void handleRenameResume(resume)
                  }}
                  onDelete={() => {
                    void handleDeleteResume(resume)
                  }}
                  onDownload={() => {
                    void handleDownloadResume(resume)
                  }}
                />
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  )
}

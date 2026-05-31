import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react'
import Editor from '@monaco-editor/react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import {
  ArrowLeft,
  Copy,
  Download,
  RefreshCcw,
  Save,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PdfPreview } from '../components/PdfPreview.tsx'
import { StatusPill } from '../components/StatusPill.tsx'
import { DEFAULT_RESUME_TITLE } from '../data/defaultResume.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { compileResumePdf, explainLatexRuntimeError } from '../lib/latex.ts'
import { configureLatexMonaco } from '../lib/monaco.ts'
import {
  duplicateResume,
  subscribeToResume,
  touchCompiledAt,
  updateResumeDraft,
} from '../lib/resumes.ts'
import {
  downloadBlob,
  formatDateTime,
  getErrorMessage,
  slugifyFilename,
} from '../lib/utils.ts'
import type {
  CompileStatus,
  ResumeRecord,
  SaveStatus,
} from '../types/resume.ts'

function getSaveTone(status: SaveStatus) {
  if (status === 'saved') {
    return 'success' as const
  }

  if (status === 'saving') {
    return 'accent' as const
  }

  if (status === 'error') {
    return 'danger' as const
  }

  return 'neutral' as const
}

function getSaveLabel(status: SaveStatus) {
  if (status === 'saved') {
    return 'Saved'
  }

  if (status === 'saving') {
    return 'Saving'
  }

  if (status === 'error') {
    return 'Save failed'
  }

  return 'Unsaved'
}

function getCompileTone(status: CompileStatus) {
  if (status === 'success') {
    return 'success' as const
  }

  if (status === 'compiling') {
    return 'accent' as const
  }

  if (status === 'error') {
    return 'danger' as const
  }

  return 'neutral' as const
}

function getCompileLabel(status: CompileStatus) {
  if (status === 'success') {
    return 'Ready'
  }

  if (status === 'compiling') {
    return 'Compiling'
  }

  if (status === 'error') {
    return 'Failed'
  }

  return 'Waiting'
}

export function EditorPage() {
  const { resumeId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isCompact = useMediaQuery('(max-width: 1023px)')

  const [loading, setLoading] = useState(true)
  const [resume, setResume] = useState<ResumeRecord | null>(null)
  const [title, setTitle] = useState(DEFAULT_RESUME_TITLE)
  const [source, setSource] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [compileStatus, setCompileStatus] = useState<CompileStatus>('idle')
  const [compileError, setCompileError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [lastSuccessfulSource, setLastSuccessfulSource] = useState<string | null>(
    null,
  )

  const hydratedResumeIdRef = useRef<string | null>(null)
  const skipAutosaveRef = useRef(false)
  const latestTitleRef = useRef(title)
  const latestSourceRef = useRef(source)
  const latestResumeRef = useRef<ResumeRecord | null>(resume)
  const compileRequestRef = useRef(0)
  const deferredSource = useDeferredValue(source)
  const activeResumeId = resume?.id ?? null

  useEffect(() => {
    latestTitleRef.current = title
  }, [title])

  useEffect(() => {
    latestSourceRef.current = source
  }, [source])

  useEffect(() => {
    latestResumeRef.current = resume
  }, [resume])

  useEffect(() => {
    if (!user || !resumeId) {
      return undefined
    }

    const unsubscribe = subscribeToResume(
      user.uid,
      resumeId,
      (nextResume) => {
        setResume(nextResume)
        setLoading(false)

        if (hydratedResumeIdRef.current !== nextResume.id) {
          hydratedResumeIdRef.current = nextResume.id
          skipAutosaveRef.current = true
          setTitle(nextResume.title)
          setSource(nextResume.latexSource)
          setLastSavedAt(nextResume.updatedAt)
          setSaveStatus('saved')
          setLastSuccessfulSource(null)
          setCompileStatus('idle')
          setCompileError(null)
        }
      },
      () => {
        setLoading(false)
        toast.error('That resume could not be found.')
        navigate('/')
      },
      (error) => {
        setLoading(false)
        toast.error(getErrorMessage(error))
      },
    )

    return unsubscribe
  }, [navigate, resumeId, user])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const persistDraft = useCallback(
    async (mode: 'auto' | 'manual') => {
      if (!user || !latestResumeRef.current) {
        return
      }

      setSaveStatus('saving')

      try {
        await updateResumeDraft(user.uid, latestResumeRef.current.id, {
          title: latestTitleRef.current,
          latexSource: latestSourceRef.current,
        })

        setLastSavedAt(new Date())
        setSaveStatus('saved')

        if (mode === 'manual') {
          toast.success('Draft saved.')
        }
      } catch (error) {
        setSaveStatus('error')
        toast.error(getErrorMessage(error))
      }
    },
    [user],
  )

  const runCompile = useCallback(
    async (mode: 'auto' | 'manual') => {
      if (!user || !latestResumeRef.current) {
        return
      }

      const compileId = ++compileRequestRef.current
      const input = latestSourceRef.current

      setCompileStatus('compiling')
      setCompileError(null)

      try {
        const { pdf, succeeded } = await compileResumePdf(input)

        if (compileId !== compileRequestRef.current) {
          return
        }

        if (!succeeded) {
          setCompileStatus('error')
          setCompileError('Compilation failed. Fix the LaTeX source and recompile.')
          setLastSuccessfulSource(null)

          if (mode === 'manual') {
            toast.error('Compilation failed.')
          }

          return
        }

        if (!pdf) {
          setCompileStatus('error')
          setCompileError(
            'Compilation finished, but no PDF file was produced. Recompile once more or review the log below.',
          )
          setLastSuccessfulSource(null)

          if (mode === 'manual') {
            toast.error('No PDF was produced.')
          }

          return
        }

        const nextUrl = URL.createObjectURL(pdf)
        setPdfUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current)
          }

          return nextUrl
        })
        setCompileStatus('success')
        setLastSuccessfulSource(input)
        void touchCompiledAt(user.uid, latestResumeRef.current.id)

        if (mode === 'manual') {
          toast.success('Preview refreshed.')
        }
      } catch (error) {
        if (compileId !== compileRequestRef.current) {
          return
        }

        setCompileStatus('error')
        setCompileError(explainLatexRuntimeError(error))
        setLastSuccessfulSource(null)

        if (mode === 'manual') {
          toast.error(explainLatexRuntimeError(error))
        }
      }
    },
    [user],
  )

  useEffect(() => {
    if (!activeResumeId || !user) {
      return undefined
    }

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return undefined
    }

    setSaveStatus('dirty')

    const timeout = window.setTimeout(() => {
      void persistDraft('auto')
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activeResumeId, persistDraft, source, title, user])

  useEffect(() => {
    if (!activeResumeId || !user) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      void runCompile('auto')
    }, 1500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activeResumeId, deferredSource, runCompile, user])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const metaKey = event.metaKey || event.ctrlKey

      if (!metaKey) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 's') {
        event.preventDefault()
        void persistDraft('manual')
      }

      if (key === 'enter') {
        event.preventDefault()
        void runCompile('manual')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [persistDraft, runCompile])

  async function handleDuplicate() {
    if (!user || !resume) {
      return
    }

    try {
      await persistDraft('manual')
      const nextId = await duplicateResume(user.uid, {
        ...resume,
        title: latestTitleRef.current.trim() || DEFAULT_RESUME_TITLE,
        latexSource: latestSourceRef.current,
      })
      toast.success('Resume duplicated.')
      navigate(`/resume/${nextId}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const canDownloadCurrentPdf =
    compileStatus === 'success' &&
    Boolean(pdfUrl) &&
    lastSuccessfulSource === source

  function handleDownloadPdf() {
    if (!canDownloadCurrentPdf || !pdfUrl) {
      toast.error('Compile the current source successfully before downloading.')
      return
    }

    fetch(pdfUrl)
      .then((response) => response.blob())
      .then((blob) => {
        downloadBlob(blob, `${slugifyFilename(title || DEFAULT_RESUME_TITLE)}.pdf`)
      })
      .catch((error: unknown) => {
        toast.error(getErrorMessage(error))
      })
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-panel surface">
          <h1>Loading resume</h1>
          <p className="muted">
            Pulling the latest LaTeX source from Firestore.
          </p>
        </div>
      </main>
    )
  }

  if (isCompact) {
    return (
      <main className="page-shell">
        <div className="message-panel surface">
          <h1>Use a larger screen to edit</h1>
          <p className="muted">
            The dashboard works on mobile, but the split editor and PDF preview
            stay desktop-first.
          </p>
          <div>
            <Link to="/" className="button button-primary">
              Back to resumes
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="editor-screen">
      <div className="editor-frame">
        <header className="editor-toolbar surface">
          <div className="editor-toolbar-main">
            <Link to="/" className="button button-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to resumes
            </Link>

            <div className="field editor-toolbar-title">
              <label htmlFor="resume-title">Resume title</label>
              <input
                id="resume-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                }}
                onBlur={() => {
                  if (!title.trim()) {
                    setTitle(DEFAULT_RESUME_TITLE)
                  }
                }}
                className="title-input"
              />
            </div>
          </div>

          <div className="editor-toolbar-status">
            <div className="status-pair">
              <span className="status-label">Save</span>
              <StatusPill tone={getSaveTone(saveStatus)}>
                {getSaveLabel(saveStatus)}
              </StatusPill>
            </div>
            <div className="status-pair">
              <span className="status-label">Compile</span>
              <StatusPill tone={getCompileTone(compileStatus)}>
                {getCompileLabel(compileStatus)}
              </StatusPill>
            </div>
            <span className="small-text muted">
              Last saved {formatDateTime(lastSavedAt)}
            </span>
          </div>

          <div className="editor-toolbar-actions">
            <button
              type="button"
              onClick={() => {
                void persistDraft('manual')
              }}
              className="button button-sm"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                void runCompile('manual')
              }}
              className="button button-primary button-sm"
            >
              <RefreshCcw className="h-4 w-4" />
              Recompile
            </button>
            <button
              type="button"
              onClick={() => {
                void handleDuplicate()
              }}
              className="button button-sm"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!canDownloadCurrentPdf}
              className="button button-sm"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </header>

        <section className="editor-workbench">
          <div className="workbench-shell surface">
            <Group orientation="horizontal">
              <Panel defaultSize={46} minSize={30}>
                <section className="workbench-pane surface-flat">
                  <div className="pane-header">
                    <div className="pane-header-copy">
                      <h2>Source</h2>
                      <p>LaTeX source stored in Firestore.</p>
                    </div>
                  </div>

                  <div className="pane-body editor-scroll">
                    <Editor
                      beforeMount={configureLatexMonaco}
                      defaultLanguage="latex"
                      language="latex"
                      theme="resume-atelier"
                      value={source}
                      onChange={(value) => {
                        setSource(value ?? '')
                      }}
                      loading={
                        <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                          Starting Monaco…
                        </div>
                      }
                      options={{
                        automaticLayout: true,
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 13,
                        lineHeight: 21,
                        minimap: { enabled: false },
                        padding: { top: 16, bottom: 16 },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                      }}
                    />
                  </div>
                </section>
              </Panel>

              <Separator className="split-handle" />

              <Panel defaultSize={54} minSize={34}>
                <PdfPreview
                  fileUrl={pdfUrl}
                  status={compileStatus}
                  errorMessage={compileError}
                />
              </Panel>
            </Group>
          </div>
        </section>
      </div>
    </main>
  )
}

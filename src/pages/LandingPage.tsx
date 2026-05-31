import { LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { FirebaseSetupPanel } from '../components/FirebaseSetupPanel.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { getErrorMessage } from '../lib/utils.ts'

const features = [
  {
    title: 'Google sign-in',
    description:
      'Use Firebase Authentication to open a private workspace tied to your account.',
  },
  {
    title: 'Private Firestore workspace',
    description:
      'Each resume version is stored under your user record, not in a shared list.',
  },
  {
    title: 'LaTeX editor',
    description:
      'Edit structured source in Monaco with syntax highlighting and fast local feedback.',
  },
  {
    title: 'In-browser PDF compile',
    description:
      'BusyTeX runs in the browser so you can compile, preview, and iterate without a server.',
  },
  {
    title: 'Live preview',
    description:
      'Recompile the current draft and inspect the resulting PDF beside the source.',
  },
  {
    title: 'Duplicate and download',
    description:
      'Keep tailored variants for different roles and export the current version as PDF.',
  },
] as const

const previewLines = [
  '\\documentclass[10pt,letterpaper]{article}',
  '\\usepackage[margin=0.65in]{geometry}',
  '\\usepackage[hidelinks]{hyperref}',
  '\\section{Experience}',
  '\\resumeSubheading{Senior Frontend Engineer}{2023 -- Present}',
  '\\resumeItem{Led the redesign of a portfolio analytics product.}',
] as const

export function LandingPage() {
  const { firebaseConfigured, signInWithGoogle } = useAuth()

  async function handleSignIn() {
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <main className="page-shell">
      <div className="page-frame">
        <header className="landing-nav">
          <div className="brand">Resume Atelier</div>
          <button
            type="button"
            onClick={() => {
              void handleSignIn()
            }}
            disabled={!firebaseConfigured}
            className="button button-primary disabled:cursor-not-allowed"
          >
            <LogIn className="h-4 w-4" />
            Sign in with Google
          </button>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <h1>Write, compile, and manage LaTeX resumes in one place.</h1>
            <p>
              Resume Atelier keeps each resume version in a private Firebase
              workspace and compiles PDFs directly in the browser. It is built
              for editing source, checking layout, duplicating variants, and
              downloading final copies without leaving the app.
            </p>

            <div className="landing-actions">
              <button
                type="button"
                onClick={() => {
                  void handleSignIn()
                }}
                disabled={!firebaseConfigured}
                className="button button-primary disabled:cursor-not-allowed"
              >
                <LogIn className="h-4 w-4" />
                Open workspace
              </button>
              <p className="small-text muted">
                Requires Firebase configuration and Google sign-in.
              </p>
            </div>

            <ul className="feature-list">
              {features.map((feature) => (
                <li key={feature.title} className="feature-item">
                  <strong>{feature.title}</strong>
                  <p>{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-preview surface">
            <div className="landing-preview-toolbar">
              <span>Editorial Resume</span>
              <span>Saved · Preview ready</span>
            </div>

            <div className="landing-preview-body">
              <div className="mock-pane">
                <div className="mock-pane-header">Source</div>
                <div className="mock-code">
                  {previewLines.map((line, index) => (
                    <div key={line} className="mock-code-line">
                      <span>{index + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mock-pane">
                <div className="mock-pane-header">Preview</div>
                <div className="mock-paper">
                  <h3>Alex Morgan</h3>
                  <p>alex@email.com · (555) 123-4567 · New York, NY</p>
                  <p>
                    Product-minded software engineer with experience building
                    customer-facing web applications and internal tools.
                  </p>
                  <p>
                    Senior Frontend Engineer · Northstar Studio · 2023 —
                    Present
                  </p>
                  <p>
                    Led the redesign of a portfolio analytics product and
                    shipped a shared React component system.
                  </p>
                </div>
              </div>
            </div>

            <div className="mock-log">
              Compilation log — Output written on main.pdf
            </div>
          </div>
        </section>

        {!firebaseConfigured ? <FirebaseSetupPanel /> : null}
      </div>
    </main>
  )
}

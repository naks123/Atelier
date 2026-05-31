import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth.ts'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { EditorPage } from './pages/EditorPage.tsx'
import { LandingPage } from './pages/LandingPage.tsx'

function App() {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-panel surface">
          <h1>Loading workspace</h1>
          <p className="muted">
            Checking authentication and restoring your saved resumes.
          </p>
        </div>
      </main>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={user ? <DashboardPage /> : <LandingPage />} />
        <Route
          path="/resume/:resumeId"
          element={user ? <EditorPage /> : <Navigate replace to="/" />}
        />
        <Route path="*" element={<Navigate replace to={user ? '/' : '/'} />} />
      </Routes>
      <Toaster
        closeButton
        expand
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast: '!border-[var(--border)] !bg-[var(--surface)] !text-[var(--text)]',
            description: '!text-[var(--muted)]',
          },
        }}
      />
    </>
  )
}

export default App

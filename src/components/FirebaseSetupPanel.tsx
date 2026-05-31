import { FIREBASE_ENV_KEYS } from '../lib/firebase.ts'

export function FirebaseSetupPanel() {
  return (
    <section className="setup-panel surface mt-6">
      <h2>Firebase setup required</h2>
      <p className="muted">
        Add the Firebase web app credentials to `.env.local`, enable Google
        Authentication in Firebase Console, and restart the Vite dev server.
      </p>
      <pre>
        {FIREBASE_ENV_KEYS.map((key) => `${key}=\n`).join('')}
        VITE_BUSYTEX_BASE_PATH=/core/busytex
      </pre>
    </section>
  )
}

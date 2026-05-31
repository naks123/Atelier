import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'
import {
  assertFirebaseReady,
  auth,
  firebaseConfigured,
} from '../lib/firebase.ts'
import { AuthContext, type AuthContextValue } from './auth-context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => auth !== null)

  useEffect(() => {
    if (!auth) {
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    firebaseConfigured,
    async signInWithGoogle() {
      const { auth: readyAuth, googleProvider } = assertFirebaseReady()
      await signInWithPopup(readyAuth, googleProvider)
    },
    async signOutUser() {
      const { auth: readyAuth } = assertFirebaseReady()
      await signOut(readyAuth)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

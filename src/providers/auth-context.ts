import type { User } from 'firebase/auth'
import { createContext } from 'react'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  firebaseConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth, googleAuthProvider } from '../services/firebase'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const signup = useCallback((email, password) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }, [])

  const login = useCallback((email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }, [])

  const loginWithGoogle = useCallback(() => {
    return signInWithPopup(auth, googleAuthProvider)
  }, [])

  const logout = useCallback(() => {
    return signOut(auth)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, loading, signup, login, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used inside an AuthProvider')
  }

  return context
}

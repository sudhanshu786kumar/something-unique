'use client'

import { createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const { data: session, status } = useSession()

  return (
    <AuthContext.Provider value={{ user: session?.user, isAuthenticated: status === 'authenticated' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

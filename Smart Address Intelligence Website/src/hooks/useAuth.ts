import { useState, useEffect } from 'react'
import { authService, type AuthState, type User } from '../services/auth'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    console.log('=== USEAUTH EFFECT CALLED ===')
    const unsubscribe = authService.subscribe((state) => {
      console.log('Auth state received in useAuth:', {
        user: state.user?.email,
        loading: state.loading,
        error: state.error
      })
      setAuthState(state)
    })
    
    // Check current session on mount
    console.log('Checking current session on mount...')
    authService.getCurrentSession().then(session => {
      console.log('Current session result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      })
      if (!session) {
        console.log('No session found - setting loading to false')
        setAuthState({ user: null, loading: false, error: null })
      }
    })

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setAuthState(prev => {
        if (prev.loading) {
          console.warn('Auth loading timeout - setting loading to false')
          return { ...prev, loading: false }
        }
        return prev
      })
    }, 3000) // 3 second timeout

    console.log('=== USEAUTH EFFECT SETUP COMPLETE ===')

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    return await authService.signIn(email, password)
  }

  const signUp = async (email: string, password: string, name: string) => {
    return await authService.signUp(email, password, name)
  }

  const signOut = async () => {
    return await authService.signOut()
  }

  const updateProfile = async (updates: Partial<User>) => {
    return await authService.updateProfile(updates)
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    isAdmin: authService.isAdmin(),
    isAuthenticated: authService.isAuthenticated(),
    currentUser: authService.getCurrentUser(),
  }
}

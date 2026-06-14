import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

export type User = {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export const useAuthSimple = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    console.log('=== SIMPLE AUTH HOOK INIT ===')
    
    let mounted = true
    
    // Check current session immediately
    const checkAuth = async () => {
      try {
        console.log('Checking current session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          if (mounted) {
            setAuthState({ user: null, loading: false, error: error.message })
          }
          return
        }
        
        if (session?.user) {
          console.log('Session found, user ID:', session.user.id)
          
          // Create basic user from session data
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.log('Setting user state:', basicUser.email)
          if (mounted) {
            setAuthState({ user: basicUser, loading: false, error: null })
          }
        } else {
          console.log('No session found - setting loading to false')
          if (mounted) {
            setAuthState({ user: null, loading: false, error: null })
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          setAuthState({ 
            user: null, 
            loading: false, 
            error: error instanceof Error ? error.message : 'Authentication error' 
          })
        }
      }
    }
    
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== AUTH STATE CHANGE (SIMPLE) ===')
      console.log('Event:', event)
      console.log('Session:', !!session)
      
      if (!mounted) return
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in:', session.user.email)
        
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setAuthState({ user: basicUser, loading: false, error: null })
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        setAuthState({ user: null, loading: false, error: null })
      }
    })
    
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && authState.loading) {
        console.warn('Simple auth timeout - forcing loading to false')
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    }, 2000)
    
    return () => {
      mounted = false
      subscription?.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setAuthState({ user: null, loading: false, error: null })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!authState.user,
    currentUser: authState.user,
  }
}

import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

class AuthService {
  private currentUser: User | null = null
  private listeners: ((state: AuthState) => void)[] = []

  constructor() {
    console.log('AuthService constructor called')
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('=== AUTH STATE CHANGE ===')
      console.log('Event:', _event)
      console.log('Session exists:', !!session)
      console.log('User ID:', session?.user?.id)
      console.log('User email:', session?.user?.email)
      
      if (session?.user) {
        console.log('Loading user profile for authenticated user...')
        await this.loadUserProfile(session.user.id)
      } else {
        console.log('No session - setting user to null')
        this.currentUser = null
        this.notifyListeners({ user: null, loading: false, error: null })
      }
      console.log('=== END AUTH STATE CHANGE ===')
    })
  }

  private async loadUserProfile(userId: string) {
    try {
      console.log('Loading user profile for:', userId)
      this.notifyListeners({ user: null, loading: true, error: null })
      
      // First try to get from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('Database error:', error)
        
        // If user doesn't exist in database, try to create them
        if (error.code === 'PGRST116') {
          console.log('User not found in database, attempting to create profile')
          try {
            const { data: authData } = await supabase.auth.getUser()
            if (authData.user) {
              // Try to insert user profile
              const { data: newUserData, error: insertError } = await supabase
                .from('users')
                .insert({
                  id: authData.user.id,
                  email: authData.user.email || '',
                  name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
                  role: 'user'
                })
                .select()
                .single()

              if (insertError) {
                console.log('Failed to create user profile:', insertError)
                // Even if insert fails, create a basic profile from auth data
                const basicUser: User = {
                  id: authData.user.id,
                  email: authData.user.email || '',
                  name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                this.currentUser = basicUser
                this.notifyListeners({ user: basicUser, loading: false, error: null })
                return
              }

              console.log('User profile created successfully')
              this.currentUser = newUserData
              this.notifyListeners({ user: newUserData, loading: false, error: null })
              return
            }
          } catch (authError) {
            console.error('Auth error:', authError)
          }
        }
        
        // If we can't create the profile, create a basic one from auth data
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          console.log('Creating basic user profile from auth data')
          const basicUser: User = {
            id: userData.user.id,
            email: userData.user.email || '',
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          this.currentUser = basicUser
          this.notifyListeners({ user: basicUser, loading: false, error: null })
          return
        }
        
        throw error
      }

      console.log('User profile loaded from database')
      this.currentUser = data
      this.notifyListeners({ user: data, loading: false, error: null })
    } catch (error) {
      console.error('Error loading user profile:', error)
      
      // Final fallback - try to get basic user from auth
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const basicUser: User = {
            id: userData.user.id,
            email: userData.user.email || '',
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          this.currentUser = basicUser
          this.notifyListeners({ user: basicUser, loading: false, error: null })
          return
        }
      } catch (fallbackError) {
        console.error('Fallback auth error:', fallbackError)
      }
      
      this.notifyListeners({ 
        user: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load user profile' 
      })
    }
  }

  private notifyListeners(state: AuthState) {
    this.listeners.forEach(listener => listener(state))
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    
    // Return current state immediately
    listener({
      user: this.currentUser,
      loading: false,
      error: null
    })

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  async signIn(email: string, password: string) {
    try {
      this.notifyListeners({ user: null, loading: true, error: null })

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
      this.notifyListeners({ user: null, loading: false, error: errorMessage })
      throw error
    }
  }

  async signUp(email: string, password: string, name: string) {
    try {
      this.notifyListeners({ user: null, loading: true, error: null })

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
      this.notifyListeners({ user: null, loading: false, error: errorMessage })
      throw error
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      this.currentUser = null
      this.notifyListeners({ user: null, loading: false, error: null })
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  async updateProfile(updates: UserUpdate) {
    if (!this.currentUser) {
      throw new Error('No user logged in')
    }

    try {
      this.notifyListeners({ 
        user: this.currentUser, 
        loading: true, 
        error: null 
      })

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      this.currentUser = data
      this.notifyListeners({ user: data, loading: false, error: null })
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      this.notifyListeners({ 
        user: this.currentUser, 
        loading: false, 
        error: errorMessage 
      })
      throw error
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  // Check if user has admin role
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin'
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }
}

export const authService = new AuthService()

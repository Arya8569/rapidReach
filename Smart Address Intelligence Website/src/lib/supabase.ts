import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set')
  throw new Error('Please set up your Supabase environment variables in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Types for our database
export interface Database {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          original_address: string
          standardized_address: string
          latitude: number
          longitude: number
          confidence: number
          address_type: 'residential' | 'commercial' | 'industrial' | 'mixed'
          landmarks: string[]
          tags: string[]
          status: 'pending' | 'verified' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['addresses']['Row']>
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      services: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          latitude: number
          longitude: number
          address: string
          phone: string
          website: string
          rating: number
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Row']>
      }
    }
  }
}

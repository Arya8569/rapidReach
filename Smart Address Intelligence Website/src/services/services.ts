import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

export type Service = Database['public']['Tables']['services']['Row']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']

export interface ServiceWithDistance extends Service {
  distance_km?: number
}

class ServicesService {
  async getAllServices(limit = 50, offset = 0): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('rating', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching services:', error)
      throw error
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching service:', error)
      throw error
    }
  }

  async getServicesByCategory(category: string, limit = 20): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching services by category:', error)
      throw error
    }
  }

  async searchServices(query: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,address.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(20)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error searching services:', error)
      throw error
    }
  }

  async getServicesNearLocation(
    latitude: number, 
    longitude: number, 
    radiusKm = 10,
    category?: string
  ): Promise<ServiceWithDistance[]> {
    try {
      // Use the PostGIS function for efficient spatial queries
      const { data, error } = await supabase
        .rpc('find_nearby_services', {
          lat: latitude,
          lng: longitude,
          radius_km: radiusKm,
          category_filter: category || null
        })

      if (error) {
        // Fallback to client-side calculation if RPC doesn't exist
        return await this.getServicesNearLocationFallback(latitude, longitude, radiusKm, category)
      }

      return data || []
    } catch (error) {
      console.error('Error finding nearby services:', error)
      // Fallback to client-side calculation
      return await this.getServicesNearLocationFallback(latitude, longitude, radiusKm, category)
    }
  }

  private async getServicesNearLocationFallback(
    latitude: number, 
    longitude: number, 
    radiusKm: number,
    category?: string
  ): Promise<ServiceWithDistance[]> {
    try {
      let supabaseQuery = supabase
        .from('services')
        .select('*')

      if (category) {
        supabaseQuery = supabaseQuery.eq('category', category)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        throw error
      }

      if (!data) return []

      // Calculate distances client-side
      const servicesWithDistance = data
        .map(service => ({
          ...service,
          distance_km: this.calculateDistance(
            latitude, longitude, 
            service.latitude, service.longitude
          )
        }))
        .filter(service => service.distance_km! <= radiusKm)
        .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))

      return servicesWithDistance
    } catch (error) {
      console.error('Error in fallback nearby services:', error)
      throw error
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('category')
        .not('category', 'is', null)

      if (error) {
        throw error
      }

      const categories = [...new Set((data || []).map(s => s.category))]
      return categories.sort()
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  async getVerifiedServices(limit = 50): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('verified', true)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching verified services:', error)
      throw error
    }
  }

  async createService(serviceData: ServiceInsert): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating service:', error)
      throw error
    }
  }

  async updateService(id: string, updates: ServiceUpdate): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating service:', error)
      throw error
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      throw error
    }
  }

  async getTopRatedServices(limit = 10): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('verified', true)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching top rated services:', error)
      throw error
    }
  }

  // Subscribe to real-time updates for services
  subscribeToServices(callback: (payload: any) => void) {
    return supabase
      .channel('services')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        callback
      )
      .subscribe()
  }
}

export const servicesService = new ServicesService()

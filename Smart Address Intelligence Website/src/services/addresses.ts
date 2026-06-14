import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { geocodingService } from './geocoding'

export type Address = Database['public']['Tables']['addresses']['Row']
export type AddressInsert = Database['public']['Tables']['addresses']['Insert']
export type AddressUpdate = Database['public']['Tables']['addresses']['Update']

export interface AddressWithDistance extends Address {
  distance_km?: number
}

class AddressService {
  async createAddress(userId: string, originalAddress: string): Promise<Address> {
    try {
      // First geocode the address
      const geocoded = await geocodingService.geocode(originalAddress)

      // Then insert into database
      const addressData: AddressInsert = {
        user_id: userId,
        original_address: geocoded.original,
        standardized_address: geocoded.standardized,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        confidence: geocoded.confidence,
        address_type: geocoded.type,
        landmarks: geocoded.landmarks,
        tags: geocoded.tags,
        status: 'verified', // Auto-verify for now, could be manual in production
      }

      return await this.saveVerifiedAddress(addressData)
    } catch (error) {
      console.error('Error creating address:', error)
      throw error
    }
  }

  async saveVerifiedAddress(addressData: AddressInsert): Promise<Address> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert(addressData)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error saving verified address:', error)
      throw error
    }
  }

  async getUserAddresses(userId: string, limit = 50, offset = 0): Promise<Address[]> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user addresses:', error)
      throw error
    }
  }

  async getAddressById(id: string): Promise<Address | null> {
    try {
      const { data, error } = await supabase
        .from('addresses')
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
      console.error('Error fetching address:', error)
      throw error
    }
  }

  async updateAddress(id: string, userId: string, updates: AddressUpdate): Promise<Address> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only update their own addresses
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating address:', error)
      throw error
    }
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only delete their own addresses

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      throw error
    }
  }

  async searchAddresses(query: string, userId?: string): Promise<Address[]> {
    try {
      let supabaseQuery = supabase
        .from('addresses')
        .select('*')
        .or(`original_address.ilike.%${query}%,standardized_address.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (userId) {
        supabaseQuery = supabaseQuery.eq('user_id', userId)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error searching addresses:', error)
      throw error
    }
  }

  async getAddressesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm = 10,
    userId?: string
  ): Promise<AddressWithDistance[]> {
    try {
      // Use the PostGIS function for efficient spatial queries
      const { data, error } = await supabase
        .rpc('find_nearby_addresses', {
          lat: latitude,
          lng: longitude,
          radius_km: radiusKm,
          user_id_filter: userId || null
        })

      if (error) {
        // Fallback to client-side calculation if RPC doesn't exist
        return await this.getAddressesNearLocationFallback(latitude, longitude, radiusKm, userId)
      }

      return data || []
    } catch (error) {
      console.error('Error finding nearby addresses:', error)
      // Fallback to client-side calculation
      return await this.getAddressesNearLocationFallback(latitude, longitude, radiusKm, userId)
    }
  }

  private async getAddressesNearLocationFallback(
    latitude: number,
    longitude: number,
    radiusKm: number,
    userId?: string
  ): Promise<AddressWithDistance[]> {
    try {
      let supabaseQuery = supabase
        .from('addresses')
        .select('*')

      if (userId) {
        supabaseQuery = supabaseQuery.eq('user_id', userId)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        throw error
      }

      if (!data) return []

      // Calculate distances client-side
      const addressesWithDistance = data
        .map(address => ({
          ...address,
          distance_km: this.calculateDistance(
            latitude, longitude,
            address.latitude, address.longitude
          )
        }))
        .filter(address => address.distance_km! <= radiusKm)
        .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))

      return addressesWithDistance
    } catch (error) {
      console.error('Error in fallback nearby addresses:', error)
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

  async getAddressStatistics(userId: string): Promise<{
    total: number
    verified: number
    pending: number
    rejected: number
    byType: Record<string, number>
  }> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('status, address_type')
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      const addresses = data || []

      const stats = {
        total: addresses.length,
        verified: addresses.filter(a => a.status === 'verified').length,
        pending: addresses.filter(a => a.status === 'pending').length,
        rejected: addresses.filter(a => a.status === 'rejected').length,
        byType: addresses.reduce((acc, addr) => {
          acc[addr.address_type] = (acc[addr.address_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      return stats
    } catch (error) {
      console.error('Error getting address statistics:', error)
      throw error
    }
  }

  // Subscribe to real-time updates for a user's addresses
  subscribeToUserAddresses(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`addresses:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'addresses',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

export const addressService = new AddressService()

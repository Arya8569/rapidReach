export interface GeocodingResult {
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
  }
  importance: number
  place_type: string[]
  boundingbox: [string, string, string, string]
}

export interface StandardizedAddress {
  original: string
  standardized: string
  latitude: number
  longitude: number
  confidence: number
  type: 'residential' | 'commercial' | 'industrial' | 'mixed'
  landmarks: string[]
  tags: string[]
}

class GeocodingService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org'
  }

  // Indian address normalization
  private normalizeIndianAddress(input: string): string {
    let normalized = input.toLowerCase().trim()
    
    // Expand common Indian abbreviations
    const abbreviations: { [key: string]: string } = {
      'opp': 'opposite',
      'stn': 'station',
      'rd': 'road',
      'rly': 'railway',
      'hwy': 'highway',
      'junc': 'junction',
      'chowk': 'chowk',
      'cross': 'crossing',
      'naka': 'naka',
      'petrol': 'petrol',
      'pump': 'pump',
      'depot': 'depot',
      'office': 'office',
      'shop': 'shop',
      'market': 'market',
      'mandir': 'mandir',
      'bhavan': 'bhavan',
      'society': 'society',
      'apartment': 'apartment',
      'flat': 'flat',
      'bungalow': 'bungalow',
      'colony': 'colony',
      'nagar': 'nagar',
      'puram': 'puram',
      'ganj': 'ganj',
      'gali': 'gali',
      'marg': 'marg',
      'path': 'path',
      'lane': 'lane',
      'street': 'street',
      'sadar': 'sadar',
      'circle': 'circle',
      'square': 'square',
      'garden': 'garden',
      'park': 'park',
      'road': 'road',
      'bridge': 'bridge',
      'tunnel': 'tunnel',
      'metro': 'metro',
      'bus': 'bus',
      'stand': 'stand',
      'complex': 'complex',
      'center': 'centre',
    }

    // Replace abbreviations
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi')
      normalized = normalized.replace(regex, full)
    })

    // Indian state normalization
    const stateMap: { [key: string]: string } = {
      'mh': 'maharashtra',
      'dl': 'delhi',
      'up': 'uttar pradesh',
      'tn': 'tamil nadu',
      'ka': 'karnataka',
      'ap': 'andhra pradesh',
      'wb': 'west bengal',
      'gj': 'gujarat',
      'rj': 'rajasthan',
      'pb': 'punjab',
      'hr': 'haryana',
      'ct': 'chhattisgarh',
      'jh': 'jharkhand',
      'as': 'assam',
      'ml': 'meghalaya',
      'tr': 'tripura',
      'mz': 'mizoram',
      'nl': 'nagaland',
      'sk': 'sikkim',
      'goa': 'goa',
      'ut': 'uttarakhand',
      'jk': 'jammu & kashmir',
      'la': 'ladakh',
      'py': 'pondicherry',
      'ch': 'chandigarh',
      'dn': 'dadra and nagar haveli',
      'dd': 'daman and diu'
    }

    // Normalize states
    Object.entries(stateMap).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi')
      normalized = normalized.replace(regex, full)
    })

    // Add country if missing
    if (!normalized.includes('india') && !normalized.includes('bharat')) {
      normalized += ', India'
    }

    return normalized
  }

  // Extract components for multi-pass strategy
  private extractAddressComponents(address: string): {
    fullAddress: string
    cityPincodeOnly: string
    landmarkCity: string
    pincodeIndia: string
  } {
    // Extract pincode (6 digits)
    const pincodeMatch = address.match(/\b(\d{6})\b/)
    const pincode = pincodeMatch ? pincodeMatch[1] : ''

    // Extract city (common Indian cities)
    const cities = [
      'thane', 'mumbai', 'pune', 'nashik', 'nagpur', 'aurangabad',
      'solapur', 'amravati', 'nanded', 'kolhapur', 'sangli',
      'satara', 'ratnagiri', 'sindhudurg', 'palghar',
      'ahmednagar', 'jalgaon', 'buldhana', 'akola', 'washim',
      'yavatmal', 'beed', 'latur', 'osmanabad',
      'nanded', 'latur', 'parbhani', 'hingoli',
      'jalna', 'bid', 'bhandara', 'gondia',
      'chandrapur', 'gadchiroli', 'yavatmal',
      'wardha', 'nashik', 'dhule', 'nandurbar',
      'ahmednagar', 'pune', 'satara', 'sangli',
      'kolhapur', 'ratnagiri', 'sindhudurg',
      'palghar', 'raigad', 'nashik', 'aurangabad',
      'jalgaon', 'buldhana', 'akola', 'washim',
      'yavatmal', 'beed', 'latur', 'osmanabad',
      'nanded', 'parbhani', 'hingoli',
      'jalna', 'bid', 'bhandara',
      'gondia', 'chandrapur', 'gadchiroli',
      'yavatmal', 'wardha', 'nashik',
      'dhule', 'nandurbar', 'ahmednagar',
      'pune', 'satara', 'sangli',
      'kolhapur', 'ratnagiri', 'sindhudurg',
      'palghar', 'raigad'
    ]
    
    let city = ''
    for (const city_name of cities) {
      if (address.toLowerCase().includes(city_name)) {
        city = city_name
        break
      }
    }

    // Extract landmarks (before city/pincode)
    const parts = address.split(',')
    let landmark = ''
    let beforeCity = ''
    
    for (const part of parts) {
      const cleanPart = part.trim().toLowerCase()
      if (cleanPart.includes(city) || cleanPart.includes(pincode)) {
        break
      }
      beforeCity += part + ', '
    }
    
    // Remove trailing comma
    if (beforeCity.endsWith(', ')) {
      beforeCity = beforeCity.slice(0, -2)
    }
    landmark = beforeCity.trim()

    return {
      fullAddress: address,
      cityPincodeOnly: city && pincode ? `${city}, ${pincode}, India` : '',
      landmarkCity: landmark && city ? `${landmark}, ${city}` : '',
      pincodeIndia: pincode ? `${pincode}, India` : ''
    }
  }

  // Multi-pass geocoding strategy
  private async geocodeWithMultipleAttempts(address: string): Promise<StandardizedAddress> {
    const normalized = this.normalizeIndianAddress(address)
    const components = this.extractAddressComponents(normalized)
    
    const attempts = [
      { query: components.fullAddress, description: 'Full address' },
      { query: components.cityPincodeOnly, description: 'City + Pincode' },
      { query: components.landmarkCity, description: 'Landmark + City' },
      { query: components.pincodeIndia, description: 'Pincode + India' }
    ]

    console.log('Starting multi-pass geocoding for:', address)
    console.log('Normalized address:', normalized)
    console.log('Components:', components)

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i]
      console.log(`Attempt ${i + 1}: ${attempt.description} - "${attempt.query}"`)
      
      try {
        const result = await this.singleGeocodeAttempt(attempt.query)
        if (result) {
          console.log(`✅ Success on attempt ${i + 1}:`, result.standardized)
          return result
        }
      } catch (error) {
        console.log(`❌ Attempt ${i + 1} failed:`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    throw new Error(`No results found after ${attempts.length} attempts for address: ${address}`)
  }

  private async singleGeocodeAttempt(query: string): Promise<StandardizedAddress> {
    const response = await fetch(
      `${this.baseUrl}/search?format=json&addressdetails=1&countrycodes=in&limit=3&dedupe=1&namedetails=1`,
      {
        headers: {
          'User-Agent': 'RapidReach/1.0 (contact@rapidreach.ai)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: GeocodingResult[] = await response.json()

    if (data.length === 0) {
      throw new Error('No results found')
    }

    const result = data[0]
    
    // Check if we have valid coordinates
    if (!result.lat || !result.lon) {
      throw new Error('Invalid coordinates received')
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(result, query)

    return {
      original: query,
      standardized: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      confidence,
      type: this.determineAddressType(result),
      landmarks: this.extractLandmarks(result),
      tags: this.generateTags(result, confidence)
    }
  }

  async geocode(address: string): Promise<StandardizedAddress> {
    try {
      console.log('=== GEOCODING START ===')
      console.log('Input address:', address)
      
      const result = await this.geocodeWithMultipleAttempts(address)
      
      console.log('=== GEOCODING SUCCESS ===')
      console.log('Final result:', {
        standardized: result.standardized,
        confidence: result.confidence,
        coordinates: `${result.latitude}, ${result.longitude}`
      })
      
      return result
    } catch (error) {
      console.error('=== GEOCODING FAILED ===')
      console.error('Error:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  private determineAddressType(result: GeocodingResult): 'residential' | 'commercial' | 'industrial' | 'mixed' {
    const { place_type, address } = result
    
    if (place_type.includes('house') || place_type.includes('residential') || address.house_number) {
      return 'residential'
    }
    
    if (place_type.includes('commercial') || place_type.includes('office') || place_type.includes('shop')) {
      return 'commercial'
    }
    
    if (place_type.includes('industrial') || place_type.includes('factory')) {
      return 'industrial'
    }
    
    return 'mixed'
  }

  private extractLandmarks(result: GeocodingResult): string[] {
    const landmarks: string[] = []
    const { address } = result
    
    // Extract potential landmarks from address components
    if (address.suburb) landmarks.push(address.suburb)
    if (address.city && address.city !== address.suburb) landmarks.push(address.city)
    
    return landmarks
  }

  private calculateConfidence(result: GeocodingResult, originalAddress: string): number {
    let confidence = Math.round(result.importance * 100)
    
    // Boost confidence for exact matches
    if (result.display_name.toLowerCase().includes(originalAddress.toLowerCase())) {
      confidence = Math.min(99, confidence + 10)
    }
    
    // Reduce confidence for incomplete addresses
    if (!result.address.house_number) confidence -= 5
    if (!result.address.postcode) confidence -= 5
    
    return Math.max(85, Math.min(99, confidence))
  }

  private generateTags(result: GeocodingResult, confidence: number): string[] {
    const tags: string[] = []
    
    if (confidence >= 95) tags.push('Verified')
    if (result.address.house_number) tags.push('Precise')
    if (result.address.postcode) tags.push('Complete')
    if (result.importance > 0.8) tags.push('High Priority')
    
    return tags
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'RapidReach/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      throw error
    }
  }
}

export const geocodingService = new GeocodingService()

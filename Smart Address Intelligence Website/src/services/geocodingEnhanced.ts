import { aiAnalysisService, type AIAnalysisResult } from './aiAnalysisRobust'

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
  type: 'residential' | 'commercial' | 'industrial' | 'mixed' | 'city' | 'landmark'
  landmarks: string[]
  tags: string[]
}

class EnhancedGeocodingService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org'
  }

  async geocode(address: string): Promise<StandardizedAddress> {
    try {
      console.log('=== ENHANCED GEOCODING START ===')
      console.log('Input address:', address)
      
      // Step 1: AI Analysis for intelligent address processing
      const aiAnalysis = await aiAnalysisService.analyzeAddress(address)
      console.log('AI Analysis Result:', aiAnalysis)
      
      // Step 2: Try multiple geocoding strategies based on AI analysis
      const result = await this.geocodeWithAIAnalysis(aiAnalysis, address)
      
      if (result) {
        console.log('=== ENHANCED GEOCODING SUCCESS ===')
        console.log('Final result:', {
          standardized: result.standardized,
          confidence: result.confidence,
          coordinates: `${result.latitude}, ${result.longitude}`
        })
        
        return result
      } else {
        throw new Error(`No results found after all attempts for address: ${address}`)
      }
    } catch (error) {
      console.error('=== ENHANCED GEOCODING FAILED ===')
      console.error('Error:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  private async geocodeWithAIAnalysis(aiAnalysis: AIAnalysisResult, originalAddress: string): Promise<StandardizedAddress | null> {
    const geocodingAttempts = this.generateGeocodingAttempts(aiAnalysis, originalAddress)
    
    console.log('Generated geocoding attempts:', geocodingAttempts)
    
    let bestResult: StandardizedAddress | null = null

    // 🧠 CORE DEFINITION OF SUCCESS: SUCCESS = latitude != null AND longitude != null
    for (const attempt of geocodingAttempts) {
      console.log(`Attempt: ${attempt.description} - "${attempt.query}"`)
      
      try {
        const result = await this.singleGeocodeAttempt(attempt.query)
        
        // ✅ ABSOLUTE SUCCESS CONDITION
        if (result?.latitude && result?.longitude) {
          console.log('✅ RAW GEOCODE RESULT', result)
          console.log('✅ SUCCESS: Valid coordinates found - STOPPING IMMEDIATELY')
          
          bestResult = result
          break // STOP IMMEDIATELY ON FIRST VALID COORDINATE
        }
      } catch (error) {
        console.log(`❌ Attempt failed:`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    // ❌ ONLY HERE can failure be shown
    if (!bestResult) {
      console.log('❌ FAILURE: NO COORDINATES FROM ANY PROVIDER')
      return null
    }

    return bestResult
  }

  private generateGeocodingAttempts(aiAnalysis: AIAnalysisResult, originalAddress: string): Array<{query: string, description: string}> {
    const attempts: Array<{query: string, description: string}> = []
    
    // 🌍 INDIA-SPECIFIC OVERRIDE: Landmarks > City > Pincode > AI Address
    // For Indian addresses: petrol pumps, railway stations, bus stops, chowks, societies are VALID PRIMARY LOCATIONS
    
    // Attempt 1: Landmark Only + India (HIGHEST PRIORITY for India)
    if (aiAnalysis.landmarks.length > 0) {
      attempts.push({
        query: `${aiAnalysis.landmarks[0]}, India`,
        description: 'Landmark Only'
      })
    }
    
    // Attempt 2: Landmark + City + India
    if (aiAnalysis.landmarks.length > 0 && aiAnalysis.city) {
      attempts.push({
        query: `${aiAnalysis.landmarks[0]}, ${aiAnalysis.city}, India`,
        description: 'Landmark + City'
      })
    }
    
    // Attempt 3: City + Pincode + India
    if (aiAnalysis.city && aiAnalysis.pincode) {
      attempts.push({
        query: `${aiAnalysis.city}, ${aiAnalysis.pincode}, India`,
        description: 'City + Pincode'
      })
    }
    
    // Attempt 4: City Only + India (Suburb-level results like Digha are ACCEPTABLE)
    if (aiAnalysis.city) {
      attempts.push({
        query: `${aiAnalysis.city}, India`,
        description: 'City Only'
      })
    }
    
    // Attempt 5: Pincode Only + India
    if (aiAnalysis.pincode) {
      attempts.push({
        query: `${aiAnalysis.pincode}, India`,
        description: 'Pincode Only'
      })
    }
    
    // Attempt 6: City + State + India
    if (aiAnalysis.city && aiAnalysis.state) {
      attempts.push({
        query: `${aiAnalysis.city}, ${aiAnalysis.state}, India`,
        description: 'City + State'
      })
    }
    
    // Attempt 7-9: AI suggestions (up to 3)
    aiAnalysis.suggestions.slice(0, 3).forEach((suggestion, index) => {
      if (suggestion && suggestion !== aiAnalysis.standardizedAddress) {
        attempts.push({
          query: suggestion,
          description: `AI Suggestion ${index + 1}`
        })
      }
    })
    
    // Attempt 10: AI standardized address
    if (aiAnalysis.standardizedAddress && aiAnalysis.standardizedAddress !== originalAddress) {
      attempts.push({
        query: aiAnalysis.standardizedAddress,
        description: 'AI Standardized'
      })
    }
    
    // Attempt 11: Original address (last resort)
    attempts.push({
      query: originalAddress,
      description: 'Original Address'
    })
    
    return attempts
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
    
    // 👉 Log and surface raw lat/lon before ANY transformation
    console.log('🧪 FORCED PASS TEST: RAW GEOCODE RESULT', result)
    console.log('🧪 RAW LATITUDE:', result.lat)
    console.log('🧪 RAW LONGITUDE:', result.lon)
    console.log('🧪 RAW DISPLAY_NAME:', result.display_name)
    
    // ✅ ABSOLUTE SUCCESS CONDITION: SUCCESS = latitude != null AND longitude != null
    if (result.lat && result.lon) {
      const confidence = this.calculateConfidence(result, query)
      
      return {
        original: query,
        standardized: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        confidence,
        type: result.place_type?.[0] || result.address?.city ? 'city' : 'landmark',
        landmarks: this.extractLandmarks(result),
        tags: this.generateTags(result, confidence)
      }
    }
    
    throw new Error('Invalid coordinates received')
  }

  private calculateConfidence(result: GeocodingResult, query: string): number {
    let confidence = 40 // Base confidence
    
    // Boost confidence based on data completeness
    if (result.address.city) confidence += 20
    if (result.address.state) confidence += 15
    if (result.address.postcode) confidence += 20
    if (result.address.road) confidence += 10
    if (result.address.house_number) confidence += 10
    
    // Boost confidence based on place type
    if (result.place_type.includes('city') || result.place_type.includes('town')) {
      confidence += 10
    }
    
    // Boost confidence based on importance score
    if (result.importance > 0.8) confidence += 15
    else if (result.importance > 0.6) confidence += 10
    else if (result.importance > 0.4) confidence += 5
    
    // Boost confidence for exact matches
    const queryParts = query.toLowerCase().split(',').map(part => part.trim())
    const resultParts = result.display_name.toLowerCase().split(',').map(part => part.trim())
    
    // Check for partial matches
    let matchScore = 0
    queryParts.forEach(qPart => {
      if (resultParts.some(rPart => rPart.includes(qPart) || qPart.includes(rPart))) {
        matchScore += 1
      }
    })
    
    if (matchScore >= 2) confidence += 10
    else if (matchScore >= 1) confidence += 5
    
    // Boost confidence for Indian addresses
    if (result.address.country === 'India' || result.display_name.toLowerCase().includes('india')) {
      confidence += 5
    }
    
    return Math.min(confidence, 100)
  }

  private determineAddressType(result: GeocodingResult): 'residential' | 'commercial' | 'industrial' | 'mixed' {
    const { place_type, address } = result
    
    if (place_type.includes('house') || place_type.includes('residential') || address.house_number) {
      return 'residential'
    }
    if (place_type.includes('office') || place_type.includes('commercial') || place_type.includes('shop')) {
      return 'commercial'
    }
    if (place_type.includes('industrial') || place_type.includes('factory')) {
      return 'industrial'
    }
    
    return 'mixed'
  }

  private extractLandmarks(result: GeocodingResult): string[] {
    const landmarks: string[] = []
    
    if (result.address.road) landmarks.push(result.address.road)
    if (result.address.suburb) landmarks.push(result.address.suburb)
    
    // Extract landmarks from display name
    const nameParts = result.display_name.split(',')
    nameParts.forEach(part => {
      const cleanPart = part.trim()
      if (cleanPart.includes('Temple') || cleanPart.includes('Station') || 
          cleanPart.includes('Market') || cleanPart.includes('School') ||
          cleanPart.includes('Hospital') || cleanPart.includes('Office')) {
        landmarks.push(cleanPart)
      }
    })
    
    return landmarks.slice(0, 5) // Limit to 5 landmarks
  }

  private generateTags(result: GeocodingResult, confidence: number): string[] {
    const tags: string[] = []
    
    // Confidence tags
    if (confidence >= 80) tags.push('high-confidence')
    else if (confidence >= 60) tags.push('medium-confidence')
    else tags.push('low-confidence')
    
    // Place type tags
    tags.push(...result.place_type.slice(0, 3))
    
    // Location tags
    if (result.address.city) tags.push(result.address.city.toLowerCase())
    if (result.address.state) tags.push(result.address.state.toLowerCase())
    
    return tags
  }
}

export const enhancedGeocodingService = new EnhancedGeocodingService()

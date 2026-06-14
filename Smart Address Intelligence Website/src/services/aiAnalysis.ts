import Groq from 'groq-sdk'

export interface AIAnalysisResult {
  standardizedAddress: string
  city: string
  state: string
  pincode: string
  landmarks: string[]
  confidence: number
  suggestions: string[]
}

class AIAnalysisService {
  private groq: any

  constructor() {
    this.groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY || ''
    })
  }

  async analyzeAddress(input: string): Promise<AIAnalysisResult> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian address analysis AI. Your task is to analyze unstructured Indian addresses and extract structured information.

            Analyze the given address and return a JSON object with:
            - standardizedAddress: Clean, properly formatted address
            - city: Main city name (lowercase)
            - state: State name (lowercase) 
            - pincode: 6-digit pincode if present
            - landmarks: Array of key landmarks/places mentioned
            - confidence: 0-100 based on how complete the address is
            - suggestions: Array of alternative formats for better geocoding

            Rules:
            - Expand common Indian abbreviations (opp → opposite, stn → station, rd → road)
            - Normalize state codes (MH → maharashtra, DL → delhi)
            - Always include "India" in standardized address
            - Extract pincode (6 digits) if present
            - Identify major cities (mumbai, delhi, bangalore, pune, chennai, kolkata, etc.)
            - Handle Hindi text if present

            Return ONLY valid JSON, no explanations.`
          },
          {
            role: 'user',
            content: `Analyze this Indian address: "${input}"`
          }
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 0.1,
        max_tokens: 500
      })

      const content = completion.choices[0]?.message?.content
      
      if (!content) {
        throw new Error('No response from AI analysis')
      }

      // Parse JSON response
      const analysis = JSON.parse(content)
      
      return {
        standardizedAddress: analysis.standardizedAddress || input,
        city: analysis.city || '',
        state: analysis.state || '',
        pincode: analysis.pincode || '',
        landmarks: analysis.landmarks || [],
        confidence: analysis.confidence || 50,
        suggestions: analysis.suggestions || []
      }
    } catch (error) {
      console.error('AI Analysis error:', error)
      
      // Fallback to basic parsing
      return this.fallbackAnalysis(input)
    }
  }

  private fallbackAnalysis(input: string): AIAnalysisResult {
    const normalized = input.toLowerCase().trim()
    
    // Extract pincode
    const pincodeMatch = normalized.match(/\b(\d{6})\b/)
    const pincode = pincodeMatch ? pincodeMatch[1] : ''
    
    // Extract city
    const cities = ['thane', 'mumbai', 'pune', 'nashik', 'nagpur', 'aurangabad', 'solapur', 'amravati', 
                   'delhi', 'new delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'hyderabad',
                   'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'patna']
    
    let city = ''
    for (const city_name of cities) {
      if (normalized.includes(city_name)) {
        city = city_name
        break
      }
    }
    
    // Extract state
    const states = {
      'maharashtra': 'maharashtra',
      'mh': 'maharashtra',
      'delhi': 'delhi',
      'karnataka': 'karnataka',
      'ka': 'karnataka',
      'tamil nadu': 'tamil nadu',
      'tn': 'tamil nadu',
      'west bengal': 'west bengal',
      'wb': 'west bengal',
      'gujarat': 'gujarat',
      'gj': 'gujarat',
      'rajasthan': 'rajasthan',
      'rj': 'rajasthan'
    }
    
    let state = ''
    for (const [key, value] of Object.entries(states)) {
      if (normalized.includes(key)) {
        state = value
        break
      }
    }
    
    // Extract landmarks
    const landmarkKeywords = ['station', 'stn', 'railway', 'petrol', 'pump', 'temple', 'mandir', 'market', 'bazaar', 
                           'school', 'college', 'hospital', 'office', 'complex', 'tower', 'bridge']
    
    const landmarks: string[] = []
    landmarkKeywords.forEach(keyword => {
      if (normalized.includes(keyword)) {
        landmarks.push(keyword)
      }
    })
    
    // Generate suggestions
    const suggestions: string[] = []
    if (city && pincode) {
      suggestions.push(`${city}, ${state || 'maharashtra'} ${pincode}, India`)
      suggestions.push(`${pincode}, ${city}, India`)
    }
    if (city) {
      suggestions.push(`${city}, ${state || 'maharashtra'}, India`)
    }
    
    const standardized = [city, state, pincode, 'India'].filter(Boolean).join(', ')
    
    return {
      standardizedAddress: standardized || `${input}, India`,
      city,
      state,
      pincode,
      landmarks,
      confidence: city && pincode ? 70 : city ? 50 : 30,
      suggestions
    }
  }
}

export const aiAnalysisService = new AIAnalysisService()

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
  private groq: any = null

  private async initializeGroq() {
    if (this.groq) return this.groq
    
    try {
      console.log('=== DEBUG: Initializing robust Groq SDK ===')
      const { default: Groq } = await import('groq-sdk')
      
      this.groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
        dangerouslyAllowBrowser: true
      })
      
      console.log('=== DEBUG: Robust Groq SDK initialized ===')
      return this.groq
    } catch (error) {
      console.error('=== DEBUG: Failed to initialize Groq SDK ===', error)
      throw error
    }
  }

  async analyzeAddress(input: string): Promise<AIAnalysisResult> {
    try {
      console.log('=== DEBUG: Starting robust AI analysis for:', input)
      
      const groq = await this.initializeGroq()
      
      // Enhanced prompt with better instructions
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian address analysis AI. Your task is to analyze unstructured Indian addresses and extract structured information.

CRITICAL: You must return ONLY a valid JSON object. No explanations, no markdown, no extra text.

JSON Format:
{
  "standardizedAddress": "Clean, properly formatted address with India at the end",
  "city": "city name in lowercase",
  "state": "state name in lowercase", 
  "pincode": "6-digit pincode or empty string",
  "landmarks": ["landmark1", "landmark2"],
  "confidence": 85,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

RULES:
1. Expand ALL Indian abbreviations: opp→opposite, stn→station, rd→road, nr→near, opp→opposite, st→street, rd→road, bldg→building, soc→society, col→colony, nagar→nagar, puram→puram, ganj→ganj, marg→marg, chowk→chowk, sadar→sadar, circle→circle, square→square, garden→garden, park→park, road→road, bridge→bridge, tunnel→tunnel, metro→metro, bus→bus, stand→stand, complex→complex, center→centre, junction→junction, crossing→crossing

2. Normalize state codes: MH→maharashtra, DL→delhi, KA→karnataka, TN→tamil nadu, WB→west bengal, GJ→gujarat, RJ→rajasthan, UP→uttar pradesh, MP→madhya pradesh, HR→haryana, PB→punjab, CH→chandigarh

3. Major cities to recognize: mumbai, delhi, bangalore, bengaluru, pune, chennai, kolkata, hyderabad, ahmedabad, surat, jaipur, lucknow, kanpur, nagpur, indore, thane, bhopal, visakhapatnam, patna, vadodara, agra, nashik, faridabad, meerut, rajkot, kalyan, vasai-virar, aurangabad, dhanbad, amritsar, navi mumbai, allahabad, howrah, gwalior, jabalpur, coimbatore, vijayawada, jodhpur, madurai, raipur, kota, guwahati, chandigarh, hubli-dharwad, srinagar

4. Always include "India" at the end of standardizedAddress

5. Extract 6-digit pincodes (pattern: \\b\\d{6}\\b)

6. Confidence scoring: 90-100 for complete addresses with pincode, 70-89 for city+pincode, 50-69 for city only, 30-49 for partial info

7. Generate 3-4 useful suggestions for geocoding

EXAMPLES:
Input: "opp cst station, mumbai 400001"
Output: {"standardizedAddress": "opposite chhatrapati shivaji terminus station, mumbai, maharashtra 400001, India", "city": "mumbai", "state": "maharashtra", "pincode": "400001", "landmarks": ["cst station", "chhatrapati shivaji terminus"], "confidence": 90, "suggestions": ["mumbai, maharashtra 400001, India", "400001, mumbai, India", "cst station, mumbai, India"]}

Input: "near digha railway station, thane 400607"
Output: {"standardizedAddress": "near digha railway station, thane, maharashtra 400607, India", "city": "thane", "state": "maharashtra", "pincode": "400607", "landmarks": ["digha railway station"], "confidence": 95, "suggestions": ["thane, maharashtra 400607, India", "400607, thane, India", "digha, thane, India"]}`
          },
          {
            role: 'user',
            content: `Analyze this Indian address and return ONLY JSON: "${input}"`
          }
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 0.1,
        max_tokens: 800
      })

      const content = completion.choices[0]?.message?.content
      
      if (!content) {
        throw new Error('No response from AI analysis')
      }

      console.log('=== DEBUG: AI analysis raw response ===', content)
      
      // Clean the response to ensure it's valid JSON
      let cleanContent = content.trim()
      
      // Remove any markdown formatting
      cleanContent = cleanContent.replace(/```json/gi, '').replace(/```/g, '').trim()
      
      // Extract JSON if there's extra text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanContent = jsonMatch[0]
      }
      
      console.log('=== DEBUG: Cleaned JSON content ===', cleanContent)
      
      // Parse JSON response
      const analysis = JSON.parse(cleanContent)
      
      // Validate the response structure
      const validatedAnalysis: AIAnalysisResult = {
        standardizedAddress: analysis.standardizedAddress || `${input}, India`,
        city: analysis.city || '',
        state: analysis.state || '',
        pincode: analysis.pincode || '',
        landmarks: Array.isArray(analysis.landmarks) ? analysis.landmarks : [],
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 50,
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : []
      }
      
      console.log('=== DEBUG: Validated AI analysis ===', validatedAnalysis)
      
      return validatedAnalysis
    } catch (error) {
      console.error('=== DEBUG: AI analysis failed ===', error)
      
      // Fallback to robust basic parsing
      return this.robustFallbackAnalysis(input)
    }
  }

  private robustFallbackAnalysis(input: string): AIAnalysisResult {
    console.log('=== DEBUG: Using robust fallback analysis ===')
    
    const normalized = input.toLowerCase().trim()
    
    // Comprehensive pincode extraction
    const pincodeMatch = normalized.match(/\b(\d{6})\b/)
    const pincode = pincodeMatch ? pincodeMatch[1] : ''
    
    // Comprehensive city extraction
    const cities = [
      'thane', 'mumbai', 'pune', 'nashik', 'nagpur', 'aurangabad', 'solapur', 'amravati', 
      'delhi', 'new delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'hyderabad',
      'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'patna',
      'bhopal', 'visakhapatnam', 'vadodara', 'agra', 'nashik', 'faridabad', 'meerut',
      'rajkot', 'kalyan', 'vasai-virar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai',
      'allahabad', 'howrah', 'gwalior', 'jabalpur', 'coimbatore', 'vijayawada', 'jodhpur',
      'madurai', 'raipur', 'kota', 'guwahati', 'chandigarh', 'hubli-dharwad', 'srinagar'
    ]
    
    let city = ''
    for (const city_name of cities) {
      if (normalized.includes(city_name)) {
        city = city_name
        break
      }
    }
    
    // Comprehensive state extraction
    const states = {
      'maharashtra': 'maharashtra', 'mh': 'maharashtra',
      'delhi': 'delhi', 'dl': 'delhi',
      'karnataka': 'karnataka', 'ka': 'karnataka',
      'tamil nadu': 'tamil nadu', 'tn': 'tamil nadu',
      'west bengal': 'west bengal', 'wb': 'west bengal',
      'gujarat': 'gujarat', 'gj': 'gujarat',
      'rajasthan': 'rajasthan', 'rj': 'rajasthan',
      'uttar pradesh': 'uttar pradesh', 'up': 'uttar pradesh',
      'madhya pradesh': 'madhya pradesh', 'mp': 'madhya pradesh',
      'haryana': 'haryana', 'hr': 'haryana',
      'punjab': 'punjab', 'pb': 'punjab',
      'chandigarh': 'chandigarh', 'ch': 'chandigarh'
    }
    
    let state = ''
    for (const [key, value] of Object.entries(states)) {
      if (normalized.includes(key)) {
        state = value
        break
      }
    }
    
    // Default state based on city if not found
    if (!state && city) {
      const cityStateMap: { [key: string]: string } = {
        'thane': 'maharashtra', 'mumbai': 'maharashtra', 'pune': 'maharashtra',
        'delhi': 'delhi', 'new delhi': 'delhi',
        'bangalore': 'karnataka', 'bengaluru': 'karnataka',
        'chennai': 'tamil nadu',
        'kolkata': 'west bengal',
        'hyderabad': 'telangana',
        'ahmedabad': 'gujarat', 'surat': 'gujarat',
        'jaipur': 'rajasthan',
        'lucknow': 'uttar pradesh', 'kanpur': 'uttar pradesh'
      }
      state = cityStateMap[city] || 'maharashtra'
    }
    
    // Comprehensive landmark extraction
    const landmarkKeywords = [
      'station', 'stn', 'railway', 'petrol', 'pump', 'temple', 'mandir', 'market', 'bazaar', 
      'school', 'college', 'hospital', 'office', 'complex', 'tower', 'bridge', 'tunnel',
      'metro', 'bus', 'stand', 'society', 'colony', 'nagar', 'puram', 'ganj', 'marg',
      'chowk', 'sadar', 'circle', 'square', 'garden', 'park', 'road', 'bridge', 'junction',
      'crossing', 'centre', 'center', 'cst', 'victoria terminus', 'chatrapati shivaji terminus'
    ]
    
    const landmarks: string[] = []
    landmarkKeywords.forEach(keyword => {
      if (normalized.includes(keyword)) {
        landmarks.push(keyword)
      }
    })
    
    // Generate smart suggestions
    const suggestions: string[] = []
    if (city && pincode) {
      suggestions.push(`${city}, ${state} ${pincode}, India`)
      suggestions.push(`${pincode}, ${city}, India`)
      suggestions.push(`${city}, ${state}, India`)
    } else if (city) {
      suggestions.push(`${city}, ${state}, India`)
      suggestions.push(`${city}, India`)
    } else if (pincode) {
      suggestions.push(`Pincode ${pincode}, India`)
    }
    
    // Add generic suggestions
    suggestions.push('Try: "Near [Landmark], [City], [Pincode], India"')
    suggestions.push('Try: "[Building Name], [Road], [City], India"')
    
    const standardized = [city, state, pincode, 'India'].filter(Boolean).join(', ')
    
    // Calculate confidence based on available information
    let confidence = 30
    if (city && pincode) confidence = 85
    else if (city) confidence = 60
    else if (pincode) confidence = 40
    
    return {
      standardizedAddress: standardized || `${input}, India`,
      city,
      state,
      pincode,
      landmarks,
      confidence,
      suggestions: suggestions.slice(0, 4)
    }
  }
}

export const aiAnalysisService = new AIAnalysisService()

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { MapPin, CheckCircle, FileText, Copy, Check, Search, Globe, Code, Database, Navigation, Target, MousePointer2 } from 'lucide-react'
import { useToast, toast } from '../ui/toast'
import { Map, type MapMarker } from '../ui/map'
import { useAuthWorking } from '../../hooks/useAuthWorking'
import { addressService } from '../../services/addresses'
import { VoiceInput } from '../VoiceInput'

interface BackendResponse {
  original_text: string
  translated_text: string
  parsing_result: {
    cities: string[]
    landmarks: string[]
    directional_cues: string[]
    original: string
    ai_corrected_address?: string
  }
  geocoding_result: {
    lat: string
    lon: string
    display_name: string
    confidence_score: number
  } | null
  attempts_log: Array<{
    stage: string
    query: string
    success: boolean
    result: any
  }>
}

export const AddressAnalysis: React.FC = () => {

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BackendResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [refinedCoords, setRefinedCoords] = useState<{ lat: number, lng: number } | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Reset/Sync refined coords when a new result comes in
  React.useEffect(() => {
    if (result?.geocoding_result) {
      setRefinedCoords({
        lat: parseFloat(result.geocoding_result.lat),
        lng: parseFloat(result.geocoding_result.lon)
      })
      setIsConfirmed(false)
    }
  }, [result])

  const { addToast } = useToast()
  const { isAuthenticated, user } = useAuthWorking()

  const handleAnalyze = async () => {
    if (!input.trim()) {
      addToast(toast.error('Error', 'Please enter an address to analyze'))
      return
    }

    setLoading(true)
    setResult(null)
    setShowMap(false)

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: input }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data: BackendResponse = await response.json()
      console.log('Backend Response:', data)
      setResult(data)
      setShowMap(true)

      if (data.geocoding_result) {
        addToast(toast.success('Analysis Complete', 'Address successfully processed'))
      } else {
        addToast(toast.warning('Location Not Found', 'Could not determine precise coordinates'))
      }

    } catch (error) {
      console.error('Analysis error:', error)
      addToast(toast.error('Analysis Failed', 'Could not connect to analysis server'))
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (result?.geocoding_result) {
      try {
        await navigator.clipboard.writeText(result.geocoding_result.display_name)
        setCopied(true)
        addToast(toast.success('Copied', 'Address copied to clipboard'))
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        addToast(toast.error('Copy Failed', 'Failed to copy address to clipboard'))
      }
    }
  }

  const handleSaveToDatabase = async () => {
    if (!result?.geocoding_result || !isAuthenticated || !user) {
      if (!isAuthenticated) {
        addToast(toast.error('Authentication Required', 'Please sign in to save addresses'))
      }
      return
    }

    try {
      await addressService.saveVerifiedAddress({
        user_id: user.id,
        original_address: result.original_text,
        standardized_address: result.geocoding_result.display_name,
        latitude: parseFloat(result.geocoding_result.lat),
        longitude: parseFloat(result.geocoding_result.lon),
        confidence: Math.round(result.geocoding_result.confidence_score * 100),
        address_type: 'mixed',
        landmarks: result.parsing_result.landmarks,
        tags: ['backend-verified'],
        status: 'verified'
      })
      addToast(toast.success('Saved', 'Address saved to your account'))
    } catch (error) {
      console.error(error)
      addToast(toast.error('Save Failed', 'Failed to save address'))
    }
  }

  const handleMarkerDragEnd = (markerId: string, lat: number, lng: number) => {
    if (!isConfirmed) {
      setRefinedCoords({ lat, lng })
      addToast(toast.success('Location Updated', 'Confirm this pin if it looks correct.'))
    }
  }

  const handleGetDirections = () => {
    // 1. Validation
    if (!refinedCoords) return;

    // 2. Browser Support Check
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    // 3. Fetch Live Location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const destLat = refinedCoords.lat;
        const destLng = refinedCoords.lng;

        // 4. Construct Universal Link
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;

        // 5. Execute
        window.open(url, '_blank');
      },
      (error) => {
        // Error Handling
        console.error("Error getting location:", error);
        addToast(toast.error("Location Error", "Unable to retrieve your location. Please check browser permissions."));
      }
    );
  };

  const mapMarkers: MapMarker[] = (result?.geocoding_result && refinedCoords) ? [{
    id: 'result',
    lat: refinedCoords.lat,
    lng: refinedCoords.lng,
    title: 'Analyzed Location',
    description: result.parsing_result.ai_corrected_address || result.geocoding_result.display_name,
    type: 'address',
    color: isConfirmed ? '#3B82F6' : '#10B981',
    draggable: !isConfirmed
  }] : []

  const exampleAddresses = [
    { text: "Near the big tree, after the chai shop, first lane from main road", type: "Urban Example" },
    { text: "दीघा रेलवे स्टेशन के पास दीघा गांव नवी मुंबई", type: "Hindi Example" }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Backend Address Analysis</h2>
        <p className="text-gray-600">Full-stack pipeline: Translation → NLP Parsing → Multi-stage Geocoding</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 h-fit"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Address Input</h3>
                <p className="text-xs text-slate-400">Voice or Text (Hindi/English)</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">

            {/* Voice Input Section */}
            <VoiceInput
              onTranscriptChange={(text) => setInput(text)}
            />

            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter address here (e.g. Hindi or English)..."
                className="w-full h-32 p-4 border-2 border-dashed border-slate-200 rounded-xl resize-none focus:border-indigo-500 focus:outline-none transition-colors text-slate-700 placeholder-slate-400"
                maxLength={500}
              />
              <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                {input.length}/500 chars
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Try examples:</p>
              <div className="flex flex-wrap gap-2">
                {exampleAddresses.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(example.text)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 rounded-lg text-sm transition-colors"
                  >
                    {example.type}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Pipeline...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Analysis
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Running Python Backend...</p>
              <div className="flex gap-4 mt-6 text-xs text-slate-400">
                <span className="animate-pulse"> Translating...</span>
                <span className="animate-pulse delay-100"> Parsing (NLTK)...</span>
                <span className="animate-pulse delay-200"> Geocoding...</span>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && !loading && (
            <div className="space-y-4">

              {/* 0. Smart AI Correction Layer */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200 text-white overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Smart AI Normalization</h3>
                    <p className="text-xs text-indigo-100 opacity-90">Predicts & Corrects using Spatial Intelligence</p>
                  </div>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-8 relative">
                  {/* Visual Arrow */}
                  <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="bg-white text-indigo-600 p-2 rounded-full shadow-lg">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Input (Unstructured)</span>
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                      <p className="text-sm font-medium leading-relaxed">{result.translated_text || result.original_text}</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">Ambiguous</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Raw Text</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">AI Corrected & Verified Address</span>
                    <div className="bg-white text-slate-800 rounded-lg p-3 shadow-sm border-l-4 border-emerald-500">
                      <p className="text-sm font-bold leading-relaxed">
                        {result.parsing_result.ai_corrected_address || result.geocoding_result?.display_name || "Location not found"}
                      </p>
                      {/* Show geocoded locality below if it differs significantly, or just trusting the pin */}
                      {result.geocoding_result?.display_name && result.geocoding_result.display_name !== result.parsing_result.ai_corrected_address && (
                        <p className="text-xs text-slate-500 mt-1 border-t pt-1">
                          📍 {result.geocoding_result.display_name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-emerald-400 text-emerald-900 font-bold px-2 py-0.5 rounded shadow-sm">Verified</span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Complete Format</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Translation Layer */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase">Translation Layer</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="grid grid-cols-[100px_1fr] gap-4 text-sm">
                    <span className="text-slate-400">Original:</span>
                    <span className="text-slate-800 font-medium">{result.original_text}</span>
                    <span className="text-slate-400">Translated:</span>
                    <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded w-fit">
                      {result.translated_text}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Parsing Layer */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase">NLP Parsing Layer</span>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {result.parsing_result.landmarks.map((l, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
                        📍 Landmark: {l}
                      </span>
                    ))}
                    {result.parsing_result.cities.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                        🏙️ City: {c}
                      </span>
                    ))}
                    {result.parsing_result.directional_cues.map((d, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium border border-amber-200">
                        ↗️ Cue: {d}
                      </span>
                    ))}
                    {result.parsing_result.landmarks.length === 0 && result.parsing_result.cities.length === 0 && (
                      <span className="text-slate-400 text-sm italic">No specific entities extracted</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Geocoding Layer */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase">Geocoding Waterfall</span>
                  </div>
                  {result.geocoding_result && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Confidence:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${result.geocoding_result.confidence_score >= 0.8
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                        }`}>
                        {(result.geocoding_result.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {result.attempts_log.map((attempt, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${attempt.success ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {attempt.success ? <Check className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-700">{attempt.stage}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${attempt.success ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {attempt.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5 font-mono">Query: "{attempt.query}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </motion.div >

        {/* Map Panel (Full Width) */}
        {
          showMap && result?.geocoding_result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Precise GPS Coordinates</h3>
                    <p className="text-sm font-medium text-emerald-700">
                      {result.parsing_result.ai_corrected_address || result.geocoding_result.display_name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Copy
                  </button>

                  {!isConfirmed ? (
                    <button
                      onClick={() => setIsConfirmed(true)}
                      className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Exact Location
                    </button>
                  ) : (
                    <button
                      onClick={handleGetDirections}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 animate-pulse"
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </button>
                  )}

                  {isAuthenticated && (
                    <button
                      onClick={handleSaveToDatabase}
                      className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" />
                      Save
                    </button>
                  )}
                </div>
              </div>
              <div className="h-96 rounded-xl overflow-hidden border border-slate-200 relative group">
                {!isConfirmed && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-200 text-xs font-bold flex items-center gap-2 pointer-events-none">
                    <MousePointer2 className="w-4 h-4 text-teal-600" />
                    Drag pin to adjust location
                  </div>
                )}
                <Map
                  center={refinedCoords ? [refinedCoords.lat, refinedCoords.lng] : [parseFloat(result.geocoding_result.lat), parseFloat(result.geocoding_result.lon)]}
                  zoom={16}
                  markers={mapMarkers}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  height="100%"
                />
              </div>
            </motion.div>
          )
        }
      </div >
    </div >
  )
}

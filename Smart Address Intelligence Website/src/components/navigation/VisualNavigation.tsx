import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Camera, MapPin, Navigation, Car, Bike, Train, Footprints, Mic, Volume2, Search, ArrowRight } from 'lucide-react'
import { useToast, toast } from '../ui/toast'
import { Map } from '../ui/map'
import L from 'leaflet'
import 'leaflet-routing-machine'
import { SpeechManager } from '../../utils/SpeechManager'

interface VisualNavigationProps {
    // Props if needed
}

export const VisualNavigation: React.FC<VisualNavigationProps> = () => {
    const [image, setImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)

    const [startLocation, setStartLocation] = useState<{ lat: number, lon: number, name: string } | null>(null)
    const [destination, setDestination] = useState('')
    const [destinationCoords, setDestinationCoords] = useState<{ lat: number, lon: number } | null>(null)

    const [mode, setMode] = useState<'car' | 'bike' | 'train' | 'walk'>('bike')
    const [language, setLanguage] = useState('en')
    const [voiceEnabled, setVoiceEnabled] = useState(true)
    const [navigating, setNavigating] = useState(false)
    const [routeInstructions, setRouteInstructions] = useState<any[]>([])
    const [eta, setEta] = useState<string>('')
    const [tripDistance, setTripDistance] = useState<string>('')
    const watchIdRef = React.useRef<number | null>(null)

    // Ref to prevent repetitive voice announcements
    const lastSpokenRef = React.useRef('')

    const { addToast } = useToast()

    // 1. Auto-fetch Browser Location on Mount
    // 1. Auto-fetch & Watch Browser Location
    useEffect(() => {
        if ('geolocation' in navigator) {
            // 1. FAST FIX (Low Accuracy) - Gets rough location almost instantly (WiFi/Cell)
            navigator.geolocation.getCurrentPosition(
                updatePosition,
                (err) => console.log("Fast fix failed, waiting for GPS...", err),
                { enableHighAccuracy: false, timeout: 2000, maximumAge: Infinity }
            );

            // 2. PRECISE FIX (High Accuracy) - Starts warming up GPS
            navigator.geolocation.getCurrentPosition(updatePosition, handleLocError, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });

            // Continuous watch
            watchIdRef.current = navigator.geolocation.watchPosition(
                updatePosition,
                handleLocError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 10000,
                    timeout: 30000
                }
            )
        }

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
        }
    }, [])

    // Haversine distance helper (meters)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3 // metres
        const φ1 = lat1 * Math.PI / 180
        const φ2 = lat2 * Math.PI / 180
        const Δφ = (lat2 - lat1) * Math.PI / 180
        const Δλ = (lon2 - lon1) * Math.PI / 180

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        return R * c
    }

    const [locationError, setLocationError] = useState<string | null>(null)

    const updatePosition = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords

        setLocationError(null) // Clear error on success

        // Filter out small movements (< 10m) to prevent jittery rerouting
        // unless we don't have a start location yet
        setStartLocation(prev => {
            if (prev) {
                // Only filter if we have a valid previous location
                const dist = calculateDistance(prev.lat, prev.lon, latitude, longitude)
                if (dist < 5) return prev // Lowered threshold for faster updates (5m)
            }

            return {
                lat: latitude,
                lon: longitude,
                name: prev?.name?.includes('Browser') || !prev ? 'Current Location (Live)' : prev.name
            }
        })
    }

    const handleLocError = (err: GeolocationPositionError) => {
        console.warn("Location watch error", err)
        if (!startLocation) {
            let msg = "Could not fetch location."
            if (err.code === 1) msg = "Location permission denied. Please allow access."
            if (err.code === 2) msg = "Location unavailable. Check GPS."
            if (err.code === 3) msg = "Location request timed out."
            setLocationError(msg)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImage(file)
            setPreviewUrl(URL.createObjectURL(file))
            analyzeImage(file)
        }
    }

    const analyzeImage = async (file: File) => {
        setAnalyzing(true)
        const formData = new FormData()
        formData.append('image', file)

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/analyze-image`, {
                method: 'POST',
                body: formData
            })
            const data = await response.json()

            if (data.location) {
                setStartLocation({
                    lat: parseFloat(data.location.lat),
                    lon: parseFloat(data.location.lon),
                    name: data.location.display_name
                })
                addToast(toast.success('Location Found', data.source === 'gps_exif' ? 'Precise GPS from Photo' : 'Visual AI Location Matching'))
            } else {
                addToast(toast.error('Location Failed', 'Could not identify location from image.'))
            }
        } catch (error) {
            console.error(error)
            addToast(toast.error('Error', 'Failed to connect to vision server'))
        } finally {
            setAnalyzing(false)
        }
    }

    const handleDestinationSearch = async () => {
        if (!destination) return
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${destination}`)
            const data = await res.json()
            if (data && data[0]) {
                setDestinationCoords({
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                })
                setNavigating(true)
                const text = `Starting navigation to ${destination} by ${mode}`
                speakDirections(text)
            }
        } catch (e) {
            addToast(toast.error('Error', 'Could not find destination'))
        }
    }

    const speakDirections = async (text: string) => {
        console.log("📢 Speaking:", text, "Voice:", voiceEnabled ? "ON" : "OFF")
        if (!voiceEnabled) return

        let textToSpeak = text
        let langCode = 'en-US' // Default

        if (language === 'hi') {
            langCode = 'hi-IN'
        } else if (language === 'mr') {
            langCode = 'mr-IN'
        } else if (language === 'en') {
            langCode = 'en-IN' // Use Indian English if available
        }

        // Translate if not English
        if (language !== 'en') {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${baseUrl}/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, target_lang: language })
                })
                const data = await res.json()
                if (data.translated_text) {
                    textToSpeak = data.translated_text
                }
            } catch (e) {
                console.warn("Translation failed, falling back to English text but strict accent.")
            }
        }

        // Use Robust SpeechManager
        SpeechManager.getInstance().speak(textToSpeak, langCode)
    }

    // Memoize routing config to prevent infinite re-render loops
    const routingConfig = React.useMemo(() => {
        if (startLocation && destinationCoords) {
            return {
                start: [startLocation.lat, startLocation.lon] as [number, number],
                end: [destinationCoords.lat, destinationCoords.lon] as [number, number],
                profile: mode as 'car' | 'bike' | 'walk' | 'train'
            }
        }
        return undefined
    }, [startLocation, destinationCoords, mode])

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Navigation className="text-indigo-600" />
                        Navigation Assistant
                    </h2>
                    {/* Language Selector */}
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="p-2 border rounded-lg text-sm bg-slate-50"
                    >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="mr">Marathi (मराठी)</option>
                    </select>
                </div>

                {/* 1. Location Status (Showing Browser Location or Image) */}
                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Start Point</span>

                        <label className="block text-sm font-medium text-slate-700">Start Point</label>
                        {/* Optional Image Override */}
                        <label className="text-xs text-indigo-600 cursor-pointer font-medium hover:underline flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {startLocation?.name?.includes('Browser') ? 'Change via Photo' : 'Update Photo'}
                            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                        <MapPin className="w-5 h-5 text-indigo-500" />
                        {locationError ? (
                            <div className="flex items-center justify-between w-full">
                                <span className="text-red-500 text-sm font-medium">{locationError}</span>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : startLocation ? (
                            <span className="font-medium text-slate-900">{startLocation.name}</span>
                        ) : (
                            <span className="animate-pulse">Fetching current location...</span>
                        )}
                    </div>
                </div>

                {/* 2. Navigation Controls */}
                <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        {[
                            { id: 'bike', icon: Bike, label: 'Bike' },
                            { id: 'car', icon: Car, label: 'Car' },
                            { id: 'train', icon: Train, label: 'Train' },
                            { id: 'walk', icon: Footprints, label: 'Walk' },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id as any)}
                                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-md text-xs font-medium transition-all ${mode === m.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                <m.icon className="w-4 h-4 mb-1" />
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Where to go?"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        </div>
                        <button
                            onClick={handleDestinationSearch}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <Navigation className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Map View */}
            {(startLocation || destinationCoords) && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[500px] border border-slate-100 relative flex flex-col">
                    <div className="flex-1 relative">
                        <Map
                            center={startLocation ? [startLocation.lat, startLocation.lon] : [19.0760, 72.8777]}
                            zoom={14}
                            markers={[
                                ...(startLocation ? [{
                                    id: 'start',
                                    lat: startLocation.lat,
                                    lng: startLocation.lon,
                                    title: 'Start',
                                    color: '#10B981', // Emerald
                                    type: 'user' as const
                                }] : []),
                                ...(destinationCoords ? [{
                                    id: 'end',
                                    lat: destinationCoords.lat,
                                    lng: destinationCoords.lon,
                                    title: 'Destination',
                                    color: '#6366F1', // Indigo
                                    type: 'address' as const
                                }] : [])
                            ]}
                            height="100%"
                            routing={routingConfig}
                            onRouteError={(err) => {
                                console.error("Navigation Error:", err)
                                // Toast removed as per user request
                            }}
                            onRouteFound={(route) => {
                                setRouteInstructions(route.instructions || [])

                                // Update Metrics
                                const distM = route.summary.totalDistance
                                const timeS = route.summary.totalTime

                                setTripDistance(distM > 1000 ? `${(distM / 1000).toFixed(1)} km` : `${Math.round(distM)} m`)
                                setEta(timeS > 3600
                                    ? `${Math.floor(timeS / 3600)} hr ${Math.round((timeS % 3600) / 60)} min`
                                    : `${Math.round(timeS / 60)} min`
                                )

                                // === ARRIVAL DETECTION ===
                                if (distM < 20) {
                                    if (navigating && lastSpokenRef.current !== 'arrived') {
                                        SpeechManager.getInstance().cancel()
                                        speakDirections("You have arrived at your destination.")
                                        lastSpokenRef.current = 'arrived'
                                        // Do NOT stop navigation automatically
                                    }
                                }

                                if (navigating && voiceEnabled && route.instructions && route.instructions.length > 0) {
                                    const nextInstruction = route.instructions[0]
                                    const displayText = nextInstruction.text

                                    // === VOICE LOGIC ===
                                    // User wants "ALL directions spoken" and "keep voice on".
                                    // We speak whenever the instruction TEXT changes or if we are very close to the NEXT turn.

                                    if (lastSpokenRef.current !== displayText) {
                                        SpeechManager.getInstance().cancel()
                                        lastSpokenRef.current = displayText

                                        // Contextualize
                                        const dist = Math.round(nextInstruction.distance)
                                        const spokenText = `In ${dist} meters, ${displayText}`

                                        speakDirections(spokenText)
                                    }
                                }
                            }}
                        />
                        {navigating && (
                            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
                                {/* Navigation Header */}
                                <div className="bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border-l-4 border-indigo-500 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Navigating to</p>
                                        <p className="text-lg font-bold text-indigo-900 truncate">{destination || 'Destination'}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-800">{eta}</p>
                                            <p className="text-xs font-bold text-slate-500">{tripDistance}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                console.log("Toggling voice:", !voiceEnabled)
                                                setVoiceEnabled(!voiceEnabled)
                                            }}
                                            className={`p-3 rounded-full shadow-sm border transition-colors ${voiceEnabled ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                        >
                                            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Current Instruction */}
                                {routeInstructions.length > 0 && (
                                    <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg flex items-center gap-4 animate-in slide-in-from-top-2">
                                        <ArrowRight className="w-8 h-8 flex-shrink-0" />
                                        <div>
                                            <p className="text-lg font-bold leading-tight">{routeInstructions[0].text}</p>
                                            <p className="text-indigo-200 text-sm">{Math.round(routeInstructions[0].distance)}m ahead</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Instructions Panel (In-depth Navigation) */}
                    {navigating && routeInstructions.length > 0 && (
                        <div className="h-48 overflow-y-auto bg-slate-50 border-t border-slate-200 p-4">
                            <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase">Directions</h3>
                            <div className="space-y-3">
                                {routeInstructions.map((inst, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-slate-700 border-b border-slate-200 pb-2 last:border-0 hover:bg-white p-2 rounded transition-colors cursor-pointer"
                                        onClick={() => speakDirections(inst.text)}>
                                        <span className="font-bold text-slate-400">{i + 1}.</span>
                                        <div className="flex-1">
                                            <p>{inst.text}</p>
                                            <p className="text-xs text-slate-400">{Math.round(inst.distance)}m</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

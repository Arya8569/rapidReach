import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, CheckCircle, AlertTriangle, RefreshCw, Navigation, FileText, Activity, Layers, Copy, Check } from 'lucide-react';
import { geocodingService, type StandardizedAddress } from '../../services/geocoding';
import { useToast, toast } from '../../components/ui/toast';
import { MapSkeleton } from '../../components/ui/skeleton';
import { Map, type MapMarker } from '../../components/ui/map';
import { useAuth } from '../../hooks/useAuth';

export const DemoSection = () => {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StandardizedAddress | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleAnalyze = async () => {
    if (!input.trim()) {
      addToast(toast.error('Error', 'Please enter an address to analyze'));
      return;
    }
    
    setLoading(true);
    setResult(null);
    setShowMap(false);
    
    try {
      const geocoded = await geocodingService.geocode(input);
      setResult(geocoded);
      setShowMap(true);
      
      addToast(toast.success(
        'Address Analyzed',
        `Successfully processed with ${geocoded.confidence}% confidence`
      ));
    } catch (error) {
      console.error('Geocoding error:', error);
      addToast(toast.error(
        'Analysis Failed',
        error instanceof Error ? error.message : 'Failed to analyze address'
      ));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.standardized);
        setCopied(true);
        addToast(toast.success('Copied', 'Address copied to clipboard'));
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        addToast(toast.error('Copy Failed', 'Failed to copy address to clipboard'));
      }
    }
  };

  const handleSaveToDatabase = async () => {
    if (!result || !isAuthenticated) {
      if (!isAuthenticated) {
        addToast(toast.error('Authentication Required', 'Please sign in to save addresses'));
      }
      return;
    }

    try {
      // Import here to avoid circular dependency
      const { addressService } = await import('../../services/addresses');
      const auth = await import('../../hooks/useAuth');
      const { currentUser } = auth.useAuth();
      
      if (currentUser) {
        await addressService.createAddress(currentUser.id, result.original);
        addToast(toast.success('Saved', 'Address saved to your account'));
      }
    } catch (error) {
      addToast(toast.error('Save Failed', 'Failed to save address'));
    }
  };

  const mapMarkers: MapMarker[] = result ? [{
    id: 'result',
    lat: result.latitude,
    lng: result.longitude,
    title: 'Analyzed Location',
    description: result.standardized,
    type: 'address',
    color: '#10B981'
  }] : [];

  return (
    <section id="demo" className="py-20 md:py-32 bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/50 to-transparent -z-10"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-4">
             Interactive Demo
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
            Experience Intelligent Resolution
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Try our model with informal, unstructured address text in multiple languages.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto items-start">
          {/* Input Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100 h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Raw Input</h3>
                  <p className="text-xs text-slate-400">Paste any unstructured address</p>
                </div>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 bg-slate-50 focus:border-indigo-500 outline-none"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="regional">Regional (Mixed)</option>
              </select>
            </div>

            <div className="flex-1 space-y-6">
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. Near the big tree, after the chai shop, first lane from main road..."
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-h-[220px] resize-none bg-slate-50/50 text-slate-700 placeholder:text-slate-400 text-lg leading-relaxed"
                />
                <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                   {input.length} chars
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                <span className="font-medium text-slate-400">Try:</span>
                <button onClick={() => setInput("Near Sharma Sweet House, Opp Metro Pillar 143, MG Road")} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  Urban Example
                </button>
                <button onClick={() => setInput("Peeche wala gali, mandir ke paas, white gate")} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  Hindi Example
                </button>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !input.trim()}
                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all transform active:scale-[0.99]
                  ${loading || !input.trim() 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300'
                  }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing Request...
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Analyze Address
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Output Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100 min-h-[480px] flex flex-col relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">AI Analysis</h3>
                  <p className="text-xs text-slate-400">Structured Output Data</p>
                </div>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Live
                   </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 m-4">
                <Layers className="w-16 h-16 mb-4 opacity-40" />
                <p className="font-medium text-slate-400">Waiting for input...</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-indigo-500 animate-pulse" />
                  </div>
                </div>
                <div className="w-full space-y-3 max-w-xs">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite] w-1/2"></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tokenizing...</span>
                    <span>Geocoding...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Results State */}
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 relative z-10"
              >
                {/* Confidence Card */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="text-sm font-medium text-slate-500 block mb-1">Confidence Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-slate-900">{result.confidence}%</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase tracking-wider">High</span>
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-500 opacity-20" />
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>

                {/* Address Result */}
                <div className="relative group">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Standardized Output</label>
                  <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-900 font-medium leading-relaxed shadow-sm group-hover:border-indigo-200 transition-colors">
                    {result.standardized}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-8 right-3 p-2 text-indigo-400 hover:text-indigo-600 bg-white rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Geocoordinates</label>
                    <div className="font-mono text-sm text-slate-700 font-semibold tracking-tight">
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Type</label>
                    <div className="text-sm text-slate-700 font-semibold">
                      {result.type}
                    </div>
                  </div>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {result.landmarks.map((l: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">
                      📍 {l}
                    </span>
                  ))}
                  {result.tags.map((t: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                  {isAuthenticated && (
                    <button 
                      onClick={handleSaveToDatabase}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Save to Account
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Map Panel */}
          {showMap && result && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Location Map</h3>
                    <p className="text-xs text-slate-400">Interactive OpenStreetMap</p>
                  </div>
                </div>
              </div>
              <div className="h-96 rounded-lg overflow-hidden">
                <Map 
                  center={[result.latitude, result.longitude]}
                  zoom={16}
                  markers={mapMarkers}
                  height="100%"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

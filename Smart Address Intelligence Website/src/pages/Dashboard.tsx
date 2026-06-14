import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Chatbot } from '../components/chat/Chatbot'
import { AnimatePresence } from 'motion/react'
import { Bot, MapPin, Search, Plus, TrendingUp, Clock, CheckCircle, AlertCircle, LogOut } from 'lucide-react'
import { useAuthWorking } from '../hooks/useAuthWorking'
import { useToast, toast } from '../components/ui/toast'
import { Map, type MapMarker } from '../components/ui/map'
import { TableSkeleton } from '../components/ui/skeleton'
import { addressService, type Address } from '../services/addresses'
import { servicesService, type ServiceWithDistance } from '../services/services'
import { AddressAnalysis } from '../components/dashboard/AddressAnalysis'
import { VisualNavigation } from '../components/navigation/VisualNavigation'

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuthWorking()
  const { addToast } = useToast()

  console.log('=== DASHBOARD RENDER ===')
  console.log('Auth state in Dashboard:', {
    isAuthenticated,
    authLoading,
    userEmail: user?.email,
    userName: user?.name
  })
  console.log('=== END DASHBOARD RENDER ===')

  const [addresses, setAddresses] = useState<Address[]>([])
  const [nearbyServices, setNearbyServices] = useState<ServiceWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  })
  const [activeTab, setActiveTab] = useState<'analysis' | 'navigation' | 'chatbot'>('analysis')

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const loadData = async () => {
      try {
        setLoading(true)

        // Load user addresses
        const userAddresses = await addressService.getUserAddresses(user.id)
        setAddresses(userAddresses)

        // Load statistics
        const addressStats = await addressService.getAddressStatistics(user.id)
        setStats(addressStats)

        // Load nearby services for first address
        if (userAddresses.length > 0) {
          const firstAddress = userAddresses[0]
          setSelectedAddress(firstAddress)

          const services = await servicesService.getServicesNearLocation(
            firstAddress.latitude,
            firstAddress.longitude,
            5 // 5km radius
          )
          setNearbyServices(services)
          setShowMap(true)
        }
      } catch (error) {
        addToast(toast.error('Error', 'Failed to load dashboard data'))
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Subscribe to real-time updates
    const subscription = addressService.subscribeToUserAddresses(user.id, () => {
      loadData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isAuthenticated, user, addToast])

  const handleLogout = async () => {
    try {
      await signOut()
      addToast(toast.success('Logged Out', 'You have been successfully logged out'))
    } catch (error) {
      addToast(toast.error('Logout Error', 'Failed to log out'))
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return

    try {
      const results = await addressService.searchAddresses(searchQuery, user.id)
      setAddresses(results)
    } catch (error) {
      addToast(toast.error('Search Error', 'Failed to search addresses'))
    }
  }

  const handleCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      addToast(toast.error('Error', 'Geolocation is not supported by your browser'))
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Reverse geocode using Nominatim to get address details
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()

          if (!data || !user) throw new Error('Could not fetch address details')

          // Create new address entry
          await addressService.saveVerifiedAddress({
            user_id: user.id,
            original_address: 'Current Location',
            standardized_address: data.display_name,
            latitude: parseFloat(data.lat),
            longitude: parseFloat(data.lon),
            confidence: 100, // High confidence as it's GPS
            address_type: 'mixed',
            landmarks: [],
            tags: ['browser-location'],
            status: 'verified'
          })

          addToast(toast.success('Success', 'Current location added successfully'))

        } catch (error) {
          addToast(toast.error('Error', 'Failed to save current location'))
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        addToast(toast.error('Location Error', error.message))
      }
    )
  }

  const handleAddressSelect = async (address: Address) => {
    setSelectedAddress(address)

    try {
      const services = await servicesService.getServicesNearLocation(
        address.latitude,
        address.longitude,
        5
      )
      setNearbyServices(services)
      setShowMap(true)
    } catch (error) {
      addToast(toast.error('Error', 'Failed to load nearby services'))
    }
  }

  const mapMarkers: MapMarker[] = [
    ...(selectedAddress ? [{
      id: selectedAddress.id,
      lat: selectedAddress.latitude,
      lng: selectedAddress.longitude,
      title: 'Your Address',
      description: selectedAddress.standardized_address,
      type: 'address' as const,
      color: '#10B981'
    }] : []),
    ...nearbyServices.map(service => ({
      id: service.id,
      lat: service.latitude,
      lng: service.longitude,
      title: service.name,
      description: service.description,
      type: 'service' as const,
      color: '#3B82F6'
    }))
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search addresses..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <button
                onClick={handleCurrentLocation}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Address
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Addresses', value: stats.total, icon: MapPin, color: 'bg-blue-500' },
            { label: 'Verified', value: stats.verified, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500' },
            { label: 'Rejected', value: stats.rejected, icon: AlertCircle, color: 'bg-red-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-gray-200 w-fit shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analysis'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <div className="p-1 bg-indigo-100 rounded text-indigo-600">
              <Search className="w-3 h-3" />
            </div>
            Address Intelligence
          </button>
          <button
            onClick={() => setActiveTab('navigation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'navigation'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <div className="p-1 bg-emerald-100 rounded text-emerald-600">
              <MapPin className="w-3 h-3" />
            </div>
            Audio Navigation
          </button>
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'chatbot'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <div className="p-1 bg-purple-100 rounded text-purple-600">
              <Bot className="w-3 h-3" />
            </div>
            AI Assistant
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'analysis' ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Address Analysis Section */}
              <AddressAnalysis />

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Addresses List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Your Addresses</h2>
                  </div>
                  <div className="p-6">
                    {loading ? (
                      <TableSkeleton rows={5} />
                    ) : addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No addresses found</p>
                        <button
                          onClick={handleCurrentLocation}
                          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            onClick={() => handleAddressSelect(address)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress?.id === address.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{address.standardized_address}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {address.confidence}% confidence
                                  </span>
                                  <span className="capitalize">{address.address_type}</span>
                                </div>
                              </div>
                              <div className={`px-2 py-1 text-xs font-medium rounded-full ${address.status === 'verified' ? 'bg-green-100 text-green-700' :
                                address.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {address.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Map and Services */}
                <div className="space-y-8">
                  {/* Map */}
                  {showMap && selectedAddress && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Location Map</h2>
                      </div>
                      <div className="p-6">
                        <div className="h-96 rounded-lg overflow-hidden">
                          <Map
                            center={[selectedAddress.latitude, selectedAddress.longitude]}
                            zoom={14}
                            markers={mapMarkers}
                            height="100%"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nearby Services */}
                  {nearbyServices.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Nearby Services</h2>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {nearbyServices.slice(0, 5).map((service) => (
                            <div key={service.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{service.name}</p>
                                <p className="text-sm text-gray-600">{service.category}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {service.distance_km?.toFixed(1)} km away
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-yellow-600">
                                  ⭐ {service.rating}
                                </div>
                                {service.verified && (
                                  <div className="text-xs text-green-600 font-medium">Verified</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'navigation' ? (
            <motion.div
              key="navigation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <VisualNavigation />
            </motion.div>
          ) : (
            <motion.div
              key="chatbot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <Chatbot />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

import React from 'react'
import { useAuthWorking } from '../hooks/useAuthWorking'

export default function AppTestAuth() {
  const { user, isAuthenticated, loading, error } = useAuthWorking()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-800 font-mono text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">RapidReach</h1>
        <p className="text-lg text-gray-600 mb-4">Smart Address Intelligence Platform</p>
        
        <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
          <p className="text-green-800">✅ Authentication working!</p>
          <p className="text-green-600 text-sm mt-2">
            Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </p>
          {user && (
            <p className="text-green-600 text-sm mt-1">
              User: {user.email}
            </p>
          )}
        </div>

        {!isAuthenticated && (
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800">Please sign in to access the dashboard</p>
          </div>
        )}
      </div>
    </div>
  )
}

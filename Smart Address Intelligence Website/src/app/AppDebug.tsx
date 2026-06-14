import React from 'react'

export default function AppDebug() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">RapidReach Debug</h1>
        <p className="text-lg text-gray-600 mb-8">Testing if React is working...</p>
        <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
          <p className="text-green-800">✅ React is working!</p>
          <p className="text-green-600 text-sm mt-2">Environment variables loaded: {import.meta.env.VITE_SUPABASE_URL ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  )
}

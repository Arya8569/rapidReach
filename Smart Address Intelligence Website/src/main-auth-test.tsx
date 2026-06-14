import { createRoot } from "react-dom/client";
import "./styles/index.css";

console.log('=== DEBUG: Auth test starting ===')

// Test auth hook import
try {
  const { useAuthWorking } = await import('./hooks/useAuthWorking')
  console.log('=== DEBUG: useAuthWorking imported successfully ===')
  
  const AuthTest = () => {
    console.log('=== DEBUG: AuthTest component rendering ===')
    const { user, isAuthenticated, loading, error } = useAuthWorking()
    
    console.log('=== DEBUG: Auth state ===', { user, isAuthenticated, loading, error })
    
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
            <h1 className="text-4xl font-bold text-red-600 mb-4">Auth Error</h1>
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
          <h1 className="text-4xl font-bold text-blue-600 mb-4">RapidReach Auth Test</h1>
          <p className="text-lg text-gray-600 mb-4">Authentication system working!</p>
          
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
            <p className="text-green-800">✅ Auth hook working!</p>
            <p className="text-green-600 text-sm">Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
            {user && <p className="text-green-600 text-sm">User: {user.email}</p>}
          </div>
        </div>
      </div>
    )
  }

  console.log('=== DEBUG: Creating root element ===')
  const root = document.getElementById('root')
  if (root) {
    console.log('=== DEBUG: Root element found, rendering React ===')
    createRoot(root).render(<AuthTest />)
  } else {
    console.error('=== DEBUG: Root element not found ===')
  }
} catch (error) {
  console.error('=== DEBUG: Auth hook import failed ===', error)
  
  // Fallback to error display
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: red;">Auth Hook Import Failed</h1>
          <p style="color: #666;">Error: ${error.message}</p>
        </div>
      </div>
    `
  }
}

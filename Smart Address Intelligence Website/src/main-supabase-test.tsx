import { createRoot } from "react-dom/client";
import "./styles/index.css";

console.log('=== DEBUG: Supabase test starting ===')

// Test Supabase import
try {
  const { supabase } = await import('./lib/supabase')
  console.log('=== DEBUG: Supabase imported successfully ===')
  
  const SupabaseTest = () => {
    console.log('=== DEBUG: SupabaseTest component rendering ===')
    
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        console.log('=== DEBUG: Supabase session test ===', { data, error })
        alert(`Supabase working! Session: ${data.session ? 'Found' : 'Not found'}`)
      } catch (error) {
        console.error('=== DEBUG: Supabase session error ===', error)
        alert(`Supabase error: ${error.message}`)
      }
    }
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">RapidReach Supabase Test</h1>
          <p className="text-lg text-gray-600 mb-4">Testing Supabase integration...</p>
          
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
            <p className="text-green-800">✅ React + CSS working!</p>
          </div>

          <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
            <p className="text-blue-800">✅ Supabase imported!</p>
          </div>

          <button 
            onClick={testSupabase}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Test Supabase Connection
          </button>
        </div>
      </div>
    )
  }

  console.log('=== DEBUG: Creating root element ===')
  const root = document.getElementById('root')
  if (root) {
    console.log('=== DEBUG: Root element found, rendering React ===')
    createRoot(root).render(<SupabaseTest />)
  } else {
    console.error('=== DEBUG: Root element not found ===')
  }
} catch (error) {
  console.error('=== DEBUG: Supabase import failed ===', error)
  
  // Fallback to error display
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: red;">Supabase Import Failed</h1>
          <p style="color: #666;">Error: ${error.message}</p>
        </div>
      </div>
    `
  }
}

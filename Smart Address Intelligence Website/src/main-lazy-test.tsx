import { createRoot } from "react-dom/client";
import "./styles/index.css";

console.log('=== DEBUG: Lazy Groq test starting ===')

// Test lazy Groq import
try {
  console.log('=== DEBUG: Attempting lazy Groq import ===')
  const { aiAnalysisService } = await import('./services/aiAnalysisLazy')
  console.log('=== DEBUG: Lazy Groq imported successfully ===')
  
  const LazyGroqTest = () => {
    console.log('=== DEBUG: LazyGroqTest component rendering ===')
    
    const testLazyGroq = async () => {
      try {
        console.log('=== DEBUG: Testing lazy Groq analysis ===')
        const result = await aiAnalysisService.analyzeAddress('thane, maharashtra 400607')
        console.log('=== DEBUG: Lazy Groq analysis successful ===', result)
        alert(`Lazy Groq working! City: ${result.city}, Pincode: ${result.pincode}`)
      } catch (error) {
        console.error('=== DEBUG: Lazy Groq analysis failed ===', error)
        alert(`Lazy Groq error: ${error.message}`)
      }
    }
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">RapidReach Lazy Groq Test</h1>
          <p className="text-lg text-gray-600 mb-4">Testing lazy-loaded Groq API...</p>
          
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
            <p className="text-green-800">✅ Lazy Groq imported!</p>
            <p className="text-green-600 text-sm">API Key: {import.meta.env.VITE_GROQ_API_KEY ? '✅ Set' : '❌ Not Set'}</p>
          </div>

          <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
            <p className="text-blue-800">✅ No initialization at module load!</p>
            <p className="text-blue-600 text-sm">Groq loads only when needed</p>
          </div>

          <button 
            onClick={testLazyGroq}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Test Lazy Groq Analysis
          </button>
        </div>
      </div>
    )
  }

  console.log('=== DEBUG: Creating root element ===')
  const root = document.getElementById('root')
  if (root) {
    console.log('=== DEBUG: Root element found, rendering React ===')
    createRoot(root).render(<LazyGroqTest />)
  } else {
    console.error('=== DEBUG: Root element not found ===')
  }
} catch (error) {
  console.error('=== DEBUG: Lazy Groq import failed ===', error)
  
  // Fallback to error display
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: red;">Lazy Groq Import Failed</h1>
          <p style="color: #666;">Error: ${error.message}</p>
        </div>
      </div>
    `
  }
}

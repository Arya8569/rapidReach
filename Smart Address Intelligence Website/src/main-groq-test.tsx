import { createRoot } from "react-dom/client";
import "./styles/index.css";

console.log('=== DEBUG: Groq test starting ===')

// Test Groq import
try {
  console.log('=== DEBUG: Attempting Groq import ===')
  const Groq = (await import('groq-sdk')).default
  console.log('=== DEBUG: Groq imported successfully ===')
  
  // Test Groq initialization
  try {
    console.log('=== DEBUG: Attempting Groq initialization ===')
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY || ''
    })
    console.log('=== DEBUG: Groq initialized successfully ===')
    
    const GroqTest = () => {
      console.log('=== DEBUG: GroqTest component rendering ===')
      
      const testGroq = async () => {
        try {
          console.log('=== DEBUG: Testing Groq API call ===')
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: 'user',
                content: 'Hello, can you respond with just "OK"?'
              }
            ],
            model: 'mixtral-8x7b-32768',
            max_tokens: 10
          })
          console.log('=== DEBUG: Groq API call successful ===', completion.choices[0]?.message?.content)
          alert(`Groq working! Response: ${completion.choices[0]?.message?.content}`)
        } catch (error) {
          console.error('=== DEBUG: Groq API call failed ===', error)
          alert(`Groq API error: ${error.message}`)
        }
      }
      
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">RapidReach Groq Test</h1>
            <p className="text-lg text-gray-600 mb-4">Testing Groq API integration...</p>
            
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
              <p className="text-green-800">✅ Groq SDK imported!</p>
              <p className="text-green-600 text-sm">API Key: {import.meta.env.VITE_GROQ_API_KEY ? '✅ Set' : '❌ Not Set'}</p>
            </div>

            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
              <p className="text-blue-800">✅ Groq client initialized!</p>
            </div>

            <button 
              onClick={testGroq}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Test Groq API Call
            </button>
          </div>
        </div>
      )
    }

    console.log('=== DEBUG: Creating root element ===')
    const root = document.getElementById('root')
    if (root) {
      console.log('=== DEBUG: Root element found, rendering React ===')
      createRoot(root).render(<GroqTest />)
    } else {
      console.error('=== DEBUG: Root element not found ===')
    }
  } catch (error) {
    console.error('=== DEBUG: Groq initialization failed ===', error)
    
    // Fallback to error display
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: red;">Groq Initialization Failed</h1>
            <p style="color: #666;">Error: ${error.message}</p>
            <p style="color: #999; font-size: 12px;">This is likely causing the blank screen!</p>
          </div>
        </div>
      `
    }
  }
} catch (error) {
  console.error('=== DEBUG: Groq import failed ===', error)
  
  // Fallback to error display
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: red;">Groq Import Failed</h1>
          <p style="color: #666;">Error: ${error.message}</p>
          <p style="color: #999; font-size: 12px;">This is the root cause of the blank screen!</p>
        </div>
      </div>
    `
  }
}

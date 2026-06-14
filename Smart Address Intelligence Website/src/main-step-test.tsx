import { createRoot } from "react-dom/client";
import "./styles/index.css";

console.log('=== DEBUG: Step test starting ===')

const StepTest = () => {
  console.log('=== DEBUG: StepTest component rendering ===')
  
  // Test 1: Basic React with CSS
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">RapidReach Step Test</h1>
        <p className="text-lg text-gray-600 mb-4">Testing components step by step...</p>
        
        <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4">
          <p className="text-green-800">✅ React + CSS working!</p>
        </div>

        <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
          <p className="text-blue-800">🧪 Testing imports...</p>
        </div>

        <button 
          onClick={() => console.log('=== DEBUG: Button clicked ===')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Test Console
        </button>
      </div>
    </div>
  )
}

console.log('=== DEBUG: Creating root element ===')
const root = document.getElementById('root')
if (root) {
  console.log('=== DEBUG: Root element found, rendering React ===')
  createRoot(root).render(<StepTest />)
} else {
  console.error('=== DEBUG: Root element not found ===')
}

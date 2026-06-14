import { createRoot } from "react-dom/client";

console.log('=== DEBUG: React test starting ===')

const ReactTest = () => {
  console.log('=== DEBUG: ReactTest component rendering ===')
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1 style={{ color: 'blue', marginBottom: '20px' }}>React is Working!</h1>
        <p style={{ color: 'green', marginBottom: '10px' }}>✅ React component rendered successfully</p>
        <p style={{ color: 'orange', marginBottom: '10px' }}>⚠️ Testing environment variables...</p>
        <div style={{ 
          background: '#e0e0e0', 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not Set'}</div>
          <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not Set'}</div>
          <div>VITE_GROQ_API_KEY: {import.meta.env.VITE_GROQ_API_KEY ? '✅ Set' : '❌ Not Set'}</div>
        </div>
        <button 
          onClick={() => alert('React event handlers working!')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Click
        </button>
      </div>
    </div>
  )
}

console.log('=== DEBUG: Creating root element ===')
const root = document.getElementById('root')
if (root) {
  console.log('=== DEBUG: Root element found, rendering React ===')
  createRoot(root).render(<ReactTest />)
} else {
  console.error('=== DEBUG: Root element not found ===')
}

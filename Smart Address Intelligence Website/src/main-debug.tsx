// Very basic test to see if React works at all
console.log('=== DEBUG: main-debug.tsx loaded ===')

const root = document.getElementById('root')
if (root) {
  console.log('=== DEBUG: Root element found ===')
  root.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: blue; margin-bottom: 20px;">RapidReach Debug</h1>
        <p style="color: green;">✅ HTML is working!</p>
        <p style="color: orange;">⚠️ React may have issues</p>
        <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px;">
          <small>Environment Variables:</small><br>
          VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not Set'}<br>
          VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not Set'}<br>
          VITE_GROQ_API_KEY: ${import.meta.env.VITE_GROQ_API_KEY ? '✅ Set' : '❌ Not Set'}
        </div>
      </div>
    </div>
  `
} else {
  console.error('=== DEBUG: Root element not found ===')
}

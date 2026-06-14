import { createRoot } from "react-dom/client";
import "./styles/index.css";

console.log('=== DEBUG: Full app test starting ===')

// Test full app import
try {
  const AppWorking = (await import('./app/AppWorking')).default
  console.log('=== DEBUG: AppWorking imported successfully ===')
  
  const ErrorBoundary = (await import('./components/ErrorBoundary')).ErrorBoundary
  console.log('=== DEBUG: ErrorBoundary imported successfully ===')
  
  console.log('=== DEBUG: Creating root element ===')
  const root = document.getElementById('root')
  if (root) {
    console.log('=== DEBUG: Root element found, rendering full app ===')
    createRoot(root).render(
      <ErrorBoundary>
        <AppWorking />
      </ErrorBoundary>
    )
  } else {
    console.error('=== DEBUG: Root element not found ===')
  }
} catch (error) {
  console.error('=== DEBUG: Full app import failed ===', error)
  
  // Fallback to error display
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: red;">Full App Import Failed</h1>
          <p style="color: #666;">Error: ${error.message}</p>
          <p style="color: #999; font-size: 12px;">Check browser console for more details</p>
        </div>
      </div>
    `
  }
}

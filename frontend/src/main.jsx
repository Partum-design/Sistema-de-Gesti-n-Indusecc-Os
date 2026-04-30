import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
// IMPORTA EL PROVIDER AQUÍ
import { AuthProvider } from './context/AuthContext' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 👉 ENVUELVE LA APP CON EL PROVIDER */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}

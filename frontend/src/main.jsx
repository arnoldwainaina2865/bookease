
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// BookEase typography
import '@fontsource-variable/inter'
import '@fontsource-variable/manrope'

// Global design system
import './index.css'

// Theme management
import ThemeProvider from './context/ThemeProvider.jsx'

// Application
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

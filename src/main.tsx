import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HouseholdProvider } from './context/HouseholdContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HouseholdProvider>
      <App />
    </HouseholdProvider>
  </StrictMode>,
)

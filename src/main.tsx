import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/styles/globals.css'

async function enableMocking() {
  if (import.meta.env.VITE_MSW_ENABLED !== 'true') return
  const { worker } = await import('@/mocks/browser')
  return worker.start({ onUnhandledRequest: 'warn' }).catch(console.warn)
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}).catch(console.error)

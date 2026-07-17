import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept global fetch to support separate API deployments
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  if (typeof url === 'string' && url.startsWith('/api')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
    url = `${apiBase}${url}`;
    options.credentials = 'include';
  }
  return originalFetch(url, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

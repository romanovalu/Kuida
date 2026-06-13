import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import BookingPage from './components/BookingPage.tsx'

const path = window.location.pathname;
const bookingMatch = path.match(/^\/reservar\/([^/]+)/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {bookingMatch ? <BookingPage slug={bookingMatch[1]} /> : <App />}
  </StrictMode>,
)

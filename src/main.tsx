import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { loadGoogleMapsAPI, resetGoogleMapsLoadState } from './utils/loadGoogleMapsAPI';
import { verifyGooglePlacesAPIKey } from './utils/verifyGoogleAPI';

// Reset the loading state in case there was a previous load attempt
resetGoogleMapsLoadState();

// Check if API key is available
const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
if (!apiKey) {
  console.warn('WARNING: Google Places API key is missing from environment variables');
  console.warn('Set VITE_GOOGLE_PLACES_API_KEY in your .env file');
} else {
  console.log('Google Places API key found in environment variables');
  
  // Verify the API key
  verifyGooglePlacesAPIKey().then(result => {
    if (result.success) {
      console.log('✅ ' + result.message);
    } else {
      console.warn('⚠️ Google Places API issue:', result.message);
      console.warn('See GOOGLE_PLACES_API_SETUP.md for setup instructions');
    }
  });
}

// Defer Google Maps API loading to improve initial page load
// Load it after the page is interactive
if (typeof window !== 'undefined') {
  // Use requestIdleCallback if available, otherwise setTimeout
  const loadMaps = () => {
    console.log('main.tsx: Loading Google Maps API (deferred)');
    loadGoogleMapsAPI({
      libraries: ['places', 'geocoding'],
      callback: () => {
        console.log('main.tsx: Google Maps API loaded successfully');
      },
      onerror: (error) => {
        if (error.message?.includes('Places API') || error.message?.includes('ApiNotActivatedMapError')) {
          console.warn('main.tsx: Google Places API is not activated for this API key');
          console.warn('See GOOGLE_PLACES_API_SETUP.md for instructions on how to enable it');
        } else {
          console.warn('main.tsx: Failed to load Google Maps API:', error);
        }
      }
    }).catch(error => {
      console.error('main.tsx: Google Maps API loading error:', error);
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadMaps, { timeout: 2000 });
  } else {
    setTimeout(loadMaps, 2000);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

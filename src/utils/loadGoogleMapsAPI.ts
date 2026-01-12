let googleMapsLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;
let loadError: Error | null = null;

export interface GoogleMapsLoadOptions {
  apiKey?: string;
  libraries?: string[];
  callback?: () => void;
  onerror?: (error: Error) => void;
}

/**
 * Check if Google Maps API is already loaded
 */
function isGoogleMapsAvailable(): boolean {
  return typeof window !== 'undefined' && 
         window.google !== undefined && 
         window.google.maps !== undefined &&
         window.google.maps.places !== undefined;
}

/**
 * Load the Google Maps API dynamically
 */
export function loadGoogleMapsAPI(options: GoogleMapsLoadOptions = {}): Promise<void> {
  // Check if Google is already available in the window object (might be loaded by other means)
  if (isGoogleMapsAvailable()) {
    console.log('loadGoogleMapsAPI: Google Maps already available in window object');
    googleMapsLoaded = true;
    return Promise.resolve();
  }

  console.log('loadGoogleMapsAPI: Start loading, current state:', { 
    googleMapsLoaded, 
    isLoading, 
    hasLoadError: !!loadError 
  });

  // If already loaded, return resolved promise
  if (googleMapsLoaded) {
    console.log('loadGoogleMapsAPI: Google Maps already loaded');
    return Promise.resolve();
  }
  
  // If already loading, return the existing promise
  if (isLoading && loadPromise) {
    console.log('loadGoogleMapsAPI: Google Maps already loading');
    return loadPromise;
  }
  
  // Reset error state to try again
  loadError = null;
  
  // Start loading
  isLoading = true;
  
  // Read API key from environment or options
  const apiKey = options.apiKey || import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  
  console.log('loadGoogleMapsAPI: Using API key?', !!apiKey);
  
  if (!apiKey) {
    console.warn('Google Maps API key is missing. Places autocomplete will not work.');
    loadError = new Error('Google Maps API key is missing');
    isLoading = false;
    return Promise.reject(loadError);
  }
  
  // Create and return loading promise
  loadPromise = new Promise<void>((resolve, reject) => {
    // Remove any previous script
    const previousScript = document.getElementById('google-maps-script');
    if (previousScript) {
      console.log('loadGoogleMapsAPI: Removing previous script tag');
      document.head.removeChild(previousScript);
    }
    
    // Setup callback function in global scope
    const callbackName = `initGoogleMaps_${Date.now()}`;
    console.log('loadGoogleMapsAPI: Setting up callback', callbackName);
    
    // Add timeout to prevent hanging if Google doesn't respond
    const timeoutId = setTimeout(() => {
      if (!googleMapsLoaded) {
        console.error('loadGoogleMapsAPI: Loading timed out after 10 seconds');
        const error = new Error('Google Maps API loading timed out');
        loadError = error;
        isLoading = false;
        if (options.onerror) {
          options.onerror(error);
        }
        reject(error);
      }
    }, 10000);
    
    (window as any)[callbackName] = () => {
      console.log('loadGoogleMapsAPI: Callback executed successfully');
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Additional validation to ensure Places API is actually available
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('loadGoogleMapsAPI: Verified Google Places API is available');
        googleMapsLoaded = true;
        isLoading = false;
        if (options.callback) {
          options.callback();
        }
      } else {
        console.error('loadGoogleMapsAPI: Google callback executed but Places API not available');
        const error = new Error('Google Maps loaded but Places API not available');
        loadError = error;
        isLoading = false;
        if (options.onerror) {
          options.onerror(error);
        }
        reject(error);
      }
      delete (window as any)[callbackName]; // Clean up
      resolve();
    };

    // Error handler function in global scope
    const errorCallbackName = `googleMapsError_${Date.now()}`;
    (window as any)[errorCallbackName] = (err: { error: string }) => {
      console.error('loadGoogleMapsAPI: Google Maps error callback triggered:', err);
      
      // Clear the timeout since we got an error response
      clearTimeout(timeoutId);
      
      let errorMessage = 'Google Maps API error';
      
      if (err && typeof err === 'object') {
        // For ApiNotActivatedMapError, provide a specific message
        if (err.error === 'ApiNotActivatedMapError') {
          errorMessage = 'The Google API key does not have the Places API enabled. Please enable it in the Google Cloud Console.';
          console.error('The Places API is not activated for this API key. Visit https://console.cloud.google.com/ to enable it.');
        } else {
          errorMessage = `Google Maps API error: ${err.error || 'Unknown error'}`;
        }
      }
      
      const error = new Error(errorMessage);
      loadError = error;
      isLoading = false;
      
      if (options.onerror) {
        options.onerror(error);
      }
      
      delete (window as any)[errorCallbackName];
      reject(error);
    };
    
    // Create script element with specific required parameters
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    const libraries = options.libraries?.join(',') || 'places';
    
    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&callback=${callbackName}&v=weekly&channel=1&onerror=${errorCallbackName}`;
    script.src = scriptSrc;
    
    console.log('loadGoogleMapsAPI: Creating script with libraries:', libraries);
    console.log('loadGoogleMapsAPI: Script pattern:', 
      scriptSrc.replace(apiKey, '[REDACTED]')
    );
    
    script.async = true;
    script.defer = true;
    
    // Add error callback
    script.onerror = (event) => {
      console.error('loadGoogleMapsAPI: Script loading failed', event);
      
      // Clear the timeout since we got an error
      clearTimeout(timeoutId);
      
      const error = new Error('Failed to load Google Maps API script');
      loadError = error;
      isLoading = false;
      if (options.onerror) {
        options.onerror(error);
      }
      reject(error);
    };

    // Add script to document
    document.head.appendChild(script);
    console.log('loadGoogleMapsAPI: Script added to document head');
  });
  
  return loadPromise;
}

/**
 * Reset the loading state to try loading again
 */
export function resetGoogleMapsLoadState(): void {
  console.log('resetGoogleMapsLoadState: Resetting Google Maps load state');
  googleMapsLoaded = false;
  isLoading = false;
  loadPromise = null;
  loadError = null;
} 
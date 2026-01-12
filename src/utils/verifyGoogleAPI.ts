/**
 * Utility to verify Google Places API status
 */
export async function verifyGooglePlacesAPIKey(): Promise<{
  success: boolean;
  message: string;
}> {
  // Skip verification during SSR or build process
  if (typeof window === 'undefined') {
    return {
      success: false,
      message: 'Skipping API verification during build/SSR'
    };
  }
  
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        message: 'Google Places API key is missing from environment variables'
      };
    }
    
    // Create a simple test request to verify the API key using Geocoding API
    // This will respond with an error if the key is invalid or restricted
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`
    );
    
    const data = await response.json();
    
    // Check the status
    if (data.status === 'REQUEST_DENIED') {
      let errorMessage = 'API key is invalid or restricted';
      
      // Parse more specific error message if available
      if (data.error_message) {
        if (data.error_message.includes('API key is invalid')) {
          errorMessage = 'Invalid API key';
        } else if (data.error_message.includes('API key not authorized')) {
          errorMessage = 'API key not authorized for Geocoding API';
        } else if (data.error_message.includes('API project is not authorized')) {
          errorMessage = 'API project is not properly configured';
        } else {
          errorMessage = data.error_message;
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
    
    return {
      success: true, 
      message: 'Google Places API key is valid'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error verifying API key: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 
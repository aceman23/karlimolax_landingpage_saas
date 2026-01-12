# Google Places API Setup Guide

## Fix for "ApiNotActivatedMapError"

If you're seeing this error in your console:
```
Google Maps JavaScript API error: ApiNotActivatedMapError
https://developers.google.com/maps/documentation/javascript/error-messages#api-not-activated-map-error
```

It means your API key exists but doesn't have the Places API service enabled. Follow these steps to fix it:

## Step 1: Access the Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with the Google account used to create your API key

## Step 2: Select Your Project

1. Make sure you're in the correct project that contains your API key
2. If you need to switch projects, click on the project selector at the top of the page

## Step 3: Enable the Places API

1. In the left sidebar, click on "APIs & Services" > "Library"
2. Search for "Places API"
3. Click on "Places API" in the search results
4. Click the "ENABLE" button (or if already enabled, it will show "MANAGE")

## Step 4: Enable Additional Required APIs

The Places Autocomplete feature requires the following APIs to be enabled:

1. Places API
2. Maps JavaScript API
3. Geocoding API

Repeat Step 3 for each of these APIs to ensure they're all enabled.

## Step 5: Verify API Key Restrictions

1. In the left sidebar, go to "APIs & Services" > "Credentials"
2. Find your API key in the list and click on it
3. Under "API restrictions," ensure that the Places API, Maps JavaScript API, and Geocoding API are included in the allowed APIs list
4. If using "Application restrictions," make sure your website's domain is properly included

## Step 6: Wait for Changes to Propagate

After making these changes, it may take a few minutes for them to take effect. If the error persists:

1. Clear your browser cache
2. Wait 5-10 minutes and try again
3. Check the Google Cloud Console for any error messages or quota issues

## Troubleshooting Autocomplete Issues

### Common Problems and Solutions:

1. **Missing API Key**: 
   - Make sure `VITE_GOOGLE_PLACES_API_KEY` is set in your `.env` file
   - Check browser console for missing API key warnings

2. **API Not Activated Error**:
   - If you see `ApiNotActivatedMapError`, follow Step 3 above
   - Make sure to enable ALL required APIs: Places API, Maps JavaScript API, and Geocoding API

3. **Request Denied Error**:
   - Check if your API key has correct permissions
   - Verify billing is enabled for your Google Cloud project
   - Ensure your domain is allowed in the API key restrictions

4. **API Key Restrictions**:
   - If using localhost, make sure `http://localhost` and `http://localhost:PORT` are in the allowed referrers
   - For production, add your website domain to the allowed referrers

5. **No Predictions Showing**:
   - Verify the console doesn't show any errors
   - Check if you're using country restrictions that might be limiting results
   - Try entering a full address or clear long inputs and start again

### Console Debugging:

Open your browser's developer console (F12) and look for:
- "Google Places API key found in environment variables" (confirms key is loaded)
- "Google Maps API loaded successfully" (confirms API is working)
- Any error messages containing "Google", "Maps", or "Places"

If you're still having issues after following these steps, please check your Google Cloud Platform console for any additional error messages or quota limitations.

## Recommended API Key Security Measures

For production use, it's recommended to restrict your API key:

1. **HTTP Referrers (websites)**: Restrict to your specific domain(s)
2. **API restrictions**: Limit to only the specific APIs you need
3. **Quotas**: Set appropriate quotas to prevent unexpected billing

## Additional Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Google API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Error Messages Reference](https://developers.google.com/maps/documentation/javascript/error-messages) 
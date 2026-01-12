# Deployment Guide for DapperLimoLax

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Server Port (optional, defaults to 3001)
PORT=3001

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key

# Google Places API Key for address autocomplete
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

## Google Places API Setup

To enable address autocomplete in the booking forms, you need to set up a Google Places API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable "Places API"
5. Go to "APIs & Services" > "Credentials"
6. Create an API Key (restrict it to Places API only)
7. Add the key to your `.env` file as `VITE_GOOGLE_PLACES_API_KEY`

## Build and Deployment

### Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Production Build

```bash
# Create production build
npm run build

# Start the server
npm run start
```

## Additional Configuration

### Restricting the Google Places API Key

For security, restrict your Google Places API key:

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers"
4. Add your domain(s) to the whitelist
5. Under "API restrictions", select "Restrict key" and choose "Places API"
6. Save the changes

This will prevent unauthorized use of your API key. 
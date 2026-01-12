# Supabase Edge Functions

This directory contains Edge Functions for the Dapper Limo LAX application.

## Available Functions

1. **send-sms** - Sends SMS messages via Twilio and logs them
2. *(Additional functions can be added as needed)*

## Development

Each function has its own directory with an `index.ts` file.

### Local Development

1. Install the Supabase CLI
2. Start the local development server:
   ```bash
   supabase functions serve
   ```
3. Test your functions:
   ```bash
   curl -X POST http://localhost:8000/functions/v1/send-sms \
     -H "Content-Type: application/json" \
     -d '{"to":"+1234567890","message":"Test message","type":"test"}'
   ```

### Deployment

Functions are deployed automatically when pushed to Supabase:

```bash
supabase functions deploy send-sms
```

### Environment Variables

Set environment variables in the Supabase Dashboard under Settings > API > Edge Functions.

For local development, create a `.env` file in the function directory.

## Function Documentation

Each function has its own README.md with detailed documentation.
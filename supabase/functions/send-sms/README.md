# SMS Sending Function

This Supabase Edge Function handles sending SMS messages through Twilio.

## Environment Variables Required

The following environment variables must be set in the Supabase dashboard:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Function Usage

The function accepts POST requests with the following JSON body:

```json
{
  "to": "+1234567890",  // Phone number in E.164 format
  "message": "Your message text here",
  "type": "booking_confirmation"  // Message type for logging
}
```

Message types include:
- booking_confirmation
- booking_reminder
- driver_assignment
- admin_notification
- booking_update

## Response

The function returns a JSON response with the following format on success:

```json
{
  "success": true,
  "messageSid": "SM123456789"
}
```

Or on failure:

```json
{
  "error": "Error message here"
}
```

## Implementation Notes

The function:
1. Validates input parameters
2. Sends the SMS via Twilio
3. Logs the SMS to the `sms_logs` table
4. Returns the result

## Testing

You can test this function by invoking it with the Supabase CLI:

```bash
supabase functions serve
```

Then call it with curl:

```bash
curl -X POST http://localhost:8000/functions/v1/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890","message":"Test message","type":"test"}'
```
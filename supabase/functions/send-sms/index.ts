import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Twilio } from "npm:twilio@4.22.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { message, to, type } = await req.json();

    // Validate request data
    if (!message || !to || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Twilio client with environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioNumber) {
      console.error("Missing Twilio environment variables");
      return new Response(
        JSON.stringify({ error: "Twilio configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const client = new Twilio(accountSid, authToken);

    // Log SMS request (for debugging purposes)
    console.log(`Sending ${type} SMS to ${to}: ${message}`);

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: twilioNumber,
      to: to,
    });

    // Log SMS status in Supabase
    const { data: logData, error: logError } = await supabaseClient
      .from('sms_logs')
      .insert([
        {
          phone_number: to,
          message_type: type,
          message_body: message,
          message_sid: result.sid,
          status: result.status,
        },
      ]);

    if (logError) {
      console.error("Error logging SMS:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending SMS:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send SMS" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
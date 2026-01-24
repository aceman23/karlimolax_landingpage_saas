import twilio from 'twilio';

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  // Check for missing environment variables with detailed error
  const missingVars = [];
  if (!accountSid) missingVars.push('TWILIO_ACCOUNT_SID');
  if (!authToken) missingVars.push('TWILIO_AUTH_TOKEN');
  if (!twilioPhoneNumber) missingVars.push('TWILIO_PHONE_NUMBER');

  if (missingVars.length > 0) {
    const errorMsg = `Twilio configuration is missing. Please set the following environment variables: ${missingVars.join(', ')}`;
    console.error('[SMS] Configuration error:', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const client = twilio(accountSid, authToken);
    return {
      client,
      phoneNumber: twilioPhoneNumber
    };
  } catch (clientError: any) {
    console.error('[SMS] Error creating Twilio client:', clientError);
    throw new Error(`Failed to initialize Twilio client: ${clientError.message || 'Unknown error'}`);
  }
};

export interface SMSOptions {
  to: string;
  message: string;
  type?: string;
}

export interface SMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send an SMS message using Twilio
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  try {
    const { to, message, type } = options;

    // Validate required parameters
    if (!to || !message) {
      return {
        success: false,
        error: 'Missing required parameters: to and message are required'
      };
    }

    // Get Twilio client - catch configuration errors early
    let client, phoneNumber;
    try {
      const twilioConfig = getTwilioClient();
      client = twilioConfig.client;
      phoneNumber = twilioConfig.phoneNumber;
    } catch (configError: any) {
      console.error('[SMS] Twilio configuration error:', configError.message);
      return {
        success: false,
        error: configError.message || 'Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
      };
    }

    // Log SMS request
    console.log(`[SMS] Sending ${type || 'SMS'} to ${to}: ${message.substring(0, 50)}...`);

    // Send SMS via Twilio
    const result = await client.messages.create({
      body: message,
      from: phoneNumber,
      to: to
    });

    console.log(`[SMS] Successfully sent SMS to ${to}. Message SID: ${result.sid}`);

    return {
      success: true,
      messageSid: result.sid
    };
  } catch (error: any) {
    console.error('[SMS] Error sending SMS:', error);
    console.error('[SMS] Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send SMS';
    if (error?.code === 21211) {
      errorMessage = 'Invalid phone number format';
    } else if (error?.code === 21608) {
      errorMessage = 'Unsubscribed recipient';
    } else if (error?.code === 20003) {
      errorMessage = 'Invalid Twilio credentials. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN';
    } else if (error?.code === 21212) {
      errorMessage = 'Invalid phone number';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send SMS to multiple recipients
 */
export async function sendBulkSMS(recipients: string[], message: string, type?: string): Promise<SMSResult[]> {
  const results = await Promise.allSettled(
    recipients.map(phoneNumber => sendSMS({ to: phoneNumber, message, type }))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`[SMS] Failed to send to ${recipients[index]}:`, result.reason);
      return {
        success: false,
        error: result.reason?.message || 'Unknown error'
      };
    }
  });
}

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

// Create reusable transporter
// Note: The "from" address in emails must match the authenticated SMTP_USER
// If SMTP_USER is karlimolax@gmail.com, Gmail will use that as the sender
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as any);

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Email recipient (to) is required');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    if (!options.html) {
      throw new Error('Email HTML content is required');
    }

    console.log('Attempting to send email to:', options.to);
    console.log('Email subject:', options.subject);
    
    // Always use karlimolax@gmail.com as the sender address
    // CRITICAL: SMTP_USER in .env MUST be karlimolax@gmail.com
    // Gmail will override the "from" field with the authenticated user's email
    const fromAddress = 'karlimolax@gmail.com';
    
    // Validate SMTP_USER matches the desired from address
    const smtpUser = process.env.SMTP_USER?.trim().toLowerCase();
    const requiredUser = 'karlimolax@gmail.com';
    
    if (!smtpUser) {
      console.error(`[ERROR] SMTP_USER is not set in environment variables`);
      console.error(`[ERROR] Please set SMTP_USER=${requiredUser} in your .env file`);
      throw new Error('SMTP_USER environment variable is not configured');
    }
    
    if (smtpUser !== requiredUser) {
      console.error(`[ERROR] SMTP_USER (${process.env.SMTP_USER}) does not match required from address (${requiredUser})`);
      console.error(`[ERROR] Gmail will override the "from" field with the authenticated user's email`);
      console.error(`[ERROR] To fix: Set SMTP_USER=${requiredUser} in your .env file and restart the server`);
      throw new Error(`SMTP_USER must be set to ${requiredUser} to send emails from that address. Current value: ${process.env.SMTP_USER}`);
    }
    
    const mailOptions = {
      from: fromAddress,
      ...options,
    };
    
    console.log(`[EMAIL] Sending email from: ${fromAddress}`);
    console.log(`[EMAIL] SMTP_USER verified: ${smtpUser} (matches required address)`);
    
    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text?.substring(0, 100) + '...',
      html: mailOptions.html?.substring(0, 100) + '...'
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
export const templates = {
  emailVerification: (verificationUrl: string, user: { name: string; email: string }) => {
    console.log('Creating verification email template with URL:', verificationUrl);
    return {
      subject: 'Verify Your Email Address - Kar Limo LAX',
      text: `Hello ${user.name},\n\nThank you for signing up with Kar Limo LAX!\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.\n\nBest regards,\nKar Limo LAX Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Kar Limo LAX</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <!-- Header with Branding -->
            <div style="background-color: #d97706; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Kar Limo LAX</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Premium Transportation Services</p>
            </div>
            
            <!-- Email Content -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #1a1a1a; margin-bottom: 20px; font-size: 24px;">Verify Your Email Address</h2>
              <p style="color: #4a4a4a; margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Hello ${user.name},</p>
              <p style="color: #4a4a4a; margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Thank you for signing up with <strong>Kar Limo LAX</strong>! Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background-color: #d97706; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #4a4a4a; margin-bottom: 10px; font-size: 14px;">This link will expire in 24 hours.</p>
              <p style="color: #4a4a4a; margin-bottom: 0; font-size: 14px;">If you did not create an account with Kar Limo LAX, you can safely ignore this email.</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #4a4a4a; margin: 0 0 10px 0; font-size: 14px;">Best regards,</p>
              <p style="color: #1a1a1a; margin: 0; font-weight: bold; font-size: 16px;">Kar Limo LAX Team</p>
              <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 12px;">
                This email was sent from karlimolax@gmail.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  passwordReset: (resetUrl: string) => {
    console.log('Creating password reset template with URL:', resetUrl);
    const template = {
      subject: 'Password Reset Request - Kar Limo LAX',
      text: `You requested a password reset. Click this link to set a new password: ${resetUrl}. This link will expire in 1 hour. If you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Password Reset Request</h2>
          <p style="color: #4a4a4a;">You requested a password reset for your Kar Limo LAX account.</p>
          <p style="color: #4a4a4a;">Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #4a4a4a;">This link will expire in 1 hour.</p>
          <p style="color: #4a4a4a;">If you didn't request this password reset, please ignore this email.</p>
          <hr style="border: 1px solid #e5e5e5; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
      `
    };
    console.log('Password reset template created successfully');
    return template;
  },
  
  welcomeEmail: (user: { name: string; email: string }) => {
    console.log('Creating welcome email template for user:', user.email);
    const template = {
      subject: 'Welcome to Kar Limo LAX!',
      text: `Welcome to Kar Limo LAX, ${user.name}!

Thank you for creating an account with us. We're excited to have you on board and look forward to providing you with exceptional luxury transportation services.

With your account, you can:
- Book rides easily online
- View your booking history
- Manage your profile
- Track your rides in real-time

If you have any questions, our customer service team is here to help.

Best regards,
The Kar Limo LAX Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Kar Limo LAX</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; padding: 20px 0; background-color: #f59e0b; margin: -20px -20px 20px -20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Kar Limo LAX</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0;">Your Luxury Transportation Partner</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 20px 0;">
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Dear ${user.name},
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Thank you for creating an account with Kar Limo LAX. We're excited to have you on board and look forward to providing you with exceptional luxury transportation services.
              </p>

              <!-- Features Section -->
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                  Your Account Benefits
                </h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;">
                      <strong>📱 Easy Booking</strong><br>
                      Book rides with just a few clicks
                    </p>
                    <p style="color: #4a4a4a; margin: 8px 0;">
                      <strong>📋 Booking History</strong><br>
                      Access your past and upcoming rides
                    </p>
                  </div>
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;">
                      <strong>👤 Profile Management</strong><br>
                      Update your preferences anytime
                    </p>
                    <p style="color: #4a4a4a; margin: 8px 0;">
                      <strong>📍 Real-time Tracking</strong><br>
                      Track your rides in real-time
                    </p>
                  </div>
                </div>
              </div>

              <!-- Getting Started Section -->
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                  Getting Started
                </h2>
                <p style="color: #4a4a4a; margin: 8px 0;">
                  Ready to book your first ride? Simply log in to your account and click the "Book Now" button to get started.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://karlimolax.com'}/book" 
                     style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Book Your First Ride
                  </a>
                </div>
              </div>

              <!-- Contact Information -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="color: #4a4a4a; margin: 0 0 10px 0;">Need help? Our team is here for you:</p>
                <p style="color: #4a4a4a; margin: 0;">
                  <strong>Phone:</strong> (424) 526-0457<br>
                  <strong>Email:</strong> Knockoutautorentals@gmail.com
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e5e5; margin-top: 20px;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                This is an automated message, please do not reply to this email.<br>
                © ${new Date().getFullYear()} Kar Limo LAX. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    console.log('Welcome email template created successfully');
    return template;
  },

  bookingConfirmation: (booking: any) => {
    console.log('Creating booking confirmation template for booking:', booking._id);
    
    // Format pickup date and time
    const pickupDateTime = new Date(booking.pickupTime);
    const formattedDate = pickupDateTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = pickupDateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    // Vehicle information
    const vehicleInfo = (booking.vehicleId && (booking.vehicleId as any).name)
      ? `${(booking.vehicleId as any).make} ${(booking.vehicleId as any).model} (${(booking.vehicleId as any).name})`
      : (booking.vehicleName || 'Assigned vehicle');
    
    // Package information
    const packageInfo = booking.packageName || (
      booking.packageId === 'lax-special' ? 'Airport Special' :
      booking.packageId === 'disneyland' ? 'Disneyland Park & Hotel' :
      booking.packageId === 'special-events' ? 'Special Events' :
      'Custom Package'
    );
    
    // Get customer information from user model if available
    const customerName = booking.customerId?.firstName && booking.customerId?.lastName
      ? `${booking.customerId.firstName} ${booking.customerId.lastName}`
      : booking.customerName || 'Not provided';
    
    const customerEmail = booking.customerId?.email || booking.customerEmail || 'Not provided';
    const customerPhone = booking.customerId?.phone || booking.customerPhone || 'Not provided';
    
    // Format stops if they exist
    const stopsHtml = booking.stops && booking.stops.length > 0
      ? `
        <div style="margin-top: 15px;">
          <h3 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 16px;">Additional Stops:</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${booking.stops.map((stop: any, index: number) => `
              <li style="margin-bottom: 8px; padding: 8px; background-color: #f8f8f8; border-radius: 4px;">
                <strong>Stop ${index + 1}:</strong> ${stop.location}
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : '';
    
    // Airport code (if applicable)
    const airportInfo = booking.airportCode 
      ? `<p style="color: #4a4a4a; margin: 8px 0;"><strong>Airport:</strong> ${booking.airportCode}</p>` 
      : '';
    
    // Passenger count information
    const passengerInfo = booking.passengers 
      ? `<p style="color: #4a4a4a; margin: 8px 0;"><strong>Passengers:</strong> ${booking.passengers}</p>` 
      : '';
    
    // Price information
    const priceInfo = booking.price
      ? `<p style="color: #4a4a4a; margin: 8px 0;"><strong>Total Amount:</strong> $${booking.price.toFixed(2)}</p>`
      : '';
    
    // Gratuity information
    const gratuityInfo = booking.gratuity && booking.gratuity.type !== 'none'
      ? `<p style="color: #4a4a4a; margin: 8px 0;"><strong>Gratuity:</strong> $${booking.gratuity.amount.toFixed(2)} (${booking.gratuity.type === 'percentage' ? `${booking.gratuity.percentage}%` : booking.gratuity.type === 'custom' ? 'Custom Amount' : 'Cash'})</p>`
      : '';
    
    const template = {
      subject: `Booking Confirmation - ${booking._id}`,
      text: `Thank you for your booking with Kar Limo LAX. Your booking has been confirmed.
      
Booking Details:
- Booking ID: ${booking._id}
- Package: ${packageInfo}
- Vehicle: ${vehicleInfo}
- Pickup: ${booking.pickupLocation}
- Dropoff: ${booking.dropoffLocation}
${booking.stops ? `- Additional Stops: ${booking.stops.map((stop: any) => stop.location).join(', ')}` : ''}
- Date: ${formattedDate}
- Time: ${formattedTime}
${booking.passengers ? `- Passengers: ${booking.passengers}` : ''}
${booking.price ? `- Total Amount: $${booking.price.toFixed(2)}` : ''}
${booking.gratuity && booking.gratuity.type !== 'none' ? `- Gratuity: $${booking.gratuity.amount.toFixed(2)} (${booking.gratuity.type === 'percentage' ? `${booking.gratuity.percentage}%` : booking.gratuity.type === 'custom' ? 'Custom Amount' : 'Cash'})` : ''}
      
Customer Information:
- Name: ${customerName}
- Email: ${customerEmail}
- Phone: ${customerPhone}
      
If you have any questions about your booking, please contact our customer service team.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; padding: 20px 0; background-color: #f2c568; margin: -20px -20px 20px -20px;">
              <h1 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: bold;">Booking Confirmation</h1>
              <p style="color: #1a1a1a; margin: 10px 0 0 0; font-weight: 600;">Kar Limo LAX</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 20px 0;">
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Dear ${customerName},
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Thank you for choosing Kar Limo LAX for your transportation needs. Your booking has been confirmed and we're looking forward to providing you with exceptional service.
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Please review your booking details below. If you need to make any changes or have questions, please contact us at your earliest convenience.
              </p>

              <!-- Booking Details Section -->
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #f2c568; padding-bottom: 10px;">
                  Booking Details
                </h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Booking ID:</strong><br>${booking._id}</p>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Package:</strong><br>${packageInfo}</p>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Vehicle:</strong><br>${vehicleInfo}</p>
                    ${airportInfo}
                    ${passengerInfo}
                  </div>
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Date:</strong><br>${formattedDate}</p>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Time:</strong><br>${formattedTime}</p>
                    ${priceInfo}
                    ${gratuityInfo}
                  </div>
                </div>
              </div>

              <!-- Location Details Section -->
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #f2c568; padding-bottom: 10px;">
                  Location Details
                </h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Pickup Location:</strong><br>${booking.pickupLocation}</p>
                  </div>
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Dropoff Location:</strong><br>${booking.dropoffLocation}</p>
                  </div>
                </div>
                ${stopsHtml}
              </div>

              <!-- Customer Information Section -->
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #f2c568; padding-bottom: 10px;">
                  Customer Information
                </h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Name:</strong><br>${customerName}</p>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Email:</strong><br>${customerEmail}</p>
                  </div>
                  <div>
                    <p style="color: #4a4a4a; margin: 8px 0;"><strong>Phone:</strong><br>${customerPhone}</p>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="color: #4a4a4a; margin: 0 0 10px 0;">If you have any questions about your booking, please contact us:</p>
                <p style="color: #4a4a4a; margin: 0;">
                  <strong>Phone:</strong> (424) 526-0457<br>
                  <strong>Email:</strong> Knockoutautorentals@gmail.com
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e5e5; margin-top: 20px;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                This is an automated message, please do not reply to this email.<br>
                © ${new Date().getFullYear()} Kar Limo LAX. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    console.log('Booking confirmation template created successfully');
    return template;
  }
};

export const sendBookingConfirmation = async (booking: any): Promise<void> => {
  const emailTemplate = templates.bookingConfirmation(booking);
  await sendEmail({
    to: booking.customerEmail,
    subject: emailTemplate.subject,
    text: emailTemplate.text,
    html: emailTemplate.html
  });
};
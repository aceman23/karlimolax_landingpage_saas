import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { AdminSettings } from '../models/schema.js';

dotenv.config();

// Create a transporter using SMTP
// Note: The "from" address in emails must match the authenticated SMTP_USER
// If SMTP_USER is karlimolax@gmail.com, Gmail will use that as the sender
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Set default from address (though Gmail may override based on auth user)
  defaults: {
    from: 'karlimolax@gmail.com',
  },
});

interface BookingDetails {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: Date;
  dropoffTime: Date;
  status: string;
  price: number;
  specialInstructions?: string;
  packageName?: string;
  hours?: number;
  passengers?: number;
}

export const sendBookingNotificationEmail = async (booking: any) => {
  try {
    console.log('Starting admin notification email process...');
    console.log('Booking object:', JSON.stringify(booking, null, 2));
    
    // Get or create admin settings
    const adminSettings = await AdminSettings.getOrCreateAdminSettings();
    console.log('Admin settings retrieved:', {
      emailEnabled: adminSettings.emailEnabled,
      sendToAdmin: adminSettings.emailNotifications?.sendToAdmin,
      adminEmails: adminSettings.emailNotifications?.adminEmails
    });

    // Check if admin email notifications are enabled
    if (!adminSettings.emailEnabled || !adminSettings.emailNotifications?.sendToAdmin) {
      console.log('Admin email notifications are disabled in settings');
      return;
    }

    // Get admin emails
    const adminEmails = adminSettings.emailNotifications?.adminEmails || [];
    if (!adminEmails.length) {
      console.log('No admin emails configured');
      return;
    }

    // Validate SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration is incomplete');
      return;
    }

    // Get email template
    const template = adminSettings.emailNotifications?.customTemplates?.admin || `
      New Booking Details:
      
      Booking ID: {{bookingId}}
      Customer: {{customerName}}
      Email: {{customerEmail}}
      Phone: {{customerPhone}}
      
      Pickup: {{pickupLocation}}
      Dropoff: {{dropoffLocation}}
      Pickup Time: {{pickupTime}}
      Dropoff Time: {{dropoffTime}}
      
      Status: {{status}}
      Price: {{price}}
      Package: {{packageName}}
      Vehicle: {{vehicleInfo}}
      Hours: {{hours}}
      Passengers: {{passengers}}
      Gratuity: {{gratuity}}
      Special Instructions: {{specialInstructions}}
    `;

    // Format email content
    const vehicleInfo = booking.vehicleId?.name || booking.vehicleName || 'N/A';
    const content = template
      .replace('{{bookingId}}', booking._id?.toString() || 'N/A')
      .replace('{{customerName}}', booking.customerName || `${booking.customerId?.profileId?.firstName || ''} ${booking.customerId?.profileId?.lastName || ''}`.trim() || 'N/A')
      .replace('{{customerEmail}}', booking.customerEmail || booking.customerId?.profileId?.email || 'N/A')
      .replace('{{customerPhone}}', booking.customerPhone || booking.customerId?.profileId?.phone || 'N/A')
      .replace('{{pickupLocation}}', booking.pickupLocation || 'N/A')
      .replace('{{dropoffLocation}}', booking.dropoffLocation || 'N/A')
      .replace('{{pickupTime}}', booking.pickupTime ? new Date(booking.pickupTime).toLocaleString() : 'N/A')
      .replace('{{dropoffTime}}', booking.dropoffTime ? new Date(booking.dropoffTime).toLocaleString() : 'N/A')
      .replace('{{status}}', booking.status || 'N/A')
      .replace('{{price}}', booking.price ? `$${booking.price.toFixed(2)}` : 'N/A')
      .replace('{{packageName}}', booking.packageName || booking.packageId?.name || 'N/A')
      .replace('{{vehicleInfo}}', vehicleInfo)
      .replace('{{hours}}', booking.hours?.toString() || 'N/A')
      .replace('{{passengers}}', booking.passengers?.toString() || 'N/A')
      .replace('{{gratuity}}', booking.gratuity && booking.gratuity.type !== 'none' ? `$${booking.gratuity.amount.toFixed(2)} (${booking.gratuity.type === 'percentage' ? `${booking.gratuity.percentage}%` : booking.gratuity.type === 'custom' ? 'Custom Amount' : 'Cash'})` : 'None')
      .replace('{{specialInstructions}}', booking.specialInstructions || booking.notes || 'N/A');

    // Send emails to all admin addresses
    // CRITICAL: SMTP_USER in .env MUST be karlimolax@gmail.com
    // Gmail will override the "from" field with the authenticated user's email
    const fromAddress = 'karlimolax@gmail.com';
    
    // Validate SMTP_USER matches the desired from address
    const smtpUser = process.env.SMTP_USER?.trim().toLowerCase();
    const requiredUser = 'karlimolax@gmail.com';
    
    if (!smtpUser || smtpUser !== requiredUser) {
      console.error(`[ERROR] SMTP_USER (${process.env.SMTP_USER || 'not set'}) does not match required from address (${requiredUser})`);
      console.error(`[ERROR] Cannot send email - SMTP_USER must be ${requiredUser}`);
      return;
    }
    
    const emailPromises = adminEmails.map(async (email: string) => {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: `New Booking Notification - ${booking._id?.toString() || 'N/A'}`,
          text: content
        });
        console.log(`Admin notification email sent successfully to ${email}`);
        return { email, success: true };
      } catch (error) {
        console.error(`Failed to send admin notification email to ${email}:`, error);
        return { email, success: false, error };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter((r: any) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter((r: any) => r.status === 'rejected' || !r.value.success).length;

    console.log(`Admin notification email results: ${successful} successful, ${failed} failed`);
  } catch (error) {
    console.error('Error sending admin notification email:', error);
  }
}; 
import express from 'express';
import { Booking, Profile } from '../models/schema.js';
import connectDB from '../db.js';
import { sendBookingEmails } from '../services/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await connectDB();
    
    const booking = new Booking(req.body);
    await booking.save();

    // Get driver details if assigned
    let driverDetails = {};
    if (booking.driverId) {
      const driver = await Profile.findById(booking.driverId);
      if (driver) {
        driverDetails = {
          driverName: `${driver.firstName} ${driver.lastName}`,
          driverEmail: driver.email
        };
      }
    }

    // Prepare booking details for email
    const bookingDetails = {
      bookingId: booking._id.toString(),
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      pickupTime: booking.pickupTime.toLocaleString(),
      dropoffTime: booking.dropoffTime.toLocaleString(),
      status: booking.status,
      price: booking.price,
      specialInstructions: booking.specialInstructions,
      ...driverDetails
    };

    // Send emails
    try {
      await sendBookingEmails(bookingDetails, req.body.emailSettings);
    } catch (emailError) {
      console.error('Error sending booking emails:', emailError);
      // Don't fail the booking creation if email sending fails
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router; 
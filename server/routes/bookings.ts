import express, { Request, Response } from 'express';
import { Booking, Stop } from '../models/schema.js';
import { sendBookingNotificationEmail } from '../utils/emailService.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Middleware to authenticate token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // For now, we'll just check if the token exists
  // In a real application, you would verify the JWT token
  next();
};

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {

  console.log('here 2');
  
  console.log('req.body', req.body);

  try {
    const {
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      dropoffTime,
      price,
      specialInstructions,
      packageId,
      packageName,
      vehicleId,
      vehicleName,
      hours,
      passengers,
      carSeats,
      boosterSeats,
      totalAmount,
      stops
    } = req.body;
    
    console.log('DEBUG - Vehicle info from request:', { vehicleId, vehicleName });
    
    // Create the booking
    const booking = await Booking.create({
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      dropoffTime,
      price,
      totalAmount,
      specialInstructions,
      packageId,
      packageName,
      vehicleId,
      vehicleName,
      hours: hours && hours > 0 ? hours : undefined,
      passengers,
      carSeats,
      boosterSeats,
      status: 'pending',
      paymentStatus: 'paid'
    });

    // Create stops if provided
    if (stops && stops.length > 0) {
      const stopPromises = stops.map((stop: any, index: number) => 
        Stop.create({
          bookingId: booking._id,
          location: stop.location,
          order: index + 1,
          price: stop.price || 0
        })
      );
      await Promise.all(stopPromises);
    }

    // Send email notification to admin
    try {
      await sendBookingNotificationEmail({
        bookingId: booking._id.toString(),
        customerName,
        customerEmail,
        customerPhone,
        pickupLocation,
        dropoffLocation,
        pickupTime,
        dropoffTime,
        status: 'pending',
        price,
        specialInstructions,
        packageName,
        hours,
        passengers
      });
    } catch (emailError) {
      console.error('Failed to send booking notification email:', emailError);
      // Don't fail the booking creation if email fails
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ... existing code ... 
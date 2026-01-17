import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sendEmail, templates } from '../utils/email.js';
import crypto from 'crypto';
import connectDB from '../db.js';
import { Profile } from '../models/schema.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Authentication Middleware
const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    console.error('[ERROR] JWT_SECRET is not set in environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'JWT_SECRET environment variable is not configured.',
      code: 'MISSING_JWT_SECRET'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; email: string; role: string; iat: number; exp: number };
    req.user = { 
      userId: decoded.userId, 
      email: decoded.email,
      role: decoded.role 
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Admin Role Middleware
const adminRoleMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Testing email configuration...');
    console.log('Environment variables:', {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_FROM: process.env.SMTP_FROM,
      FRONTEND_URL: process.env.FRONTEND_URL
    });

    // Send test email
    await sendEmail({
      to: email,
      subject: 'Test Email from Dapper Limo LAX',
      text: 'This is a test email to verify the email configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Test Email</h2>
          <p style="color: #4a4a4a;">This is a test email to verify the email configuration.</p>
          <p style="color: #4a4a4a;">If you received this email, the email system is working correctly.</p>
        </div>
      `
    });

    res.json({ message: 'Test email sent successfully' });
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({ message: `Failed to send test email: ${error.message}` });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    console.log('[DEBUG] Login attempt for email:', email);

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`[DEBUG] Login Attempt - User not found for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Email verification is not required - users can log in immediately after account creation

    // Check password
    try {
      const isValidPassword = await user.comparePassword(password);
      
      if (!isValidPassword) {
        console.log(`[DEBUG] Login Attempt - Invalid password for user: ${email}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (passwordError) {
      console.error('[ERROR] Password comparison failed:', passwordError);
      return res.status(500).json({ error: 'Error validating password' });
    }

    // Check if profile exists, if not create it
    try {
      let profile = await Profile.findOne({ userId: user._id });
      
      if (!profile) {
        console.log('[DEBUG] Creating new profile for user:', user._id);
        
        // Check if a profile with this email already exists
        const existingProfileByEmail = await Profile.findOne({ email: user.email });
        if (existingProfileByEmail) {
          // If profile exists but with different userId, update it
          existingProfileByEmail.userId = user._id;
          existingProfileByEmail.role = user.role;
          if (user.role === 'driver' && !existingProfileByEmail.driverStatus) {
            existingProfileByEmail.driverStatus = 'offline';
          }
          await existingProfileByEmail.save();
          profile = existingProfileByEmail;
          console.log('[DEBUG] Updated existing profile with new userId:', profile._id);
        } else {
          // Create new profile
          profile = await Profile.create({
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            driverStatus: user.role === 'driver' ? 'offline' : undefined
          });
          console.log('[DEBUG] Profile created successfully:', profile._id);
        }
      } else if (user.role === 'driver' && !profile.driverStatus) {
        // Update existing profile if it's a driver but missing driverStatus
        profile.driverStatus = 'offline';
        await profile.save();
        console.log('[DEBUG] Updated existing profile with driver status:', profile._id);
      }
    } catch (profileError) {
      console.error('[ERROR] Profile creation/retrieval failed:', profileError);
      return res.status(500).json({ error: 'Failed to create/update profile' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[ERROR] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register route - Public sign-up enabled
router.post('/register', async (req, res) => {
  try {
    await connectDB();
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields (email, password, firstName, lastName) are required' });
    }

    // Normalize email (trim and lowercase) - though User schema setter should handle this
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user - email verification not required
    const user = await User.create({
      email: normalizedEmail,
      password, // Plain password - will be hashed by pre-save hook
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role || 'customer',
      isEmailVerified: true // Set to true by default - no email verification required
    });

    // Return user data (excluding sensitive information)
    const { password: _, emailVerificationToken: __, ...userData } = user.toObject();
    res.status(201).json({
      user: userData,
      message: 'User account created successfully.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.body;
    console.log('=== Forgot Password Process Start ===');
    console.log('Request received for email:', email);

    if (!email) {
      console.log('Error: Email is missing');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Normalize email by trimming whitespace and converting to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);

    console.log('Looking up user in database...');
    const user = await User.findOne({ email: normalizedEmail });
    console.log('Database query result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.log('No user found for email:', normalizedEmail);
      // Don't reveal that the user doesn't exist for security reasons
      return res.json({ message: 'If an account exists with that email, you will receive password reset instructions.' });
    }

    console.log('User found:', { id: user._id, email: user.email });
    console.log('Generating reset token...');
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    console.log('Saving reset token to user...');
    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    console.log('Reset token saved successfully');

    // Create reset URL
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL); // Debug log
    if (!process.env.FRONTEND_URL) {
      console.error('Error: FRONTEND_URL environment variable is not set');
      throw new Error('FRONTEND_URL environment variable is not set');
    }
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    // Get email template
    console.log('Preparing email template...');
    const emailTemplate = templates.passwordReset(resetUrl);
    console.log('Email template prepared');

    try {
      console.log('Attempting to send reset email...');
      console.log('Email configuration:', {
        to: user.email,
        subject: emailTemplate.subject,
        hasHtml: !!emailTemplate.html,
        hasText: !!emailTemplate.text
      });

      // Send email
      await sendEmail({
        to: user.email,
        ...emailTemplate
      });

      console.log('Reset email sent successfully');
      res.json({ message: 'If an account exists with that email, you will receive password reset instructions.' });
    } catch (emailError: any) {
      console.error('Email sending error:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        stack: emailError.stack
      });
      // Revert the token changes if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw new Error(`Failed to send reset email: ${emailError.message}`);
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: error.message || 'Error sending reset email' });
  } finally {
    console.log('=== Forgot Password Process End ===');
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    await connectDB();
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update user's password and clear reset token
    user.password = password; // Let the pre-save hook hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

export default router; 
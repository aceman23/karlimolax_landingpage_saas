import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Profile } from '../models/schema';
// import connectDB from './mongodb'; // TS2307: Module not found, and shouldn't be used client-side

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthResult {
  user?: any;
  error?: {
    message: string;
  };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    // await connectDB(); // Client should call API
    
    const profile = await Profile.findOne({ email }); // Problematic: Mongoose model on client
    if (!profile) {
      return { error: { message: 'User not found' } };
    }

    // For admin users, we'll use a simple password check
    if (profile.role === 'admin') {
      if (password !== 'admin123') { // This is also insecure client-side
        return { error: { message: 'Invalid password' } };
      }
    } else {
      // For other users, we'll use bcrypt
      if (!profile.password) { // Add check for password existence
        return { error: { message: 'User profile has no password set.' } };
      }
      const isValid = await bcrypt.compare(password, profile.password);
      if (!isValid) {
        return { error: { message: 'Invalid password' } };
      }
    }

    const token = jwt.sign(
      { 
        userId: profile.userId,
        email: profile.email,
        role: profile.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      user: {
        ...profile.toObject(),
        token
      }
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    // Ensure connectDB is not called in catch if it was problematic
    return { error: { message: error.message } };
  }
}

export async function signUp(email: string, password: string, firstName: string, lastName: string): Promise<AuthResult> {
  try {
    // await connectDB(); // Client should call API

    const existingProfile = await Profile.findOne({ email }); // Problematic
    if (existingProfile) {
      return { error: { message: 'User already exists' } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Math.random().toString(36).substring(2);

    const profile = await Profile.create({
      userId,
      email,
      firstName,
      lastName,
      role: 'customer',
      password: hashedPassword
    });

    const token = jwt.sign(
      { 
        userId: profile.userId,
        email: profile.email,
        role: profile.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      user: {
        ...profile.toObject(),
        token
      }
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { error: { message: error.message } };
  }
}

export async function getCurrentUser(token: string): Promise<AuthResult> {
  try {
    // await connectDB(); // Client should call API

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const profile = await Profile.findOne({ userId: decoded.userId });

    if (!profile) {
      return { error: { message: 'User not found' } };
    }

    return {
      user: {
        ...profile.toObject(),
        token
      }
    };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return { error: { message: error.message } };
  }
}

export async function signOut(): Promise<void> {
  // In a JWT-based system, we don't need to do anything on the server side
  // The client should remove the token from storage
} 
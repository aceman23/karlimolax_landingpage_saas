const API_BASE_URL = 'http://localhost:3000/api';

export async function getProfiles() {
  const response = await fetch(`${API_BASE_URL}/profiles`);
  if (!response.ok) {
    throw new Error('Failed to fetch profiles');
  }
  return response.json();
}

interface VerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  alreadyVerified?: boolean;
  expired?: boolean;
}

export const verifyEmail = async (token: string): Promise<VerificationResponse> => {
  try {
    console.log('Verifying email with token:', token); // Debug log
    
    const response = await fetch(`${API_BASE_URL}/verify-email/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Verification response data:', data); // Debug log

  if (!response.ok) {
      console.error('Verification failed:', data); // Debug log
      return {
        success: false,
        error: data.error || 'Failed to verify email',
        expired: data.expired || false
      };
  }

    return data;
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

export const resendVerification = async (email: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to resend verification email');
  }
  return response.json();
};

// Add more API functions as needed 
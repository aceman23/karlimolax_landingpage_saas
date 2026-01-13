import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';

export default function EmailVerificationPage() {
  const location = useLocation();
  const { token } = useParams();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (token && !hasVerified.current) {
      hasVerified.current = true;
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setVerificationStatus('loading');
    try {
      const response = await fetch(`/api/verify-email/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify email');
      }

      setVerificationStatus('success');
      setMessage(data.message || 'Email verified successfully!');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: data.message || 'Email verified successfully! You can now log in.',
            type: 'success'
          }
        });
      }, 3000);
    } catch (error: any) {
      setVerificationStatus('error');
      setMessage(error.message || 'Failed to verify email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      toast.success('Verification email has been resent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email. Please try again.');
    }
  };

  // If we have a token, show verification status
  if (token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Helmet>
          <title>Verifying Email | Kar Limo LAX</title>
          <meta name="description" content="Verifying your email address for Kar Limo LAX." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            {verificationStatus === 'loading' && (
              <Mail className="mx-auto h-12 w-12 text-purple-600 animate-pulse" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            )}
            {verificationStatus === 'error' && (
              <XCircle className="mx-auto h-12 w-12 text-red-600" />
            )}
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {verificationStatus === 'loading' && 'Verifying Your Email...'}
              {verificationStatus === 'success' && 'Email Verified!'}
              {verificationStatus === 'error' && 'Verification Failed'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </div>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              {verificationStatus === 'success' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Redirecting you to the login page...
                  </p>
                </div>
              )}
              {verificationStatus === 'error' && (
                <div className="space-y-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleResendVerification}
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}
              <Link to="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial verification page
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Verify Your Email | Kar Limo LAX</title>
        <meta name="description" content="Verify your email address to complete your registration with Kar Limo LAX." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-purple-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to {email}
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Please check your email and click the verification link to complete your registration.
                If you don't see the email, check your spam folder.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </Button>

              <Link to="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
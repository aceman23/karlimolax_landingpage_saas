import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LocationState {
  from?: {
    pathname: string;
  };
  message?: string;
  type?: string;
  showRegistration?: boolean;
}

export default function LoginPage() {
  const { signIn, isAdmin, isDriver } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    general?: string 
  }>({});

  // Show success message if redirected from email verification
  useEffect(() => {
    if (state?.message && state?.type === 'success') {
      toast.success(state.message);
    }
  }, [state]);

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
    } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Sign-up is disabled - only admins can create accounts
      const result = await signIn(email, password);
      
      if (result.error) {
        console.error('Login error:', result.error);
        setErrors({ 
          general: 'The email or password you entered is incorrect. Please try again.',
          password: 'Incorrect password' 
        });
        toast.error('Invalid login credentials', { duration: 5000 });
      } else {
        toast.success('Login successful');
        
        // Redirect based on user role
        if (isAdmin()) {
          navigate('/admin');
        } else if (isDriver()) {
          navigate('/driver');
        } else {
          navigate(state?.from?.pathname || '/');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ 
        general: `An unexpected error occurred: ${error.message || 'Please try again later'}`
      });
      toast.error('An error occurred during login', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Login | Kar Limo LAX</title>
        <meta name="description" content="Log in to your Kar Limo LAX account." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-brand">
          KarLimoLax.com
        </h1>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access the limo service portal for admins and drivers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{errors.general}</div>
              </div>
            )}


            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>


            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-brand hover:text-brand-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
              >
                {isLoading ? (
                  'Processing...'
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
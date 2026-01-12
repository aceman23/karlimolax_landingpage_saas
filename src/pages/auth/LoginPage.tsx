import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { LogIn, UserPlus } from 'lucide-react';
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
  const { signIn, signUp, isAdmin, isDriver } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [isRegistering, setIsRegistering] = useState(state?.showRegistration || false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
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
      confirmPassword?: string;
      firstName?: string;
      lastName?: string;
    } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (isRegistering) {
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
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
      let result;
      if (isRegistering) {
        result = await signUp(email, password, firstName, lastName);
        
        if (result.error) {
          console.error('Registration error:', result.error);
          setErrors({ 
            general: 'Failed to create account. Please try again.'
          });
          toast.error('Registration failed', { duration: 5000 });
        } else {
          // Redirect to email verification page
          navigate('/verify-email', { 
            state: { 
              email,
              message: 'Registration successful. Please check your email to verify your account.'
            }
          });
        }
      } else {
        result = await signIn(email, password);
      
      if (result.error) {
          console.error('Login error:', result.error);
          if (result.error.needsVerification) {
            setErrors({ 
              general: 'Please verify your email before logging in.'
            });
            toast.error('Please verify your email before logging in', { duration: 5000 });
          } else {
        setErrors({ 
              general: 'The email or password you entered is incorrect. Please try again.',
          password: 'Incorrect password' 
        });
            toast.error('Invalid login credentials', { duration: 5000 });
      }
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
      }
    } catch (error: any) {
      console.error(isRegistering ? 'Registration error:' : 'Login error:', error);
      setErrors({ 
        general: `An unexpected error occurred: ${error.message || 'Please try again later'}`
      });
      toast.error(`An error occurred during ${isRegistering ? 'registration' : 'login'}`, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>{isRegistering ? 'Sign Up' : 'Login'} | Dapper Limo LAX</title>
        <meta name="description" content={`${isRegistering ? 'Create' : 'Log in to'} your Dapper Limo LAX account.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-cyan-600">
          DapperLimoLax.com
        </h1>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isRegistering ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRegistering 
            ? 'Join Dapper Limo LAX for premium transportation services'
            : 'Access the limo service portal for admins and drivers'}
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

            {isRegistering && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                    />
                    {errors.firstName && (
                      <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                    />
                    {errors.lastName && (
                      <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </>
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
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
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
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-cyan-600 hover:text-cyan-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                {isLoading ? (
                  'Processing...'
                ) : isRegistering ? (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                {isRegistering ? (
                  <>
                    <LogIn className="h-5 w-5 mr-2 text-gray-400" />
                    Sign in instead
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2 text-gray-400" />
                    Create new account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
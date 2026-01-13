import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'driver' | 'customer';
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role?: 'customer' | 'admin' | 'driver') => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isDriver: () => boolean;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  async function signIn(email: string, password: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          return { error: { needsVerification: true, message: data.error } };
        }
        return { error: new Error(data.error || 'Failed to login') };
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.token);

      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  }

  async function signUp(email: string, password: string, firstName: string, lastName: string, role: 'customer' | 'admin' | 'driver' = 'customer') {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          firstName,
          lastName,
          role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Failed to register') };
      }

      // Don't automatically log in the user
      // Instead, show a message about email verification
      return { 
        error: null,
        message: data.message || 'Registration successful. Please check your email to verify your account.'
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  }

  async function logout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  function isAdmin() {
    return user?.role === 'admin';
  }

  function isDriver() {
    return user?.role === 'driver';
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        logout,
        isAdmin,
        isDriver,
        setToken,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
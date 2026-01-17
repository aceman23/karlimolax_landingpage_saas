import React, { createContext, useContext } from 'react';
import { vi } from 'vitest';

export const mockAuthContext = {
  user: {
    id: 'admin-123',
    email: 'admin@test.com',
    role: 'admin' as const,
    firstName: 'Admin',
    lastName: 'User',
  },
  token: 'mock-token-123',
  loading: false,
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  logout: vi.fn().mockResolvedValue(undefined),
  isAdmin: () => true,
  isDriver: () => false,
  setToken: vi.fn(),
  isAuthenticated: true,
};

export const AuthContext = createContext(mockAuthContext);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
}

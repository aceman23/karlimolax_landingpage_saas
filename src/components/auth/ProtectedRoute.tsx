import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredRole?: 'admin' | 'driver' | 'customer';
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredRole
}: ProtectedRouteProps) {
  const { user, isAdmin, isDriver } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    // Redirect to home page if not admin
    return <Navigate to="/" replace />;
  }

  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin()) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole === 'driver' && !isDriver()) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
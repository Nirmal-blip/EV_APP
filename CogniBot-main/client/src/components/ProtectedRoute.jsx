import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, blockAdmin = false }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  const isAdmin = currentUser.profile && currentUser.profile.role === 'admin';

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  if (blockAdmin && isAdmin) {
    return <Navigate to="/admin" />;
  }

  return children;
}

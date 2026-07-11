import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageLoadingState } from '@/components/Spinner';

// Mirrors the backend's authenticate/authorize split: ProtectedRoute is
// "you must be logged in" (any role), AdminRoute is "you must be logged in
// AND be an admin" -- exactly the same two-tier distinction as
// authenticate vs. authorize(Role.ADMIN) on the server. The server is
// still the actual source of truth/enforcement (a client-side guard is
// just UX, never security -- a determined user can bypass any frontend
// check), but mirroring the same model keeps the mental model consistent
// across the whole stack.

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (!isAuthenticated) {
    // Preserve where the user was headed so we can send them back after
    // login, instead of always dumping them on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

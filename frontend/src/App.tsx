import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminRoute, ProtectedRoute } from '@/components/RouteGuards';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VehicleDetailPage } from '@/pages/VehicleDetailPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// One QueryClient instance for the whole app's lifetime -- created outside
// the component so it isn't recreated (losing all cached data) on every
// render.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on every window focus by default -- fine for most
      // apps, but for an inventory system where stock changes matter,
      // React Query's default 0-staleTime already refetches on mount/
      // remount, which covers the common case (navigating back to the
      // dashboard) without being overly aggressive.
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Browsing now requires login -- the kata spec groups
                  GET /vehicles, /search, and /:id under "Vehicles
                  (Protected)", so the backend rejects these without a
                  valid token. The frontend mirrors that here rather than
                  showing a dashboard that would just 401 on load. */}
              <Route element={<ProtectedRoute />}>
                <Route index element={<DashboardPage />} />
                <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminRoute } from '@/components/RouteGuards';
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
              <Route index element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/vehicles/:id" element={<VehicleDetailPage />} />

              {/* Purchasing is gated inline on VehicleDetailPage (checks
                  isAuthenticated directly) rather than behind a route --
                  the page itself is public (anyone can VIEW a vehicle),
                  only the purchase action requires login. ProtectedRoute
                  (see components/RouteGuards.tsx) is available and tested
                  for any future USER-only PAGE, e.g. "my purchase history". */}

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

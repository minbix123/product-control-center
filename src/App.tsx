import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { VersionDetailPage } from './pages/VersionDetailPage';
import { ActivityPage } from './pages/ActivityPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingIndicator } from './components/ui/LoadingIndicator';
import type { ReactNode } from 'react';

// Guard: redirect to login if not authenticated
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingIndicator fullPage label="Authenticating..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Guard: redirect to dashboard if already logged in
function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingIndicator fullPage label="Loading..." />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <RequireGuest>
          <LoginPage />
        </RequireGuest>
      } />

      {/* Protected routes wrapped in AppLayout */}
      <Route element={
        <RequireAuth>
          <RealtimeProvider>
            <AppLayout />
          </RealtimeProvider>
        </RequireAuth>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/products/:productId/versions/:versionId" element={<VersionDetailPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

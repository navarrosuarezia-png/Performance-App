import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import HourlyLogPage from '@/pages/HourlyLogPage';
import DashboardPage from '@/pages/DashboardPage';
import IncidentsPage from '@/pages/IncidentsPage';
import ReportsPage from '@/pages/ReportsPage';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppProvider>
              <AppShell />
            </AppProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/registro" replace />} />
        <Route path="registro" element={<HourlyLogPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="incidencias" element={<IncidentsPage />} />
        <Route path="reportes" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

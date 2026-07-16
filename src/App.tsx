import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { I18nProvider } from './lib/I18nContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CarRental from './pages/CarRental';
import UserAuth from './pages/UserAuth';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import StockManagement from './pages/admin/StockManagement';
import CustomerDatabase from './pages/admin/CustomerDatabase';
import BookingManagement from './pages/admin/BookingManagement';
import AdminLayout from './components/admin/AdminLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-toska-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function AdminLoginRoute() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-toska-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminLogin />;
}

function UserAuthRoute() {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50">
        <div className="w-12 h-12 border-4 border-toska-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If already logged in, redirect
  if (isLoggedIn) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <UserAuth />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/sewa-mobil" element={<><Navbar /><CarRental /></>} />

            {/* User Auth (Login/Sign Up) */}
            <Route path="/login" element={<UserAuthRoute />} />

            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLoginRoute />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute><BookingManagement /></ProtectedRoute>} />
            <Route path="/admin/stock" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute><CustomerDatabase /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

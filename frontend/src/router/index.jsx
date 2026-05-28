import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

// Layouts
import CustomerLayout from '../components/layout/CustomerLayout';
import StaffLayout from '../components/layout/StaffLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Public pages
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import Invoice from '../pages/public/Invoice';
import ServicesPage from '../pages/public/ServicesPage';
import CategoriesPage from '../pages/public/CategoriesPage';

// Customer pages
import CustomerDashboard from '../pages/customer/Dashboard';
import CustomerOrders from '../pages/customer/Orders';
import CustomerOrderNew from '../pages/customer/OrderNew';
import CustomerOrderDetail from '../pages/customer/OrderDetail';
import CustomerProfile from '../pages/customer/Profile';

// Staff pages
import StaffOrders from '../pages/staff/Orders';
import StaffOrderDetail from '../pages/staff/OrderDetail';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminOrders from '../pages/admin/Orders';
import AdminOrderDetail from '../pages/admin/OrderDetail';
import AdminUsers from '../pages/admin/Users';
import AdminServices from '../pages/admin/Services';
import AdminCategories from '../pages/admin/Categories';
import AdminPayments from '../pages/admin/Payments';
import AdminStaffMetrics from '../pages/admin/StaffMetrics';
import AdminNotifications from '../pages/admin/Notifications';
import AdminErrorLogs from '../pages/admin/ErrorLogs';

// Helper to determine landing page based on role
export const getDefaultRedirect = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'staff':
      return '/staff/orders';
    case 'customer':
    default:
      return '/dashboard';
  }
};

// Route Guard for unauthenticated guests (e.g. login, register pages)
export const GuestRoute = () => {
  const { isAuthenticated, user, token, fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Memverifikasi Sesi...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const userRole = user?.role?.name || user?.role;
    return <Navigate to={getDefaultRedirect(userRole)} replace />;
  }

  return <Outlet />;
};

// Route Guard for authenticated users based on allowed roles
export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, token, fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Memverifikasi Sesi...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to correct panel if user's role isn't authorized for this route
  const userRole = user?.role?.name || user?.role;
  if (user && allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDefaultRedirect(userRole)} replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Guest Route Guard (Redirect if already logged in) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Public Route Accessible by Everyone (No login required) */}
      <Route path="/invoice/:invoiceToken" element={<Invoice />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/categories" element={<CategoriesPage />} />

      {/* Protected Routes for Customer Panel */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/orders/new" element={<CustomerOrderNew />} />
          <Route path="/orders/:orderNumber" element={<CustomerOrderDetail />} />
          <Route path="/profile" element={<CustomerProfile />} />
        </Route>
      </Route>

      {/* Protected Routes for Staff Panel */}
      <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff/orders" element={<StaffOrders />} />
          <Route path="/staff/orders/:id" element={<StaffOrderDetail />} />
        </Route>
      </Route>

      {/* Protected Routes for Admin Panel */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/staff/metrics" element={<AdminStaffMetrics />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/logs" element={<AdminErrorLogs />} />
        </Route>
      </Route>

      {/* Wildcard / Fallback Redirection */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

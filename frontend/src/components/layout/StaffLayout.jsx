import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';

const StaffLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const [paymentsRes, ordersRes] = await Promise.all([
          api.get('/admin/payments'),
          api.get('/admin/orders')
        ]);
        if (paymentsRes.data?.success) {
          const count = paymentsRes.data.data.filter(p => p.status === 'pending').length;
          setPendingPayments(count);
        }
        if (ordersRes.data?.success) {
          const count = ordersRes.data.data.filter(o => o.order_status === 'received').length;
          setPendingOrders(count);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/staff/orders', label: 'Tugas Orderan' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-teal-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Role Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold">
                ST
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight">Anjem Staff</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                  Operasional Staf
                </span>
              </div>
            </div>

            {/* Navigation links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-teal-100 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-teal-100 hover:text-white transition-colors focus:outline-none" 
                  title="Notifikasi"
                >
                  <span className="text-xl">🔔</span>
                  {(pendingPayments + pendingOrders) > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                      {pendingPayments + pendingOrders}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Tugas & Info Baru</h3>
                    </div>
                    <div className="py-2">
                      <Link 
                        to="/staff/orders" 
                        onClick={() => setShowNotifications(false)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧺</span>
                          <span className="text-xs font-semibold text-slate-700">Tugas Baru Masuk</span>
                        </div>
                        {pendingOrders > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-[10px] font-bold text-teal-600">
                            {pendingOrders}
                          </span>
                        )}
                      </Link>
                      {/* For payments, staff can just see there are pending payments, 
                          but since staff orders view handles their payments indirectly, 
                          we keep the notification as a heads up or let them know payments need verification */}
                      <div className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-default">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💳</span>
                          <span className="text-xs font-semibold text-slate-700">Pembayaran Pending</span>
                        </div>
                        {pendingPayments > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600">
                            {pendingPayments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-semibold text-sm leading-tight text-white">
                  {user?.name || 'Staff'}
                </span>
                <span className="text-xs text-teal-200">{user?.phone}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-white text-teal-950 hover:bg-teal-50 text-xs font-bold shadow-sm transition-all duration-200"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="md:hidden border-t border-teal-800 bg-teal-950 flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-colors duration-200 ${
                  isActive ? 'text-teal-300' : 'text-teal-100 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Anjem Laundry. Staff Workspace.</p>
        </div>
      </footer>
    </div>
  );
};

export default StaffLayout;

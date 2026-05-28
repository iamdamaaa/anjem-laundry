import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';

const StaffLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const response = await api.get('/admin/payments');
        if (response.data?.success) {
          const count = response.data.data.filter(p => p.status === 'pending').length;
          setPendingPayments(count);
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
              <Link to="/staff/orders" className="relative p-2 text-teal-100 hover:text-white transition-colors" title="Order Menunggu Konfirmasi">
                <span className="text-xl">🔔</span>
                {pendingPayments > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                    {pendingPayments}
                  </span>
                )}
              </Link>
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

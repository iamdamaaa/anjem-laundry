import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const menuItems = [
    { path: '/admin/dashboard', label: 'Ringkasan', icon: '📊' },
    { path: '/admin/orders', label: 'Pesanan', icon: '🧺' },
    { path: '/admin/payments', label: 'Pembayaran', icon: '💳' },
    { path: '/admin/users', label: 'Pengguna & Staf', icon: '👥' },
    { path: '/admin/services', label: 'Layanan', icon: '🛠️' },
    { path: '/admin/categories', label: 'Kategori', icon: '📁' },
    { path: '/admin/staff/metrics', label: 'KPI Staf', icon: '📈' },
    { path: '/admin/notifications', label: 'Notifikasi', icon: '🔔' },
    { path: '/admin/logs', label: 'Error Logs', icon: '⚠️' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex font-sans">
      {/* Sidebar navigation */}
      <aside
        className={`bg-slate-900 text-slate-200 w-64 min-h-screen flex flex-col transition-all duration-300 border-r border-slate-800 ${
          sidebarOpen ? 'ml-0' : '-ml-64'
        } fixed md:static z-50`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-500/30">
              AD
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-white">Anjem Admin</span>
              <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">
                Full Control Panel
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex flex-col truncate">
              <span className="font-semibold text-xs text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 truncate">{user?.phone}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20 text-[9px] font-bold text-indigo-400">
              ADMIN
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            ☰
          </button>
          
          <div className="flex items-center gap-4">
            <Link to="/admin/payments" className="relative p-2 text-slate-500 hover:text-slate-800 transition-colors" title="Pembayaran Menunggu Konfirmasi">
              <span className="text-xl">🔔</span>
              {pendingPayments > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                  {pendingPayments}
                </span>
              )}
            </Link>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
              Workspace Aktif
            </span>
          </div>
        </header>

        {/* Dynamic content view */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

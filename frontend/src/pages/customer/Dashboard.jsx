import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/orders');
        if (response.data && response.data.success) {
          setOrders(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load orders for dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeOrders = orders.filter((o) => o.order_status !== 'completed');
  const totalOrders = orders.length;
  const unpaidOrders = orders.filter((o) => !o.is_paid);

  const getStatusLabelAndColor = (status) => {
    switch (status) {
      case 'received':
        return { label: 'Diterima', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'picked_up':
        return { label: 'Di-pickup', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'in_process':
        return { label: 'Diproses Staf', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'waiting_delivery':
        return { label: 'Menunggu Kirim', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'completed':
        return { label: 'Selesai', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Menyiapkan Ringkasan Dashboard..." />;
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-sm gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Halo, {user?.name || 'Pelanggan'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Selamat datang kembali. Siap untuk membuat pakaian Anda harum dan rapi hari ini?
          </p>
        </div>
        <Link
          to="/orders/new"
          className="w-full sm:w-auto px-6 py-3 rounded-md bg-primary hover:brightness-110 active:scale-95 text-white font-extrabold text-sm text-center shadow-sm transition-all duration-150"
        >
          🧺 Buat Pesanan Baru
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors duration-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center text-xl font-bold">
            📁
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Total Seluruh Order
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalOrders}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl font-bold">
            ⏳
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Pesanan Sedang Aktif
            </span>
            <span className="text-2xl font-black text-primary mt-1 block">{activeOrders.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors duration-200">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-error flex items-center justify-center text-xl font-bold">
            💳
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Belum Lunas
            </span>
            <span className="text-2xl font-black text-error mt-1 block">{unpaidOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Pesanan Terbaru</h2>
          <Link to="/orders" className="text-xs font-bold text-primary hover:underline">
            Lihat Semua Pesanan &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/60 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-2xl mx-auto">
              🧺
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Pesanan</h3>
              <p className="text-xs text-slate-500">Anda belum pernah membuat order laundry sebelumnya.</p>
            </div>
            <Link
              to="/orders/new"
              className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md transition-colors"
            >
              Mulai Pesanan Pertama Anda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.slice(0, 4).map((order) => {
              const { label: statusLabel, bg: statusBg } = getStatusLabelAndColor(order.order_status);
              const totalAmount = order.total_price_actual ? order.total_price_actual : order.total_price;
              const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const pickupDate = order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) : '-';
              const completionDate = order.completion_date ? new Date(order.completion_date).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) : '-';
              
              let itemsSummary = '';
              if (order.items && order.items.length > 0) {
                const names = order.items.slice(0, 2).map(i => i.service_name_snapshot);
                itemsSummary = names.join(', ');
                if (order.items.length > 2) {
                  itemsSummary += ` +${order.items.length - 2} lainnya`;
                }
              } else {
                itemsSummary = 'Belum ada item';
              }

              return (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">#{order.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{formattedDate}</span>
                    </div>
                    
                    <span className="text-sm font-black text-slate-950">
                      Rp {parseFloat(totalAmount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-3">
                    <p className="text-[11px] text-slate-600 font-medium truncate" title={itemsSummary}>
                      📦 {itemsSummary}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 flex-1">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Jadwal Pickup</span>
                        <span className="text-xs font-bold text-slate-800">{pickupDate}</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded border border-blue-100 flex-1">
                        <span className="text-[9px] font-extrabold uppercase text-primary block">Estimasi Selesai</span>
                        <span className="text-xs font-bold text-blue-900">{completionDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-auto">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.is_paid 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-red-50 text-error border border-red-100'
                    }`}>
                      {order.is_paid ? 'Lunas' : 'Belum Lunas'}
                    </span>

                    <Link
                      to={`/orders/${order.order_number}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Detail Pesanan &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

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

const OrderCard = memo(({ order }) => {
  const { label: statusLabel, bg: statusBg } = getStatusLabelAndColor(order.order_status);
  const totalAmount = order.total_price_actual ? order.total_price_actual : order.total_price;
  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-150 flex flex-col justify-between gap-5">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">#{order.order_number}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
              {statusLabel}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">{formattedDate}</span>
        </div>
        
        <div className="text-right">
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
            {order.total_price_actual ? 'Harga Aktual' : 'Estimasi Awal'}
          </span>
          <span className="text-sm font-black text-slate-950 block mt-0.5">
            Rp {parseFloat(totalAmount).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-50 pt-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            order.is_paid 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-red-50 text-error border-red-100'
          }`}>
            {order.is_paid ? 'Lunas' : 'Belum Lunas'}
          </span>
          {order.assigned_staff_id && (
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
              Staf: {order.assigned_staff?.name || 'Ditugaskan'}
            </span>
          )}
        </div>

        <Link
          to={`/orders/${order.order_number}`}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-md transition-all duration-150"
        >
          Detail Pesanan
        </Link>
      </div>
    </div>
  );
});

const Orders = () => {

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'active') {
      return order.order_status !== 'completed';
    }
    if (activeFilter === 'completed') {
      return order.order_status === 'completed';
    }
    if (activeFilter === 'unpaid') {
      return !order.is_paid;
    }
    return true;
  });

  const filterTabs = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Sedang Aktif' },
    { key: 'completed', label: 'Selesai' },
    { key: 'unpaid', label: 'Belum Lunas' },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Mengambil Riwayat Cucian..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Pesanan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Lacak status pengerjaan, detail timbangan aktual, dan riwayat tagihan Anda.
          </p>
        </div>
        <Link
          to="/orders/new"
          className="w-full sm:w-auto px-4 py-2 bg-primary hover:brightness-110 active:scale-95 text-white text-xs font-bold rounded-md shadow-sm transition-all duration-150 text-center"
        >
          + Order Baru
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth gap-2">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-smooth border-b-2 -mb-0.5 ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders Grid/List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200/60 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-2xl mx-auto">
            🧺
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Tidak Ada Pesanan</h3>
            <p className="text-xs text-slate-500">Tidak ada pesanan laundry yang sesuai dengan filter saat ini.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

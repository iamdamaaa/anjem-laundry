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
      return { label: 'Proses Cuci', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'waiting_delivery':
      return { label: 'Menunggu Kirim', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'completed':
      return { label: 'Selesai', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    default:
      return { label: status, bg: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
};

const StaffOrderCard = memo(({ order }) => {
  const { label: statusLabel, bg: statusBg } = getStatusLabelAndColor(order.order_status);
  const totalAmount = order.total_price_actual ? order.total_price_actual : order.total_price;
  const pickupAddr = order.pickup_address_snapshot || {};
  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">#{order.order_number}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
                {statusLabel}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">{formattedDate}</span>
          </div>

          <span className="text-sm font-black text-slate-950">
            Rp {parseFloat(totalAmount).toLocaleString('id-ID')}
          </span>
        </div>

        <div className="text-xs border-t border-slate-50 pt-3 space-y-1">
          <p className="font-semibold text-slate-700">
            Pelanggan: <span className="font-bold text-slate-900">{order.user?.name}</span>
          </p>
          <p className="text-slate-500 line-clamp-1">
            Penjemputan: {pickupAddr.address}, {pickupAddr.city}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-50 pt-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          order.is_paid
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : 'bg-red-50 text-error border border-red-100'
        }`}>
          {order.is_paid ? 'Lunas' : 'Belum Lunas'}
        </span>

        <Link
          to={`/staff/orders/${order.id}`}
          className="px-4 py-2 bg-primary hover:brightness-110 active:scale-95 text-white text-xs font-bold rounded-md transition-all duration-150"
        >
          Kerjakan Tugas
        </Link>
      </div>
    </div>
  );
});

const Orders = () => {

  if (isLoading) {
    return <LoadingSpinner message="Mengambil Penugasan Cucian..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tugas Laundry Saya</h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar seluruh pesanan pelanggan yang didelegasikan kepada Anda. Proses secara linear demi kepuasan pelanggan.
        </p>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/60 shadow-sm text-center text-slate-500">
          <p className="text-xs italic">Belum ada tugas pesanan laundry yang di-assign ke Anda saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <StaffOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

import React, { useEffect, useState, useCallback, memo } from 'react';
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

const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case 'received':
      return 'picked_up';
    case 'picked_up':
      return 'in_process';
    case 'in_process':
      return 'waiting_delivery';
    case 'waiting_delivery':
      return 'completed';
    default:
      return null;
  }
};

const OrderRow = memo(({ order, staffList, isProcessing, onAssignStaff, onStatusTransition }) => {
  const { label: statusLabel, bg: statusBg } = getStatusLabelAndColor(order.order_status);
  const total = order.total_price_actual ? order.total_price_actual : order.total_price;
  const nextStatus = getNextStatus(order.order_status);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-4">
        <span className="font-extrabold text-slate-900 block">#{order.order_number}</span>
        <span className="text-[9px] text-slate-400 block mt-0.5">
          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>

      <td className="p-4">
        <span className="font-bold text-slate-900 block">{order.user?.name}</span>
        <span className="text-[9px] text-slate-400 block">{order.user?.phone}</span>
      </td>

      <td className="p-4 text-center">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusBg}`}>
          {statusLabel}
        </span>
      </td>

      <td className="p-4 text-right font-extrabold text-slate-950">
        Rp {parseFloat(total).toLocaleString('id-ID')}
      </td>

      {/* Inline Staff Assignment */}
      <td className="p-4">
        <select
          disabled={isProcessing}
          value={order.assigned_staff_id || ''}
          onChange={(e) => onAssignStaff(order.id, e.target.value)}
          className="px-2 py-1 border border-slate-200 rounded-md text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-primary text-slate-900 bg-white"
        >
          <option value="">-- Pilih Staf --</option>
          {staffList.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
      </td>

      {/* Inline Status Upgrade linear transition */}
      <td className="p-4 text-center">
        {nextStatus ? (
          <button
            disabled={isProcessing}
            onClick={() => onStatusTransition(order.id, nextStatus)}
            className="px-2.5 py-1 bg-blue-50 border border-blue-200 hover:bg-primary hover:text-white hover:border-primary text-primary text-[9px] font-bold rounded-md transition-all duration-150"
          >
            &rarr; {nextStatus.toUpperCase()}
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Selesai</span>
        )}
      </td>

      <td className="p-4 text-center">
        <Link
          to={`/admin/orders/${order.id}`}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md transition-colors"
        >
          Detail
        </Link>
      </td>
    </tr>
  );
});

const Orders = () => {

  // Filter orders logic
  const filteredOrders = orders.filter((order) => {
    const matchStatus = statusFilter ? order.order_status === statusFilter : true;
    const matchStaff = staffFilter ? order.assigned_staff_id === parseInt(staffFilter) : true;
    return matchStatus && matchStaff;
  });

  if (isLoading) {
    return <LoadingSpinner message="Mengambil Seluruh Berkas Pesanan..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Pesanan Laundry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Pantau seluruh pesanan, delegasikan kurir/staf operasional, dan awasi status linear laundry.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-slate-900 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="received">Diterima</option>
              <option value="picked_up">Di-pickup</option>
              <option value="in_process">Diproses</option>
              <option value="waiting_delivery">Menunggu Kirim</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          {/* Staff filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staf Penugasan:</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-slate-900 bg-white"
            >
              <option value="">Semua Staf</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400">
          Ditemukan: <span className="text-slate-900">{filteredOrders.length}</span> orderan
        </span>
      </div>

      {/* Operations feedback alerts */}
      {alertSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold">
          ✅ {alertSuccess}
        </div>
      )}
      {alertError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-semibold">
          ⚠️ {alertError}
        </div>
      )}

      {/* Dynamic Tabular Orders Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="p-4">No Order & Tanggal</th>
                <th className="p-4">Customer</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Total Tagihan</th>
                <th className="p-4">Penugasan Staf</th>
                <th className="p-4 text-center">Aksi Linier</th>
                <th className="p-4 text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ditemukan data pesanan laundry.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order} 
                    staffList={staffList}
                    isProcessing={isProcessing}
                    onAssignStaff={handleAssignStaff}
                    onStatusTransition={handleStatusTransition}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;

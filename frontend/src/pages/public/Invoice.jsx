import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Invoice = () => {
  const { invoiceToken } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchPublicInvoice = async () => {
      try {
        const response = await api.get(`/invoice/${invoiceToken}`);
        if (response.data && response.data.success) {
          setOrder(response.data.data);
        } else {
          setErrorMsg('Invoice tidak ditemukan atau token tidak valid.');
        }
      } catch (err) {
        setErrorMsg('Gagal memuat rincian invoice. Harap periksa koneksi internet atau tautan Anda.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicInvoice();
  }, [invoiceToken]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabelAndColor = (status) => {
    switch (status) {
      case 'received':
        return { label: 'Diterima', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'picked_up':
        return { label: 'Di-pickup', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'in_process':
        return { label: 'Diproses', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'waiting_delivery':
        return { label: 'Menunggu Kirim', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'completed':
        return { label: 'Selesai', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <LoadingSpinner message="Mengambil Invoice Publik..." />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-card border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-error flex items-center justify-center text-xl mx-auto font-bold">
            ⚠️
          </div>
          <h3 className="text-lg font-extrabold text-brandText">Terjadi Kendala</h3>
          <p className="text-xs text-slate-500">{errorMsg || 'Rincian invoice gagal dimuat.'}</p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const { label: statusLabel, bg: statusBg } = getStatusLabelAndColor(order.order_status);
  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Pickup and delivery snapshots
  const pickupAddr = order.pickup_address_snapshot || {};
  const deliveryAddr = order.delivery_address_snapshot || {};

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-brandText print:bg-white print:py-0 print:text-black">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-card border border-slate-200/80 shadow-sm print:shadow-none print:border-none print:p-0">
        
        {/* Actions Top Right */}
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn shadow-sm transition-smooth flex items-center gap-2"
          >
            <span>⬇️</span> Download PDF
          </button>
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-8 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm print:border print:border-black">
                AL
              </div>
              <span className="text-xl font-black text-slate-900">Anjem Laundry</span>
            </div>
            <p className="text-xs text-slate-500">Premium Antar Jemput Laundry SPA</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">INVOICE</h1>
            <p className="text-xs font-semibold text-slate-500">No: {order.order_number}</p>
            <p className="text-[10px] text-slate-400">{formattedDate}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
          {/* Customer & Status details */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Pelanggan
              </span>
              <p className="text-sm font-bold text-slate-900">{order.user?.name}</p>
              <p className="text-xs text-slate-500">{order.user?.phone}</p>
              {order.user?.email && <p className="text-xs text-slate-400">{order.user.email}</p>}
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Status Cucian
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBg}`}>
                  {statusLabel}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Status Bayar
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  order.is_paid 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-error border-red-200'
                }`}>
                  {order.is_paid ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
              </div>
            </div>
          </div>

          {/* Logistics Snapshots */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Alamat Penjemputan (Pickup)
              </span>
              <p className="text-xs font-medium text-slate-700">
                <span className="font-bold text-slate-900">[{pickupAddr.label || 'Rumah'}] </span>
                {pickupAddr.address}, {pickupAddr.city}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Alamat Pengantaran (Delivery)
              </span>
              <p className="text-xs font-medium text-slate-700">
                <span className="font-bold text-slate-900">[{deliveryAddr.label || 'Rumah'}] </span>
                {deliveryAddr.address}, {deliveryAddr.city}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="py-8">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
            Rincian Layanan & Cucian
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3">Layanan</th>
                  <th className="py-3 text-center">Durasi</th>
                  <th className="py-3 text-center">Harga Satuan</th>
                  <th className="py-3 text-center">Estimasi Client</th>
                  <th className="py-3 text-center">Timbangan Aktual</th>
                  <th className="py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item) => {
                  const pricingUnit = item.pricing_type_snapshot === 'by_weight' ? 'kg' : 'pcs';
                  const initialQty = item.pricing_type_snapshot === 'by_weight' ? `${item.weight_kg} kg` : `${item.quantity} unit`;
                  const actualQty = item.pricing_type_snapshot === 'by_weight' 
                    ? (item.weight_actual_kg ? `${item.weight_actual_kg} kg` : '-')
                    : (item.quantity_actual ? `${item.quantity_actual} unit` : '-');

                  const rate = item.pricing_type_snapshot === 'by_weight' 
                    ? item.price_per_kg_snapshot 
                    : item.price_per_unit_snapshot;

                  const subtotal = order.total_price_actual ? item.subtotal_actual : item.subtotal;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <p className="font-bold text-slate-950">{item.service_name_snapshot}</p>
                        <span className="text-[10px] text-slate-400">{item.category_name_snapshot}</span>
                      </td>
                      <td className="py-4 text-center font-medium">{item.duration_label_snapshot}</td>
                      <td className="py-4 text-center font-medium">Rp {parseFloat(rate).toLocaleString('id-ID')}</td>
                      <td className="py-4 text-center font-medium text-slate-500">{initialQty}</td>
                      <td className={`py-4 text-center font-bold ${item.weight_actual_kg || item.quantity_actual ? 'text-primary' : 'text-slate-400'}`}>
                        {actualQty}
                      </td>
                      <td className="py-4 text-right font-extrabold text-slate-950">
                        Rp {parseFloat(subtotal || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t-2 border-dashed border-slate-200 pt-6 flex flex-col items-end gap-2 text-right">
          {order.total_price_actual ? (
            // Shown when weight checks have completed
            <>
              <div className="flex justify-between w-64 text-xs font-semibold text-slate-400">
                <span>Estimasi Awal:</span>
                <span>Rp {parseFloat(order.total_price).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-bold text-slate-600 border-t border-slate-100 pt-2">
                <span>Total Koreksi Aktual:</span>
                <span className="text-primary">Rp {parseFloat(order.total_price_actual).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between w-64 text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Harus Dibayar:</span>
                <span className="text-xl font-black text-slate-900">
                  Rp {parseFloat(order.total_price_actual).toLocaleString('id-ID')}
                </span>
              </div>
            </>
          ) : (
            // Shown on initial registration pending actual weight checking
            <>
              <div className="flex justify-between w-64 text-xs text-slate-500 font-bold">
                <span>Status Koreksi:</span>
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[10px]">
                  Menunggu Timbangan Kurir
                </span>
              </div>
              <div className="flex justify-between w-64 text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Estimasi Awal:</span>
                <span className="text-xl font-black text-slate-900">
                  Rp {parseFloat(order.total_price).toLocaleString('id-ID')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Notes snap */}
        {order.notes && (
          <div className="mt-8 p-4 bg-slate-50 rounded-card border border-slate-100 text-xs">
            <span className="font-extrabold block text-slate-500 mb-1">Catatan Tambahan:</span>
            <p className="text-slate-600 italic">"{order.notes}"</p>
          </div>
        )}

        {/* Actions (WA) */}
        <div className="mt-12 flex flex-col sm:flex-row justify-end items-center gap-3 print:hidden border-t border-slate-100 pt-6">
          <a
            href={`https://wa.me/628123456789?text=Halo%20Admin%20Anjem%20Laundry%2C%20saya%20ingin%20bertanya%20mengenai%20pesanan%20saya%20%23${order.order_number}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-btn text-xs font-bold shadow-md shadow-emerald-500/10 transition-smooth text-center"
          >
            💬 Hubungi via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default Invoice;

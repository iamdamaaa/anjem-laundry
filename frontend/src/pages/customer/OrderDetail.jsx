import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const OrderDetail = () => {
  const { orderNumber } = useParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment upload states
  const [method, setMethod] = useState('transfer');
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`/orders/${orderNumber}`);
      if (response.data && response.data.success) {
        setOrder(response.data.data);
        const finalPrice = response.data.data.total_price_actual
          ? response.data.data.total_price_actual
          : response.data.data.total_price;
        setAmount(finalPrice);
      } else {
        setErrorMsg('Pesanan tidak ditemukan.');
      }
    } catch (err) {
      setErrorMsg('Gagal memuat rincian pesanan laundry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderNumber]);

  // Handle proof upload submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!proofFile && method !== 'cash') {
      setPaymentError('Harap lampirkan gambar bukti transfer Anda.');
      return;
    }

    setIsUploading(true);
    setPaymentError('');
    setPaymentSuccess('');

    const formData = new FormData();
    formData.append('method', method);
    formData.append('amount', amount);
    if (proofFile) {
      formData.append('proof_image', proofFile);
    }

    try {
      const response = await api.post(`/orders/${order.id}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        setPaymentSuccess('Bukti pembayaran Anda berhasil dikirim dan sedang diverifikasi!');
        setProofFile(null);
        // Refresh order details to show pending payment status
        fetchOrderDetail();
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran. Ukuran max 5MB (JPG/PNG).');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusLabelAndColor = (status) => {
    switch (status) {
      case 'received':
        return { label: 'Pesanan Diterima', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'picked_up':
        return { label: 'Cucian Di-pickup', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'in_process':
        return { label: 'Cucian Sedang Diproses', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'waiting_delivery':
        return { label: 'Menunggu Pengiriman', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'completed':
        return { label: 'Pesanan Selesai', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Mengambil Detail Cucian Anda..." />;
  }

  if (errorMsg || !order) {
    return (
      <div className="bg-white p-12 rounded-card border border-slate-200/60 shadow-sm text-center max-w-md mx-auto space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-red-50 text-error flex items-center justify-center text-xl mx-auto font-bold">
          ⚠️
        </div>
        <h3 className="text-sm font-bold text-brandText">Terjadi Kendala</h3>
        <p className="text-xs text-slate-500">{errorMsg || 'Rincian pesanan gagal dimuat.'}</p>
        <Link
          to="/orders"
          className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-btn transition-colors"
        >
          Kembali ke Riwayat
        </Link>
      </div>
    );
  }

  const { label: statusLabel, bg: statusBg } = getStatusLabelAndColor(order.order_status);
  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timelineSteps = [
    { key: 'received', label: 'Pesanan Diterima', desc: 'Cucian Anda telah dicatat di sistem.' },
    { key: 'picked_up', label: 'Cucian Di-pickup', desc: 'Kurir kami telah berhasil mengambil cucian Anda.' },
    { key: 'in_process', label: 'Sedang Diproses', desc: 'Staf sedang menimbang aktual, mencuci, dan melipat pakaian Anda.' },
    { key: 'waiting_delivery', label: 'Menunggu Pengiriman', desc: 'Pakaian bersih wangi Anda sedang dipacking untuk diantar.' },
    { key: 'completed', label: 'Selesai', desc: 'Cucian telah sampai di tangan Anda. Terima kasih!' },
  ];

  // Find index of current status to highlight timeline
  const currentStepIndex = timelineSteps.findIndex((s) => s.key === order.order_status);

  return (
    <div className="space-y-8 font-sans">

      {/* Header Panel */}
      <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-brandText">Pesanan #{order.order_number}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBg}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500">Dibuat pada {formattedDate}</p>
        </div>

        {(order.is_paid || order.order_status !== 'received') && (
          <Link
            to={`/invoice/${order.invoice_token}`}
            target="_blank"
            className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn text-center shadow-md shadow-blue-500/10 transition-colors"
          >
            📄 Lihat Invoice
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Timeline & Order Details */}
        <div className="lg:col-span-2 space-y-8">

          {/* Vertical Tracking Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-card border border-slate-200/60 shadow-sm">
            <h2 className="text-base font-extrabold text-brandText mb-6">Pelacakan Pesanan</h2>
            <div className="relative pl-6 space-y-6">
              {/* Stepper vertical line connector */}
              <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-slate-100"></div>

              {timelineSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.key} className="relative flex gap-4">
                    {/* Stepper node circle */}
                    <div className={`absolute -left-[22px] w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${isCurrent
                        ? 'border-primary bg-white ring-4 ring-blue-100 text-white'
                        : isPassed
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-200 bg-white text-slate-300'
                      }`}>
                      {isPassed && !isCurrent && <span className="text-[8px] font-bold">✓</span>}
                    </div>

                    <div className="space-y-1">
                      <span className={`text-xs font-bold block ${isPassed ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itemized list of services */}
          <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-brandText">Rincian Cucian</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Nama Layanan</th>
                    <th className="py-2.5 text-center">Tipe Satuan</th>
                    <th className="py-2.5 text-center">Estimasi Anda</th>
                    <th className="py-2.5 text-center">Timbangan Staf</th>
                    <th className="py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.items?.map((item) => {
                    const pricingUnit = item.pricing_type_snapshot === 'by_weight' ? 'kg' : 'pcs';
                    const estQty = item.pricing_type_snapshot === 'by_weight' ? `${item.weight_kg} kg` : `${item.quantity} unit`;
                    const actualQty = item.pricing_type_snapshot === 'by_weight'
                      ? (item.weight_actual_kg ? `${item.weight_actual_kg} kg` : 'Menunggu')
                      : (item.quantity_actual ? `${item.quantity_actual} unit` : 'Menunggu');

                    const subtotal = order.total_price_actual ? item.subtotal_actual : item.subtotal;

                    return (
                      <tr key={item.id}>
                        <td className="py-3 font-semibold text-slate-900">{item.service_name_snapshot}</td>
                        <td className="py-3 text-center text-slate-500 uppercase">{pricingUnit}</td>
                        <td className="py-3 text-center text-slate-500">{estQty}</td>
                        <td className={`py-3 text-center font-bold ${item.weight_actual_kg || item.quantity_actual ? 'text-primary' : 'text-slate-400'}`}>
                          {actualQty}
                        </td>
                        <td className="py-3 text-right font-extrabold text-slate-950">
                          Rp {parseFloat(subtotal || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Price corrections footer */}
            <div className="border-t border-slate-100 pt-4 flex flex-col items-end gap-1.5 text-right">
              {order.total_price_actual ? (
                <>
                  <span className="text-[10px] font-bold text-slate-400">Total Biaya Cucian Terkoreksi:</span>
                  <span className="text-xl font-black text-brandText">
                    Rp {parseFloat(order.total_price_actual).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    *Harga disesuaikan otomatis berdasarkan timbangan aktual staf di workshop.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold text-slate-400">Total Estimasi Sementara:</span>
                  <span className="text-xl font-black text-brandText">
                    Rp {parseFloat(order.total_price).toLocaleString('id-ID')}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Billing & Payments */}
        <div className="space-y-8">
          {/* Payment Status Info card */}
          <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-brandText border-b border-slate-50 pb-2">Status Pembayaran</h2>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Status Tagihan:</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${order.is_paid
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-red-50 text-error border-red-100'
                }`}>
                {order.is_paid ? 'Lunas Terverifikasi' : 'Belum Lunas'}
              </span>
            </div>

            {order.paid_at && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Waktu Lunas:</span>
                <span className="font-bold text-slate-900">
                  {new Date(order.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* If paid, display beautiful success checkmark */}
            {order.is_paid ? (
              <div className="p-4 bg-emerald-50 rounded-card border border-emerald-100 text-center space-y-1.5">
                <span className="text-2xl">🎉</span>
                <p className="text-xs font-bold text-emerald-800">Cucian Anda Telah Lunas</p>
                <p className="text-[10px] text-emerald-600">Terima kasih atas kerja samanya. Pakaian Anda diproses dengan cinta.</p>
              </div>
            ) : order.payments?.some(p => p.status === 'pending') ? (
              <div className="p-4 bg-amber-50 rounded-card border border-amber-100 text-center space-y-1.5">
                <span className="text-2xl">⏳</span>
                <p className="text-xs font-bold text-amber-800">Menunggu Konfirmasi Pembayaran</p>
                <p className="text-[10px] text-amber-600">Bukti pembayaran Anda sudah diunggah dan sedang diverifikasi oleh admin kami.</p>
              </div>
            ) : (
              // Otherwise, if not paid, offer proof upload form
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Unggah Bukti Bayar
                </span>

                {paymentSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-input text-success text-[10px] font-semibold">
                    {paymentSuccess}
                  </div>
                )}
                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-input text-error text-[10px] font-semibold">
                    {paymentError}
                  </div>
                )}

                <form onSubmit={handlePaymentSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Metode Transfer
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText bg-white"
                    >
                      <option value="transfer">Bank Transfer</option>
                      <option value="qris">QRIS</option>
                    </select>
                  </div>

                  {method !== 'cash' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Screenshoot Pembayaran
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files[0])}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-btn file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-full py-2.5 text-xs font-bold text-white rounded-btn shadow-sm transition-colors ${isUploading
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-hover shadow-blue-500/10'
                      }`}
                  >
                    {isUploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

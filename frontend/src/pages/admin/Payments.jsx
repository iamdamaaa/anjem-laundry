import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Zoom image overlay state
  const [zoomImage, setZoomImage] = useState(null);

  // Operations state
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState({}); // { [paymentId]: reason_text }
  const [showRejectionForm, setShowRejectionForm] = useState(null); // paymentId
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  const fetchPayments = async () => {
    try {
      const response = await api.get('/admin/payments');
      if (response.data && response.data.success) {
        setPayments(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin payments queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Handle payment verification (verification confirms payment, is_paid = true)
  const handleVerifyPayment = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin memverifikasi bukti transfer ini? Pemasukan kas akan tercatat lunas.')) return;
    setIsProcessing(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const response = await api.patch(`/admin/payments/${id}/verify`);
      if (response.data && response.data.success) {
        setAlertSuccess('Bukti transfer berhasil diverifikasi! Tagihan order diset lunas otomatis.');
        fetchPayments();
      }
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Gagal melakukan verifikasi pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment rejection
  const handleRejectPayment = async (id) => {
    const reason = rejectionReasonInput[id];
    if (!reason) {
      alert('Alasan penolakan pembayaran wajib diisi!');
      return;
    }

    setIsProcessing(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const response = await api.patch(`/admin/payments/${id}/reject`, {
        rejection_reason: reason,
      });

      if (response.data && response.data.success) {
        setAlertSuccess('Bukti transfer berhasil ditolak! Email permintaan re-upload terkirim ke customer.');
        setShowRejectionForm(null);
        fetchPayments();
      }
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Gagal menolak bukti transfer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusLabelAndColor = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending Review', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'verified':
        return { label: 'Diverifikasi', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'rejected':
        return { label: 'Ditolak', bg: 'bg-red-50 text-error border-red-200' };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Mengambil Antrean Pembayaran..." />;
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 relative">
      
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verifikasi Bukti Pembayaran</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review lampiran bukti transfer dana perbankan / e-wallet yang dikirimkan oleh customer secara cermat.
        </p>
      </div>

      {/* Operations feedback alerts */}
      {alertSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-success text-xs font-semibold">
          ✅ {alertSuccess}
        </div>
      )}
      {alertError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-error text-xs font-semibold">
          ⚠️ {alertError}
        </div>
      )}

      {/* Click To Zoom Overlay Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setZoomImage(null)}></div>
          <div className="relative max-w-lg w-full bg-white p-2 rounded-2xl shadow-lg flex flex-col items-center">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 text-white font-extrabold text-sm bg-slate-800 px-3 py-1 rounded-full hover:bg-slate-700"
            >
              ✕ Tutup Zoom
            </button>
            <img
              src={zoomImage}
              alt="Bukti Bayar Zoom"
              className="max-h-[80vh] object-contain rounded-md"
            />
          </div>
        </div>
      )}

      {/* Dynamic Tabular Payments List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="p-4">Invoice Order</th>
                <th className="p-4">Customer Pengirim</th>
                <th className="p-4">Metode & Jumlah</th>
                <th className="p-4 text-center">Bukti Lampiran</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Tidak ditemukan antrean bukti pembayaran saat ini.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const { label: statusLabel, bg: statusBg } = getStatusLabelAndColor(p.status);
                  // Setup image URL dynamically matching backend Laravel asset mappings (symlink is served at /storage/)
                  const imageUrl = p.proof_image_path 
                    ? `${import.meta.env.VITE_API_URL || 'http://localhost'}/storage/${p.proof_image_path.replace('public/', '')}`
                    : null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <Link to={`/admin/orders/${p.order_id}`} className="font-extrabold text-primary hover:underline block">
                          #{p.order?.order_number || `Order ID: ${p.order_id}`}
                        </Link>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{p.uploader?.name || 'Customer'}</span>
                        <span className="text-[9px] text-slate-400 block">{p.uploader?.phone}</span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-slate-800 uppercase block">{p.method}</span>
                        <span className="text-xs font-black text-slate-950 block mt-0.5">
                          Rp {parseFloat(p.amount).toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {imageUrl ? (
                          <div className="flex items-center justify-center">
                            <img
                              src={imageUrl}
                              alt="Bukti Thumbnail"
                              onClick={() => setZoomImage(imageUrl)}
                              className="w-12 h-12 object-cover rounded-md border border-slate-200 cursor-pointer hover:opacity-85 hover:scale-105 transition-all shadow-sm"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No File</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {p.status === 'pending' ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1.5 justify-center">
                              <button
                                disabled={isProcessing}
                                onClick={() => handleVerifyPayment(p.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-md transition-colors shadow-sm"
                              >
                                Verifikasi (Lunas)
                              </button>
                              <button
                                disabled={isProcessing}
                                onClick={() => setShowRejectionForm(showRejectionForm === p.id ? null : p.id)}
                                className="px-3 py-1.5 bg-error hover:bg-red-600 text-white text-[10px] font-bold rounded-md transition-colors shadow-sm"
                              >
                                Tolak
                              </button>
                            </div>

                            {/* Rejection input dialog inline panel */}
                            {showRejectionForm === p.id && (
                              <div className="mt-2 space-y-1.5 w-48 text-left bg-slate-50 p-2.5 rounded-md border border-slate-200">
                                <label className="block text-[8px] font-bold uppercase text-slate-500">
                                  Alasan Penolakan:
                                </label>
                                <input
                                  type="text"
                                  placeholder="Bukti buram, nominal kurang"
                                  value={rejectionReasonInput[p.id] || ''}
                                  onChange={(e) => setRejectionReasonInput({
                                    ...rejectionReasonInput,
                                    [p.id]: e.target.value,
                                  })}
                                  className="w-full px-2 py-1 border border-slate-200 rounded-md text-[10px] focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                                />
                                <button
                                  onClick={() => handleRejectPayment(p.id)}
                                  className="w-full py-1 bg-error text-white text-[9px] font-bold rounded-md transition-colors"
                                >
                                  Submit Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Diselesaikan</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;

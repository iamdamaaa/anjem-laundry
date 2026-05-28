import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Operations state
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/notifications');
      if (response.data && response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle triggering failed notification retry
  const handleRetryNotification = async (id) => {
    setIsProcessing(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const response = await api.post(`/admin/notifications/${id}/retry`);
      if (response.data && response.data.success) {
        setAlertSuccess('Notifikasi berhasil diantrekan ulang untuk dikirim!');
        fetchNotifications();
      }
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Gagal mengirim ulang notifikasi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Pengiriman Notifikasi</h1>
        <p className="text-xs text-slate-500 mt-1">
          Lacak logs pengiriman notifikasi terotomatisasi WhatsApp (Fonnte API) dan Email (SMTP) kepada pelanggan laundry.
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

      {/* Dynamic Tabular Notifications Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="p-4 text-center">Saluran</th>
                <th className="p-4">Penerima (Recipient)</th>
                <th className="p-4">Subjek / Topik</th>
                <th className="p-4">Isi Pesan Notifikasi</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Kesalahan / Logs</th>
                <th className="p-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ditemukan riwayat notifikasi terkirim.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => {
                  const isWhatsapp = n.channel === 'whatsapp';
                  
                  return (
                    <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Channel Indicator with premium icons */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex w-8 h-8 rounded-full items-center justify-center font-bold text-sm ${
                          isWhatsapp 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-blue-50 text-primary border border-blue-100'
                        }`}>
                          {isWhatsapp ? '💬' : '📧'}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-slate-900 truncate max-w-[150px]">
                        {n.recipient}
                      </td>

                      <td className="p-4 font-semibold text-slate-600 max-w-[120px] truncate">
                        {n.subject || 'WhatsApp Alert'}
                      </td>

                      <td className="p-4 max-w-[280px]">
                        <p className="text-slate-500 font-medium line-clamp-2 leading-relaxed" title={n.message}>
                          {n.message}
                        </p>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-extrabold border ${
                          n.is_sent 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-red-50 text-error border-red-100'
                        }`}>
                          {n.is_sent ? 'SENT' : 'FAILED'}
                        </span>
                      </td>

                      <td className="p-4 text-center max-w-[130px] truncate font-mono text-[9px] text-red-500">
                        {n.sent_error || '-'}
                      </td>

                      <td className="p-4 text-center">
                        {!n.is_sent ? (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleRetryNotification(n.id)}
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-primary hover:text-white hover:border-primary text-primary text-[10px] font-bold rounded-md transition-smooth shadow-sm"
                          >
                            Kirim Ulang
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Terkirim</span>
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

export default Notifications;

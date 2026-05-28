import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ErrorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/logs/errors');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil data error logs.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getBadgeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'FATAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'ERROR': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (isLoading) return <LoadingSpinner message="Memuat logs..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Error Logs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau dan analisis log error aplikasi secara real-time.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2"
        >
          🔄 Refresh Logs
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-bold">Waktu</th>
                <th className="px-6 py-4 font-bold">Pengguna</th>
                <th className="px-6 py-4 font-bold">Tipe & Sumber</th>
                <th className="px-6 py-4 font-bold">Pesan Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-semibold text-slate-600">{formatDate(log.created_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {log.user ? (
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{log.user.name}</p>
                        <p className="text-[10px] text-slate-500">{log.user.email || log.user.phone}</p>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400 italic">Guest / System</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getBadgeColor(log.error_type)}`}>
                        {log.error_type}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {log.source}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800 break-words max-w-md">
                      {log.error_message}
                    </div>
                    {log.context && (
                      <pre className="mt-2 p-2 bg-slate-900 text-slate-300 rounded text-[10px] overflow-x-auto max-w-md">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="text-4xl mb-2">✨</div>
                    <p className="text-slate-500 font-medium">Sistem berjalan dengan baik. Tidak ada error log.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogs;

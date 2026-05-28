import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const ErrorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchErrorLogs = async () => {
    try {
      const url = typeFilter 
        ? `/admin/logs/errors?type=${typeFilter}`
        : '/admin/logs/errors';
        
      const response = await api.get(url);
      if (response.data && response.data.success) {
        setLogs(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin error logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, [typeFilter]);

  return (
    <div className="space-y-6 font-sans text-brandText">
      
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm">
        <h1 className="text-2xl font-black text-brandText tracking-tight">Logs Diagnostik & Error</h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar kendala teknis terlaporkan baik dari sisi klien (frontend Javascript window.onerror) maupun server (backend Laravel exception tracker).
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-card border border-slate-200/60 shadow-sm flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Tipe Kesalahan:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-brandText bg-white"
        >
          <option value="">Semua Tipe Error</option>
          <option value="QueryException">QueryException (Database)</option>
          <option value="ValidationException">ValidationException</option>
          <option value="ModelNotFoundException">ModelNotFoundException</option>
          <option value="ClientError">Client Error (Frontend)</option>
        </select>
        {typeFilter && (
          <button
            onClick={() => setTypeFilter('')}
            className="text-xs font-semibold text-slate-500 hover:text-brandText"
          >
            Reset
          </button>
        )}
      </div>

      {/* Tabular Error logs Grid */}
      <div className="bg-white rounded-card border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="p-4">Waktu & IP Address</th>
                <th className="p-4">Sumber</th>
                <th className="p-4">Tipe / Kategori</th>
                <th className="p-4">Pesan Error (Message)</th>
                <th className="p-4">URL Terkait</th>
                <th className="p-4 text-center">User Pengakses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
              {logs.length === 0 ? (
                <tr className="font-sans">
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Tidak ditemukan catatan log error sistem.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">
                        {new Date(log.created_at).toLocaleString('id-ID', { hour12: false })}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{log.ip_address || '127.0.0.1'}</span>
                    </td>

                    <td className="p-4 font-sans text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                        log.source === 'server'
                          ? 'bg-red-50 text-error border-red-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {log.source || 'client'}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-slate-700 max-w-[130px] truncate">
                      {log.error_type}
                    </td>

                    <td className="p-4 max-w-[280px]">
                      <div className="p-2.5 bg-red-50/60 border border-red-100/50 rounded-input text-error leading-relaxed break-all whitespace-pre-wrap font-mono text-[9px]" title={log.error_message}>
                        {log.error_message}
                      </div>
                      {log.stack_trace && (
                        <details className="mt-1 text-[8px] text-slate-400 font-sans cursor-pointer">
                          <summary className="hover:text-slate-600 font-semibold select-none">Tampilkan Stack Trace</summary>
                          <pre className="mt-1 p-2 bg-slate-900 text-slate-200 rounded-input overflow-x-auto whitespace-pre leading-relaxed text-[8px] max-w-[320px] max-h-[150px]">
                            {log.stack_trace}
                          </pre>
                        </details>
                      )}
                    </td>

                    <td className="p-4 text-slate-500 font-mono text-[9px] truncate max-w-[150px]" title={log.request_url}>
                      {log.request_url || '-'}
                    </td>

                    <td className="p-4 text-center font-sans">
                      {log.user ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-800 text-[10px]">{log.user.name}</span>
                          <span className="text-[9px] text-slate-400">{log.user.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 italic">Guest</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogs;

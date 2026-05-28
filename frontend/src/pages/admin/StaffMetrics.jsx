import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const StaffMetrics = () => {
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Operations state
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  const fetchMetrics = async () => {
    try {
      const url = selectedMonth 
        ? `/admin/staff/metrics?month=${selectedMonth}`
        : '/admin/staff/metrics';
        
      const response = await api.get(url);
      if (response.data && response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load staff metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedMonth]);

  // Handle triggering a recalculation of staff metrics
  const handleRecalculate = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memicu kalkulasi ulang metrics performa staf bulan ini secara manual?')) return;
    setIsProcessing(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const response = await api.post('/admin/staff/metrics/recalculate');
      if (response.data && response.data.success) {
        setAlertSuccess('Kalkulasi ulang metrics performa staf berhasil diselesaikan!');
        fetchMetrics();
      }
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Gagal menghitung ulang metrics staf.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColorAndBg = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 80) {
      return { text: 'text-success', bg: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
    if (num >= 50) {
      return { text: 'text-amber-500', bg: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 border-amber-100' };
    }
    return { text: 'text-error', bg: 'bg-error', pill: 'bg-red-50 text-error border-red-100' };
  };

  if (isLoading) {
    return <LoadingSpinner message="Mengolah Analitik KPI Staf..." />;
  }

  return (
    <div className="space-y-6 font-sans text-brandText">
      
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brandText tracking-tight">Kinerja & KPI Staf</h1>
          <p className="text-xs text-slate-500 mt-1">
            Laporan penyelesaian tugas cucian tepat waktu, keterlambatan kurir, dan skor indeks kinerja (KPI).
          </p>
        </div>
        <button
          disabled={isProcessing}
          onClick={handleRecalculate}
          className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-btn shadow-sm transition-colors text-center ${
            isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-blue-500/10'
          }`}
        >
          {isProcessing ? 'Menghitung...' : '🔄 Hitung Ulang Metrics'}
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-card border border-slate-200/60 shadow-sm flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Periode Laporan:</span>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-brandText bg-white"
        />
        {selectedMonth && (
          <button
            onClick={() => setSelectedMonth('')}
            className="text-xs font-semibold text-slate-500 hover:text-brandText"
          >
            Reset
          </button>
        )}
      </div>

      {/* Operations feedback alerts */}
      {alertSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-card text-success text-xs font-semibold">
          ✅ {alertSuccess}
        </div>
      )}
      {alertError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-card text-error text-xs font-semibold">
          ⚠️ {alertError}
        </div>
      )}

      {/* Dynamic Tabular KPI Grid */}
      <div className="bg-white rounded-card border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="p-4">Staf Operasional</th>
                <th className="p-4 text-center">Bulan Laporan</th>
                <th className="p-4 text-center">Total Order</th>
                <th className="p-4 text-center">Tepat Waktu</th>
                <th className="p-4 text-center">Terlambat</th>
                <th className="p-4 text-center">Kompleksitas Rata-rata (Jam)</th>
                <th className="p-4">Skor Kinerja (KPI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ditemukan catatan metrics untuk periode ini.
                  </td>
                </tr>
              ) : (
                metrics.map((m) => {
                  const score = m.performance_score || 0;
                  const { text: scoreText, bg: progressBg, pill: pillBg } = getScoreColorAndBg(score);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{m.user?.name}</span>
                        <span className="text-[9px] text-slate-400 block">{m.user?.phone}</span>
                      </td>

                      <td className="p-4 text-center font-semibold text-slate-600">
                        {m.period_month}
                      </td>

                      <td className="p-4 text-center font-bold text-slate-900">
                        {m.total_orders_handled}
                      </td>

                      <td className="p-4 text-center font-bold text-emerald-600">
                        {m.orders_on_time}
                      </td>

                      <td className="p-4 text-center font-bold text-error">
                        {m.orders_late}
                      </td>

                      <td className="p-4 text-center font-semibold text-slate-500">
                        {m.avg_completion_hours ? `${parseFloat(m.avg_completion_hours).toFixed(1)} jam` : '-'}
                      </td>

                      {/* Performance Progress score */}
                      <td className="p-4 space-y-1.5 w-60">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className={`px-2 py-0.5 rounded border ${pillBg}`}>
                            {parseFloat(score).toFixed(1)}%
                          </span>
                          <span className={`uppercase text-[9px] ${scoreText}`}>
                            {score >= 80 ? 'Sangat Baik' : score >= 50 ? 'Cukup' : 'Kurang'}
                          </span>
                        </div>
                        {/* Interactive progress bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                          <div
                            style={{ width: `${score}%` }}
                            className={`${progressBg} h-full rounded-full transition-all duration-500`}
                          ></div>
                        </div>
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

export default StaffMetrics;

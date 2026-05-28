import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from 'react-hot-toast';

const StaffMetrics = () => {
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Current month string in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const fetchMetrics = async (month) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/admin/staff/metrics?month=${month}`);
      if (res.data?.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil data KPI Staf.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(selectedMonth);
  }, [selectedMonth]);

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      const res = await api.post('/admin/staff/metrics/recalculate', {
        month: selectedMonth
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Berhasil menghitung ulang KPI!');
        setMetrics(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghitung ulang KPI.');
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading && metrics.length === 0) return <LoadingSpinner message="Memuat KPI Staf..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">KPI Staf</h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau metrik performa staf berdasarkan target waktu pengerjaan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-md transition-colors whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRecalculating ? 'Menghitung...' : 'Hitung Ulang KPI'}
          </button>
        </div>
      </div>

      {/* Table - Temporarily Hidden */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center text-2xl mb-4">
          🚧
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Dalam Pengembangan</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Fitur KPI Dashboard saat ini sedang dalam tahap pengembangan dan penyempurnaan. Data perhitungan performa staf akan segera hadir.
        </p>
      </div>
    </div>
  );
};

export default StaffMetrics;

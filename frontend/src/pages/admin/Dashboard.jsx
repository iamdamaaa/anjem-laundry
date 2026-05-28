import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        const [summaryRes, servicesRes, chartRes] = await Promise.all([
          api.get('/admin/dashboard/summary'),
          api.get('/admin/dashboard/top-services'),
          api.get('/admin/dashboard/orders-chart'),
        ]);

        if (summaryRes.data && summaryRes.data.success) {
          setSummary(summaryRes.data.data);
        }
        if (servicesRes.data && servicesRes.data.success) {
          setTopServices(servicesRes.data.data || []);
        }
        if (chartRes.data && chartRes.data.success) {
          setChartData(chartRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Memuat Summary Dashboard Admin..." />;
  }

  // Fallback structures if empty
  const totalOrders = summary?.total_orders || 0;
  const totalRevenue = summary?.revenue || 0;
  const pendingPayments = summary?.pending_payments || 0;
  const activeOrders = summary?.active_orders || 0;

  // Render a responsive, highly premium styled pure CSS Bar Chart
  const maxChartValue = chartData.length > 0 
    ? Math.max(...chartData.map((d) => d.count || 0)) 
    : 10;

  return (
    <div className="space-y-8 font-sans text-brandText">
      {/* Top Banner Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard Ringkasan</h1>
        <p className="text-xs text-slate-500 mt-1">Ringkasan operasional keuangan, penugasan staf, dan log diagnostik.</p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Orders */}
        <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4 hover:shadow transition-all duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Cucian</span>
            <span className="text-xl">🧺</span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 block">{totalOrders}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Akumulasi pesanan masuk</span>
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4 hover:shadow transition-all duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pendapatan Bersih</span>
            <span className="text-xl">💰</span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block">
              Rp {parseFloat(totalRevenue).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-success font-semibold block mt-1">Selesai terverifikasi</span>
          </div>
        </div>

        {/* Card 3: Pending Payments */}
        <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4 hover:shadow transition-all duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Antrean Verifikasi</span>
            <span className="text-xl">💳</span>
          </div>
          <div>
            <span className="text-3xl font-black text-amber-500 block">{pendingPayments}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Bukti transfer pending</span>
          </div>
        </div>

        {/* Card 4: Active Orders */}
        <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4 hover:shadow transition-all duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pesanan Aktif</span>
            <span className="text-xl">⏳</span>
          </div>
          <div>
            <span className="text-3xl font-black text-primary block">{activeOrders}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Sedang dikerjakan staf</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Pure CSS Analytics Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-extrabold text-brandText uppercase tracking-wider">Grafik Pesanan Masuk</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Statistik volume transaksi harian dalam 7 hari terakhir.</p>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">
              Tidak ada data grafik transaksi saat ini.
            </div>
          ) : (
            <div className="h-64 flex flex-col justify-end space-y-2">
              <div className="flex-1 flex items-end gap-3 px-2">
                {chartData.map((data, idx) => {
                  const percentage = maxChartValue > 0 ? (data.count / maxChartValue) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      {/* Floating tooltip */}
                      <span className="opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded absolute -translate-y-8 transition-opacity duration-200 pointer-events-none">
                        {data.count} order
                      </span>
                      {/* Bar fill */}
                      <div
                        style={{ height: `${Math.max(percentage, 5)}%` }}
                        className="w-full bg-blue-100 hover:bg-primary rounded-t-sm transition-all duration-300 shadow-inner"
                      ></div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Dates Axis */}
              <div className="flex border-t border-slate-100 pt-2 gap-3 text-center text-[9px] font-bold text-slate-400">
                {chartData.map((data, idx) => (
                  <span key={idx} className="flex-1 truncate">
                    {data.date}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Top Services */}
        <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-brandText uppercase tracking-wider">Layanan Terlaris</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Top 5 tipe layanan terfavorit pilihan pelanggan.</p>
            </div>

            {topServices.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada statistik layanan.</p>
            ) : (
              <div className="space-y-3.5 divide-y divide-slate-50">
                {topServices.slice(0, 5).map((srv, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pt-3 first:pt-0">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">{srv.name}</p>
                      <span className="text-[9px] text-slate-400">{srv.category}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-primary shrink-0">
                      {srv.total_orders || srv.count} order
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

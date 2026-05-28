import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';

const ServicesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState(''); // '', 'cuci-kiloan', 'cuci-sepatu'
  
  // State Utama: Durasi Pengerjaan
  const [selectedDuration, setSelectedDuration] = useState('3_hari');

  useEffect(() => {
    // Simulate API load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number);
  };

  // Opsi Durasi Pengerjaan (Primary Filter)
  const durations = [
    { id: '4_jam', label: '4 Jam', addedPrice: 50000, badge: 'Super Express' },
    { id: '8_jam', label: '8 Jam', addedPrice: 40000, badge: 'Express' },
    { id: '12_jam', label: '12 Jam', addedPrice: 30000, badge: 'Kilat' },
    { id: '1_hari', label: '1 Hari', addedPrice: 20000, badge: 'Cepat' },
    { id: '2_hari', label: '2 Hari', addedPrice: 10000, badge: 'Standar' },
    { id: '3_hari', label: '3 Hari', addedPrice: 0, badge: 'Reguler' },
  ];

  const currentDuration = durations.find(d => d.id === selectedDuration);

  // Base Services (Harga Dasar untuk durasi 3 Hari)
  const baseServices = [
    {
      id: 'kiloan',
      categorySlug: 'cuci-kiloan',
      categoryName: 'Cuci Kiloan',
      name: 'Cuci Lipat Setrika',
      description: 'Layanan lengkap cuci, lipat, dan setrika untuk pakaian harian Anda.',
      basePrice: 8000,
      unitLabel: '/ kg',
      icon: '🧺'
    },
    {
      id: 'sepatu-putih',
      categorySlug: 'cuci-sepatu',
      categoryName: 'Cuci Sepatu',
      name: 'Cuci Sepatu Putih',
      description: 'Perawatan deep cleaning khusus untuk sepatu berwarna putih/canvas terang dengan formula pemutih aman.',
      basePrice: 30000,
      unitLabel: '/ pasang',
      icon: '👟'
    },
    {
      id: 'sepatu-warna',
      categorySlug: 'cuci-sepatu',
      categoryName: 'Cuci Sepatu',
      name: 'Cuci Sepatu Warna',
      description: 'Pembersihan mendalam khusus untuk sepatu berwarna/multi-color dengan color protection khusus.',
      basePrice: 35000,
      unitLabel: '/ pasang',
      icon: '🎨'
    },
    {
      id: 'bedcover',
      categorySlug: 'cuci-satuan',
      categoryName: 'Cuci Satuan',
      name: 'Cuci Bedcover Besar',
      description: 'Pencucian bedcover ukuran Queen/King dengan pengeringan optimal agar tidak bau apek.',
      basePrice: 45000,
      unitLabel: '/ pcs',
      icon: '🛏️'
    },
    {
      id: 'jas',
      categorySlug: 'dry-cleaning',
      categoryName: 'Dry Cleaning',
      name: 'Dry Clean Jas',
      description: 'Pembersihan pakaian khusus tanpa air (dry clean) untuk menjaga kualitas serat kain.',
      basePrice: 60000,
      unitLabel: '/ stel',
      icon: '👔'
    }
  ];

  const filteredServices = filterCategory
    ? baseServices.filter(s => s.categorySlug === filterCategory)
    : baseServices;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative overflow-hidden animate-fade-in-up">
      
      {/* Decorative Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#E3FDFD]/60 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-[#71C9CE]/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <Navbar />

      {/* Hero & Global Filter Section */}
      <div className="relative pt-24 pb-8 px-4 z-10 flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 text-center">
          Pilih <span className="text-primary">Durasi & Layanan</span>
        </h1>
        <p className="max-w-xl text-slate-500 text-sm font-medium leading-relaxed mb-8 text-center">
          Semua harga akan menyesuaikan secara otomatis berdasarkan durasi pengerjaan yang Anda pilih.
        </p>

        {/* PRIMARY FILTER: DURATION */}
        <div className="w-full max-w-4xl mx-auto mb-10">
          <div className="flex items-center justify-center mb-6 px-2">
            <h2 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Durasi Pengerjaan
            </h2>
          </div>

          {/* Radio Buttons for Duration */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {durations.map((duration) => (
              <label 
                key={duration.id}
                className={`relative flex flex-col items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedDuration === duration.id
                    ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]'
                    : 'border-white bg-white hover:border-[#A6E3E9] hover:bg-slate-50 shadow-sm'
                }`}
              >
                <input 
                  type="radio" 
                  name="global_duration" 
                  value={duration.id}
                  checked={selectedDuration === duration.id}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="sr-only"
                />
                <span className={`text-xs font-extrabold uppercase tracking-wider mb-1 ${
                  selectedDuration === duration.id ? 'text-primary' : 'text-slate-400'
                }`}>
                  {duration.badge}
                </span>
                <span className={`text-lg font-black tracking-tight ${
                  selectedDuration === duration.id ? 'text-slate-900' : 'text-slate-700'
                }`}>
                  {duration.label}
                </span>
                
                {/* Visual Checkmark */}
                {selectedDuration === duration.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* SECONDARY FILTER: CATEGORY */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              filterCategory === ''
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterCategory('cuci-kiloan')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              filterCategory === 'cuci-kiloan'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            🧺 Kiloan
          </button>
          <button
            onClick={() => setFilterCategory('cuci-sepatu')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              filterCategory === 'cuci-sepatu'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            👟 Sepatu
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-6 pb-24 w-full z-10">
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[#E3FDFD] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-sm font-bold text-primary animate-pulse">Menghitung estimasi harga...</span>
          </div>
        ) : (
          /* Cards Grid */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service, index) => {
                // Kalkulasi harga final berdasarkan durasi terpilih
                const finalPrice = service.basePrice + (currentDuration ? currentDuration.addedPrice : 0);

                return (
                  <div
                    key={service.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col h-full shadow-sm hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3FDFD] text-primary text-[10px] font-bold uppercase tracking-wider">
                        {service.categoryName}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300">
                        ⏱️ {currentDuration?.label}
                      </span>
                    </div>

                    {/* Title & Icon */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-3xl shrink-0 drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 leading-tight">
                          {service.name}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 font-medium leading-relaxed flex-grow mb-6">
                      {service.description}
                    </p>

                    {/* Pricing & CTA */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                          Estimasi Harga
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-primary transition-all duration-300">
                            {formatRupiah(finalPrice)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {service.unitLabel}
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/login"
                        className="bg-slate-900 hover:bg-primary text-white p-2 rounded-md transition-colors duration-300 shadow-sm"
                        aria-label="Pesan Layanan"
                      >
                        <svg className="w-5 h-5 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200/60 py-10 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo & Info */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E3FDFD] flex items-center justify-center text-primary font-black text-sm">
                AL
              </div>
              <span className="font-extrabold text-lg text-slate-800 tracking-tight">Anjem Laundry</span>
            </div>
            <div className="text-sm text-slate-500 font-medium text-center md:text-left space-y-1">
              <p>📍 Jl. Example No. 123, Kecamatan Example, Kota Example</p>
              <p>📞 +62 812-3456-7890</p>
            </div>
          </div>
          
          <div className="text-xs text-slate-400 font-medium text-center md:text-right">
            &copy; {new Date().getFullYear()} Anjem Laundry. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ServicesPage;

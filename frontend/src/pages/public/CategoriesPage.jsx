import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';

const CategoriesPage = () => {
  // Static premium categories representation
  const categories = [
    {
      id: 1,
      name: 'Cuci Kiloan',
      slug: 'cuci-kiloan',
      description: 'Solusi cerdas untuk pakaian harian Anda. Layanan cuci, lipat, dan setrika dengan penimbangan per kilogram. Praktis, ekonomis, namun tetap higienis.',
      gradient: 'from-[#E3FDFD]/50 to-[#CBF1F5]/50 group-hover:from-[#E3FDFD] group-hover:to-[#CBF1F5]',
      border: 'border-[#A6E3E9]/30',
      icon: (
        <svg className="w-12 h-12 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 2,
      name: 'Cuci Sepatu',
      slug: 'cuci-sepatu',
      description: 'Perawatan khusus untuk sepatu kesayangan Anda. Teknik pencucian spesifik yang mampu mengangkat noda membandel tanpa merusak material atau serat kain.',
      gradient: 'from-[#CBF1F5]/50 to-[#A6E3E9]/50 group-hover:from-[#CBF1F5] group-hover:to-[#A6E3E9]',
      border: 'border-[#71C9CE]/30',
      icon: (
        <svg className="w-12 h-12 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] font-sans flex flex-col relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#E3FDFD]/60 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-[#71C9CE]/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-24 pb-16 px-6 z-10 flex flex-col items-center text-center animate-[fadeIn_0.6s_ease-out]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
          Kategori Layanan
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Pilih Perawatan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#71C9CE]">Terbaik</span>
        </h1>
        <p className="max-w-2xl text-gray-500 text-sm md:text-base font-medium leading-relaxed">
          Kami mengerti setiap barang butuh penanganan berbeda. Temukan kategori yang sesuai dan nikmati hasil cucian yang bersih maksimal, wangi, dan rapi.
        </p>
      </div>

      {/* Cards Grid */}
      <main className="flex-grow max-w-5xl mx-auto px-6 pb-24 w-full z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`group bg-white rounded-3xl border ${category.border} p-8 flex flex-col h-full shadow-lg hover:shadow-[#2563EB]/20 hover:-translate-y-2 transition-all duration-300 animate-[fadeIn_0.6s_ease-out]`}
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
            >
              {/* Card Header: Icon & Title */}
              <div className="flex items-start gap-6 mb-6">
                <div className={`w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-inner transition-colors duration-300`}>
                  <div className="transform group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                    {category.name}
                  </h3>
                  <div className="inline-block px-2.5 py-1 rounded bg-gray-100 text-gray-500 text-[10px] font-mono font-bold uppercase tracking-widest">
                    {category.slug}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed flex-grow mb-8 font-medium">
                {category.description}
              </p>

              {/* Action */}
              <div className="mt-auto border-t border-gray-100 pt-6">
                <Link
                  to="/services"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-[#2563EB] text-[#2563EB] hover:text-white px-6 py-4 rounded-xl font-bold transition-all duration-300"
                >
                  Lihat Layanan & Harga
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo & Info */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E3FDFD] flex items-center justify-center text-[#2563EB] font-black text-sm">
                AL
              </div>
              <span className="font-extrabold text-lg text-gray-800 tracking-tight">Anjem Laundry</span>
            </div>
            <div className="text-sm text-gray-500 font-medium text-center md:text-left space-y-1">
              <p>📍 Jl. Example No. 123, Kecamatan Example, Kota Example</p>
              <p>📞 +62 812-3456-7890</p>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 font-medium text-center md:text-right">
            &copy; {new Date().getFullYear()} Anjem Laundry. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Custom Keyframes for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default CategoriesPage;

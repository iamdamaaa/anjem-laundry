import React from 'react';

const Services = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Manajemen Layanan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola rincian layanan laundry, tipe penetapan harga, durasi pengerjaan, dan tarif.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center text-slate-500">
        <p className="text-sm italic">Memuat daftar layanan aktif...</p>
      </div>
    </div>
  );
};

export default Services;

import React from 'react';

const Categories = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Kategori Layanan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola kategori-kategori utama layanan laundry beserta deskripsinya.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center text-slate-500">
        <p className="text-sm italic">Memuat daftar kategori aktif...</p>
      </div>
    </div>
  );
};

export default Categories;

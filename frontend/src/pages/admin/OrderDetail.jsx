import React from 'react';
import { useParams } from 'react-router-dom';

const OrderDetail = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Detail Pesanan Laundry</h1>
        <p className="text-slate-500 text-sm mt-1">
          ID Pesanan: <span className="font-bold text-indigo-600">{id}</span>
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center text-slate-500">
        <p className="text-sm italic">Memuat detail operasional pesanan...</p>
      </div>
    </div>
  );
};

export default OrderDetail;

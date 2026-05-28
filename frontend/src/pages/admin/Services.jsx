import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    category_id: '',
    name: '',
    pricing_type: 'by_weight',
    price_per_kg: '',
    price_per_unit: '',
    duration_hours: 24,
    description: '',
    is_active: true
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [srvRes, catRes] = await Promise.all([
        api.get('/services'),
        api.get('/categories')
      ]);
      
      if (srvRes.data?.success) setServices(srvRes.data.data);
      if (catRes.data?.success) setCategories(catRes.data.data);
    } catch (err) {
      toast.error('Gagal mengambil data layanan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      category_id: categories[0]?.id || '',
      name: '',
      pricing_type: 'by_weight',
      price_per_kg: '',
      price_per_unit: '',
      duration_hours: 24,
      description: '',
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (srv) => {
    setIsEditing(true);
    setFormData({
      id: srv.id,
      category_id: srv.category_id,
      name: srv.name,
      pricing_type: srv.pricing_type,
      price_per_kg: srv.price_per_kg || '',
      price_per_unit: srv.price_per_unit || '',
      duration_hours: srv.duration_hours,
      description: srv.description || '',
      is_active: srv.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`/admin/services/${formData.id}`, formData);
        toast.success('Layanan berhasil diperbarui!');
      } else {
        await api.post('/admin/services', formData);
        toast.success('Layanan baru berhasil ditambahkan!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menonaktifkan layanan ini?')) {
      try {
        await api.delete(`/admin/services/${id}`);
        toast.success('Layanan berhasil dinonaktifkan.');
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal menonaktifkan layanan.');
      }
    }
  };

  if (isLoading) return <LoadingSpinner message="Memuat daftar layanan..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Layanan</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola rincian layanan laundry, tipe penetapan harga, durasi, dan tarif.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-md transition-colors whitespace-nowrap"
        >
          + Tambah Layanan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-bold">Nama Layanan</th>
                <th className="px-6 py-4 font-bold">Kategori</th>
                <th className="px-6 py-4 font-bold text-center">Harga</th>
                <th className="px-6 py-4 font-bold text-center">Estimasi (Jam)</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map(srv => (
                <tr key={srv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{srv.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{srv.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {srv.category?.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                    {srv.pricing_type === 'by_weight' 
                      ? `Rp ${Number(srv.price_per_kg).toLocaleString('id-ID')} / kg` 
                      : `Rp ${Number(srv.price_per_unit).toLocaleString('id-ID')} / pcs`}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">
                    {srv.duration_hours}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {srv.is_active ? (
                      <span className="text-emerald-500 text-sm font-bold">Aktif</span>
                    ) : (
                      <span className="text-red-500 text-sm font-bold">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(srv)}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(srv.id)}
                      disabled={!srv.is_active}
                      className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Disable
                    </button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 text-sm italic">
                    Belum ada data layanan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-slate-900">
                {isEditing ? 'Edit Layanan' : 'Tambah Layanan Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Layanan</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Contoh: Cuci Lipat Ekspres"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Induk</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Pengerjaan (Jam)</label>
                  <input
                    type="number"
                    name="duration_hours"
                    value={formData.duration_hours}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">Tipe Harga</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_type"
                      value="by_weight"
                      checked={formData.pricing_type === 'by_weight'}
                      onChange={handleInputChange}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-semibold text-slate-700">Per Kilo (Kiloan)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_type"
                      value="by_unit"
                      checked={formData.pricing_type === 'by_unit'}
                      onChange={handleInputChange}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-semibold text-slate-700">Per Item (Satuan)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarif (Rp)
                </label>
                <input
                  type="number"
                  name={formData.pricing_type === 'by_weight' ? 'price_per_kg' : 'price_per_unit'}
                  value={formData.pricing_type === 'by_weight' ? formData.price_per_kg : formData.price_per_unit}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Contoh: 6000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Deskripsi layanan untuk pelanggan..."
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Layanan Aktif (Ditampilkan)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-md transition-colors"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;

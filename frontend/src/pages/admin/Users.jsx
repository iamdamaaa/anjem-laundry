import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New staff form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  
  // Operations state
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      if (response.data && response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle toggle user active/inactive status
  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Apakah Anda yakin ingin ${currentStatus ? 'Menonaktifkan' : 'Mengaktifkan'} akun pengguna ini?`)) return;
    setIsProcessing(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const response = await api.patch(`/admin/users/${id}/status`, {
        is_active: !currentStatus,
      });

      if (response.data && response.data.success) {
        setAlertSuccess('Status aktifasi akun pengguna berhasil diperbarui!');
        fetchUsers();
      }
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Gagal mengubah status aktifasi akun.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle registering a new staff account (role_id 2 = staff)
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const response = await api.post('/admin/users', {
        name,
        phone,
        email,
        role_id: 2, // Hardcoded staff role
      });

      if (response.data && response.data.success) {
        setAlertSuccess('Akun staf operasional baru berhasil dibuat!');
        setName('');
        setPhone('');
        setEmail('');
        setShowAddStaffForm(false);
        fetchUsers();
      }
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Gagal mendaftarkan staf baru. Nomor WhatsApp mungkin telah terdaftar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-50 text-error border-red-200';
      case 'staff':
        return 'bg-blue-50 text-primary border-blue-200';
      case 'customer':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Mengambil Akun Pengguna..." />;
  }

  return (
    <div className="space-y-6 font-sans text-brandText">
      
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brandText tracking-tight">Manajemen Pengguna</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau akun pelanggan terdaftar, daftarkan staf operasional baru, dan kelola status otorisasi akun.
          </p>
        </div>
        <button
          onClick={() => setShowAddStaffForm(!showAddStaffForm)}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn shadow-sm transition-colors text-center"
        >
          {showAddStaffForm ? 'Batal' : '+ Tambah Staf Baru'}
        </button>
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

      {/* Inline Form to Add a New Staff */}
      {showAddStaffForm && (
        <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4 animate-in fade-in zoom-in-95">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-50 pb-2">
            Form Pendaftaran Staf Baru
          </h3>
          
          <form onSubmit={handleAddStaffSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-brandText bg-white"
                placeholder="Masukkan nama staf"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-brandText bg-white"
                placeholder="Contoh: 628123456789"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Alamat Email (Opsional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-brandText bg-white"
                placeholder="nama@email.com"
              />
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn shadow-sm transition-colors"
              >
                {isProcessing ? 'Menyimpan...' : 'Daftarkan Akun Staf'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabular User Accounts Grid */}
      <div className="bg-white rounded-card border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Nomor WhatsApp</th>
                <th className="p-4">Alamat Email</th>
                <th className="p-4 text-center">Hak Akses (Role)</th>
                <th className="p-4 text-center">Status Akun</th>
                <th className="p-4 text-center">Tindakan Otoritas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const roleBadge = getRoleBadge(u.role?.name || 'customer');
                
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    
                    <td className="p-4 font-semibold text-slate-600">+{u.phone}</td>
                    
                    <td className="p-4 text-slate-500">{u.email || '-'}</td>

                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${roleBadge}`}>
                        {u.role?.display_name || 'Customer'}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-extrabold border ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-red-50 text-error border-red-100'
                      }`}>
                        {u.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        disabled={isProcessing}
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className={`px-3 py-1.5 border text-[10px] font-bold rounded-btn transition-colors shadow-sm ${
                          u.is_active
                            ? 'bg-red-50 border-red-200 text-error hover:bg-red-100'
                            : 'bg-emerald-50 border-emerald-200 text-success hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;

import React, { useEffect, useState } from 'react';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile forms
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address forms
  const [label, setLabel] = useState('Rumah');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addressSuccess, setAddressSuccess] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/profile/addresses');
      if (response.data && response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email || '');
    }
    fetchAddresses();
  }, [user]);

  // Handle profile form save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const response = await api.patch('/profile', { name, email });
      if (response.data && response.data.success) {
        updateProfile({ name, email });
        setProfileSuccess('Profil berhasil diperbarui!');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle address form submit
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setAddressSuccess('');
    setAddressError('');

    try {
      const response = await api.post('/profile/addresses', {
        label,
        address,
        city,
        district,
        postal_code: postalCode,
        is_default: isDefault,
      });

      if (response.data && response.data.success) {
        setAddressSuccess('Alamat baru berhasil ditambahkan!');
        setAddress('');
        setCity('');
        setDistrict('');
        setPostalCode('');
        setIsDefault(false);
        setShowAddressForm(false);
        fetchAddresses();
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || 'Gagal menambahkan alamat baru.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Set default address
  const handleSetDefault = async (id) => {
    try {
      const response = await api.patch(`/profile/addresses/${id}/default`);
      if (response.data && response.data.success) {
        fetchAddresses();
      }
    } catch (err) {
      alert('Gagal menyetel alamat default.');
    }
  };

  // Delete address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus alamat ini?')) return;
    try {
      const response = await api.delete(`/profile/addresses/${id}`);
      if (response.data && response.data.success) {
        fetchAddresses();
      }
    } catch (err) {
      alert('Gagal menghapus alamat.');
    }
  };

  // Initial name placeholder
  const nameInitial = name ? name.charAt(0).toUpperCase() : 'C';

  if (isLoading) {
    return <LoadingSpinner message="Memuat Profil & Alamat Anda..." />;
  }

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      
      {/* Top Banner with Avatar Placeholder */}
      <div className="bg-white p-6 sm:p-8 rounded-card border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-blue-500/20 ring-4 ring-blue-50">
          {nameInitial}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-black text-brandText">{name}</h1>
          <p className="text-xs text-slate-500">{user?.phone}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] font-bold text-primary">
            Customer Member
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Profile Details Form */}
        <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-extrabold text-brandText border-b border-slate-50 pb-2">Informasi Kontak</h2>
          
          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-input text-success text-xs font-semibold">
              ✅ {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-input text-error text-xs font-semibold">
              ⚠️ {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText"
                placeholder="nama@email.com"
              />
              <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                *Wajib diisi sebelum melakukan order laundry pertama.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className={`w-full py-2.5 text-xs font-bold text-white rounded-btn shadow-sm transition-colors ${
                isSavingProfile 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-hover shadow-blue-500/10'
              }`}
            >
              {isSavingProfile ? 'Menyimpan...' : 'Perbarui Profil'}
            </button>
          </form>
        </div>

        {/* Right Column - Address List and Form Addition */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Address List Title Area */}
          <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm flex justify-between items-center">
            <h2 className="text-base font-extrabold text-brandText">Buku Alamat Saya</h2>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn transition-colors"
            >
              {showAddressForm ? 'Batal' : '+ Alamat Baru'}
            </button>
          </div>

          {/* New Address Dialog Inline Form */}
          {showAddressForm && (
            <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tambah Alamat Baru</h3>
              {addressError && <p className="text-xs text-error font-bold">{addressError}</p>}
              
              <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Label Alamat (Contoh: Rumah, Kantor)
                  </label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Kota
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Detail Alamat Lengkap
                  </label>
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-brandText"
                    placeholder="Nama Jalan, Blok, No Rumah, RT/RW, Patokan"
                  />
                </div>

                <div className="flex items-center gap-2 md:col-span-2 py-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <label htmlFor="isDefault" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    Jadikan Alamat Utama (Default)
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isSavingAddress}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-btn shadow-sm transition-colors"
                  >
                    {isSavingAddress ? 'Menyimpan...' : 'Simpan Alamat'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Dynamic Address Cards List */}
          {addresses.length === 0 ? (
            <div className="bg-white p-12 rounded-card border border-slate-200/60 shadow-sm text-center text-slate-500">
              <p className="text-xs italic">Belum ada daftar alamat tersimpan. Silakan tambahkan alamat baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white p-5 rounded-card border transition-smooth flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    addr.is_default ? 'border-primary ring-1 ring-primary/5' : 'border-slate-200/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">[{addr.label}]</span>
                      {addr.is_default && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-primary border border-blue-100 text-[9px] font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {addr.address}, {addr.city}, {addr.postal_code}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-brandText text-[10px] font-bold rounded-btn transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-error text-[10px] font-bold rounded-btn transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;

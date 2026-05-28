import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';

const Register = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle request registration OTP
  const handleRequestRegisterOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/auth/request-otp', { phone, name, purpose: 'register' });
      if (response.data && response.data.success) {
        setIsOtpSent(true);
        setSuccessMsg(response.data.message || 'Kode OTP pendaftaran telah dikirim via WhatsApp.');
      } else {
        setErrorMsg(response.data.message || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Nomor WhatsApp sudah terdaftar atau tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify registration OTP and login
  const handleVerifyRegisterOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/auth/verify-otp', { phone, name, code: otp, purpose: 'register' });
      if (response.data && response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        navigate('/dashboard');
      } else {
        setErrorMsg(response.data.message || 'Kode OTP salah.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Kode OTP salah atau telah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-50 font-sans animate-fade-in-up">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-white rounded-full blur-[120px] mix-blend-overlay"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#E3FDFD]/40 rounded-full blur-[150px] mix-blend-multiply"></div>
      
      {/* Main Container - Card */}
      <div className="relative z-10 w-full max-w-[480px] p-6 sm:p-8 m-4 bg-white rounded-2xl shadow-sm border border-slate-200/60">
        
        {/* Large Logo / Illustration */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#E3FDFD] rounded-full flex items-center justify-center mb-6 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#71C9CE]/20 animate-pulse rounded-full"></div>
            <svg
              className="w-12 h-12 text-primary relative z-10 transform transition-transform group-hover:scale-110 duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.151c0-1.229-1.04-2.186-2.261-2.112a15.34 15.34 0 01-11.978 0 2.22 2.22 0 00-2.261 2.112v11.758a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V7.151z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 17.25a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14.25a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 8.25h7.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
            Anjem Laundry
          </h1>
          <p className="text-slate-500 mt-2 text-center text-sm font-medium">
            Bergabung & Nikmati Layanan Premium
          </p>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">
            {isOtpSent ? 'Verifikasi OTP' : 'Daftar Akun Baru'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isOtpSent
              ? `Masukkan kode OTP yang dikirim ke +${phone}`
              : 'Daftar dengan mudah menggunakan WhatsApp.'}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-center">
            <span className="text-sm text-red-700 font-medium">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-md flex items-center">
            <span className="text-sm text-green-700 font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={isOtpSent ? handleVerifyRegisterOtp : handleRequestRegisterOtp} className="space-y-6">
          {!isOtpSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200/60 rounded-md text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 sm:text-sm placeholder-slate-400"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Nomor WhatsApp
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-semibold group-focus-within:text-primary transition-colors">+</span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="block w-full pl-9 pr-4 py-3 border border-slate-200/60 rounded-md text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 sm:text-sm placeholder-slate-400"
                    placeholder="628123456789"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Gunakan format kode negara (contoh: 62) tanpa + atau spasi.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                  Kode OTP
                </label>
                <button
                  type="button"
                  onClick={() => { setIsOtpSent(false); setOtp(''); setErrorMsg(''); }}
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Ubah Data?
                </button>
              </div>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="block w-full px-4 py-3 border border-slate-200/60 rounded-md text-center text-2xl tracking-[0.5em] font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                placeholder="------"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-bold text-white transition-all duration-150 bg-primary hover:brightness-110 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {isOtpSent ? 'Verifikasi & Daftar' : 'Daftar & Kirim OTP'}
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-slate-200/60">
          <p className="text-center text-sm text-slate-500 font-medium">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-bold text-primary hover:text-primary-hover hover:underline transition-colors">
              Login di sini
            </Link>
          </p>
          <div className="flex justify-center items-center gap-4 mt-4 text-[10px] font-semibold text-slate-400">
            <Link to="/services" className="hover:text-primary transition-colors flex items-center gap-1">
              <span>Layanan Kami</span>
            </Link>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <Link to="/categories" className="hover:text-primary transition-colors flex items-center gap-1">
              <span>Kategori</span>
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Register;

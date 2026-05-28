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
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E3FDFD] via-[#71C9CE] to-[#2563EB] font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-white/30 rounded-full blur-[120px] mix-blend-overlay"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#2563EB]/40 rounded-full blur-[150px] mix-blend-multiply"></div>
      
      {/* Main Container - Card */}
      <div className="relative z-10 w-full max-w-[480px] p-6 sm:p-10 m-4 bg-white rounded-2xl shadow-xl border border-white/50 animate-[fadeIn_0.6s_ease-out_forwards]">
        
        {/* Large Logo / Illustration */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 bg-[#E3FDFD] rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#71C9CE]/20 animate-pulse rounded-full"></div>
            <svg
              className="w-14 h-14 text-[#2563EB] relative z-10 transform transition-transform group-hover:scale-110 duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.25 7.151c0-1.229-1.04-2.186-2.261-2.112a15.34 15.34 0 01-11.978 0 2.22 2.22 0 00-2.261 2.112v11.758a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V7.151z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 17.25a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 14.25a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.25 8.25h7.5"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-center">
            Anjem Laundry
          </h1>
          <p className="text-gray-500 mt-2 text-center text-sm font-medium">
            Bergabung & Nikmati Layanan Premium
          </p>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isOtpSent ? 'Verifikasi OTP' : 'Daftar Akun Baru'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isOtpSent
              ? `Masukkan kode OTP yang dikirim ke +${phone}`
              : 'Daftar dengan mudah menggunakan WhatsApp.'}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center animate-[fadeIn_0.3s_ease-in-out]">
            <svg className="w-5 h-5 text-red-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700 font-medium">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-center animate-[fadeIn_0.3s_ease-in-out]">
            <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-700 font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={isOtpSent ? handleVerifyRegisterOtp : handleRequestRegisterOtp} className="space-y-6">
          {!isOtpSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3.5 border-2 border-[#A6E3E9] rounded-xl text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all duration-300 sm:text-sm font-medium placeholder-gray-400"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  Nomor WhatsApp
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-semibold group-focus-within:text-[#2563EB] transition-colors">+</span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="block w-full pl-9 pr-4 py-3.5 border-2 border-[#A6E3E9] rounded-xl text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all duration-300 sm:text-sm font-medium placeholder-gray-400"
                    placeholder="628123456789"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Gunakan format kode negara (contoh: 62) tanpa + atau spasi.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700">
                  Kode OTP
                </label>
                <button
                  type="button"
                  onClick={() => { setIsOtpSent(false); setOtp(''); setErrorMsg(''); }}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
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
                className="block w-full px-4 py-4 border-2 border-[#A6E3E9] rounded-xl text-center text-2xl tracking-[0.5em] font-bold text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all duration-300"
                placeholder="------"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${
              isLoading 
                ? 'bg-[#71C9CE] cursor-not-allowed shadow-none'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] hover:shadow-[#2563EB]/30 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </>
            ) : isOtpSent ? (
              'Verifikasi & Daftar'
            ) : (
              'Daftar & Kirim OTP'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-sm text-gray-600 font-medium">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors">
              Login di sini
            </Link>
          </p>
          <div className="flex justify-center items-center gap-4 mt-4 text-xs font-semibold text-gray-400">
            <Link to="/services" className="hover:text-[#2563EB] transition-colors flex items-center gap-1">
              <span>Layanan Kami</span>
            </Link>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <Link to="/categories" className="hover:text-[#2563EB] transition-colors flex items-center gap-1">
              <span>Kategori</span>
            </Link>
          </div>
        </div>
        
      </div>
      
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

export default Register;

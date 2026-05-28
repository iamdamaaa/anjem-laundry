import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll to add background blur only when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  const guestLinks = [
    { path: '/services', label: 'Layanan' },
    { path: '/categories', label: 'Kategori' },
  ];

  const authLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/orders/new', label: 'Buat Order' },
    { path: '/orders', label: 'Riwayat' },
    { path: '/profile', label: 'Profil' },
  ];

  const currentLinks = isAuthenticated ? authLinks : guestLinks;

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          scrolled || isOpen
            ? 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-sm py-2'
            : 'bg-transparent border-transparent py-4'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link
              to={isAuthenticated ? '/dashboard' : '/services'}
              className="flex items-center gap-2.5 group z-50 relative"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E3FDFD] to-[#CBF1F5] flex items-center justify-center text-[#2563EB] font-black text-lg shadow-inner border border-[#A6E3E9]/50 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[#71C9CE]/20 group-hover:shadow-lg">
                AL
              </div>
              <span className={`font-extrabold text-xl tracking-tight transition-colors duration-300 ${
                scrolled || isOpen ? 'text-gray-900' : 'text-gray-800'
              }`}>
                Anjem Laundry
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {currentLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-[#E3FDFD] text-[#2563EB]'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="w-px h-6 bg-gray-300 mx-2"></div>

              {/* CTA Buttons */}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-gray-900/20 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Logout
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-5 py-2.5 text-gray-700 hover:text-gray-900 text-sm font-bold rounded-xl transition-all duration-300 hover:bg-gray-100"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#2563EB]/25 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden relative z-50 p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-current rounded-full transform transition-all duration-300 origin-left ${isOpen ? 'rotate-45 translate-x-px' : ''}`}></span>
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-full h-0.5 bg-current rounded-full transform transition-all duration-300 origin-left ${isOpen ? '-rotate-45 translate-x-px' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sliding Overlay Menu */}
      <div
        className={`fixed inset-0 z-40 bg-white/95 backdrop-blur-3xl md:hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col pt-24 pb-8 px-6 overflow-y-auto ${
          isOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-4'
        }`}
      >
        <div className="flex flex-col gap-2 flex-grow">
          {currentLinks.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`px-5 py-4 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-between ${
                  isActive
                    ? 'bg-[#E3FDFD] text-[#2563EB]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateY(0)' : 'translateY(10px)',
                }}
              >
                {item.label}
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                )}
              </Link>
            );
          })}
        </div>

        <div 
          className="mt-auto pt-8 flex flex-col gap-3"
          style={{
            transitionDelay: isOpen ? `${currentLinks.length * 50}ms` : '0ms',
            transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full py-4 text-center bg-gray-100 hover:bg-red-50 text-red-600 font-bold rounded-2xl transition-colors duration-300"
            >
              Logout dari Akun
            </button>
          ) : (
            <>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="w-full py-4 text-center bg-[#2563EB] text-white font-bold rounded-2xl shadow-xl shadow-[#2563EB]/25"
              >
                Daftar Akun Baru
              </Link>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full py-4 text-center bg-gray-50 text-gray-700 font-bold rounded-2xl"
              >
                Masuk ke Akun
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;

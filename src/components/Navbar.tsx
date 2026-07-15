import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Palmtree, ShieldCheck, User, LogOut, LogIn, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/I18nContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const navLinks = [
    { href: '/#beranda', label: t('home') },
    { href: '/#paket', label: t('tourPackages') },
    { href: '/sewa-mobil', label: t('carRental') },
    { href: '/#destinasi', label: t('destinations') },
    { href: '/#testimoni', label: t('testimonials') },
    { href: '/#faq', label: t('faq') },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2">
            <Palmtree className={`w-8 h-8 ${scrolled ? 'text-toska-500' : 'text-white'}`} />
            <span className={`text-xl font-bold font-[family-name:var(--font-display)] ${scrolled ? 'text-ocean-900' : 'text-white'}`}>
              ClickAndGo
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              link.href.startsWith('/') && link.href.includes('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-toska-400 ${
                    scrolled ? 'text-ocean-800' : 'text-white/90'
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-toska-400 ${
                    scrolled ? 'text-ocean-800' : 'text-white/90'
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
            <a
              href="/#booking"
              className="bg-toska-500 hover:bg-toska-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-toska-500/25"
            >
              {t('bookingNow')}
            </a>

            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                scrolled
                  ? 'text-ocean-700 border-ocean-200 hover:bg-ocean-50'
                  : 'text-white border-white/20 hover:bg-white/10'
              }`}
              title={locale === 'id' ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
            >
              <Globe className="w-3.5 h-3.5 animate-spin-slow" />
              <span>{locale === 'id' ? 'ID' : 'EN'}</span>
            </button>

            {/* User Auth Button */}
            {isLoggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    scrolled
                      ? 'text-ocean-700 hover:bg-ocean-50'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-toska-400 to-ocean-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {getUserInitial()}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate hidden xl:block">
                    {getUserDisplayName()}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl shadow-ocean-500/10 border border-ocean-100 overflow-hidden py-2"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-ocean-100">
                        <p className="text-sm font-semibold text-ocean-900 truncate">{getUserDisplayName()}</p>
                        <p className="text-xs text-ocean-500 truncate">{user?.email}</p>
                      </div>

                      {/* Admin Panel Link */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-ocean-700 hover:bg-toska-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-toska-500" />
                          <span className="font-medium">{t('adminPanel')}</span>
                          <span className="ml-auto text-xs bg-toska-100 text-toska-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
                        </Link>
                      )}

                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">{t('logout')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  scrolled
                    ? 'text-ocean-700 border-ocean-200 hover:border-toska-400 hover:text-toska-600 hover:bg-toska-50'
                    : 'text-white border-white/30 hover:border-white/60 hover:bg-white/10'
                }`}
              >
                <LogIn className="w-4 h-4" />
                {t('signIn')}
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-ocean-900' : 'text-white'}`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-md border-t border-ocean-100"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(link => (
                link.href.includes('#') && !link.href.startsWith('/sewa') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block px-4 py-3 text-ocean-800 hover:bg-ocean-50 rounded-lg font-medium"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="block px-4 py-3 text-ocean-800 hover:bg-ocean-50 rounded-lg font-medium"
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <a
                href="/#booking"
                className="block text-center bg-toska-500 text-white px-6 py-3 rounded-full font-semibold mt-4 text-sm"
              >
                {t('bookingNow')}
              </a>

              {/* Mobile Language Switcher */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-ocean-100">
                <button
                  onClick={() => setLocale('id')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    locale === 'id'
                      ? 'bg-toska-50 text-toska-600 border-toska-200'
                      : 'text-ocean-500 border-ocean-100'
                  }`}
                >
                  🇮🇩 {t('indonesian')}
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    locale === 'en'
                      ? 'bg-toska-50 text-toska-600 border-toska-200'
                      : 'text-ocean-500 border-ocean-100'
                  }`}
                >
                  🇬🇧 {t('english')}
                </button>
              </div>

              {/* Mobile User Auth */}
              {isLoggedIn ? (
                <div className="border-t border-ocean-100 mt-4 pt-4 space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-toska-400 to-ocean-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {getUserInitial()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ocean-900">{getUserDisplayName()}</p>
                      <p className="text-xs text-ocean-500">{user?.email}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-3 text-toska-600 hover:bg-toska-50 rounded-lg font-medium text-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {t('adminPanel')}
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium w-full text-left text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-ocean-700 border border-ocean-200 hover:bg-ocean-50 rounded-xl font-semibold mt-4 text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  {t('signIn')} / {t('signUp')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

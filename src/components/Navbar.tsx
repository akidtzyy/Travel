import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Palmtree, ShieldCheck, User, LogOut, LogIn, ChevronDown, Globe, MapPin, Phone, Calendar, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/I18nContext';
import supabase from '../lib/supabase';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  
  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin, signOut, profile, refreshProfile } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isScrolledOrSubpage = scrolled || location.pathname !== '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
    setMobileAboutOpen(false);
  }, [location]);

  // Load profile data into form states when profile changes or modal opens
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setBirthDate(profile.birth_date || '');
    }
  }, [profile, showProfileModal]);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    setModalError('');
    setModalSuccess('');

    try {
      // 1. Update public.profiles table in Supabase
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          address: address,
          birth_date: birthDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      // 2. Update auth.users metadata so displayName reflects changes instantly
      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authErr) {
        console.warn('Metadata update failed, profile updated successfully:', authErr.message);
      }

      // 3. Refresh profile state in AuthContext
      await refreshProfile();

      setModalSuccess(locale === 'id' ? 'Profil berhasil diperbarui!' : 'Profile updated successfully!');
      setTimeout(() => {
        setShowProfileModal(false);
        setModalSuccess('');
      }, 1500);

    } catch (err: any) {
      console.error('Profile update error:', err);
      setModalError(err.message || (locale === 'id' ? 'Gagal memperbarui profil' : 'Failed to update profile'));
    } finally {
      setUpdating(false);
    }
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
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
    { href: '/sewa-mobil', label: locale === 'id' ? 'Mobil' : 'Cars' },
    { href: '/#destinasi', label: t('destinations') },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolledOrSubpage ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-ocean-100/50' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-2">
              <Palmtree className={`w-8 h-8 ${isScrolledOrSubpage ? 'text-toska-500' : 'text-white'}`} />
              <span className={`text-xl font-bold font-[family-name:var(--font-display)] ${isScrolledOrSubpage ? 'text-ocean-900' : 'text-white'}`}>
                ClickAndGo Journey
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map(link => (
                link.href.startsWith('/') && link.href.includes('#') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-toska-400 ${isScrolledOrSubpage ? 'text-ocean-800' : 'text-white/90'
                      }`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`text-sm font-medium transition-colors hover:text-toska-400 ${isScrolledOrSubpage ? 'text-ocean-800' : 'text-white/90'
                      }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}

              {/* Dropdown Tentang Kami */}
              <div className="relative group py-2">
                <button
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-toska-400 focus:outline-none ${isScrolledOrSubpage ? 'text-ocean-800' : 'text-white/90'
                    }`}
                >
                  <span>{locale === 'id' ? 'Tentang Kami' : 'About Us'}</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
                </button>

                <div className="absolute left-0 mt-2 w-56 bg-white border border-ocean-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2.5 z-50 transform origin-top -translate-y-1 group-hover:translate-y-0">
                  <a
                    href="/#testimoni"
                    className="block px-5 py-2.5 text-sm text-ocean-800 hover:bg-toska-50 hover:text-toska-600 transition-colors font-medium"
                  >
                    {t('testimonials')}
                  </a>
                  <a
                    href="/#faq"
                    className="block px-5 py-2.5 text-sm text-ocean-800 hover:bg-toska-50 hover:text-toska-600 transition-colors font-medium"
                  >
                    {t('faq')}
                  </a>
                  <a
                    href="/ketentuan-privasi?tab=terms"
                    className="block px-5 py-2.5 text-sm text-ocean-800 hover:bg-toska-50 hover:text-toska-600 transition-colors font-medium"
                  >
                    {t('termsTitle')}
                  </a>
                  <a
                    href="/ketentuan-privasi?tab=privacy"
                    className="block px-5 py-2.5 text-sm text-ocean-800 hover:bg-toska-50 hover:text-toska-600 transition-colors font-medium"
                  >
                    {t('privacyTitle')}
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="/#booking"
                className="bg-toska-500 hover:bg-toska-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-toska-500/25"
              >
                {t('bookingNow')}
              </a>

              {/* Language Switcher */}
              <button
                onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isScrolledOrSubpage
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isScrolledOrSubpage
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

                        {/* Edit Profile Menu Item */}
                        <button
                          onClick={() => {
                            setShowProfileModal(true);
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-ocean-700 hover:bg-toska-50 transition-colors w-full text-left"
                        >
                          <User className="w-4 h-4 text-toska-500" />
                          <span className="font-medium">{locale === 'id' ? 'Edit Profil' : 'Edit Profile'}</span>
                        </button>

                        {/* Admin Panel Link */}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-ocean-700 hover:bg-toska-50 transition-colors border-t border-ocean-50"
                          >
                            <ShieldCheck className="w-4 h-4 text-toska-500" />
                            <span className="font-medium">{t('adminPanel')}</span>
                            <span className="ml-auto text-xs bg-toska-100 text-toska-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
                          </Link>
                        )}

                        {/* Sign Out */}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left border-t border-ocean-50"
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${isScrolledOrSubpage
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
              className={`lg:hidden p-2 rounded-lg ${isScrolledOrSubpage ? 'text-ocean-900' : 'text-white'}`}
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

                {/* Tentang Kami Mobile Accordion */}
                <div className="space-y-1">
                  <button
                    onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 text-ocean-800 hover:bg-ocean-50 rounded-lg font-medium text-left focus:outline-none"
                  >
                    <span>{locale === 'id' ? 'Tentang Kami' : 'About Us'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileAboutOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {mobileAboutOpen && (
                    <div className="pl-4 space-y-1 bg-ocean-50/50 rounded-lg py-1">
                      <a
                        href="/#testimoni"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2.5 text-sm text-ocean-700 hover:bg-ocean-50 rounded-lg font-medium"
                      >
                        {t('testimonials')}
                      </a>
                      <a
                        href="/#faq"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2.5 text-sm text-ocean-700 hover:bg-ocean-50 rounded-lg font-medium"
                      >
                        {t('faq')}
                      </a>
                      <a
                        href="/ketentuan-privasi?tab=terms"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2.5 text-sm text-ocean-700 hover:bg-ocean-50 rounded-lg font-medium"
                      >
                        {t('termsTitle')}
                      </a>
                      <a
                        href="/ketentuan-privasi?tab=privacy"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2.5 text-sm text-ocean-700 hover:bg-ocean-50 rounded-lg font-medium"
                      >
                        {t('privacyTitle')}
                      </a>
                    </div>
                  )}
                </div>
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
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${locale === 'id'
                        ? 'bg-toska-50 text-toska-600 border-toska-200'
                        : 'text-ocean-500 border-ocean-100'
                      }`}
                  >
                    🇮🇩 {t('indonesian')}
                  </button>
                  <button
                    onClick={() => setLocale('en')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${locale === 'en'
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
                    
                    {/* Mobile Edit Profile */}
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-toska-600 hover:bg-toska-50 rounded-lg font-medium text-sm w-full text-left"
                    >
                      <User className="w-4 h-4" />
                      <span>{locale === 'id' ? 'Edit Profil' : 'Edit Profile'}</span>
                    </button>

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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden border border-ocean-100 z-10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-ocean-50 flex items-center justify-between bg-gradient-to-r from-toska-50/50 to-white">
                <div>
                  <h3 className="text-lg font-bold text-ocean-900 font-[family-name:var(--font-display)]">
                    {locale === 'id' ? 'Pengaturan Profil' : 'Profile Settings'}
                  </h3>
                  <p className="text-xs text-ocean-500 mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-8 h-8 rounded-full border border-ocean-100 flex items-center justify-center hover:bg-ocean-50 transition-colors text-ocean-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="p-3.5 bg-green-50 border border-green-100 text-green-600 text-xs rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ocean-700 block">
                    {locale === 'id' ? 'Nama Lengkap' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder={locale === 'id' ? 'Nama lengkap Anda' : 'Your full name'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ocean-100 focus:outline-none focus:ring-2 focus:ring-toska-500 focus:border-transparent text-sm text-ocean-900"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ocean-700 block">
                    {locale === 'id' ? 'Nomor WhatsApp' : 'WhatsApp Number'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 08123456789"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ocean-100 focus:outline-none focus:ring-2 focus:ring-toska-500 focus:border-transparent text-sm text-ocean-900 font-mono"
                    />
                  </div>
                </div>

                {/* Birth Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ocean-700 block">
                    {locale === 'id' ? 'Tanggal Lahir' : 'Birth Date'}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-400" />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ocean-100 focus:outline-none focus:ring-2 focus:ring-toska-500 focus:border-transparent text-sm text-ocean-900"
                    />
                  </div>
                </div>

                {/* House Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ocean-700 block">
                    {locale === 'id' ? 'Alamat Rumah' : 'Home Address'}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-ocean-400" />
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      rows={3}
                      placeholder={locale === 'id' ? 'Alamat rumah lengkap' : 'Your complete address'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ocean-100 focus:outline-none focus:ring-2 focus:ring-toska-500 focus:border-transparent text-sm text-ocean-900 resize-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-toska-500 hover:bg-toska-600 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-toska-500/20 disabled:opacity-50"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{locale === 'id' ? 'Simpan Perubahan' : 'Save Changes'}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

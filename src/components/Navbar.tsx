import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Palmtree, ShieldCheck, User, LogOut, LogIn, ChevronDown, Globe, MapPin, Phone, Calendar, Check, Printer, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/I18nContext';
import { apiFetch } from '../lib/apiFetch';

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

  // My Bookings & Midtrans Invoice states
  const [showMyBookingsModal, setShowMyBookingsModal] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [myBookingsError, setMyBookingsError] = useState('');
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<any>(null);
  const [generatingPelunasanForId, setGeneratingPelunasanForId] = useState<number | null>(null);

  const loadMyBookings = async () => {
    setMyBookingsLoading(true);
    setMyBookingsError('');
    try {
      const res = await apiFetch<any>('/my-bookings');
      setMyBookings(res.data || []);
    } catch (err: any) {
      console.error('Failed to load my bookings:', err);
      setMyBookingsError(err?.message || (locale === 'id' ? 'Gagal memuat pesanan.' : 'Failed to load bookings.'));
    } finally {
      setMyBookingsLoading(false);
    }
  };

  const loadInvoiceFromMidtrans = async (booking: any) => {
    if (!booking.order_id) {
      alert(locale === 'id' ? 'ID Transaksi belum tersedia untuk pesanan ini.' : 'Transaction ID not available for this booking.');
      return;
    }
    setSelectedBookingForInvoice(booking);
    setShowInvoiceModal(true);
    setInvoiceLoading(true);
    setInvoiceData(null);
    try {
      const res = await apiFetch<any>('/payments/verify-status', {
        method: 'POST',
        body: JSON.stringify({ order_id: booking.order_id }),
      });
      setInvoiceData(res.data || null);
    } catch (err: any) {
      console.error('Failed to fetch invoice from Midtrans:', err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const payPelunasan = async (bookingId: number) => {
    setGeneratingPelunasanForId(bookingId);
    try {
      const res = await apiFetch<any>('/payments/snap-token', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: bookingId,
          is_final_payment: true,
        }),
      });
      const paymentUrl = res.data?.payment_url;
      if (paymentUrl) {
        // Open Midtrans payment in new tab
        window.open(paymentUrl, '_blank');
        
        // Start polling verify-and-sync every 5 seconds for up to 3 minutes
        let attempts = 0;
        const maxAttempts = 36; // 36 x 5s = 3 minutes
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const syncRes = await apiFetch<any>('/payments/verify-and-sync', {
              method: 'POST',
              body: JSON.stringify({ booking_id: bookingId }),
            });
            const newStatus = syncRes.payment_status;
            if (newStatus === 'paid') {
              clearInterval(pollInterval);
              setGeneratingPelunasanForId(null);
              await loadMyBookings();
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setGeneratingPelunasanForId(null);
              await loadMyBookings();
            }
          } catch {
            // Silently ignore polling errors
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setGeneratingPelunasanForId(null);
            }
          }
        }, 5000);

        return; // Don't clear generatingPelunasanForId yet — polling will do it
      } else {
        alert(locale === 'id' ? 'Gagal membuat link pelunasan.' : 'Failed to generate final payment link.');
      }
    } catch (err: any) {
      console.error('Error generating pelunasan link:', err);
      alert(err?.message || (locale === 'id' ? 'Terjadi kesalahan.' : 'An error occurred.'));
    }
    setGeneratingPelunasanForId(null);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

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
    const params = new URLSearchParams(window.location.search);
    if (params.get('show_bookings') === 'true') {
      setShowMyBookingsModal(true);
      loadMyBookings();
      // Remove query parameter from URL cleanly without page refresh
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location]);

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
      // Update profile via Laravel API
      await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          address: address,
          birth_date: birthDate || null,
        }),
      });

      // Refresh profile state in AuthContext
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

                        {/* Lihat Pesanan Saya Menu Item */}
                        <button
                          onClick={() => {
                            setShowMyBookingsModal(true);
                            setUserMenuOpen(false);
                            loadMyBookings();
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-ocean-700 hover:bg-toska-50 transition-colors w-full text-left border-t border-ocean-50"
                        >
                          <Calendar className="w-4 h-4 text-toska-500" />
                          <span className="font-medium">{locale === 'id' ? 'Lihat Pesanan Saya' : 'My Bookings'}</span>
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

                    {/* Mobile Lihat Pesanan Saya */}
                    <button
                      onClick={() => {
                        setShowMyBookingsModal(true);
                        setIsOpen(false);
                        loadMyBookings();
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-toska-600 hover:bg-toska-50 rounded-lg font-medium text-sm w-full text-left animate-pulse-slow"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{locale === 'id' ? 'Lihat Pesanan Saya' : 'My Bookings'}</span>
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

      {/* 🧾 MY BOOKINGS MODAL */}
      <AnimatePresence>
        {showMyBookingsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] border border-ocean-100 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-ocean-900 to-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-toska-400" />
                    {locale === 'id' ? 'Pesanan Saya' : 'My Bookings'}
                  </h3>
                  <p className="text-xs text-ocean-300 mt-0.5">
                    {locale === 'id' ? 'Daftar riwayat pemesanan Anda' : 'Your travel and rental booking history'}
                  </p>
                </div>
                <button
                  onClick={() => setShowMyBookingsModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-ocean-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
                {myBookingsLoading ? (
                  <div className="py-20 text-center">
                    <div className="w-10 h-10 border-4 border-toska-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-slate-500 font-medium">
                      {locale === 'id' ? 'Memuat riwayat pesanan...' : 'Retrieving booking history...'}
                    </p>
                  </div>
                ) : myBookingsError ? (
                  <div className="py-16 text-center max-w-md mx-auto">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-800">{myBookingsError}</p>
                    <button
                      onClick={loadMyBookings}
                      className="mt-4 px-5 py-2 bg-toska-500 hover:bg-toska-600 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      {locale === 'id' ? 'Coba Lagi' : 'Try Again'}
                    </button>
                  </div>
                ) : myBookings.length === 0 ? (
                  <div className="py-20 text-center max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-ocean-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-toska-500" />
                    </div>
                    <h4 className="text-base font-bold text-ocean-900">
                      {locale === 'id' ? 'Belum Ada Pesanan' : 'No Bookings Yet'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {locale === 'id'
                        ? 'Anda belum melakukan pemesanan apa pun. Mulai jelajahi paket wisata kami!'
                        : 'You haven\'t made any bookings yet. Start exploring our exciting tour packages!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myBookings.map((booking: any) => {
                      const isDP = booking.payment_type === 'DP';
                      const hasBalance = (booking.remaining_balance ?? 0) > 0;
                      
                      return (
                        <div
                          key={booking.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-toska-200 shadow-sm transition-all space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                {booking.booking_code}
                              </span>
                              <span className="text-xs text-slate-400 ml-2.5">
                                {new Date(booking.created_at).toLocaleDateString(undefined, {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {/* Payment Status Badge */}
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                                  booking.payment_status === 'paid'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : booking.payment_status === 'partially_paid'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : booking.payment_status === 'pending'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {booking.payment_status === 'partially_paid'
                                  ? (locale === 'id' ? 'DP Dibayar' : 'Partially Paid')
                                  : booking.payment_status || 'unpaid'}
                              </span>
                              {/* Booking Status Badge */}
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                                  booking.status === 'confirmed' || booking.status === 'completed'
                                    ? 'bg-emerald-500 text-white'
                                    : booking.status === 'cancelled'
                                    ? 'bg-slate-500 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {booking.status || 'pending'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {booking.booking_type === 'package' ? (locale === 'id' ? 'Paket Wisata' : 'Tour Package') : (locale === 'id' ? 'Sewa Mobil' : 'Car Rental')}
                              </p>
                              <h4 className="text-sm font-bold text-slate-900 mt-0.5">{booking.item_name}</h4>
                              <div className="mt-2 space-y-1 text-xs text-slate-500">
                                <p>🗓️ {booking.date} ({booking.duration})</p>
                                <p>👤 {booking.customer?.name} ({booking.customer?.phone})</p>
                              </div>
                            </div>
                            <div className="bg-slate-50 p-3.5 rounded-xl flex flex-col justify-between">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">{locale === 'id' ? 'Total Harga' : 'Total Price'}</span>
                                <span className="font-bold text-slate-900">Rp {parseFloat(booking.total_price).toLocaleString('id-ID')}</span>
                              </div>
                              {isDP && (
                                <div className="mt-1 space-y-1 text-xs border-t border-slate-200/60 pt-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500">{locale === 'id' ? 'Sudah Dibayar' : 'Paid amount'}</span>
                                    <span className="font-semibold text-emerald-600">Rp {parseFloat(booking.amount_paid).toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500">{locale === 'id' ? 'Sisa Pelunasan' : 'Remaining Balance'}</span>
                                    <span className="font-bold text-red-600">Rp {parseFloat(booking.remaining_balance).toLocaleString('id-ID')}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2.5 justify-end pt-2 border-t border-slate-100">
                            {/* Pay Now Button (Unpaid) */}
                            {booking.payment_status === 'unpaid' && booking.payment_link && (
                              <a
                                href={booking.payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-toska-500 hover:bg-toska-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-toska-500/10"
                              >
                                💳 {locale === 'id' ? 'Bayar Sekarang' : 'Pay Now'}
                              </a>
                            )}

                            {/* Pay Pelunasan (Partially Paid) */}
                            {booking.payment_status === 'partially_paid' && hasBalance && (
                              <button
                                onClick={() => payPelunasan(booking.id)}
                                disabled={generatingPelunasanForId === booking.id}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 min-w-[150px]"
                              >
                                {generatingPelunasanForId === booking.id ? (
                                  <span className="flex items-center gap-1.5 justify-center">
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {locale === 'id' ? 'Menunggu Konfirmasi...' : 'Checking Payment...'}
                                  </span>
                                ) : (
                                  <span>💳 {locale === 'id' ? 'Bayar Pelunasan' : 'Pay Balance'}</span>
                                )}
                              </button>
                            )}

                            {/* Invoice Button (retrieved from Midtrans) */}
                            {booking.order_id && (
                              <button
                                onClick={() => loadInvoiceFromMidtrans(booking)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {locale === 'id' ? 'Lihat Invoice' : 'View Invoice'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setShowMyBookingsModal(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  {locale === 'id' ? 'Tutup' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🧾 MIDTRANS RETRIEVED INVOICE MODAL */}
      <AnimatePresence>
        {showInvoiceModal && selectedBookingForInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:p-0 print:absolute print:inset-0 print:z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:max-h-none print:overflow-visible print:border-none print:shadow-none print:w-full"
            >
              {/* Modal controls - hidden in print */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-toska-400" />
                  {locale === 'id' ? 'Invoice Resmi Pembayaran' : 'Official Payment Invoice'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="px-3.5 py-1.5 rounded-lg bg-toska-500 hover:bg-toska-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {locale === 'id' ? 'Cetak' : 'Print'}
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div id="printable-invoice" className="p-8 space-y-6 bg-white text-slate-800 font-sans overflow-y-auto flex-1 print:overflow-visible print:p-0">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                      <Palmtree className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-slate-900">ClickAndGo Journey</h2>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">Bali Travel & Rent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{t('invoice').toUpperCase()}</h1>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">INV/{new Date().getFullYear()}/BOOK-{selectedBookingForInvoice.id}</p>
                  </div>
                </div>

                {/* Company & Client Meta */}
                <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-5">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5">{locale === 'id' ? 'Diterbitkan Oleh' : 'Issued By'}</h4>
                    <p className="font-bold text-slate-800">ClickAndGo Journey</p>
                    <p className="text-slate-500">Jl. Danau Tondano IV/9A, Sanur, Bali</p>
                    <p className="text-slate-500">WhatsApp: +62 812-4349-9265</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5">{locale === 'id' ? 'Ditujukan Kepada' : 'Billed To'}</h4>
                    <p className="font-bold text-slate-800">{selectedBookingForInvoice.customer?.name || selectedBookingForInvoice.name}</p>
                    <p className="text-slate-500">Email: {selectedBookingForInvoice.customer?.email || selectedBookingForInvoice.email}</p>
                    <p className="text-slate-500">Phone: {selectedBookingForInvoice.customer?.phone || selectedBookingForInvoice.phone}</p>
                  </div>
                </div>

                {/* Booking details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{locale === 'id' ? 'Layanan Dipesan' : 'Ordered Service'}</h4>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{selectedBookingForInvoice.item_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {selectedBookingForInvoice.booking_type === 'package' ? (locale === 'id' ? 'Paket Wisata' : 'Tour Package') : (locale === 'id' ? 'Sewa Mobil' : 'Car Rental')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">{selectedBookingForInvoice.date}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedBookingForInvoice.duration}</p>
                    </div>
                  </div>
                </div>

                {/* Midtrans Data (Retrieved from Midtrans) */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    {locale === 'id' ? 'Informasi Transaksi (Midtrans)' : 'Transaction Info (Midtrans)'}
                  </h4>
                  {invoiceLoading ? (
                    <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                      <div className="w-6 h-6 border-2 border-toska-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-[10px] text-slate-500">{locale === 'id' ? 'Mengambil data dari Midtrans...' : 'Fetching data from Midtrans...'}</p>
                    </div>
                  ) : invoiceData ? (
                    <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      <div className="grid grid-cols-2 p-3 bg-slate-50/55">
                        <span className="text-slate-500">{locale === 'id' ? 'Status Transaksi' : 'Transaction Status'}</span>
                        <span className="font-bold text-green-600 text-right uppercase">{invoiceData.transaction_status || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2 p-3">
                        <span className="text-slate-500">{locale === 'id' ? 'Metode Pembayaran' : 'Payment Method'}</span>
                        <span className="font-semibold text-slate-800 text-right capitalize">{(invoiceData.payment_type || '').replace('_', ' ')}</span>
                      </div>
                      {invoiceData.va_numbers?.[0] && (
                        <div className="grid grid-cols-2 p-3">
                          <span className="text-slate-500">Virtual Account ({invoiceData.va_numbers[0].bank?.toUpperCase()})</span>
                          <span className="font-mono font-bold text-slate-800 text-right">{invoiceData.va_numbers[0].va_number}</span>
                        </div>
                      )}
                      {invoiceData.bca_va_number && (
                        <div className="grid grid-cols-2 p-3">
                          <span className="text-slate-500">BCA Virtual Account</span>
                          <span className="font-mono font-bold text-slate-800 text-right">{invoiceData.bca_va_number}</span>
                        </div>
                      )}
                      {invoiceData.permata_va_number && (
                        <div className="grid grid-cols-2 p-3">
                          <span className="text-slate-500">Permata Bank Transfer</span>
                          <span className="font-mono font-bold text-slate-800 text-right">{invoiceData.permata_va_number}</span>
                        </div>
                      )}
                      {invoiceData.bill_key && (
                        <div className="grid grid-cols-2 p-3">
                          <span className="text-slate-500">Mandiri Bill Key</span>
                          <span className="font-mono font-bold text-slate-800 text-right">{invoiceData.bill_key}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 p-3">
                        <span className="text-slate-500">{locale === 'id' ? 'Waktu Transaksi' : 'Transaction Time'}</span>
                        <span className="font-medium text-slate-600 text-right">{invoiceData.transaction_time || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2 p-3 bg-emerald-50/20 font-bold text-sm">
                        <span className="text-slate-600">{locale === 'id' ? 'Jumlah Dibayar (Midtrans)' : 'Amount Paid (Midtrans)'}</span>
                        <span className="text-slate-900 text-right">Rp {parseFloat(invoiceData.gross_amount || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs text-center">
                      ⚠️ {locale === 'id' ? 'Gagal memuat status detail pembayaran langsung dari Midtrans.' : 'Unable to query payment gateway details from Midtrans.'}
                    </div>
                  )}
                </div>

                {/* Bottom Notice */}
                <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-100">
                  {locale === 'id'
                    ? 'Terima kasih telah memesan bersama ClickAndGo Journey. Simpan halaman ini sebagai bukti pembayaran sah.'
                    : 'Thank you for booking with ClickAndGo Journey. Keep this page as a valid proof of payment.'}
                </div>
              </div>

              {/* Footer controls - hidden in print */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 print:hidden">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  {locale === 'id' ? 'Tutup' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

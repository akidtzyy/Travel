import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Car, Users, Clock, CheckCircle, Send, ArrowLeft, Fuel, Settings, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/I18nContext';

interface CarRental {
  id: number;
  name: string;
  type: string;
  price: number;
  duration_desc: string;
  seats: number;
  image_url: string;
  category: string;
  features: string[];
  is_available?: boolean;
}

export default function CarRentalPage() {
  const { user, isLoggedIn, profile } = useAuth();
  const { t, locale, translateText } = useI18n();
  const [cars, setCars] = useState<CarRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'self_drive' | 'with_driver'>('self_drive');
  const [bookingForm, setBookingForm] = useState({
    name: '', email: '', phone: '', item_name: '', booking_type: 'car', date: '', duration: '', notes: '', total_price: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | ''>('');

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const { data, error } = await supabase
          .from('car_rentals')
          .select('*')
          .order('price', { ascending: true });
        if (error) throw error;
        if (data) setCars(data);
      } catch (err) {
        console.error('Error loading cars:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCars();
  }, []);

  // Auto-fill user data when logged in or profile changes
  useEffect(() => {
    if (isLoggedIn) {
      setBookingForm(prev => ({
        ...prev,
        name: profile?.full_name || user?.user_metadata?.full_name || prev.name,
        email: profile?.email || user?.email || prev.email,
        phone: profile?.phone || prev.phone,
      }));
    }
  }, [user, profile, isLoggedIn]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const availableCars = cars.filter(c => c.is_available !== false);
  const filteredCars = availableCars.filter(c => c.type === activeTab);
  const unavailableCarsCount = cars.filter(c => c.is_available === false).length;
  const selectedCar = useMemo(() => cars.find(c => c.id === selectedCarId), [cars, selectedCarId]);

  // Auto-fill form when car is selected
  useEffect(() => {
    if (selectedCar) {
      setBookingForm(prev => ({
        ...prev,
        item_name: `${translateText(selectedCar.name)} (${selectedCar.type === 'self_drive' ? t('selfDrive') : t('withDriver')})`,
        total_price: formatPrice(selectedCar.price),
      }));
    }
  }, [selectedCar, t, translateText]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    // Format pesan WhatsApp (selalu gunakan bahasa Indonesia untuk admin)
    const message = `*BOOKING SEWA MOBIL - ClickAndGo Journey*%0A%0A` +
      `*Kendaraan:* ${bookingForm.item_name}%0A` +
      `*Durasi Sewa:* ${bookingForm.duration || 'Belum ditentukan'}%0A` +
      `*Harga:* ${bookingForm.total_price}%0A%0A` +
      `*Data Pemesan:*%0A` +
      `Nama: ${bookingForm.name}%0A` +
      `Email: ${bookingForm.email}%0A` +
      `WhatsApp: ${bookingForm.phone}%0A` +
      `Tanggal Sewa: ${bookingForm.date}%0A%0A` +
      `${bookingForm.notes ? `*Catatan:*%0A${bookingForm.notes}%0A%0A` : ''}` +
      `Mohon informasi lebih lanjut. Terima kasih!`;

    // Nomor WhatsApp admin
    const whatsappNumber = '6281243499265'; // Format: 62xxx (tanpa + atau 0)

    try {
      setBookingLoading(true);
      const cleanPhone = bookingForm.phone.replace(/\D/g, '');
      const notesWithDetails = `Tipe: Sewa Mobil\nKendaraan: ${bookingForm.item_name}\nDurasi: ${bookingForm.duration}\nTanggal Sewa: ${bookingForm.date}\nHarga: ${bookingForm.total_price}\nCatatan: ${bookingForm.notes}`;

      // Original Customer insert
      const { error: custErr } = await supabase.from('customers').insert({
        full_name: bookingForm.name,
        phone: cleanPhone,
        email: bookingForm.email,
        booking_status: 'booked',
        notes: notesWithDetails
      });
      if (custErr) throw custErr;

      // NEW Bookings insert
      const { error: bookingErr } = await supabase.from('bookings').insert({
        name: bookingForm.name,
        email: bookingForm.email,
        phone: cleanPhone,
        booking_type: 'car',
        item_name: bookingForm.item_name,
        date: bookingForm.date,
        duration: bookingForm.duration,
        notes: bookingForm.notes,
        total_price: bookingForm.total_price,
        status: 'pending'
      });
      if (bookingErr) throw bookingErr;

      setBookingSuccess(true);
    } catch (err) {
      console.error("Gagal menyimpan data sewa ke database:", err);
    } finally {
      setBookingLoading(false);
    }

    // Redirect ke WhatsApp
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');

    // Reset form
    setBookingForm(prev => ({
      ...prev,
      item_name: '',
      date: '',
      duration: '',
      notes: '',
      total_price: ''
    }));
    setSelectedCarId('');
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const selectCar = (car: CarRental) => {
    setActiveTab(car.type as 'self_drive' | 'with_driver');
    setSelectedCarId(car.id);
    setShowForm(true);
    setTimeout(() => document.getElementById('car-booking-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50 pt-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-toska-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ocean-600 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-28 bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-toska-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-ocean-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-ocean-300 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('backToHome')}</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-toska-500/20 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-toska-400" />
              </div>
              <span className="text-toska-400 font-semibold text-sm uppercase tracking-wider">{t('sewaMobilBali')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-[family-name:var(--font-display)] mb-4">
              {locale === 'id' ? 'Armada Lengkap untuk' : 'Complete Fleet for'}
              <br />
              <span className="text-toska-400">{locale === 'id' ? 'Perjalanan Anda' : 'Your Journey'}</span>
            </h1>
            <p className="text-ocean-200 text-lg max-w-2xl">
              {locale === 'id'
                ? 'Pilihan kendaraan terbaik dari city car hingga bus besar. Tersedia option self drive atau dengan driver profesional yang mengenal Bali dengan baik.'
                : 'The best selection of vehicles from city cars to large buses. Available self-drive or with professional drivers who know Bali well.'}
            </p>
            {/* Availability Summary */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white font-medium">{availableCars.length} {locale === 'id' ? 'kendaraan tersedia' : 'vehicles available'}</span>
              </div>
              {unavailableCarsCount > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-ocean-300">{unavailableCarsCount} {locale === 'id' ? 'sedang tidak tersedia' : 'currently unavailable'}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab Switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-ocean-100 p-2 inline-flex gap-2">
          <button
            onClick={() => { setActiveTab('self_drive'); setSelectedCarId(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'self_drive'
                ? 'bg-toska-500 text-white shadow-lg shadow-toska-500/25'
                : 'text-ocean-600 hover:bg-ocean-50'
              }`}
          >
            <Settings className="w-4 h-4" />
            {t('selfDrive')}
          </button>
          <button
            onClick={() => { setActiveTab('with_driver'); setSelectedCarId(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === 'with_driver'
                ? 'bg-toska-500 text-white shadow-lg shadow-toska-500/25'
                : 'text-ocean-600 hover:bg-ocean-50'
              }`}
          >
            <Users className="w-4 h-4" />
            {t('withDriver')}
          </button>
        </div>
      </section>

      {/* Car Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCars.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-ocean-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="w-10 h-10 text-ocean-300" />
              </div>
              <h3 className="text-lg font-bold text-ocean-800 mb-2">{locale === 'id' ? 'Belum ada kendaraan tersedia' : 'No vehicles available yet'}</h3>
              <p className="text-ocean-500 text-sm max-w-md mx-auto">
                {locale === 'id'
                  ? `Saat ini belum ada kendaraan ${activeTab === 'self_drive' ? 'self drive' : 'dengan supir'} yang tersedia. Silakan cek kembali nanti atau hubungi kami.`
                  : `Currently no ${activeTab === 'self_drive' ? 'self drive' : 'with driver'} vehicles available. Please check back later or contact us.`}
              </p>
            </motion.div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-ocean-100 group"
              >
                <div className="relative h-44 bg-gradient-to-br from-ocean-50 to-sand-50 flex items-center justify-center overflow-hidden">
                  {car.image_url ? (
                    <img src={car.image_url} alt={translateText(car.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Car className="w-20 h-20 text-ocean-200 group-hover:text-toska-300 transition-colors" />
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-ocean-800 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {car.seats} {locale === 'id' ? 'Kursi' : 'Seats'}
                  </div>
                  {/* Availability Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-semibold text-white">{t('available')}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-ocean-900 mb-1 font-[family-name:var(--font-display)]">{translateText(car.name)}</h3>
                  <p className="text-ocean-500 text-xs mb-3">{translateText(car.category)}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-ocean-600 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {translateText(car.duration_desc)}
                    </div>
                    <div className="flex items-center gap-1 text-ocean-600 text-xs">
                      <Fuel className="w-3.5 h-3.5" />
                      {t('bbmTermasuk')}
                    </div>
                  </div>
                  {car.features && car.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {car.features.slice(0, 3).map((f, j) => (
                        <span key={j} className="bg-ocean-50 text-ocean-600 text-xs px-2 py-0.5 rounded-full">{translateText(f)}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-ocean-100">
                    <div>
                      <p className="text-xl font-bold text-toska-600">{formatPrice(car.price)}</p>
                      <p className="text-xs text-ocean-500">{translateText(car.duration_desc)}</p>
                    </div>
                    <button
                      onClick={() => selectCar(car)}
                      className="bg-ocean-900 hover:bg-ocean-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                    >
                      {t('pesan')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-12 bg-ocean-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: t('selfDrive'), desc: locale === 'id' ? 'Bawa mobil sendiri dengan syarat KTP/SIM dan deposit. Antar-jemput area Kuta, Seminyak, dan Nusa Dua.' : 'Drive the car yourself with ID card/driver license and deposit. Pick-up and drop-off in Kuta, Seminyak, and Nusa Dua areas.', icon: Settings },
              { title: t('withDriver'), desc: locale === 'id' ? 'Driver profesional yang ramah dan menguasai seluruh rute wisata Bali. Termasuk BBM dan air mineral.' : 'Friendly professional drivers who know all Bali tourist routes. Fuel and mineral water included.', icon: Users },
              { title: locale === 'id' ? 'Syarat & Ketentuan' : 'Terms & Conditions', desc: locale === 'id' ? 'Booking minimal H-1. Pembatalan H-3 full refund. Overtime charge 10% per jam dari harga sewa.' : 'Minimum H-1 booking. Cancellation H-3 full refund. Overtime charge 10% per hour of the rental price.', icon: CheckCircle },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-ocean-100"
              >
                <item.icon className="w-8 h-8 text-toska-500 mb-3" />
                <h3 className="font-bold text-ocean-900 mb-2">{item.title}</h3>
                <p className="text-ocean-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      {showForm && (
        <section id="car-booking-form" className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-toska-500 font-semibold text-sm uppercase tracking-wider">{locale === 'id' ? 'Reservasi' : 'Reservation'}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mt-2 mb-4">
                {locale === 'id' ? 'Booking Sewa Mobil' : 'Car Rental Booking'}
              </h2>
              <p className="text-ocean-600">
                {locale === 'id'
                  ? 'Pilih tipe sewa dan kendaraan yang Anda inginkan, lalu lengkapi data diri. Tim kami akan segera menghubungi Anda.'
                  : 'Select the rental type and vehicle you want, then complete your personal details. Our team will contact you shortly.'}
              </p>
            </div>

            {bookingSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium">
                  {locale === 'id'
                    ? 'Booking berhasil dikirim! Tim kami akan menghubungi Anda dalam 1x24 jam.'
                    : 'Booking successfully sent! Our team will contact you within 24 hours.'}
                </span>
              </motion.div>
            )}

            <form onSubmit={handleBooking} className="bg-ocean-50 rounded-2xl p-8 border border-ocean-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-ocean-800 mb-1.5">{t('fullName')} *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.name}
                    readOnly={isLoggedIn && (!!profile?.full_name || !!user?.user_metadata?.full_name)}
                    onChange={e => setBookingForm(p => ({ ...p, name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border border-ocean-200 focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm ${isLoggedIn && (profile?.full_name || user?.user_metadata?.full_name) ? 'bg-ocean-100 text-ocean-600 cursor-not-allowed' : 'bg-white'}`}
                    placeholder={locale === 'id' ? 'Nama Anda' : 'Your Name'}
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-ocean-800 mb-1.5">{t('emailAddress')} *</label>
                  <input
                    type="email"
                    required
                    value={bookingForm.email}
                    readOnly={isLoggedIn && (!!profile?.email || !!user?.email)}
                    onChange={e => setBookingForm(p => ({ ...p, email: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border border-ocean-200 focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm ${isLoggedIn && (profile?.email || user?.email) ? 'bg-ocean-100 text-ocean-600 cursor-not-allowed' : 'bg-white'}`}
                    placeholder="email@contoh.com"
                  />
                </div>
                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-ocean-800 mb-1.5">{t('whatsAppNumber')} *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={bookingForm.phone}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setBookingForm(p => ({ ...p, phone: value }));
                    }}
                    onKeyDown={e => {
                      if ([8, 9, 27, 13, 46, 37, 39].includes(e.keyCode) ||
                        (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode))) {
                        return;
                      }
                      if ((e.keyCode < 48 || e.keyCode > 57) &&
                        (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                    placeholder="08xxxxxxxxxx"
                  />
                  <p className="text-xs text-ocean-500 mt-1">{locale === 'id' ? 'Hanya angka yang diperbolehkan' : 'Only numbers allowed'}</p>
                </div>
                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-ocean-800 mb-1.5">{t('startDateRent')} *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                  />
                </div>

                {/* Tipe Sewa */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ocean-800 mb-1.5">{t('carType')} *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('self_drive'); setSelectedCarId(''); }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${activeTab === 'self_drive'
                          ? 'bg-toska-500 text-white border-toska-500 shadow-md'
                          : 'bg-white text-ocean-700 border-ocean-200 hover:border-toska-300'
                        }`}
                    >
                      🔑 {t('selfDrive')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('with_driver'); setSelectedCarId(''); }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${activeTab === 'with_driver'
                          ? 'bg-toska-500 text-white border-toska-500 shadow-md'
                          : 'bg-white text-ocean-700 border-ocean-200 hover:border-toska-300'
                        }`}
                    >
                      👤 {t('withDriver')}
                    </button>
                  </div>
                </div>

                {/* Pilih Kendaraan */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ocean-800 mb-1.5">{locale === 'id' ? 'Pilih Kendaraan' : 'Select Vehicle'} *</label>
                  <select
                    required
                    value={selectedCarId}
                    onChange={e => setSelectedCarId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                  >
                    <option value="">— {locale === 'id' ? 'Pilih kendaraan' : 'Select vehicle'} —</option>
                    {filteredCars.map(car => (
                      <option key={car.id} value={car.id}>
                        {translateText(car.name)} ({car.seats} Seat) — {formatPrice(car.price)} / {translateText(car.duration_desc)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durasi Sewa & Price Summary */}
                {selectedCar && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-ocean-800 mb-1.5">{t('rentDuration')}</label>
                      <input
                        type="text"
                        value={bookingForm.duration}
                        onChange={e => setBookingForm(p => ({ ...p, duration: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                        placeholder={locale === 'id' ? 'Contoh: 2 hari' : 'Example: 2 days'}
                      />
                    </div>

                    {/* Price Summary */}
                    <div className="bg-toska-50 border border-toska-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-toska-700 font-medium">{translateText(selectedCar.name)}</p>
                        <p className="text-xs text-toska-600">{selectedCar.seats} Seat · {translateText(selectedCar.duration_desc)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-toska-700">{formatPrice(selectedCar.price)}</p>
                        <p className="text-xs text-toska-600">{translateText(selectedCar.duration_desc)}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Catatan */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ocean-800 mb-1.5">{t('additionalNotes')}</label>
                  <textarea
                    rows={3}
                    value={bookingForm.notes}
                    onChange={e => setBookingForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm resize-none"
                    placeholder={locale === 'id' ? 'Lokasi penjemputan, waktu, permintaan khusus, dll.' : 'Pick-up location, time, special requests, etc.'}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full mt-6 bg-toska-500 hover:bg-toska-600 disabled:bg-toska-300 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-toska-500/25 flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t('bookingNow')}
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
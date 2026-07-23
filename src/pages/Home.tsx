import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronDown, ChevronUp, Phone, CheckCircle, Car, Sparkles, Shield, Heart, LogIn, UserCheck, CreditCard } from 'lucide-react';
import Lenis from 'lenis';
import Hero from '../components/Hero';
import PackageCard from '../components/PackageCard';
import Footer from '../components/Footer';
import PaymentModal, { type PaymentStep } from '../components/PaymentModal';
import { openSnapPayment } from '../lib/midtrans';
import supabase from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/I18nContext';

interface TourPackage {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: number;
  highlights: string[];
  image_url: string;
  category: string;
  included?: {
    itinerary?: Array<{ day: number; title: string; activities: string[] }>;
    hotels?: Array<{ hotel: string; prices: Record<string, number> }>;
    includes_list?: string[];
    excludes_list?: string[];
  };
}

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
}

interface Destination {
  id: number;
  name: string;
  description: string;
  image_url: string;
  category: string;
  rating: number;
}

interface Testimonial {
  id: number;
  name: string;
  origin: string;
  rating: number;
  text: string;
  trip_date: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const paxLabels: Record<string, string> = {
  '2pax': '2 Pax',
  '4pax': '4 Pax',
  '6pax': '6 Pax',
  '8pax': '8 Pax',
  '10pax': '10 Pax',
  '12pax': '12 Pax',
  '14pax': '14 Pax',
  '15+1foc': '15+1 FOC',
  '20+1foc': '20+1 FOC',
  '25+1foc': '25+1 FOC',
  '30+1foc': '30+1 FOC',
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function Home() {
  const { user, isLoggedIn } = useAuth();
  const { t, locale, translateText } = useI18n();

  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [carRentals, setCarRentals] = useState<CarRental[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('Semua');

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    name: '', email: '', phone: '', item_name: '', booking_type: 'package', date: '', duration: '', notes: '', total_price: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Payment state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('closed');
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);

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

  // Auto-fill user data when logged in
  useEffect(() => {
    if (user) {
      setBookingForm(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Smart dropdown states
  const [selectedPkgId, setSelectedPkgId] = useState<number | ''>('');
  const [selectedHotelIdx, setSelectedHotelIdx] = useState(0);
  const [selectedPaxKey, setSelectedPaxKey] = useState('');
  const [carFilterType, setCarFilterType] = useState('self_drive');
  const [selectedCarId, setSelectedCarId] = useState<number | ''>('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const { data: pkgs, error: pkgErr } = await supabase.from('tour_packages').select('*').eq('is_available', true);
        console.log("Data paket dari Supabase:", pkgs);
        const { data: dests, error: destErr } = await supabase.from('destinations').select('*');
        const { data: cars } = await supabase.from('car_rentals').select('*').eq('is_available', true);
        const { data: tests } = await supabase.from('testimonials').select('*');
        const { data: faqData } = await supabase.from('faqs').select('*');

        if (pkgErr) console.error("Error paket:", pkgErr);
        if (destErr) console.error("Error destinasi:", destErr);

        if (pkgs) setPackages(pkgs);
        if (cars) setCarRentals(cars);
        if (dests) setDestinations(dests);
        if (tests) setTestimonials(tests);
        if (faqData) setFaqs(faqData);

      } catch (err) {
        console.error("Gagal mengambil data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  // 🟢 PERBAIKAN 1: Deklarasikan filteredPackages agar bisa dipakai di bagian JSX
  const filteredPackages = useMemo(() => {
    if (activeCategory === 'Semua') return packages;
    return packages.filter(p => p.category === activeCategory);
  }, [packages, activeCategory]);

  // Computed: selected package
  const selectedPkg = useMemo(() => packages.find(p => p.id === selectedPkgId), [packages, selectedPkgId]);
  const selectedHotel = selectedPkg?.included?.hotels?.[selectedHotelIdx];
  const isPaxPricing = useMemo(() => {
    if (!selectedHotel?.prices) return true;
    return Object.keys(selectedHotel.prices).every(k => k in paxLabels);
  }, [selectedHotel]);

  // Computed: pax options for selected hotel
  const paxOptions = useMemo(() => {
    if (!selectedHotel?.prices) return [];
    return Object.keys(selectedHotel.prices).map(key => ({
      key,
      label: paxLabels[key] || key,
      price: selectedHotel.prices[key],
    }));
  }, [selectedHotel]);

  // Computed: filtered cars
  const filteredCars = useMemo(() => carRentals.filter(c => c.type === carFilterType), [carRentals, carFilterType]);
  const selectedCar = useMemo(() => carRentals.find(c => c.id === selectedCarId), [carRentals, selectedCarId]);

  // Computed: final price
  const computedPrice = useMemo(() => {
    if (bookingForm.booking_type === 'package' && selectedHotel && selectedPaxKey) {
      return selectedHotel.prices[selectedPaxKey] || 0;
    }
    if (bookingForm.booking_type === 'car' && selectedCar) {
      return selectedCar.price;
    }
    return 0;
  }, [bookingForm.booking_type, selectedHotel, selectedPaxKey, selectedCar]);

  // Auto-update item_name and total_price
  useEffect(() => {
    if (bookingForm.booking_type === 'package' && selectedPkg && selectedHotel && selectedPaxKey) {
      const paxLabel = isPaxPricing ? (paxLabels[selectedPaxKey] || selectedPaxKey) : selectedPaxKey;
      setBookingForm(prev => ({
        ...prev,
        item_name: `${selectedPkg.name} — ${selectedHotel.hotel}`,
        duration: paxLabel,
        total_price: formatPrice(computedPrice),
      }));
    }
    if (bookingForm.booking_type === 'car' && selectedCar) {
      setBookingForm(prev => ({
        ...prev,
        item_name: `${selectedCar.name} (${selectedCar.type === 'self_drive' ? 'Self Drive' : 'With Driver'})`,
        duration: selectedCar.duration_desc,
        total_price: formatPrice(computedPrice),
      }));
    }
  }, [bookingForm.booking_type, selectedPkg, selectedHotel, selectedPaxKey, selectedCar, computedPrice, isPaxPricing]);

  // Reset sub-selections when booking type changes
  const handleBookingTypeChange = (type: string) => {
    setBookingForm(prev => ({ ...prev, booking_type: type, item_name: '', duration: '', total_price: '' }));
    setSelectedPkgId('');
    setSelectedHotelIdx(0);
    setSelectedPaxKey('');
    setSelectedCarId('');
  };

  const handlePkgChange = (id: number | '') => {
    setSelectedPkgId(id);
    setSelectedHotelIdx(0);
    setSelectedPaxKey('');
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setBookingLoading(true);
      const cleanPhone = bookingForm.phone.replace(/\D/g, '');
      const notesWithDetails = `Tipe: ${bookingForm.booking_type === 'package' ? 'Paket Wisata' : 'Sewa Mobil'}\nItem: ${bookingForm.item_name}\nJumlah/Durasi: ${bookingForm.duration}\nTanggal: ${bookingForm.date}\nHarga: ${bookingForm.total_price}\nCatatan: ${bookingForm.notes}`;

      // Insert customer record
      const { error: custErr } = await supabase.from('customers').insert({
        full_name: bookingForm.name,
        phone: cleanPhone,
        email: bookingForm.email,
        booking_status: 'booked',
        notes: notesWithDetails
      });
      if (custErr) throw custErr;

      // Insert booking record — get back the ID
      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          name: bookingForm.name,
          email: bookingForm.email,
          phone: cleanPhone,
          booking_type: bookingForm.booking_type,
          item_name: bookingForm.item_name,
          date: bookingForm.date,
          duration: bookingForm.duration,
          notes: bookingForm.notes,
          total_price: bookingForm.total_price,
          status: 'pending',
          payment_status: 'unpaid',
        })
        .select('id')
        .single();
      if (bookingErr) throw bookingErr;

      setPendingBookingId(bookingData.id);
      setPaymentStep('confirm');
      setBookingSuccess(true);
    } catch (err) {
      console.error('Gagal menyimpan data booking ke database:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!pendingBookingId) return;
    setPaymentStep('processing');

    // Helper: update booking status directly from frontend (reliable fallback)
    const updateBookingStatus = async (status: string, orderId?: string) => {
      try {
        await fetch('/api/payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: pendingBookingId,
            payment_status: status,
            ...(orderId ? { order_id: orderId } : {}),
          }),
        });
      } catch (e) {
        console.warn('Could not update booking status:', e);
      }
    };

    try {
      // Get snap token from our API — pass booking details directly
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: pendingBookingId,
          name: bookingForm.name,
          email: bookingForm.email,
          phone: bookingForm.phone,
          item_name: bookingForm.item_name,
          total_price: bookingForm.total_price,
          booking_type: bookingForm.booking_type,
        }),
      });
      const responseData = await res.json();
      const { snap_token, order_id, error, details } = responseData;

      if (!res.ok || !snap_token) {
        console.error('Payment API error:', error, details);
        throw new Error(error || 'Gagal mendapatkan token pembayaran');
      }

      // Open Midtrans Snap popup
      await openSnapPayment(snap_token, {
        onSuccess: async () => {
          // Update DB directly — don't rely solely on webhook
          await updateBookingStatus('paid', order_id);
          setPaymentStep('success');
          resetBookingForm();
        },
        onPending: async () => {
          await updateBookingStatus('pending', order_id);
          setPaymentStep('pending');
          resetBookingForm();
        },
        onError: async () => {
          await updateBookingStatus('failed', order_id);
          setPaymentStep('failed');
        },
        onClose: () => {
          // User closed without completing — don't change status
          setPaymentStep('pending');
        },
      });
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentStep('failed');
    }
  };


  const resetBookingForm = () => {
    setBookingForm({ name: '', email: '', phone: '', item_name: '', booking_type: 'package', date: '', duration: '', notes: '', total_price: '' });
    setSelectedPkgId('');
    setSelectedHotelIdx(0);
    setSelectedPaxKey('');
    setSelectedCarId('');
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const handleClosePaymentModal = () => {
    setPaymentStep('closed');
    setPendingBookingId(null);
  };

  const selectPackage = (pkg: TourPackage, hotel: string, pax: string, price: number) => {
    setSelectedPkgId(pkg.id);
    const hotelIdx = pkg.included?.hotels?.findIndex(h => h.hotel === hotel) ?? -1;
    setSelectedHotelIdx(hotelIdx >= 0 ? hotelIdx : 0);
    setSelectedPaxKey(pax);
    setBookingForm(prev => ({ ...prev, booking_type: 'package' }));
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-toska-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ocean-600 font-medium">Memuat data wisata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <Hero />

      {/* Why Choose Us */}
      <section className="py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #fefcf3 50%, #f0fdfa 100%)' }}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-toska-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-ocean-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="inline-block text-toska-600 font-semibold text-sm uppercase tracking-widest mb-3 bg-toska-50 border border-toska-200 px-4 py-1.5 rounded-full">{t('whyChooseUs')}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mb-5">
              {locale === 'id' ? 'Kenapa Pilih Kami?' : 'Why Choose Us?'}
            </h2>
            <p className="text-ocean-600 max-w-2xl mx-auto leading-relaxed">
              {locale === 'id'
                ? 'Kami berkomitmen memberikan pengalaman wisata terbaik dengan layanan profesional dan harga terjangkau'
                : 'We are committed to providing the best travel experience with professional service and affordable prices'}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: locale === 'id' ? 'Terpercaya' : 'Trusted', desc: locale === 'id' ? 'Berpengalaman lebih dari 5 tahun melayani wisatawan domestik & mancanegara' : 'Over 5 years of experience serving domestic & international tourists', gradient: 'from-blue-500 to-ocean-500' },
              { icon: Sparkles, title: locale === 'id' ? 'Kualitas Premium' : 'Premium Quality', desc: locale === 'id' ? 'Armada terawat, driver profesional, dan itinerary yang dirancang sempurna' : 'Well-maintained fleet, professional drivers, and perfectly designed itineraries', gradient: 'from-toska-400 to-toska-600' },
              { icon: Heart, title: locale === 'id' ? 'Harga Terbaik' : 'Best Prices', desc: locale === 'id' ? 'Harga kompetitif tanpa biaya tersembunyi, transparan dan jujur' : 'Competitive rates with no hidden fees, transparent and honest', gradient: 'from-rose-400 to-pink-600' },
              { icon: Phone, title: t('support247'), desc: locale === 'id' ? 'Tim kami siap membantu Anda kapan saja selama perjalanan di Bali' : 'Our team is ready to assist you anytime during your trip in Bali', gradient: 'from-amber-400 to-orange-500' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-white/80 group cursor-default"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-ocean-900 mb-2.5">{item.title}</h3>
                <p className="text-ocean-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour Packages */}
      <section id="paket" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-14">
            <span className="text-toska-500 font-semibold text-sm uppercase tracking-wider">{locale === 'id' ? 'Paket Wisata Bali' : 'Bali Tour Packages'}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mt-4 mb-6">
              {locale === 'id' ? 'Paket Tour Bali Lengkap' : 'Complete Bali Tour Packages'}
            </h2>
            <p className="text-ocean-600 max-w-2xl mx-auto leading-relaxed">
              {locale === 'id'
                ? 'Pilih paket wisata yang sesuai dengan kebutuhan Anda. Semua paket termasuk akomodasi hotel, transportasi, guide, dan makan sesuai itinerary. Tersedia berbagai pilihan hotel dan harga spesial untuk grup besar (15+1 FOC).'
                : 'Select a tour package that suits your needs. All packages include hotel accommodation, transportation, guide, and meals as per itinerary. Various hotel options and special rates for large groups (15+1 FOC) are available.'}
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 mb-14">
            {['Semua', ...Array.from(new Set(packages.map(p => p.category)))].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                    ? 'bg-toska-500 text-white shadow-lg shadow-toska-500/25'
                    : 'bg-ocean-50 text-ocean-700 hover:bg-ocean-100'
                  }`}
              >
                {cat === 'Semua' ? t('all') : cat === 'Honeymoon' ? '💕 Honeymoon' : cat === '3D2N' ? '🌴 ' + translateText('3 Hari 2 Malam') : translateText(cat)}
              </button>
            ))}
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                index={index}
                onSelect={(selectedPkg, hotel, pax, price) => {
                  setSelectedPkgId(selectedPkg.id);
                  const hotelIdx = selectedPkg.included?.hotels?.findIndex(h => h.hotel === hotel) ?? -1;
                  setSelectedHotelIdx(hotelIdx >= 0 ? hotelIdx : 0);
                  setSelectedPaxKey(pax);
                  setBookingForm(p => ({
                    ...p,
                    booking_type: 'package',
                    item_name: `${translateText(selectedPkg.name)} — ${hotel}`,
                    duration: paxLabels[pax] || pax,
                    total_price: formatPrice(price)
                  }));
                  setTimeout(() => {
                    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              />
            ))}
          </div>

          <motion.div {...fadeInUp} className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-toska-50 border border-toska-200 px-8 py-4.5 rounded-full">
              <Sparkles className="w-5 h-5 text-toska-600 shrink-0" />
              <span className="text-sm font-medium text-toska-800">
                <strong>{locale === 'id' ? 'Spesial:' : 'Special:'}</strong> 15+1 FOC, 20+1 FOC, 25+1 FOC, 30+1 FOC — {locale === 'id' ? 'Gratis 1 orang untuk grup besar!' : 'Free 1 person for large groups!'}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinasi" className="py-28 bg-gradient-to-b from-ocean-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-toska-500 font-semibold text-sm uppercase tracking-wider">{locale === 'id' ? 'Destinasi Unggulan' : 'Featured Destinations'}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mt-4 mb-6">
              {locale === 'id' ? 'Tempat Wajib Dikunjungi' : 'Places You Must Visit'}
            </h2>
            <p className="text-ocean-600 max-w-2xl mx-auto leading-relaxed">
              {locale === 'id'
                ? 'Destinasi terbaik di Bali yang menawarkan pengalaman unik dan pemandangan memukau'
                : 'The best destinations in Bali offering unique experiences and breathtaking views'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group rounded-2xl overflow-hidden h-72 cursor-pointer"
              >
                <img
                  src={dest.image_url}
                  alt={translateText(dest.name)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/80 via-ocean-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-sm font-medium">{dest.rating}</span>
                    <span className="text-white/60 text-xs ml-1">{translateText(dest.category)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-[family-name:var(--font-display)]">{translateText(dest.name)}</h3>
                  <p className="text-white/70 text-sm mt-1 line-clamp-2">{translateText(dest.description)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Car Rental CTA */}
      <section className="py-24 relative overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-900 via-ocean-800 to-[#0a3d5c]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Glow orbs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-toska-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-ocean-400/15 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-toska-500/20 border border-toska-500/30 px-4 py-1.5 rounded-full mb-6">
                <Car className="w-4 h-4 text-toska-300" />
                <span className="text-toska-300 text-sm font-medium">{locale === 'id' ? 'Sewa Mobil Bali' : 'Bali Car Rental'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[family-name:var(--font-display)] mb-5 leading-tight">
                {locale === 'id' ? 'Butuh Transportasi' : 'Need Transportation'}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-toska-300 to-toska-500">
                  {locale === 'id' ? 'di Bali?' : 'in Bali?'}
                </span>
              </h2>
              <p className="text-ocean-200/80 text-lg max-w-xl leading-relaxed">
                {locale === 'id'
                  ? 'Sewa mobil dengan atau tanpa driver. Armada lengkap dari city car hingga bus besar untuk rombongan.'
                  : 'Rent a car with or without driver. Complete fleet from city cars to large buses for groups.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                to="/sewa-mobil"
                className="flex items-center gap-3 bg-toska-500 hover:bg-toska-400 text-white px-8 py-4 rounded-full text-base font-semibold transition-all hover:shadow-2xl hover:shadow-toska-500/40 hover:-translate-y-0.5"
              >
                <Car className="w-5 h-5" />
                {locale === 'id' ? 'Lihat Armada' : 'View Fleet'}
              </Link>
              <a
                href="https://wa.me/6281243499265"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full text-base font-semibold transition-all hover:-translate-y-0.5"
              >
                {locale === 'id' ? 'Hubungi Kami' : 'Contact Us'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-toska-500 font-semibold text-sm uppercase tracking-wider">{t('testimonials')}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mt-4 mb-6">
              {t('whatTheySay')}
            </h2>
            <p className="text-ocean-600 max-w-2xl mx-auto leading-relaxed">
              {t('whatTheySaySubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((test, i) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-sand-50 rounded-2xl p-8 border border-sand-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: test.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-ocean-700 text-sm leading-relaxed mb-6 italic">"{translateText(test.text)}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-toska-100 flex items-center justify-center">
                    <span className="text-toska-700 font-bold text-sm">{test.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-ocean-900 text-sm">{translateText(test.name)}</p>
                    <p className="text-ocean-500 text-xs">{translateText(test.origin)} · {translateText(test.trip_date)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 bg-ocean-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-toska-500 font-semibold text-sm uppercase tracking-wider">{t('faq')}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mt-4 mb-6">
              {t('faqTitle')}
            </h2>
            <p className="text-ocean-600 leading-relaxed">
              {t('faqSubtitle')}
            </p>
          </motion.div>

          <div className="space-y-5">
            {faqs.map((faq) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl border border-ocean-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-ocean-50 transition-colors"
                >
                  <span className="font-semibold text-ocean-900 text-sm pr-4">{translateText(faq.question)}</span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-toska-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ocean-400 shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-6"
                  >
                    <p className="text-ocean-600 text-sm leading-relaxed">{translateText(faq.answer)}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="booking" className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-toska-500 font-semibold text-sm uppercase tracking-wider">{locale === 'id' ? 'Reservasi' : 'Reservation'}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mt-4 mb-6">
              {t('bookingNow')}
            </h2>
            <p className="text-ocean-600 leading-relaxed">
              {isLoggedIn
                ? (locale === 'id'
                  ? 'Pilih paket atau kendaraan yang Anda inginkan, lalu lengkapi data diri. Tim kami akan segera menghubungi Anda.'
                  : 'Select the package or vehicle you want, then complete your details. Our team will contact you shortly.')
                : (locale === 'id'
                  ? 'Silakan masuk atau daftar terlebih dahulu untuk melakukan pemesanan.'
                  : 'Please sign in or register first to make a booking.')}
            </p>
          </motion.div>

          {/* Login Required Prompt */}
          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-ocean-50 to-toska-50 rounded-3xl border border-ocean-200 p-10 sm:p-14 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-toska-400 to-ocean-500 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-lg shadow-toska-500/20">
                <LogIn className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mb-5">
                {locale === 'id' ? 'Masuk untuk Booking' : 'Sign In to Book'}
              </h3>
              <p className="text-ocean-600 max-w-md mx-auto mb-12 text-sm leading-relaxed">
                {locale === 'id'
                  ? 'Untuk melakukan pemesanan paket wisata atau sewa mobil, Anda perlu masuk ke akun terlebih dahulu. Belum punya akun? Daftar gratis hanya dalam beberapa detik!'
                  : 'To book a tour package or rent a car, you need to sign in to your account first. Don\'t have an account? Register for free in just a few seconds!'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-gradient-to-r from-toska-500 to-ocean-500 hover:from-toska-600 hover:to-ocean-600 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-toska-500/25"
                >
                  <LogIn className="w-4 h-4" />
                  {t('signIn')} / {t('signUp')}
                </Link>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 text-xs text-ocean-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-toska-500" />
                  {locale === 'id' ? 'Data aman & terenkripsi' : 'Safe & encrypted data'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-toska-500" />
                  {locale === 'id' ? 'Gratis tanpa biaya' : 'Free of charge'}
                </div>
              </div>
            </motion.div>
          )}

          {/* Logged In: Show user badge + form */}
          {isLoggedIn && (
            <>
              {/* User Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-toska-50 border border-toska-200 rounded-xl p-4 mb-10 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-toska-400 to-ocean-500 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0">
                  {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ocean-900 truncate">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-ocean-500 truncate">{user?.email}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                  {locale === 'id' ? 'Terverifikasi' : 'Verified'}
                </div>
              </motion.div>

              {bookingSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-10 flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">
                    {locale === 'id'
                      ? 'Booking berhasil dikirim! Tim kami akan menghubungi Anda dalam 1x24 jam.'
                      : 'Booking successfully sent! Our team will contact you within 24 hours.'}
                  </span>
                </motion.div>
              )}

              <form id="booking-form" onSubmit={handleBooking} className="bg-ocean-50 rounded-2xl p-7 sm:p-10 border border-ocean-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                  {/* Nama */}
                  <div>
                    <label className="block text-sm font-medium text-ocean-800 mb-2">{t('fullName')} *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.name}
                      readOnly={!!user?.user_metadata?.full_name}
                      onChange={e => setBookingForm(p => ({ ...p, name: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border border-ocean-200 focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm ${user?.user_metadata?.full_name ? 'bg-ocean-100 text-ocean-600 cursor-not-allowed' : 'bg-white'}`}
                      placeholder={locale === 'id' ? 'Nama Anda' : 'Your Name'}
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-ocean-800 mb-2">{t('emailAddress')} *</label>
                    <input
                      type="email"
                      required
                      value={bookingForm.email}
                      readOnly={!!user?.email}
                      onChange={e => setBookingForm(p => ({ ...p, email: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border border-ocean-200 focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm ${user?.email ? 'bg-ocean-100 text-ocean-600 cursor-not-allowed' : 'bg-white'}`}
                      placeholder="email@contoh.com"
                    />
                  </div>
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-ocean-800 mb-2">{t('whatsAppNumber')} *</label>
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
                    <p className="text-xs text-ocean-500 mt-1.5">{locale === 'id' ? 'Hanya angka yang diperbolehkan' : 'Only numbers allowed'}</p>
                  </div>
                  {/* Tanggal */}
                  <div>
                    <label className="block text-sm font-medium text-ocean-800 mb-2">{bookingForm.booking_type === 'package' ? t('startDateTour') : t('startDateRent')} *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                    />
                  </div>

                  {/* Tipe Booking */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ocean-800 mb-2.5">{t('bookingType')} *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleBookingTypeChange('package')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${bookingForm.booking_type === 'package'
                            ? 'bg-toska-500 text-white border-toska-500 shadow-md'
                            : 'bg-white text-ocean-700 border-ocean-200 hover:border-toska-300'
                          }`}
                      >
                        🌴 {t('tourPackages')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBookingTypeChange('car')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${bookingForm.booking_type === 'car'
                            ? 'bg-toska-500 text-white border-toska-500 shadow-md'
                            : 'bg-white text-ocean-700 border-ocean-200 hover:border-toska-300'
                          }`}
                      >
                        🚗 {t('carRental')}
                      </button>
                    </div>
                  </div>

                  {/* === PACKAGE BOOKING === */}
                  {bookingForm.booking_type === 'package' && (
                    <>
                      {/* Pilih Paket */}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-ocean-800 mb-2">{t('selectTourPackage')} *</label>
                        <select
                          required
                          value={selectedPkgId}
                          onChange={e => handlePkgChange(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                        >
                          <option value="">— {locale === 'id' ? 'Pilih paket' : 'Select package'} —</option>
                          {packages.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>{translateText(pkg.name)} ({translateText(pkg.duration)})</option>
                          ))}
                        </select>
                      </div>

                      {/* Pilih Hotel */}
                      {selectedPkg?.included?.hotels && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-ocean-800 mb-2.5">{t('selectHotelOption')} *</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedPkg.included.hotels?.map((h, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => { setSelectedHotelIdx(i); setSelectedPaxKey(''); }}
                                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${selectedHotelIdx === i
                                    ? 'bg-ocean-900 text-white border-ocean-900'
                                    : 'bg-white text-ocean-700 border-ocean-200 hover:border-ocean-400'
                                  }`}
                              >
                                {h.hotel}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pilih Jumlah Peserta */}
                      {selectedPkg && selectedHotel && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-ocean-800 mb-2">{t('selectPaxCapacity')} *</label>
                          <select
                            required
                            value={selectedPaxKey}
                            onChange={e => setSelectedPaxKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                          >
                            <option value="">— {locale === 'id' ? 'Pilih jumlah peserta' : 'Select number of participants'} —</option>
                            {paxOptions.map(opt => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label} — {formatPrice(opt.price)}/{t('pax')}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Price Summary */}
                      {computedPrice > 0 && (
                        <div className="sm:col-span-2 bg-toska-50 border border-toska-200 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-toska-700 font-medium">{bookingForm.item_name}</p>
                            <p className="text-xs text-toska-600">{bookingForm.duration}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-toska-700">{formatPrice(computedPrice)}</p>
                            <p className="text-xs text-toska-600">/{selectedPkg?.category === 'Honeymoon' ? t('couple') : t('pax')}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* === CAR RENTAL BOOKING === */}
                  {bookingForm.booking_type === 'car' && (
                    <>
                      {/* Tipe Sewa */}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-ocean-800 mb-2.5">{t('carType')} *</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => { setCarFilterType('self_drive'); setSelectedCarId(''); }}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${carFilterType === 'self_drive'
                                ? 'bg-toska-500 text-white border-toska-500 shadow-md'
                                : 'bg-white text-ocean-700 border-ocean-200 hover:border-toska-300'
                              }`}
                          >
                            🔑 {t('selfDrive')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCarFilterType('with_driver'); setSelectedCarId(''); }}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${carFilterType === 'with_driver'
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
                        <label className="block text-sm font-medium text-ocean-800 mb-2">{t('selectCarRental')} *</label>
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

                      {/* Durasi Sewa */}
                      {selectedCar && (
                        <div>
                          <label className="block text-sm font-medium text-ocean-800 mb-2">{t('rentDuration')}</label>
                          <input
                            type="text"
                            value={bookingForm.duration}
                            onChange={e => setBookingForm(p => ({ ...p, duration: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm"
                            placeholder={locale === 'id' ? 'Contoh: 2 hari' : 'Example: 2 days'}
                          />
                        </div>
                      )}

                      {/* Price Summary */}
                      {selectedCar && (
                        <div className={`${selectedCar ? '' : 'sm:col-span-2'} bg-toska-50 border border-toska-200 rounded-xl p-4 flex items-center justify-between ${selectedCar ? 'sm:col-span-1' : ''}`}>
                          <div>
                            <p className="text-xs text-toska-700 font-medium">{translateText(selectedCar.name)}</p>
                            <p className="text-xs text-toska-600">{selectedCar.seats} Seat · {translateText(selectedCar.duration_desc)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-toska-700">{formatPrice(selectedCar.price)}</p>
                            <p className="text-xs text-toska-600">{translateText(selectedCar.duration_desc)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Catatan */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ocean-800 mb-2">{t('additionalNotes')}</label>
                    <textarea
                      rows={3}
                      value={bookingForm.notes}
                      onChange={e => setBookingForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-ocean-200 bg-white focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none transition-all text-sm resize-none"
                      placeholder={locale === 'id' ? 'Permintaan khusus, preferensi, dll.' : 'Special requests, preferences, etc.'}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full mt-10 bg-toska-500 hover:bg-toska-600 disabled:bg-toska-300 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-toska-500/25 flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {isLoggedIn ? (locale === 'id' ? 'Lanjut ke Pembayaran' : 'Proceed to Payment') : t('bookingNow')}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>



      {/* Payment Modal */}
      <PaymentModal
        step={paymentStep}
        bookingDetails={{
          itemName: bookingForm.item_name,
          totalPrice: bookingForm.total_price,
          name: bookingForm.name,
          date: bookingForm.date,
          bookingType: bookingForm.booking_type,
        }}
        onConfirm={handlePayNow}
        onClose={handleClosePaymentModal}
        locale={locale}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, Search, Filter,
  User, FileText, Check, X, AlertCircle, Eye, Trash2, Printer,
  DollarSign, ChevronLeft, ChevronRight, RefreshCw, Palmtree, Car,
  MessageCircle, Download, Plus, Upload, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { useI18n } from '../../lib/I18nContext';
import supabase from '../../lib/supabase';

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  booking_type: 'package' | 'car';
  item_name: string;
  date: string;
  duration: string;
  notes: string;
  total_price: string;
  // Booking status = admin approval of document completeness
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
  // Payment status = auto-updated by Midtrans webhook
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'expired' | 'challenge';
  ktp_url: string | null;
  sim_url: string | null;
  order_id: string | null;
  paid_at: string | null;
  created_at: string;
}

interface AddBookingForm {
  name: string;
  email: string;
  phone: string;
  booking_type: 'package' | 'car';
  item_name: string;
  date: string;
  duration: string;
  notes: string;
  total_price: string;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
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
};

export default function BookingManagement() {
  const { t, locale } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals & Selection
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Add Booking Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [simFile, setSimFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [simPreview, setSimPreview] = useState<string | null>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const simInputRef = useRef<HTMLInputElement>(null);
  const [addForm, setAddForm] = useState<AddBookingForm>({
    name: '',
    email: '',
    phone: '',
    booking_type: 'package',
    item_name: '',
    date: '',
    duration: '',
    notes: '',
    total_price: '',
    status: 'pending',
  });

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  // States for packages & cars database dropdowns
  const [packages, setPackages] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<number | ''>('');
  const [selectedHotelIdx, setSelectedHotelIdx] = useState<number | ''>('');
  const [selectedPaxKey, setSelectedPaxKey] = useState<string>('');
  const [selectedCarId, setSelectedCarId] = useState<number | ''>('');
  const [selectedCarType, setSelectedCarType] = useState<'self_drive' | 'with_driver'>('self_drive');

  // Computed values
  const selectedPkg = useMemo(() => packages.find(p => p.id === selectedPkgId), [packages, selectedPkgId]);
  const selectedHotel = useMemo(() => {
    if (selectedHotelIdx === '' || !selectedPkg?.included?.hotels) return null;
    return selectedPkg.included.hotels[selectedHotelIdx];
  }, [selectedPkg, selectedHotelIdx]);

  const isPaxPricing = useMemo(() => {
    if (!selectedHotel?.prices) return true;
    return Object.keys(selectedHotel.prices).every(k => k in paxLabels);
  }, [selectedHotel]);

  const selectedCar = useMemo(() => cars.find(c => c.id === selectedCarId), [cars, selectedCarId]);

  const computedPrice = useMemo(() => {
    if (addForm.booking_type === 'package' && selectedHotel && selectedPaxKey) {
      return selectedHotel.prices[selectedPaxKey] || 0;
    }
    if (addForm.booking_type === 'car' && selectedCar) {
      return selectedCar.price;
    }
    return 0;
  }, [addForm.booking_type, selectedHotel, selectedPaxKey, selectedCar]);

  // Helper to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  // Sync selection with addForm values
  useEffect(() => {
    if (addForm.booking_type === 'package') {
      if (selectedPkg && selectedHotel && selectedPaxKey) {
        const paxLabel = isPaxPricing ? (paxLabels[selectedPaxKey] || selectedPaxKey) : selectedPaxKey;
        setAddForm(prev => ({
          ...prev,
          item_name: `${selectedPkg.name} — ${selectedHotel.hotel}`,
          duration: paxLabel,
          total_price: formatPrice(computedPrice),
        }));
      } else {
        setAddForm(prev => ({
          ...prev,
          item_name: '',
          duration: '',
          total_price: '',
        }));
      }
    } else if (addForm.booking_type === 'car') {
      if (selectedCar) {
        const carTypeLabel = selectedCarType === 'self_drive' ? 'Self Drive' : 'With Driver';
        setAddForm(prev => ({
          ...prev,
          item_name: `${selectedCar.name} (${carTypeLabel})`,
          duration: selectedCar.duration_desc,
          total_price: formatPrice(computedPrice),
        }));
      } else {
        setAddForm(prev => ({
          ...prev,
          item_name: '',
          duration: '',
          total_price: '',
        }));
      }
    }
  }, [addForm.booking_type, selectedPkg, selectedHotel, selectedPaxKey, selectedCar, selectedCarType, computedPrice, isPaxPricing]);

  // Reset dropdown selections when booking_type changes
  useEffect(() => {
    setSelectedPkgId('');
    setSelectedHotelIdx('');
    setSelectedPaxKey('');
    setSelectedCarId('');
    setSelectedCarType('self_drive');
  }, [addForm.booking_type]);

  const loadInitialData = async () => {
    try {
      const { data: pkgs } = await supabase
        .from('tour_packages')
        .select('*')
        .eq('is_available', true);
      if (pkgs) setPackages(pkgs);

      const { data: carData } = await supabase
        .from('car_rentals')
        .select('*')
        .eq('is_available', true);
      if (carData) setCars(carData);
    } catch (err) {
      console.error('Error loading initial database items:', err);
    }
  };

  useEffect(() => {
    loadBookings();
    loadInitialData();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setBookings(data);
    } catch (err) {
      console.error('Error loading bookings:', err);
      showToast('error', t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (id: number, value: string) => {
    try {
      // Optimistic UI update
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: value as any } : b));
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: value as any } : null);
      }

      // Only update booking status (admin doc approval)
      // DO NOT touch payment_status — that is managed by Midtrans webhook
      const { error } = await supabase.from('bookings').update({ status: value }).eq('id', id);
      if (error) throw error;

      showToast('success', t('bookingSaved'));
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('error', err?.message || t('errorOccurred'));
      loadBookings(); // Rollback
    }
  };

  const deleteBooking = async (id: number) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      showToast('success', t('bookingDeleted'));

      // Reset sequence after every delete so next ID follows max(id) + 1
      // If table becomes empty, sequence resets to 1
      // This is handled automatically by the DB trigger, but we call RPC
      // as a safety net in case the trigger is not installed
      try {
        await supabase.rpc('reset_bookings_sequence');
      } catch (rpcErr) {
        console.warn('reset_bookings_sequence RPC not available (trigger handles it):', rpcErr);
      }

      loadBookings();
    } catch (err: any) {
      console.error('Error deleting booking:', err);
      showToast('error', err?.message || t('errorOccurred'));
    }
    setDeleteConfirm(null);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'sim') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'ktp') { setKtpFile(file); setKtpPreview(preview); }
    else { setSimFile(file); setSimPreview(preview); }
  };

  const uploadDoc = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('booking-documents')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from('booking-documents').getPublicUrl(path);
    return data.publicUrl;
  };

  const resetAddForm = () => {
    setAddForm({ name: '', email: '', phone: '', booking_type: 'package', item_name: '', date: '', duration: '', notes: '', total_price: '', status: 'pending' });
    setKtpFile(null); setSimFile(null); setKtpPreview(null); setSimPreview(null);
    setSelectedPkgId(''); setSelectedHotelIdx(''); setSelectedPaxKey('');
    setSelectedCarId(''); setSelectedCarType('self_drive');
    if (ktpInputRef.current) ktpInputRef.current.value = '';
    if (simInputRef.current) simInputRef.current.value = '';
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      let ktp_url: string | null = null;
      let sim_url: string | null = null;

      if (!ktpFile) {
        showToast('error', locale === 'id' ? 'Foto KTP wajib diupload!' : 'KTP photo is required!');
        setAddLoading(false);
        return;
      }
      if (addForm.booking_type === 'car' && !simFile) {
        showToast('error', locale === 'id' ? 'Foto SIM wajib diupload untuk sewa mobil!' : 'SIM photo is required for car rental!');
        setAddLoading(false);
        return;
      }

      if (ktpFile) {
        ktp_url = await uploadDoc(ktpFile, 'ktp');
        if (!ktp_url) { showToast('error', t('docUploadError')); setAddLoading(false); return; }
      }
      if (simFile) {
        sim_url = await uploadDoc(simFile, 'sim');
        if (!sim_url) { showToast('error', t('docUploadError')); setAddLoading(false); return; }
      }

      const { error } = await supabase.from('bookings').insert({
        ...addForm,
        ktp_url,
        sim_url,
      });
      if (error) throw error;

      showToast('success', t('bookingAdded'));
      setShowAddModal(false);
      resetAddForm();
      loadBookings();
    } catch (err) {
      console.error('Error adding booking:', err);
      showToast('error', t('errorOccurred'));
    } finally {
      setAddLoading(false);
    }
  };

  // Helper labels & badges
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600 border border-amber-200',
      confirmed: 'bg-blue-50 text-blue-600 border border-blue-200',
      paid: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      completed: 'bg-green-50 text-green-600 border border-green-200',
      cancelled: 'bg-red-50 text-red-600 border border-red-200',
    };
    return badges[status] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('pending'),
      confirmed: t('confirmed'),
      paid: t('paid'),
      completed: t('completed'),
      cancelled: t('cancelled'),
    };
    return labels[status] || status;
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const badges: Record<string, string> = {
      unpaid: 'bg-red-50 text-red-600 border border-red-200',
      pending: 'bg-amber-50 text-amber-600 border border-amber-200',
      paid: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      failed: 'bg-red-50 text-red-700 border border-red-200',
      expired: 'bg-slate-50 text-slate-500 border border-slate-200',
      challenge: 'bg-orange-50 text-orange-600 border border-orange-200',
    };
    return badges[paymentStatus] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  const getPaymentStatusLabel = (paymentStatus: string) => {
    const isId = locale === 'id';
    const labels: Record<string, string> = {
      unpaid: isId ? 'Belum Lunas' : 'Unpaid',
      pending: isId ? 'Menunggu' : 'Pending',
      paid: isId ? 'Lunas' : 'Paid',
      failed: isId ? 'Gagal' : 'Failed',
      expired: isId ? 'Kedaluwarsa' : 'Expired',
      challenge: isId ? 'Perlu Verifikasi' : 'Challenge',
    };
    return labels[paymentStatus] || paymentStatus;
  };

  // Filter Logic
  const filteredBookings = bookings.filter(b => {
    const searchStr = search.toLowerCase();
    const matchSearch =
      b.name.toLowerCase().includes(searchStr) ||
      b.email.toLowerCase().includes(searchStr) ||
      b.phone.includes(searchStr) ||
      b.item_name.toLowerCase().includes(searchStr) ||
      `#${b.id}`.includes(searchStr);

    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    // Filter payment by actual payment_status column
    const matchPayment = paymentFilter === 'all' ||
      (paymentFilter === 'paid' ? b.payment_status === 'paid' : b.payment_status !== 'paid');
    const matchType = typeFilter === 'all' || b.booking_type === typeFilter;

    return matchSearch && matchStatus && matchPayment && matchType;
  });

  const pagedBookings = filteredBookings.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredBookings.length / perPage);

  // Statistics counters
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  // Count paid using actual payment_status column from Midtrans
  const paidCount = bookings.filter(b => b.payment_status === 'paid').length;

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Nama', 'Email', 'HP', 'Tipe', 'Item', 'Tanggal', 'Durasi', 'Harga', 'Status', 'Status Bayar', 'Dibuat'];
    const rows = filteredBookings.map(b => [
      b.id, `"${b.name}"`, b.email, b.phone,
      b.booking_type, `"${b.item_name}"`, b.date, b.duration,
      `"${b.total_price}"`, b.status, getPaymentStatus(b.status), b.created_at?.slice(0, 10) || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-toska-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-0">
      {/* Print-Only CSS Overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }
        }
      `}</style>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl border shadow-lg ${toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
              }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)] flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-toska-500" />
            {t('bookingManagement')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {locale === 'id' ? 'Kelola status pemesanan, pembayaran, dan cetak invoice' : 'Manage booking status, payments, and print invoices'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            {locale === 'id' ? 'Export CSV' : 'Export CSV'}
          </button>
          <button
            onClick={() => loadBookings()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </button>
          <button
            onClick={() => { resetAddForm(); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-toska-500 hover:bg-toska-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-toska-500/25"
          >
            <Plus className="w-4 h-4" />
            {t('addBooking')}
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{locale === 'id' ? 'Total Booking' : 'Total Bookings'}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{locale === 'id' ? 'Pemesanan Tertunda' : 'Pending Bookings'}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{locale === 'id' ? 'Dikonfirmasi' : 'Confirmed'}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{confirmedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{locale === 'id' ? 'Sudah Lunas' : 'Paid / Settled'}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{paidCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 print:hidden">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={locale === 'id' ? 'Cari nama, email, hp, atau item...' : 'Search name, email, phone, or item...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filters Dropdown */}
        <div className="flex flex-wrap gap-2.5">
          {/* Status Booking */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 font-medium"
            >
              <option value="all">{locale === 'id' ? 'Status: Semua' : 'Status: All'}</option>
              <option value="pending">{t('pending')}</option>
              <option value="confirmed">{t('confirmed')}</option>
              <option value="paid">{t('paid')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Pembayaran */}
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 font-medium"
            >
              <option value="all">{locale === 'id' ? 'Bayar: Semua' : 'Payment: All'}</option>
              <option value="unpaid">{t('unpaid')}</option>
              <option value="paid">{t('paid')}</option>
            </select>
            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Tipe Booking */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 font-medium"
            >
              <option value="all">{locale === 'id' ? 'Tipe: Semua' : 'Type: All'}</option>
              <option value="package">{locale === 'id' ? 'Paket Wisata' : 'Tour Package'}</option>
              <option value="car">{locale === 'id' ? 'Sewa Mobil' : 'Car Rental'}</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-full print:hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">{t('bookingId')}</th>
                <th className="px-6 py-4">{locale === 'id' ? 'Pelanggan' : 'Customer'}</th>
                <th className="px-6 py-4">{t('bookingType')}</th>
                <th className="px-6 py-4">{locale === 'id' ? 'Nama Item' : 'Item Name'}</th>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{locale === 'id' ? 'Jumlah / Durasi' : 'Duration / Pax'}</th>
                <th className="px-6 py-4">{t('price')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4">{t('paymentStatus')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {pagedBookings.length > 0 ? (
                pagedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4.5 font-semibold text-slate-900">#{b.id}</td>
                    <td className="px-6 py-4.5">
                      <div>
                        <p className="font-semibold text-slate-800 leading-tight">{b.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{b.email}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{b.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${b.booking_type === 'package'
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                        }`}>
                        {b.booking_type === 'package' ? (
                          <Palmtree className="w-3.5 h-3.5" />
                        ) : (
                          <Car className="w-3.5 h-3.5" />
                        )}
                        {b.booking_type === 'package' ? t('tourPackage') : t('carRental')}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 font-medium text-slate-800 max-w-[200px] truncate">{b.item_name}</td>
                    <td className="px-6 py-4.5 text-slate-600">{b.date}</td>
                    <td className="px-6 py-4.5 font-medium text-slate-600">
                      {b.duration}
                    </td>
                    <td className="px-6 py-4.5 font-bold text-slate-900">{b.total_price}</td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(b.status)}`}>
                        {getStatusLabel(b.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getPaymentStatusBadge(b.payment_status || 'unpaid')}`}>
                        {getPaymentStatusLabel(b.payment_status || 'unpaid')}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedBooking(b); setShowDetailModal(true); }}
                          title={t('bookingDetails')}
                          className="p-1.5 text-slate-500 hover:text-toska-600 hover:bg-toska-50 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedBooking(b); setShowInvoiceModal(true); }}
                          title={t('printInvoice')}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Quick Contact */}
                        <a
                          href={`https://wa.me/${b.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${b.name}, kami dari ClickAndGo Journey ingin mengkonfirmasi booking Anda untuk ${b.item_name} pada tanggal ${b.date}. Mohon konfirmasinya. Terima kasih!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Hubungi via WhatsApp"
                          className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>

                        {/* Quick Confirm */}
                        {b.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(b.id, 'confirmed')}
                            title={t('confirmBooking')}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        {/* Quick Cancel */}
                        {b.status !== 'cancelled' && b.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(b.id, 'cancelled')}
                            title={t('cancelBooking')}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteConfirm(b.id)}
                          title={t('deleteItem')}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p>{t('noData')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {t('showing')} <span className="font-semibold text-slate-800">{Math.min(filteredBookings.length, (page - 1) * perPage + 1)}</span> -{' '}
              <span className="font-semibold text-slate-800">{Math.min(filteredBookings.length, page * perPage)}</span> {t('of')}{' '}
              <span className="font-semibold text-slate-800">{filteredBookings.length}</span>
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-[family-name:var(--font-display)]">
                {locale === 'id' ? 'Konfirmasi Hapus' : 'Delete Booking'}
              </h3>
              <p className="text-slate-500 text-sm mt-2">
                {locale === 'id' ? 'Apakah Anda yakin ingin menghapus data booking ini secara permanen?' : 'Are you sure you want to permanently delete this booking data?'}
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  {t('cancelAction')}
                </button>
                <button
                  onClick={() => deleteBooking(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  {t('deleteItem')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-[family-name:var(--font-display)]">
                    {t('bookingDetails')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">#{selectedBooking.id} • {selectedBooking.created_at?.slice(0, 10) || ''}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Customer Section */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {locale === 'id' ? 'Informasi Pelanggan' : 'Customer Info'}
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('fullName')}</span>
                      <span className="font-semibold text-slate-800">{selectedBooking.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Email</span>
                      <span className="font-semibold text-slate-800 text-right">{selectedBooking.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{locale === 'id' ? 'No. WhatsApp' : 'Phone'}</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedBooking.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Section */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                    {locale === 'id' ? 'Detail Pesanan' : 'Booking Details'}
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('bookingType')}</span>
                      <span className="font-semibold text-slate-800">
                        {selectedBooking.booking_type === 'package' ? t('tourPackage') : t('carRental')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{locale === 'id' ? 'Nama Item' : 'Item Name'}</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{selectedBooking.item_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{locale === 'id' ? 'Tanggal Pelaksanaan' : 'Booking Date'}</span>
                      <span className="font-semibold text-slate-800">{selectedBooking.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{locale === 'id' ? 'Jumlah / Durasi' : 'Duration / Pax'}</span>
                      <span className="font-semibold text-slate-800">{selectedBooking.duration}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{locale === 'id' ? 'Total Harga' : 'Total Price'}</span>
                      <span className="font-bold text-slate-900">{selectedBooking.total_price}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {t('notes')}
                    </h4>
                    <p className="bg-amber-50/50 text-amber-800 text-xs p-3.5 rounded-xl border border-amber-100 whitespace-pre-wrap leading-relaxed">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}

                {/* KTP & SIM Documents */}
                {(selectedBooking.ktp_url || selectedBooking.sim_url) && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      {locale === 'id' ? 'Dokumen Identitas' : 'Identity Documents'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedBooking.ktp_url && (
                        <a
                          href={selectedBooking.ktp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block"
                        >
                          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-toska-300 transition-colors">
                            <img
                              src={selectedBooking.ktp_url}
                              alt="KTP"
                              className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 mt-1.5 text-center">{t('ktpPhoto')}</p>
                        </a>
                      )}
                      {selectedBooking.sim_url && (
                        <a
                          href={selectedBooking.sim_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block"
                        >
                          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-toska-300 transition-colors">
                            <img
                              src={selectedBooking.sim_url}
                              alt="SIM"
                              className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 mt-1.5 text-center">{t('simPhoto')}</p>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit Status Form */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {locale === 'id' ? 'Perbarui Status' : 'Update Status'}
                  </h4>

                  <div>
                    {/* Booking Status Dropdown */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('status')}</label>
                      <div className="relative">
                        <select
                          value={selectedBooking.status}
                          onChange={(e) => updateStatus(selectedBooking.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white"
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="confirmed">{t('confirmed')}</option>
                          <option value="paid">{t('paid')}</option>
                          <option value="completed">{t('completed')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => { setShowDetailModal(false); setShowInvoiceModal(true); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t('printInvoice')}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Print Modal */}
      <AnimatePresence>
        {showInvoiceModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:p-0 print:absolute print:inset-0 print:z-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:max-h-none print:overflow-visible print:border-none print:shadow-none print:w-full"
            >
              {/* Modal controls - hidden in print */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="text-sm font-semibold">{t('invoice')}</span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 rounded-lg bg-toska-500 hover:bg-toska-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {t('printInvoice')}
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
              <div id="printable-invoice" className="p-10 space-y-8 bg-white text-slate-800 font-sans overflow-y-auto flex-1 print:overflow-visible print:p-0">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                      <Palmtree className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-slate-900 font-[family-name:var(--font-display)]">ClickAndGo Journey</h2>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Bali Travel & Rent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('invoice').toUpperCase()}</h1>
                    <p className="text-xs text-slate-500 mt-1 font-mono">INV/2026/BOOK-{selectedBooking.id}</p>
                  </div>
                </div>

                {/* Company & Client Meta */}
                <div className="grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2.5">{locale === 'id' ? 'Diterbitkan Oleh' : 'Issued By'}</h4>
                    <p className="font-bold text-slate-800">ClickAndGo Journey</p>
                    <p className="text-slate-500 mt-1">Jl. Danau Tondano IV/9A</p>
                    <p className="text-slate-500">Sanur, Denpasar, Bali</p>
                    <p className="text-slate-500 mt-1.5">WhatsApp: +62 812-4349-9265</p>
                    <p className="text-slate-500">Email: clickandgojourney@gmail.com</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2.5">{locale === 'id' ? 'Ditujukan Kepada' : 'Billed To'}</h4>
                    <p className="font-bold text-slate-800">{selectedBooking.name}</p>
                    <p className="text-slate-500 mt-1">Email: {selectedBooking.email}</p>
                    <p className="text-slate-500">Phone: {selectedBooking.phone}</p>
                    <p className="text-slate-500 mt-3.5">
                      <span className="font-medium text-slate-800">{locale === 'id' ? 'Tanggal Invoice:' : 'Date Issued:'}</span>{' '}
                       {selectedBooking.created_at?.slice(0, 10) || ''}
                    </p>
                  </div>
                </div>

                {/* Status Badges in Invoice */}
                <div className="flex gap-4 border-y border-slate-100 py-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">{locale === 'id' ? 'Status Pemesanan' : 'Booking Status'}</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${getStatusBadge(selectedBooking.status)}`}>
                      {getStatusLabel(selectedBooking.status).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">{t('paymentStatus')}</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${getPaymentStatusBadge(getPaymentStatus(selectedBooking.status))}`}>
                      {getPaymentStatusLabel(getPaymentStatus(selectedBooking.status)).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Billing details table */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{locale === 'id' ? 'Rincian Transaksi' : 'Transaction Summary'}</h4>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="px-4 py-3">{locale === 'id' ? 'Deskripsi Layanan' : 'Description'}</th>
                        <th className="px-4 py-3 text-center">{locale === 'id' ? 'Tanggal Pelaksanaan' : 'Booking Date'}</th>
                        <th className="px-4 py-3 text-center">{locale === 'id' ? 'Durasi / Pax' : 'Duration / Pax'}</th>
                        <th className="px-4 py-3 text-right">{locale === 'id' ? 'Harga' : 'Price'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{selectedBooking.item_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {selectedBooking.booking_type === 'package' ? t('tourPackage') : t('carRental')}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">{selectedBooking.date}</td>
                        <td className="px-4 py-3.5 text-center">{selectedBooking.duration}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">{selectedBooking.total_price}</td>
                      </tr>
                      {/* Total price row */}
                      <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                        <td colSpan={3} className="px-4 py-3 text-right text-slate-900 text-sm">TOTAL AMOUNT</td>
                        <td className="px-4 py-3 text-right text-slate-900 text-sm font-black">{selectedBooking.total_price}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Notes/Terms */}
                <div className="grid grid-cols-2 gap-8 text-[10px] text-slate-500 pt-6 border-t border-slate-100">
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700 uppercase tracking-wider">Syarat & Ketentuan / Terms</h5>
                    <ul className="list-disc list-inside space-y-1 leading-relaxed">
                      <li>Pemesanan dikonfirmasi setelah pembayaran lunas atau deposit diterima.</li>
                      <li>Keterlambatan pembatalan paket dapat dikenakan biaya administrasi.</li>
                      <li>Untuk sewa mobil self-drive, BBM diisi kembali sesuai level penjemputan.</li>
                      <li>Simpan invoice ini sebagai tanda bukti pemesanan yang sah.</li>
                    </ul>
                  </div>
                  <div className="text-right flex flex-col justify-end items-end space-y-12">
                    <div className="text-center w-40">
                      <p className="text-[9px] uppercase tracking-wider mb-8 text-slate-400">ClickAndGo Journey</p>
                      <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-2 text-slate-400">
                        {/* Stamp placeholder */}
                        <div className="text-[10px] font-bold border border-slate-300 p-1 rotate-[-12deg] uppercase">ClickAndGo Journey</div>
                      </div>
                      <p className="font-bold text-slate-800 text-[10px]">AUTHORIZED SIGNATURE</p>
                    </div>
                  </div>
                </div>

                {/* Thank you */}
                <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                  <p>Matur Suksma. Thank you for choosing ClickAndGo Journey for your Bali trip!</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Booking Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-[family-name:var(--font-display)] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-toska-400" />
                    {t('addBooking')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{t('addBookingSubtitle')}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddBooking} className="overflow-y-auto flex-1">
                <div className="p-6 space-y-6">

                  {/* Customer Info Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {locale === 'id' ? 'Informasi Pelanggan' : 'Customer Info'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('fullName')} *</label>
                        <input
                          type="text"
                          required
                          value={addForm.name}
                          onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                          placeholder={locale === 'id' ? 'Nama lengkap pelanggan' : 'Full customer name'}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1.5">Email *</label>
                        <input
                          type="email"
                          required
                          value={addForm.email}
                          onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="email@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1.5">{locale === 'id' ? 'No. WhatsApp' : 'Phone / WhatsApp'} *</label>
                        <input
                          type="tel"
                          required
                          value={addForm.phone}
                          onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="08xxxxxxxxxx"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Details Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {locale === 'id' ? 'Detail Pesanan' : 'Booking Details'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('bookingType')} *</label>
                        <select
                          value={addForm.booking_type}
                          onChange={e => setAddForm(p => ({ ...p, booking_type: e.target.value as 'package' | 'car' }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white"
                        >
                          <option value="package">{t('tourPackage')}</option>
                          <option value="car">{t('carRental')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('date')} *</label>
                        <input
                          type="date"
                          required
                          value={addForm.date}
                          onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700"
                        />
                      </div>
                      {addForm.booking_type === 'package' ? (
                        <>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{locale === 'id' ? 'Pilih Paket Wisata' : 'Select Tour Package'} *</label>
                            <select
                              required
                              value={selectedPkgId}
                              onChange={e => {
                                setSelectedPkgId(e.target.value === '' ? '' : Number(e.target.value));
                                setSelectedHotelIdx('');
                                setSelectedPaxKey('');
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white"
                            >
                              <option value="">{locale === 'id' ? '-- Pilih Paket --' : '-- Select Package --'}</option>
                              {packages.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{locale === 'id' ? 'Pilih Hotel' : 'Select Hotel'} *</label>
                            <select
                              required
                              disabled={!selectedPkgId}
                              value={selectedHotelIdx}
                              onChange={e => {
                                setSelectedHotelIdx(e.target.value === '' ? '' : Number(e.target.value));
                                setSelectedPaxKey('');
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white disabled:opacity-50"
                            >
                              <option value="">{locale === 'id' ? '-- Pilih Hotel --' : '-- Select Hotel --'}</option>
                              {selectedPkg?.included?.hotels?.map((h: any, idx: number) => (
                                <option key={idx} value={idx}>{h.hotel}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{locale === 'id' ? 'Jumlah / Durasi' : 'Duration / Pax'} *</label>
                            <select
                              required
                              disabled={selectedHotelIdx === ''}
                              value={selectedPaxKey}
                              onChange={e => setSelectedPaxKey(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white disabled:opacity-50"
                            >
                              <option value="">{locale === 'id' ? '-- Pilih Jumlah/Durasi --' : '-- Select Duration/Pax --'}</option>
                              {selectedHotel?.prices && Object.keys(selectedHotel.prices).map(key => (
                                <option key={key} value={key}>{paxLabels[key] || key}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('price')} *</label>
                            <input
                              type="text"
                              readOnly
                              required
                              value={addForm.total_price}
                              placeholder={t('totalPricePlaceholder')}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none text-sm text-slate-500 font-medium"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{locale === 'id' ? 'Pilih Kendaraan' : 'Select Vehicle'} *</label>
                            <select
                              required
                              value={selectedCarId}
                              onChange={e => setSelectedCarId(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white"
                            >
                              <option value="">{locale === 'id' ? '-- Pilih Kendaraan --' : '-- Select Vehicle --'}</option>
                              {cars.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{locale === 'id' ? 'Pilih Layanan' : 'Select Service'} *</label>
                            <select
                              required
                              value={selectedCarType}
                              onChange={e => setSelectedCarType(e.target.value as 'self_drive' | 'with_driver')}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white"
                            >
                              <option value="self_drive">{locale === 'id' ? 'Lepas Kunci (Self Drive)' : 'Self Drive'}</option>
                              <option value="with_driver">{locale === 'id' ? 'Dengan Sopir (With Driver)' : 'With Driver'}</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{locale === 'id' ? 'Jumlah / Durasi' : 'Duration / Pax'} *</label>
                            <select
                              required
                              disabled={!selectedCarId}
                              value={addForm.duration}
                              onChange={e => setAddForm(p => ({ ...p, duration: e.target.value }))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white disabled:opacity-50"
                            >
                              <option value="">{locale === 'id' ? '-- Pilih Durasi --' : '-- Select Duration --'}</option>
                              {selectedCar && (
                                <option value={selectedCar.duration_desc}>{selectedCar.duration_desc}</option>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('price')} *</label>
                            <input
                              type="text"
                              readOnly
                              required
                              value={addForm.total_price}
                              placeholder={t('totalPricePlaceholder')}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none text-sm text-slate-500 font-medium"
                            />
                          </div>
                        </>
                      )}
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('status')}</label>
                        <select
                          value={addForm.status}
                          onChange={e => setAddForm(p => ({ ...p, status: e.target.value as any }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-700 bg-white"
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="confirmed">{t('confirmed')}</option>
                          <option value="paid">{t('paid')}</option>
                          <option value="completed">{t('completed')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('notes')}</label>
                        <textarea
                          rows={3}
                          value={addForm.notes}
                          onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))}
                          placeholder={locale === 'id' ? 'Catatan tambahan (opsional)' : 'Additional notes (optional)'}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-toska-500 text-sm text-slate-800 placeholder-slate-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      {locale === 'id' ? 'Upload Dokumen Identitas' : 'Identity Document Upload'}
                    </h4>

                    {/* KTP Upload */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1.5">
                        {t('ktpPhoto')}
                        <span className="ml-1 text-slate-400 font-normal">({locale === 'id' ? 'Wajib' : 'Required'})</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">{t('ktpUploadHint')}</p>
                      <div
                        onClick={() => ktpInputRef.current?.click()}
                        className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-toska-400 hover:bg-toska-50/30 transition-all group"
                      >
                        <input
                          ref={ktpInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={e => handleFileChange(e, 'ktp')}
                          className="hidden"
                        />
                        {ktpPreview ? (
                          <div className="flex items-center gap-3">
                            <img src={ktpPreview} alt="KTP Preview" className="w-20 h-14 object-cover rounded-lg border border-slate-200" />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{ktpFile?.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{ktpFile ? (ktpFile.size / 1024).toFixed(0) + ' KB' : ''}</p>
                              <p className="text-[11px] text-toska-500 mt-1">{locale === 'id' ? 'Klik untuk ganti' : 'Click to change'}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <div className="w-10 h-10 bg-slate-100 group-hover:bg-toska-100 rounded-xl flex items-center justify-center transition-colors">
                              <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-toska-500 transition-colors" />
                            </div>
                            <p className="text-sm text-slate-500 group-hover:text-toska-600 transition-colors">
                              {locale === 'id' ? 'Klik untuk upload foto KTP' : 'Click to upload KTP photo'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SIM Upload */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1.5">
                        {t('simPhoto')}
                        <span className="ml-1 text-slate-400 font-normal">
                          {addForm.booking_type === 'car'
                            ? `(${locale === 'id' ? 'Wajib untuk sewa mobil' : 'Required for car rental'})`
                            : `(${locale === 'id' ? 'Opsional' : 'Optional'})`}
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">{t('simUploadHint')}</p>
                      <div
                        onClick={() => simInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer hover:border-toska-400 hover:bg-toska-50/30 transition-all group ${addForm.booking_type === 'car' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                      >
                        <input
                          ref={simInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={e => handleFileChange(e, 'sim')}
                          className="hidden"
                        />
                        {simPreview ? (
                          <div className="flex items-center gap-3">
                            <img src={simPreview} alt="SIM Preview" className="w-20 h-14 object-cover rounded-lg border border-slate-200" />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{simFile?.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{simFile ? (simFile.size / 1024).toFixed(0) + ' KB' : ''}</p>
                              <p className="text-[11px] text-toska-500 mt-1">{locale === 'id' ? 'Klik untuk ganti' : 'Click to change'}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <div className="w-10 h-10 bg-slate-100 group-hover:bg-toska-100 rounded-xl flex items-center justify-center transition-colors">
                              <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-toska-500 transition-colors" />
                            </div>
                            <p className="text-sm text-slate-500 group-hover:text-toska-600 transition-colors">
                              {locale === 'id' ? 'Klik untuk upload foto SIM' : 'Click to upload SIM/License photo'}
                            </p>
                            {addForm.booking_type === 'car' && (
                              <p className="text-[11px] text-amber-600 font-medium">{locale === 'id' ? '⚠ Wajib untuk sewa mobil' : '⚠ Required for car rental'}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={addLoading}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    {t('cancelAction')}
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-5 py-2.5 rounded-xl bg-toska-500 hover:bg-toska-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm shadow-toska-500/25"
                  >
                    {addLoading ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('uploadingDoc')}...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> {t('addBooking')}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Pencil, Trash2, X, Search, Check, AlertCircle,
  ChevronLeft, ChevronRight, Save, User, MapPin, Calendar, Phone, Mail,
  Download, Filter, FileText
} from 'lucide-react';
import { useI18n } from '../../lib/I18nContext';
import supabase from '../../lib/supabase';

interface Customer {
  id: number;
  nik: string;
  full_name: string;
  home_address: string;
  birth_date: string;
  phone: string;
  email: string;
  booking_status: string;
  notes: string;
  created_at: string;
  nationality_type?: string;
  identity_type?: string;
  identity_number?: string;
  country_origin?: string;
  ktp_passport_url?: string;
  sim_idp_url?: string;
  identity_verification_status?: string;
  total_bookings?: number;
  total_spent?: number;
  last_booking_date?: string;
}

export default function CustomerDatabase() {
  const { t, locale } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    nik: '',
    full_name: '',
    home_address: '',
    birth_date: '',
    phone: '',
    email: '',
    booking_status: 'interested',
    notes: '',
    nationality_type: 'WNI',
    identity_type: 'NIK',
    identity_number: '',
    country_origin: '',
    identity_verification_status: 'UNVERIFIED',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Document Viewer State
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedCustDocs, setSelectedCustDocs] = useState<{ label: string; url: string; booking_info?: string }[]>([]);
  const [selectedCustName, setSelectedCustName] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => { loadCustomers(); }, []);

  const handleViewDocuments = async (cust: Customer) => {
    setSelectedCustName(cust.full_name);
    setSelectedCustDocs([]);
    setShowDocModal(true);
    setDocLoading(true);

    try {
      const docs: { label: string; url: string; booking_info?: string }[] = [];

      // Check customer profile documents (KTP/Passport and SIM/IDP)
      if (cust.ktp_passport_url) {
        docs.push({
          label: cust.nationality_type === 'WNA' ? 'Foto Paspor (Passport)' : 'Foto KTP / Identitas',
          url: cust.ktp_passport_url,
          booking_info: 'Dokumen utama terdaftar'
        });
      }
      if (cust.sim_idp_url) {
        docs.push({
          label: cust.nationality_type === 'WNA' ? 'Foto International Driving Permit (IDP)' : 'Foto SIM (Driver License)',
          url: cust.sim_idp_url,
          booking_info: 'Dokumen mengemudi terdaftar'
        });
      }

      setSelectedCustDocs(docs);
    } catch (err) {
      console.error('Error fetching customer documents:', err);
      showToast('error', locale === 'id' ? 'Gagal memuat dokumen' : 'Failed to load documents');
    } finally {
      setDocLoading(false);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (form.nationality_type === 'WNI') {
      if (!form.identity_number.trim()) {
        errors.identity_number = t('requiredField');
      } else if (!/^[0-9]{16}$/.test(form.identity_number)) {
        errors.identity_number = 'NIK harus 16 digit angka';
      }
    } else {
      // WNA
      if (!form.identity_number.trim()) {
        errors.identity_number = t('requiredField');
      } else if (!/^[a-zA-Z0-9]+$/.test(form.identity_number)) {
        errors.identity_number = 'Nomor paspor harus alfanumerik';
      }
      if (!form.country_origin.trim()) {
        errors.country_origin = t('requiredField');
      }
    }

    if (!form.full_name.trim()) errors.full_name = t('requiredField');
    if (!form.home_address.trim()) errors.home_address = t('requiredField');
    if (!form.birth_date) errors.birth_date = t('requiredField');
    if (!form.phone.trim()) errors.phone = t('requiredField');
    else if (!/^[0-9]{8,15}$/.test(form.phone.replace(/\D/g, ''))) errors.phone = t('invalidPhone');
    if (!form.email.trim()) errors.email = t('requiredField');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t('invalidEmail');
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = (customer?: Customer) => {
    setFormErrors({});
    if (customer) {
      setEditing(customer);
      setForm({
        nik: customer.identity_number || customer.nik || '',
        full_name: customer.full_name,
        home_address: customer.home_address,
        birth_date: customer.birth_date || '',
        phone: customer.phone,
        email: customer.email,
        booking_status: customer.booking_status || 'interested',
        notes: customer.notes || '',
        nationality_type: customer.nationality_type || 'WNI',
        identity_type: customer.identity_type || 'NIK',
        identity_number: customer.identity_number || customer.nik || '',
        country_origin: customer.country_origin || '',
        identity_verification_status: customer.identity_verification_status || 'UNVERIFIED',
      });
    } else {
      setEditing(null);
      setForm({
        nik: '',
        full_name: '',
        home_address: '',
        birth_date: '',
        phone: '',
        email: '',
        booking_status: 'interested',
        notes: '',
        nationality_type: 'WNI',
        identity_type: 'NIK',
        identity_number: '',
        country_origin: '',
        identity_verification_status: 'UNVERIFIED',
      });
    }
    setShowModal(true);
  };

  const saveCustomer = async () => {
    if (!validateForm()) return;

    const data = {
      nik: form.nationality_type === 'WNI' ? form.identity_number : '',
      full_name: form.full_name,
      home_address: form.home_address,
      birth_date: form.birth_date,
      phone: form.phone.replace(/\D/g, ''),
      email: form.email,
      booking_status: form.booking_status,
      notes: form.notes,
      nationality_type: form.nationality_type,
      identity_type: form.identity_type,
      identity_number: form.identity_number,
      country_origin: form.country_origin || null,
      identity_verification_status: form.identity_verification_status,
    };

    try {
      if (editing) {
        const { error } = await supabase.from('customers').update(data).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert(data);
        if (error) throw error;
      }
      showToast('success', t('customerSaved'));
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      showToast('error', t('errorOccurred'));
      console.error(err);
    }
  };

  const deleteCustomer = async (id: number) => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      showToast('success', t('customerDeleted'));
      loadCustomers();
    } catch (err) {
      showToast('error', t('errorOccurred'));
    }
    setDeleteConfirm(null);
  };

  const exportCSV = () => {
    const headers = ['ID', 'NIK', t('fullName'), t('emailAddress'), t('phoneNumber'), t('homeAddress'), t('birthDate'), t('bookingStatus'), t('notes'), t('registeredAt')];
    const rows = filteredCustomers.map(c => [
      c.id, c.nik || '', c.full_name, c.email, c.phone, `"${c.home_address}"`, c.birth_date, c.booking_status, `"${c.notes || ''}"`, c.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string, totalBookings = 0) => {
    const isHasBooked = status === 'has_booked' || totalBookings > 0;
    return isHasBooked
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
      : 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const getStatusLabel = (status: string, totalBookings = 0) => {
    const isHasBooked = status === 'has_booked' || totalBookings > 0;
    return isHasBooked
      ? (locale === 'id' ? 'Sudah pernah booking' : 'Has booked before')
      : (locale === 'id' ? 'Belum pernah booking' : 'Has never booked');
  };

  // Filter & paginate
  const filteredCustomers = customers.filter(c => {
    const searchStr = search.toLowerCase();
    const matchSearch = c.full_name.toLowerCase().includes(searchStr) ||
      c.email.toLowerCase().includes(searchStr) ||
      c.phone.includes(searchStr) ||
      (c.nik && c.nik.includes(searchStr)) ||
      (c.identity_number && c.identity_number.toLowerCase().includes(searchStr));
    
    const isHasBooked = c.booking_status === 'has_booked' || (c.total_bookings && c.total_bookings > 0);
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'has_booked' && isHasBooked) ||
      (statusFilter === 'never_booked' && !isHasBooked);

    return matchSearch && matchStatus;
  });

  const pagedCustomers = filteredCustomers.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredCustomers.length / perPage);

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
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
            {t('customerTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('customerSubtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" /> {t('export')} CSV
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-toska-500 hover:bg-toska-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-toska-500/25"
          >
            <Plus className="w-4 h-4" /> {t('addCustomer')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none"
          >
            <option value="all">{locale === 'id' ? 'Semua Status' : 'All Status'}</option>
            <option value="has_booked">{locale === 'id' ? 'Sudah pernah booking' : 'Has booked before'}</option>
            <option value="never_booked">{locale === 'id' ? 'Belum pernah booking' : 'Has never booked'}</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FileText className="w-4 h-4" />
          {t('total')}: {filteredCustomers.length}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{locale === 'id' ? 'Kewarganegaraan' : 'Nationality'}</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{locale === 'id' ? 'Identitas (NIK/Paspor)' : 'Identity (NIK/Passport)'}</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('fullName')}</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{locale === 'id' ? 'Kontak' : 'Contact'}</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{locale === 'id' ? 'Statistik Booking' : 'Booking Stats'}</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('status')}</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 text-sm">{t('noData')}</p>
                  </td>
                </tr>
              ) : pagedCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                    <span className={`inline-flex px-2 py-0.5 rounded-full ${cust.nationality_type === 'WNA' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'}`}>
                      {cust.nationality_type || 'WNI'}
                      {cust.country_origin ? ` (${cust.country_origin})` : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold block text-slate-700">{cust.identity_number || cust.nik || '-'}</span>
                    <span className={`inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      cust.identity_verification_status === 'VERIFIED'
                        ? 'bg-green-50 text-green-700'
                        : cust.identity_verification_status === 'EXPIRED'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cust.identity_verification_status || 'UNVERIFIED'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-toska-400 to-toska-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {cust.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{cust.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(cust.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-700 font-semibold">{cust.phone}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cust.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <p className="text-slate-700 font-semibold">{cust.total_bookings || 0} Bookings</p>
                    <p className="text-toska-600 font-semibold mt-0.5">Rp {(cust.total_spent || 0).toLocaleString('id-ID')}</p>
                    {cust.last_booking_date && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Last: {new Date(cust.last_booking_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(cust.booking_status, cust.total_bookings)}`}>
                      {getStatusLabel(cust.booking_status, cust.total_bookings)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDocuments(cust)}
                        className="p-2 hover:bg-toska-50 rounded-lg text-toska-600 transition-colors"
                        title={locale === 'id' ? 'Lihat Dokumen KTP/Paspor/SIM' : 'View Identity/License Docs'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => openModal(cust)} className="p-2 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors" title={t('editItem')}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(cust.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title={t('deleteItem')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {t('showing')} {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredCustomers.length)} {t('of')} {filteredCustomers.length}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700">{page}/{totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal — Sign Up Form */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    {editing ? t('editCustomer') : t('signUpTitle')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('signUpSubtitle')}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Kewarganegaraan */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{locale === 'id' ? 'Kewarganegaraan' : 'Nationality'} *</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cust_nationality"
                        value="WNI"
                        checked={form.nationality_type === 'WNI'}
                        onChange={() => setForm(p => ({ ...p, nationality_type: 'WNI', identity_type: 'NIK', country_origin: '', identity_number: '' }))}
                        className="w-4 h-4 text-toska-500 focus:ring-toska-500"
                      />
                      WNI (Warga Negara Indonesia)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cust_nationality"
                        value="WNA"
                        checked={form.nationality_type === 'WNA'}
                        onChange={() => setForm(p => ({ ...p, nationality_type: 'WNA', identity_type: 'PASSPORT', country_origin: '', identity_number: '' }))}
                        className="w-4 h-4 text-toska-500 focus:ring-toska-500"
                      />
                      WNA (Warga Negara Asing / Foreigner)
                    </label>
                  </div>
                </div>

                {/* Nomor Identitas */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {form.nationality_type === 'WNI' ? 'NIK (16 Digit Angka)' : 'Nomor Paspor / Passport Number'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={form.nationality_type === 'WNI' ? 16 : 20}
                      value={form.identity_number}
                      onChange={e => {
                        const value = form.nationality_type === 'WNI'
                          ? e.target.value.replace(/[^0-9]/g, '')
                          : e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        setForm(p => ({ ...p, identity_number: value, identity_number_err: '' }));
                        setFormErrors(p => ({ ...p, identity_number: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none transition-all font-mono ${
                        formErrors.identity_number ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-toska-400'
                      }`}
                      placeholder={form.nationality_type === 'WNI' ? '3171012345678901' : 'A1234567'}
                    />
                  </div>
                  {formErrors.identity_number && <p className="text-xs text-red-500 mt-1">{formErrors.identity_number}</p>}
                </div>

                {/* Negara Asal (Only WNA) */}
                {form.nationality_type === 'WNA' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{locale === 'id' ? 'Negara Asal' : 'Country of Origin'} *</label>
                    <select
                      required
                      value={form.country_origin}
                      onChange={e => { setForm(p => ({ ...p, country_origin: e.target.value })); setFormErrors(p => ({ ...p, country_origin: '' })); }}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none ${
                        formErrors.country_origin ? 'border-red-300' : 'border-slate-200'
                      }`}
                    >
                      <option value="">— {locale === 'id' ? 'Pilih negara' : 'Select country'} —</option>
                      {['Australia', 'Singapore', 'Malaysia', 'United States', 'United Kingdom', 'Japan', 'South Korea', 'Germany', 'France', 'China', 'India', 'Canada', 'Netherlands', 'Other'].map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    {formErrors.country_origin && <p className="text-xs text-red-500 mt-1">{formErrors.country_origin}</p>}
                  </div>
                )}

                {/* Status Verifikasi Identitas */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{locale === 'id' ? 'Status Verifikasi Identitas' : 'Identity Verification Status'} *</label>
                  <select
                    value={form.identity_verification_status}
                    onChange={e => setForm(p => ({ ...p, identity_verification_status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none text-slate-700 bg-white"
                  >
                    <option value="UNVERIFIED">UNVERIFIED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('fullName')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setFormErrors(p => ({ ...p, full_name: '' })); }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none transition-all ${
                        formErrors.full_name ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-toska-400'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {formErrors.full_name && <p className="text-xs text-red-500 mt-1">{formErrors.full_name}</p>}
                </div>

                {/* Home Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('homeAddress')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={2}
                      value={form.home_address}
                      onChange={e => { setForm(p => ({ ...p, home_address: e.target.value })); setFormErrors(p => ({ ...p, home_address: '' })); }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none transition-all resize-none ${
                        formErrors.home_address ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-toska-400'
                      }`}
                      placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                    />
                  </div>
                  {formErrors.home_address && <p className="text-xs text-red-500 mt-1">{formErrors.home_address}</p>}
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('birthDate')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={form.birth_date}
                      onChange={e => { setForm(p => ({ ...p, birth_date: e.target.value })); setFormErrors(p => ({ ...p, birth_date: '' })); }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none transition-all ${
                        formErrors.birth_date ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-toska-400'
                      }`}
                    />
                  </div>
                  {formErrors.birth_date && <p className="text-xs text-red-500 mt-1">{formErrors.birth_date}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('phoneNumber')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setForm(p => ({ ...p, phone: value }));
                        setFormErrors(p => ({ ...p, phone: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none transition-all ${
                        formErrors.phone ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-toska-400'
                      }`}
                      placeholder="08123456789"
                    />
                  </div>
                  {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('emailAddress')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setFormErrors(p => ({ ...p, email: '' })); }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 outline-none transition-all ${
                        formErrors.email ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-toska-400'
                      }`}
                      placeholder="email@contoh.com"
                    />
                  </div>
                  {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                </div>

                {/* Booking Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('bookingStatus')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['never_booked', 'has_booked'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, booking_status: status }))}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          form.booking_status === status
                            ? getStatusBadge(status).replace('border-', 'border-2 border-')
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('notes')}</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none transition-all resize-none"
                    placeholder={t('notes')}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  {t('cancelAction')}
                </button>
                <button onClick={saveCustomer} className="flex items-center gap-2 px-5 py-2.5 bg-toska-500 hover:bg-toska-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg">
                  <Save className="w-4 h-4" /> {editing ? t('saveItem') : t('submitRegistration')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('confirmDelete')}</h3>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  {t('cancelAction')}
                </button>
                <button
                  onClick={() => deleteConfirm !== null && deleteCustomer(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  {t('deleteItem')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Documents Modal */}
      <AnimatePresence>
        {showDocModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-toska-400" />
                    {locale === 'id' ? 'Berkas Dokumen Pelanggan' : 'Customer Identity Files'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedCustName}</p>
                </div>
                <button
                  onClick={() => setShowDocModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {docLoading ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-2 border-toska-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-500">{locale === 'id' ? 'Memuat data berkas...' : 'Loading document files...'}</p>
                  </div>
                ) : selectedCustDocs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold">{locale === 'id' ? 'Tidak Ada Dokumen' : 'No Documents Found'}</p>
                    <p className="text-xs text-slate-400 mt-1">Pelanggan belum pernah mengunggah KTP, SIM, atau Paspor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {locale === 'id' ? 'Dokumen Terdaftar' : 'Registered Documents'}
                    </p>
                    {selectedCustDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/55 transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{doc.label}</p>
                          {doc.booking_info && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{doc.booking_info}</p>
                          )}
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-toska-500 hover:bg-toska-600 text-white text-xs font-bold transition-all shrink-0 hover:shadow-md hover:shadow-toska-500/20"
                        >
                          {locale === 'id' ? 'Buka File' : 'Open File'}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setShowDocModal(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  {locale === 'id' ? 'Tutup' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Package, Plus, Pencil, Trash2, X, Search, Check, AlertCircle,
  ChevronLeft, ChevronRight, Save, Image, Tag, Users, Clock, List
} from 'lucide-react';
import { useI18n } from '../../lib/I18nContext';
import { useAuth } from '../../lib/AuthContext';
import supabase from '../../lib/supabase';

interface CarItem {
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

interface PackageItem {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: number;
  highlights: string[];
  image_url: string;
  category: string;
  is_available?: boolean;
  included?: {
    hotels?: Array<{ hotel: string; prices: Record<string, number> }>;
    itinerary?: Array<{ day: number; title: string; activities: string[] }>;
    includes_list?: string[];
    excludes_list?: string[];
  };
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

type Tab = 'cars' | 'packages';

export default function StockManagement() {
  const { t, locale } = useI18n();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('cars');
  const [cars, setCars] = useState<CarItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Car form
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState<CarItem | null>(null);
  const [carForm, setCarForm] = useState({
    name: '', type: 'self_drive', price: 0, duration_desc: '', seats: 4,
    image_url: '', category: '', features: '', is_available: true,
  });

  // Package form
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'hotels' | 'itinerary'>('info');
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);
  const [pkgForm, setPkgForm] = useState<{
    name: string;
    description: string;
    duration: string;
    price: number;
    highlights: string;
    image_url: string;
    category: string;
    is_available: boolean;
    included: {
      hotels?: Array<{ hotel: string; prices: Record<string, number> }>;
      itinerary?: Array<{ day: number; title: string; activities: string[] }>;
      includes_list?: string[];
      excludes_list?: string[];
    };
  }>({
    name: '',
    description: '',
    duration: '',
    price: 0,
    highlights: '',
    image_url: '',
    category: '',
    is_available: true,
    included: {
      hotels: [],
      itinerary: [],
    }
  });

  const [newPriceKeys, setNewPriceKeys] = useState<Record<number, string>>({});
  const [newPriceValues, setNewPriceValues] = useState<Record<number, string>>({});
  const [customKeys, setCustomKeys] = useState<Record<number, string>>({});

  // Pagination
  const [carPage, setCarPage] = useState(1);
  const [pkgPage, setPkgPage] = useState(1);
  const perPage = 8;

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: Tab; id: number } | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [carsRes, pkgsRes] = await Promise.all([
        supabase.from('car_rentals').select('*').order('id', { ascending: true }),
        supabase.from('tour_packages').select('*').order('id', { ascending: true }),
      ]);
      if (carsRes.data) setCars(carsRes.data);
      if (pkgsRes.data) setPackages(pkgsRes.data);
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  // Car CRUD
  const openCarModal = (car?: CarItem) => {
    if (car) {
      setEditingCar(car);
      setCarForm({
        name: car.name, type: car.type, price: car.price, duration_desc: car.duration_desc,
        seats: car.seats, image_url: car.image_url || '', category: car.category || '',
        features: car.features?.join(', ') || '', is_available: car.is_available !== false,
      });
    } else {
      setEditingCar(null);
      setCarForm({ name: '', type: 'self_drive', price: 0, duration_desc: '', seats: 4, image_url: '', category: '', features: '', is_available: true });
    }
    setShowCarModal(true);
  };

  const saveCar = async () => {
    if (!session) {
      showToast('error', 'Anda harus login terlebih dahulu untuk melakukan operasi ini.');
      return;
    }

    const data = {
      name: carForm.name,
      type: carForm.type,
      price: carForm.price,
      duration_desc: carForm.duration_desc,
      seats: carForm.seats,
      image_url: carForm.image_url,
      category: carForm.category,
      features: carForm.features.split(',').map(f => f.trim()).filter(Boolean),
      is_available: carForm.is_available,
    };

    try {
      if (editingCar) {
        const { error } = await supabase.from('car_rentals').update(data).eq('id', editingCar.id);
        if (error) throw error;
      } else {
        const { data: newCar, error } = await supabase.from('car_rentals').insert(data).select().single();
        if (error) throw error;
        if (!newCar) throw new Error('Gagal menyimpan data. Pastikan Anda memiliki izin yang cukup.');
      }
      showToast('success', t('saveSuccess'));
      setShowCarModal(false);
      await loadData();
    } catch (err: any) {
      const msg = err?.message || t('errorOccurred');
      showToast('error', `${t('errorOccurred')}: ${msg}`);
      console.error('Save car error:', err);
    }
  };

  const deleteCar = async (id: number) => {
    if (!session) {
      showToast('error', 'Anda harus login terlebih dahulu untuk melakukan operasi ini.');
      setDeleteConfirm(null);
      return;
    }

    try {
      const { error, count } = await supabase.from('car_rentals').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      if (count === 0) throw new Error('Gagal menghapus data. Pastikan Anda memiliki izin yang cukup.');
      showToast('success', t('deleteSuccess'));
      await loadData();
    } catch (err: any) {
      const msg = err?.message || t('errorOccurred');
      showToast('error', `${t('errorOccurred')}: ${msg}`);
      console.error('Delete car error:', err);
    }
    setDeleteConfirm(null);
  };

  // Package CRUD
  const openPkgModal = (pkg?: PackageItem) => {
    setModalTab('info');
    setNewPriceKeys({});
    setNewPriceValues({});
    setCustomKeys({});

    if (pkg) {
      setEditingPkg(pkg);
      setPkgForm({
        name: pkg.name,
        description: pkg.description || '',
        duration: pkg.duration || '',
        price: pkg.price,
        highlights: pkg.highlights?.join(', ') || '',
        image_url: pkg.image_url || '',
        category: pkg.category || '',
        is_available: pkg.is_available !== false,
        included: pkg.included || { hotels: [], itinerary: [] }
      });
    } else {
      setEditingPkg(null);
      setPkgForm({
        name: '',
        description: '',
        duration: '',
        price: 0,
        highlights: '',
        image_url: '',
        category: '',
        is_available: true,
        included: {
          hotels: [
            { hotel: 'Standard Hotel', prices: { '2pax': 1000000 } }
          ],
          itinerary: [
            { day: 1, title: 'Hari 1', activities: ['Penjemputan bandara'] }
          ]
        }
      });
    }
    setShowPkgModal(true);
  };

  // Hotels pricing helpers
  const updateHotelName = (hotelIndex: number, newName: string) => {
    setPkgForm(prev => {
      const hotels = [...(prev.included.hotels || [])];
      hotels[hotelIndex] = { ...hotels[hotelIndex], hotel: newName };
      return {
        ...prev,
        included: { ...prev.included, hotels }
      };
    });
  };

  const removeHotel = (hotelIndex: number) => {
    setPkgForm(prev => {
      const hotels = (prev.included.hotels || []).filter((_, idx) => idx !== hotelIndex);
      return {
        ...prev,
        included: { ...prev.included, hotels }
      };
    });
  };

  const addHotel = () => {
    setPkgForm(prev => {
      const hotels = [...(prev.included.hotels || []), { hotel: '', prices: {} }];
      return {
        ...prev,
        included: { ...prev.included, hotels }
      };
    });
  };

  const removeHotelPrice = (hotelIndex: number, priceKey: string) => {
    setPkgForm(prev => {
      const hotels = [...(prev.included.hotels || [])];
      const hotel = { ...hotels[hotelIndex] };
      const prices = { ...hotel.prices };
      delete prices[priceKey];
      hotel.prices = prices;
      hotels[hotelIndex] = hotel;
      return {
        ...prev,
        included: { ...prev.included, hotels }
      };
    });
  };

  const handleAddPrice = (hotelIndex: number) => {
    const key = newPriceKeys[hotelIndex] || '2pax';
    const isCustom = key === 'custom';
    const actualKey = isCustom ? (customKeys[hotelIndex] || '').trim().toLowerCase() : key;
    const valStr = newPriceValues[hotelIndex] || '';
    const val = parseInt(valStr) || 0;

    if (!actualKey) return;

    setPkgForm(prev => {
      const hotels = [...(prev.included.hotels || [])];
      const hotel = { ...hotels[hotelIndex] };
      hotel.prices = { ...hotel.prices, [actualKey]: val };
      hotels[hotelIndex] = hotel;
      return {
        ...prev,
        included: { ...prev.included, hotels }
      };
    });

    // Clear local inputs
    setNewPriceValues(prev => ({ ...prev, [hotelIndex]: '' }));
    if (isCustom) {
      setCustomKeys(prev => ({ ...prev, [hotelIndex]: '' }));
    }
  };

  // Itinerary helpers
  const updateItineraryDay = (dayIndex: number, fields: { title?: string; activitiesText?: string }) => {
    setPkgForm(prev => {
      const itinerary = [...(prev.included.itinerary || [])];
      const dayItem = { ...itinerary[dayIndex] };
      if (fields.title !== undefined) {
        dayItem.title = fields.title;
      }
      if (fields.activitiesText !== undefined) {
        dayItem.activities = fields.activitiesText.split('\n').map(a => a.trim()).filter(Boolean);
      }
      itinerary[dayIndex] = dayItem;
      return {
        ...prev,
        included: { ...prev.included, itinerary }
      };
    });
  };

  const removeItineraryDay = (dayIndex: number) => {
    setPkgForm(prev => {
      const itinerary = (prev.included.itinerary || [])
        .filter((_, idx) => idx !== dayIndex)
        .map((item, idx) => ({ ...item, day: idx + 1 })); // Re-number days
      return {
        ...prev,
        included: { ...prev.included, itinerary }
      };
    });
  };

  const addItineraryDay = () => {
    setPkgForm(prev => {
      const itinerary = [...(prev.included.itinerary || [])];
      const nextDay = itinerary.length + 1;
      itinerary.push({ day: nextDay, title: `Hari ${nextDay}`, activities: [] });
      return {
        ...prev,
        included: { ...prev.included, itinerary }
      };
    });
  };

  const savePkg = async () => {
    if (!session) {
      showToast('error', 'Anda harus login terlebih dahulu untuk melakukan operasi ini.');
      return;
    }

    const data = {
      name: pkgForm.name,
      description: pkgForm.description,
      duration: pkgForm.duration,
      price: pkgForm.price,
      highlights: pkgForm.highlights.split(',').map(h => h.trim()).filter(Boolean),
      image_url: pkgForm.image_url,
      category: pkgForm.category,
      is_available: pkgForm.is_available,
      included: pkgForm.included,
    };

    try {
      if (editingPkg) {
        const { error } = await supabase.from('tour_packages').update(data).eq('id', editingPkg.id);
        if (error) throw error;
      } else {
        const { data: newPkg, error } = await supabase.from('tour_packages').insert(data).select().single();
        if (error) throw error;
        if (!newPkg) throw new Error('Gagal menyimpan data. Pastikan Anda memiliki izin yang cukup.');
      }
      showToast('success', t('saveSuccess'));
      setShowPkgModal(false);
      await loadData();
    } catch (err: any) {
      const msg = err?.message || t('errorOccurred');
      showToast('error', `${t('errorOccurred')}: ${msg}`);
      console.error('Save package error:', err);
    }
  };

  const deletePkg = async (id: number) => {
    if (!session) {
      showToast('error', 'Anda harus login terlebih dahulu untuk melakukan operasi ini.');
      setDeleteConfirm(null);
      return;
    }

    try {
      const { error, count } = await supabase.from('tour_packages').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      if (count === 0) throw new Error('Gagal menghapus data. Pastikan Anda memiliki izin yang cukup.');
      showToast('success', t('deleteSuccess'));
      await loadData();
    } catch (err: any) {
      const msg = err?.message || t('errorOccurred');
      showToast('error', `${t('errorOccurred')}: ${msg}`);
      console.error('Delete package error:', err);
    }
    setDeleteConfirm(null);
  };

  const toggleAvailability = async (type: Tab, id: number, current: boolean) => {
    if (!session) {
      showToast('error', 'Anda harus login terlebih dahulu untuk melakukan operasi ini.');
      return;
    }

    try {
      const table = type === 'cars' ? 'car_rentals' : 'tour_packages';
      const { error } = await supabase.from(table).update({ is_available: !current }).eq('id', id);
      if (error) throw error;
      showToast('success', t('saveSuccess'));
      await loadData();
    } catch (err: any) {
      const msg = err?.message || t('errorOccurred');
      showToast('error', `${t('errorOccurred')}: ${msg}`);
      console.error('Toggle availability error:', err);
    }
  };

  // Filtered + Paginated data
  const filteredCars = cars.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredPkgs = packages.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const pagedCars = filteredCars.slice((carPage - 1) * perPage, carPage * perPage);
  const pagedPkgs = filteredPkgs.slice((pkgPage - 1) * perPage, pkgPage * perPage);
  const totalCarPages = Math.ceil(filteredCars.length / perPage);
  const totalPkgPages = Math.ceil(filteredPkgs.length / perPage);

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
            {t('stockTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('stockSubtitle')}</p>
        </div>
      </div>

      {/* Tab + Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          <button
            onClick={() => { setActiveTab('cars'); setSearch(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'cars' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Car className="w-4 h-4" /> {t('carStock')}
          </button>
          <button
            onClick={() => { setActiveTab('packages'); setSearch(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'packages' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" /> {t('packageStock')}
          </button>
        </div>

        <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => activeTab === 'cars' ? openCarModal() : openPkgModal()}
            className="flex items-center gap-2 bg-toska-500 hover:bg-toska-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-toska-500/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'cars' ? t('addCar') : t('addPackage')}
          </button>
        </div>
      </div>

      {/* Cars Table */}
      {activeTab === 'cars' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('carName')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('carType')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('seats')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('price')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('availability')}</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedCars.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">{t('noData')}</td>
                  </tr>
                ) : pagedCars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {car.image_url ? (
                          <img src={car.image_url} alt={car.name} className="w-12 h-10 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <div className="w-12 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{car.name}</p>
                          <p className="text-xs text-slate-500">{car.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        car.type === 'self_drive' ? 'bg-sky-50 text-sky-600' : 'bg-violet-50 text-violet-600'
                      }`}>
                        {car.type === 'self_drive' ? t('selfDrive') : t('withDriver')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{car.seats}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatPrice(car.price)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAvailability('cars', car.id, car.is_available !== false)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          car.is_available !== false
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${car.is_available !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {car.is_available !== false ? t('available') : t('unavailable')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openCarModal(car)} className="p-2 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors" title={t('editItem')}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ type: 'cars', id: car.id })} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title={t('deleteItem')}>
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
          {totalCarPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {t('showing')} {(carPage - 1) * perPage + 1}–{Math.min(carPage * perPage, filteredCars.length)} {t('of')} {filteredCars.length}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={carPage === 1} onClick={() => setCarPage(p => p - 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-700">{carPage}/{totalCarPages}</span>
                <button disabled={carPage === totalCarPages} onClick={() => setCarPage(p => p + 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Packages Table */}
      {activeTab === 'packages' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('packageName')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('category')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('duration')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('price')}</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('availability')}</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedPkgs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">{t('noData')}</td>
                  </tr>
                ) : pagedPkgs.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {pkg.image_url ? (
                          <img src={pkg.image_url} alt={pkg.name} className="w-12 h-10 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <div className="w-12 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{pkg.name}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{pkg.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600">{pkg.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{pkg.duration}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatPrice(pkg.price)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAvailability('packages', pkg.id, pkg.is_available !== false)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          pkg.is_available !== false
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${pkg.is_available !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {pkg.is_available !== false ? t('available') : t('unavailable')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openPkgModal(pkg)} className="p-2 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors" title={t('editItem')}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ type: 'packages', id: pkg.id })} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title={t('deleteItem')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPkgPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {t('showing')} {(pkgPage - 1) * perPage + 1}–{Math.min(pkgPage * perPage, filteredPkgs.length)} {t('of')} {filteredPkgs.length}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={pkgPage === 1} onClick={() => setPkgPage(p => p - 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-700">{pkgPage}/{totalPkgPages}</span>
                <button disabled={pkgPage === totalPkgPages} onClick={() => setPkgPage(p => p + 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Car Modal */}
      <AnimatePresence>
        {showCarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
                  {editingCar ? t('editItem') : t('addCar')}
                </h2>
                <button onClick={() => setShowCarModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('carName')} *</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" required value={carForm.name} onChange={e => setCarForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="Toyota Avanza" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('carType')} *</label>
                    <select value={carForm.type} onChange={e => setCarForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none bg-white">
                      <option value="self_drive">{t('selfDrive')}</option>
                      <option value="with_driver">{t('withDriver')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('seats')} *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="number" min={1} value={carForm.seats} onChange={e => setCarForm(p => ({ ...p, seats: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('pricePerDay')} *</label>
                    <input type="number" min={0} value={carForm.price} onChange={e => setCarForm(p => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('durationDesc')}</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={carForm.duration_desc} onChange={e => setCarForm(p => ({ ...p, duration_desc: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="12 Jam" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('category')}</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={carForm.category} onChange={e => setCarForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="MPV / SUV / City Car" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('imageUrl')}</label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="url" value={carForm.image_url} onChange={e => setCarForm(p => ({ ...p, image_url: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('features')}</label>
                  <div className="relative">
                    <List className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input type="text" value={carForm.features} onChange={e => setCarForm(p => ({ ...p, features: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="AC, Bluetooth, GPS" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">{t('availability')}:</label>
                  <button
                    type="button"
                    onClick={() => setCarForm(p => ({ ...p, is_available: !p.is_available }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${carForm.is_available ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${carForm.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-slate-600">{carForm.is_available ? t('available') : t('unavailable')}</span>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                <button onClick={() => setShowCarModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  {t('cancelAction')}
                </button>
                <button onClick={saveCar} className="flex items-center gap-2 px-5 py-2.5 bg-toska-500 hover:bg-toska-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg">
                  <Save className="w-4 h-4" /> {t('saveItem')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Modal */}
      <AnimatePresence>
        {showPkgModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPkgModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
                  {editingPkg ? t('editItem') : t('addPackage')}
                </h2>
                <button onClick={() => setShowPkgModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Tabs Bar */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1 sticky top-[73px] bg-white z-10">
                <button
                  type="button"
                  onClick={() => setModalTab('info')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    modalTab === 'info'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {locale === 'id' ? 'Informasi Dasar' : 'Basic Info'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('hotels')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    modalTab === 'hotels'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {locale === 'id' ? 'Opsi Hotel & Harga' : 'Hotel Options & Pricing'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('itinerary')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    modalTab === 'itinerary'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {locale === 'id' ? 'Rencana Perjalanan' : 'Itinerary'}
                </button>
              </div>

              <div className="p-6 space-y-4">
                {modalTab === 'info' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('packageName')} *</label>
                      <input type="text" required value={pkgForm.name} onChange={e => setPkgForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="Paket Bali 3D2N" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('description')}</label>
                      <textarea rows={3} value={pkgForm.description} onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none resize-none" placeholder="Deskripsi paket wisata..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('duration')}</label>
                        <input type="text" value={pkgForm.duration} onChange={e => setPkgForm(p => ({ ...p, duration: e.target.value }))}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="3D2N" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('price')} *</label>
                        <input type="number" min={0} value={pkgForm.price} onChange={e => setPkgForm(p => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('category')}</label>
                      <input type="text" value={pkgForm.category} onChange={e => setPkgForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="3D2N / Honeymoon" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('highlights')}</label>
                      <input type="text" value={pkgForm.highlights} onChange={e => setPkgForm(p => ({ ...p, highlights: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="Tanah Lot, Ubud, Kintamani" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('imageUrl')}</label>
                      <input type="url" value={pkgForm.image_url} onChange={e => setPkgForm(p => ({ ...p, image_url: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/30 focus:border-toska-400 outline-none" placeholder="https://..." />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-700">{t('availability')}:</label>
                      <button
                        type="button"
                        onClick={() => setPkgForm(p => ({ ...p, is_available: !p.is_available }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pkgForm.is_available ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pkgForm.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm text-slate-600">{pkgForm.is_available ? t('available') : t('unavailable')}</span>
                    </div>
                  </div>
                )}

                {modalTab === 'hotels' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {locale === 'id' ? 'Opsi Hotel & Harga Pax' : 'Hotel Options & Pax Pricing'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {locale === 'id' 
                            ? 'Atur harga paket per hotel berdasarkan kapasitas pax.' 
                            : 'Configure package pricing per hotel based on pax capacity.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addHotel}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {locale === 'id' ? 'Tambah Hotel' : 'Add Hotel'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(!pkgForm.included.hotels || pkgForm.included.hotels.length === 0) ? (
                        <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                          <p className="text-xs text-slate-500 font-medium">
                            {locale === 'id' ? 'Belum ada opsi hotel ditambahkan.' : 'No hotel options added yet.'}
                          </p>
                        </div>
                      ) : (
                        pkgForm.included.hotels.map((hotelOpt, hotelIdx) => (
                          <div 
                            key={hotelIdx} 
                            className="border border-slate-200/80 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all space-y-4 relative"
                          >
                            <button
                              type="button"
                              onClick={() => removeHotel(hotelIdx)}
                              className="absolute top-4 right-4 p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                              title={locale === 'id' ? 'Hapus Hotel' : 'Delete Hotel'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="max-w-[85%]">
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                {locale === 'id' ? `Hotel #${hotelIdx + 1}` : `Hotel #${hotelIdx + 1}`}
                              </label>
                              <input
                                type="text"
                                required
                                value={hotelOpt.hotel}
                                onChange={(e) => updateHotelName(hotelIdx, e.target.value)}
                                placeholder={locale === 'id' ? 'Contoh: Hotel Bintang 3 / Amaris Kuta' : 'e.g. 3-Star Hotel / Amaris Kuta'}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/20 focus:border-toska-400 outline-none transition-all font-medium text-slate-800"
                              />
                            </div>

                            <div className="space-y-3 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">
                                  {locale === 'id' ? 'Harga berdasarkan Jumlah Pax' : 'Pricing by Pax Count'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {Object.entries(hotelOpt.prices || {}).map(([paxKey, priceVal]) => (
                                  <div 
                                    key={paxKey} 
                                    className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/60 rounded-xl p-2 pl-3"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="text-xs font-semibold text-slate-700 truncate">
                                        {paxLabels[paxKey] || paxKey}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-slate-400 font-medium">Rp</span>
                                      <input
                                        type="number"
                                        min={0}
                                        value={priceVal}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          setPkgForm(prev => {
                                            const hotels = [...(prev.included.hotels || [])];
                                            hotels[hotelIdx] = {
                                              ...hotels[hotelIdx],
                                              prices: { ...hotels[hotelIdx].prices, [paxKey]: val }
                                            };
                                            return { ...prev, included: { ...prev.included, hotels } };
                                          });
                                        }}
                                        className="w-24 px-2 py-1 text-right font-semibold text-xs border border-slate-200 rounded-lg outline-none focus:border-toska-400 focus:ring-2 focus:ring-toska-500/10"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeHotelPrice(hotelIdx, paxKey)}
                                        className="p-1 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-slate-100">
                                <select
                                  value={newPriceKeys[hotelIdx] || '2pax'}
                                  onChange={(e) => {
                                    const k = e.target.value;
                                    setNewPriceKeys(p => ({ ...p, [hotelIdx]: k }));
                                  }}
                                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-toska-400"
                                >
                                  {Object.entries(paxLabels).map(([key, val]) => (
                                    <option key={key} value={key}>{val}</option>
                                  ))}
                                  <option value="custom">{locale === 'id' ? 'Custom...' : 'Custom...'}</option>
                                </select>

                                {newPriceKeys[hotelIdx] === 'custom' && (
                                  <input
                                    type="text"
                                    placeholder="e.g. 3pax, 5pax"
                                    value={customKeys[hotelIdx] || ''}
                                    onChange={(e) => setCustomKeys(p => ({ ...p, [hotelIdx]: e.target.value }))}
                                    className="w-24 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-toska-400"
                                  />
                                )}

                                <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                                  <span className="text-xs text-slate-400 font-medium">Rp</span>
                                  <input
                                    type="number"
                                    placeholder="Harga"
                                    value={newPriceValues[hotelIdx] || ''}
                                    onChange={(e) => setNewPriceValues(p => ({ ...p, [hotelIdx]: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-toska-400"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddPrice(hotelIdx)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  {locale === 'id' ? 'Tambah' : 'Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {modalTab === 'itinerary' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {locale === 'id' ? 'Rencana Perjalanan (Itinerary)' : 'Itinerary Planning'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {locale === 'id' 
                            ? 'Atur jadwal kegiatan harian untuk paket wisata.' 
                            : 'Configure the daily schedule and activities for this tour package.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addItineraryDay}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {locale === 'id' ? 'Tambah Hari' : 'Add Day'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(!pkgForm.included.itinerary || pkgForm.included.itinerary.length === 0) ? (
                        <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                          <p className="text-xs text-slate-500 font-medium">
                            {locale === 'id' ? 'Belum ada hari itinerary ditambahkan.' : 'No itinerary days added yet.'}
                          </p>
                        </div>
                      ) : (
                        pkgForm.included.itinerary.map((dayItem, dayIdx) => (
                          <div 
                            key={dayIdx} 
                            className="border border-slate-200/80 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative"
                          >
                            <button
                              type="button"
                              onClick={() => removeItineraryDay(dayIdx)}
                              className="absolute top-4 right-4 p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                              title={locale === 'id' ? 'Hapus Hari' : 'Delete Day'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 max-w-[85%]">
                              <span className="inline-flex items-center justify-center bg-violet-50 text-violet-700 w-8 h-8 rounded-lg font-bold text-xs shrink-0">
                                {dayItem.day}
                              </span>
                              <input
                                type="text"
                                required
                                value={dayItem.title}
                                onChange={(e) => updateItineraryDay(dayIdx, { title: e.target.value })}
                                placeholder={locale === 'id' ? 'Judul Hari (contoh: Penjemputan di Bandara & Bali Selatan)' : 'Day Title (e.g. Airport Pick-up & South Bali)'}
                                className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-toska-500/20 focus:border-toska-400 outline-none transition-all font-semibold text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {locale === 'id' ? 'Aktivitas Harian (Satu per baris)' : 'Daily Activities (One per line)'}
                              </label>
                              <textarea
                                rows={3}
                                value={dayItem.activities?.join('\n') || ''}
                                onChange={(e) => updateItineraryDay(dayIdx, { activitiesText: e.target.value })}
                                placeholder={locale === 'id' ? 'Penjemputan di bandara\nKalungan bunga selamat datang\nMakan malam seafood Jimbaran' : 'Airport pick-up\nWelcome flower garland\nJimbaran seafood dinner'}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-toska-500/20 focus:border-toska-400 outline-none resize-none"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl z-10">
                <button onClick={() => setShowPkgModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  {t('cancelAction')}
                </button>
                <button onClick={savePkg} className="flex items-center gap-2 px-5 py-2.5 bg-toska-500 hover:bg-toska-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg">
                  <Save className="w-4 h-4" /> {t('saveItem')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
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
                  onClick={() => {
                    if (deleteConfirm.type === 'cars') deleteCar(deleteConfirm.id);
                    else deletePkg(deleteConfirm.id);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  {t('deleteItem')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

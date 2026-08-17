import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Hotel, Users, Check, X, Sparkles, Calendar, Send, Heart } from 'lucide-react';
import { useI18n } from '../lib/I18nContext';

interface HotelOption {
  hotel: string;
  prices: Record<string, number>;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

interface PackageData {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: number;
  highlights: string[];
  image_url: string;
  category: string;
  included?: {
    itinerary?: ItineraryDay[];
    hotels?: HotelOption[];
    includes_list?: string[];
    excludes_list?: string[];
  };
}

interface PackageDetailModalProps {
  pkg: PackageData | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pkg: PackageData, hotel: string, pax: string, price: number) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

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

export default function PackageDetailModal({ pkg, isOpen, onClose, onSelect }: PackageDetailModalProps) {
  const { t, locale, translateText } = useI18n();
  const [activeHotelIdx, setActiveHotelIdx] = useState(0);
  const [selectedPaxKey, setSelectedPaxKey] = useState('');
  const [activeItineraryDay, setActiveItineraryDay] = useState(1);
  const [selectedHoneymoonHotel, setSelectedHoneymoonHotel] = useState('');

  // Reset local states when package changes or modal opens
  useEffect(() => {
    if (pkg) {
      setActiveHotelIdx(0);
      setActiveItineraryDay(1);
      
      const isHoneymoon = pkg.category === 'Honeymoon';
      const firstHotel = pkg.included?.hotels?.[0];
      
      if (!isHoneymoon && firstHotel?.prices) {
        // Set default selected pax key to the first available key (usually 2pax)
        const keys = Object.keys(firstHotel.prices);
        if (keys.length > 0) {
          setSelectedPaxKey(keys[0]);
        }
      } else if (isHoneymoon && firstHotel?.prices) {
        // Set default honeymoon hotel selection to the first one available
        const keys = Object.keys(firstHotel.prices);
        if (keys.length > 0) {
          setSelectedHoneymoonHotel(keys[0]);
        }
      }
    }
  }, [pkg, isOpen]);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!pkg) return null;

  const isHoneymoon = pkg.category === 'Honeymoon';
  const usePaxPricing = !isHoneymoon && (pkg.included?.hotels?.length ?? 0) > 0;
  
  // Calculate price based on options chosen
  let activePrice = pkg.price || 0;
  let activeHotelName = '';
  let activePaxLabel = '';

  if (usePaxPricing && pkg.included?.hotels) {
    const activeHotelObj = pkg.included.hotels[activeHotelIdx];
    if (activeHotelObj) {
      activeHotelName = activeHotelObj.hotel;
      activePrice = activeHotelObj.prices[selectedPaxKey] || activePrice;
      activePaxLabel = paxLabels[selectedPaxKey] || selectedPaxKey;
    }
  } else if (isHoneymoon && pkg.included?.hotels?.[0]) {
    const pricesObj = pkg.included.hotels[0].prices;
    activeHotelName = selectedHoneymoonHotel;
    activePrice = pricesObj[selectedHoneymoonHotel] || activePrice;
    activePaxLabel = '1 Couple';
  }

  const handleBookClick = () => {
    if (usePaxPricing) {
      onSelect(pkg, activeHotelName, selectedPaxKey, activePrice);
    } else if (isHoneymoon) {
      onSelect(pkg, activeHotelName, '1 Couple', activePrice);
    } else {
      onSelect(pkg, 'Standard Hotel', '1 Couple', activePrice);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ocean-950/60 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Modal Content container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col border border-ocean-100/50"
          >
            {/* Header Image Area */}
            <div className="relative h-48 sm:h-64 shrink-0 overflow-hidden">
              <img
                src={pkg.image_url}
                alt={translateText(pkg.name)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/90 via-ocean-900/40 to-transparent" />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                  isHoneymoon ? 'bg-pink-500' : 'bg-toska-500'
                }`}>
                  {isHoneymoon && <Heart className="w-3 h-3 fill-white" />}
                  {translateText(pkg.category)}
                </span>
                <span className="bg-white/95 backdrop-blur-sm text-ocean-800 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Clock className="w-3 h-3 text-toska-500" /> {translateText(pkg.duration)}
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white rounded-full p-2.5 transition-colors shadow-sm"
                aria-label="Tutup detail modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Package Text */}
              <div className="absolute bottom-4 left-6 right-6">
                <h3 className="text-2xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)] mb-1.5 drop-shadow-md">
                  {translateText(pkg.name)}
                </h3>
                <p className="text-white/95 text-xs sm:text-sm max-w-2xl line-clamp-2 leading-relaxed drop-shadow-sm">
                  {translateText(pkg.description)}
                </p>
              </div>
            </div>

            {/* Scrollable Contents Grid */}
            <div
              className="overflow-y-auto overscroll-contain p-6 sm:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 scrollbar-thin"
              onWheel={(e) => e.stopPropagation()}
            >
              {/* Left Side: Itinerary, Details (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Highlights Summary */}
                <div>
                  <p className="text-xs font-bold text-ocean-800 uppercase tracking-wider mb-2.5">{t('destinationsLabel')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.highlights?.map((h, j) => (
                      <span key={j} className={`text-xs px-3 py-1 rounded-full font-medium ${
                        isHoneymoon ? 'bg-pink-50 text-pink-700' : 'bg-ocean-50 text-ocean-700'
                      }`}>{translateText(h)}</span>
                    ))}
                  </div>
                </div>

                {/* Itinerary Section */}
                {pkg.included?.itinerary && (
                  <div className="border border-ocean-100 bg-ocean-50/20 rounded-2xl p-5">
                    <p className="text-xs font-bold text-ocean-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-toska-500" />
                      {locale === 'id' ? 'Rencana Perjalanan Harian' : 'Daily Itinerary Plan'}
                    </p>

                    {/* Day Selection Tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-4 scrollbar-none">
                      {pkg.included.itinerary.map((day) => (
                        <button
                          key={day.day}
                          type="button"
                          onClick={() => setActiveItineraryDay(day.day)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                            activeItineraryDay === day.day
                              ? (isHoneymoon ? 'bg-pink-500 text-white shadow-md' : 'bg-toska-500 text-white shadow-md')
                              : 'bg-white text-ocean-700 hover:bg-ocean-50 border border-ocean-100'
                          }`}
                        >
                          Hari {day.day}
                        </button>
                      ))}
                    </div>

                    {/* Active Day Itinerary Content */}
                    <div className="min-h-[140px] bg-white rounded-xl p-4.5 border border-ocean-50">
                      {(() => {
                        const activeDayObj = pkg.included.itinerary.find(d => d.day === activeItineraryDay);
                        if (!activeDayObj) return null;
                        return (
                          <motion.div
                            key={activeItineraryDay}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <h4 className="text-sm font-bold text-ocean-900 mb-3 pb-2 border-b border-ocean-50 flex items-center justify-between">
                              <span>{translateText(activeDayObj.title)}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isHoneymoon ? 'bg-pink-50 text-pink-600' : 'bg-toska-50 text-toska-600'}`}>
                                Day {activeItineraryDay}
                              </span>
                            </h4>
                            <ul className="space-y-2.5">
                              {activeDayObj.activities?.map((act, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-ocean-600 leading-relaxed">
                                  <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isHoneymoon ? 'text-pink-500' : 'text-toska-500'}`} />
                                  <span>{translateText(act)}</span>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Includes & Excludes Side-by-side */}
                {(pkg.included?.includes_list || pkg.included?.excludes_list) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Includes */}
                    {pkg.included.includes_list && (
                      <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-4.5">
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          {t('includedInPackage')}
                        </p>
                        <ul className="space-y-2">
                          {pkg.included.includes_list.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-ocean-600 leading-normal">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{translateText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Excludes */}
                    {pkg.included.excludes_list && (
                      <div className="bg-rose-50/40 border border-rose-100/60 rounded-2xl p-4.5">
                        <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <X className="w-4 h-4 text-rose-600" />
                          {t('notIncluded')}
                        </p>
                        <ul className="space-y-2">
                          {pkg.included.excludes_list.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-ocean-600 leading-normal">
                              <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span>{translateText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Options and Cost Calculator (5 Cols) */}
              <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-ocean-100 lg:pl-8">
                <div>
                  <p className="text-xs font-bold text-ocean-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Hotel className={`w-4 h-4 ${isHoneymoon ? 'text-pink-500' : 'text-toska-500'}`} />
                    {isHoneymoon ? t('hotelOptionsCouple') : t('hotelOptions')}
                  </p>

                  {usePaxPricing && pkg.included?.hotels ? (
                    /* General Pax: Hotels Tabs and Pax Dropdown */
                    <div className="space-y-4">
                      {/* Hotel Tabs */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-ocean-500">{locale === 'id' ? 'Pilih Hotel' : 'Select Hotel'}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.included.hotels.map((h, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setActiveHotelIdx(i);
                                // Sync selected pax key if the selected key is not present in new hotel prices
                                const keys = Object.keys(h.prices);
                                if (keys.length > 0 && !keys.includes(selectedPaxKey)) {
                                  setSelectedPaxKey(keys[0]);
                                }
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                activeHotelIdx === i
                                  ? 'bg-ocean-900 text-white border-ocean-900 shadow-sm'
                                  : 'bg-white text-ocean-700 hover:bg-ocean-50 border-ocean-200'
                              }`}
                            >
                              {h.hotel}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pax Dropdown Selection */}
                      {pkg.included.hotels[activeHotelIdx]?.prices && (
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pax-select" className="text-[11px] font-semibold text-ocean-500">
                            {locale === 'id' ? 'Jumlah Peserta (Pax)' : 'Number of Travelers (Pax)'}
                          </label>
                          <select
                            id="pax-select"
                            value={selectedPaxKey}
                            onChange={(e) => setSelectedPaxKey(e.target.value)}
                            className="w-full bg-white border border-ocean-200 rounded-xl px-4 py-3 text-sm font-semibold text-ocean-800 focus:outline-none focus:ring-2 focus:ring-toska-500"
                          >
                            {Object.entries(pkg.included.hotels[activeHotelIdx].prices).map(([paxKey, price]) => (
                              <option key={paxKey} value={paxKey}>
                                {paxLabels[paxKey] || paxKey} — {formatPrice(price)} /pax
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : isHoneymoon && pkg.included?.hotels?.[0] ? (
                    /* Honeymoon: Simple select hotel with flat prices */
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="honeymoon-hotel-select" className="text-[11px] font-semibold text-ocean-500">
                          {locale === 'id' ? 'Pilih Hotel Bulan Madu' : 'Select Honeymoon Hotel'}
                        </label>
                        <select
                          id="honeymoon-hotel-select"
                          value={selectedHoneymoonHotel}
                          onChange={(e) => setSelectedHoneymoonHotel(e.target.value)}
                          className="w-full bg-white border border-ocean-200 rounded-xl px-4 py-3 text-sm font-semibold text-ocean-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          {Object.entries(pkg.included.hotels[0].prices).map(([hotelName, price]) => (
                            <option key={hotelName} value={hotelName}>
                              {hotelName} — {formatPrice(price)} /couple
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-sand-50 rounded-xl border border-sand-200 text-center text-xs text-ocean-500">
                      {locale === 'id' ? 'Detail harga hotel tidak tersedia.' : 'Hotel price details not available.'}
                    </div>
                  )}
                </div>

                {/* Calculator Summary Card */}
                <div className={`rounded-2xl p-5 border text-ocean-900 flex flex-col justify-between ${
                  isHoneymoon ? 'bg-pink-50/50 border-pink-100' : 'bg-toska-50/30 border-toska-100'
                }`}>
                  <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-widest mb-1.5">
                    {locale === 'id' ? 'ESTIMASI BIAYA' : 'ESTIMATED PRICE'}
                  </p>

                  <div className="space-y-2 border-b border-ocean-100/50 pb-3 mb-3.5">
                    <div className="flex justify-between text-xs text-ocean-600">
                      <span>Hotel</span>
                      <span className="font-semibold text-ocean-800">{activeHotelName || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-ocean-600">
                      <span>Kapasitas</span>
                      <span className="font-semibold text-ocean-800">{activePaxLabel}</span>
                    </div>
                    <div className="flex justify-between text-xs text-ocean-600">
                      <span>Harga per {isHoneymoon ? 'Couple' : 'Pax'}</span>
                      <span className="font-semibold text-ocean-800">{formatPrice(activePrice)}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs font-bold text-ocean-700">{locale === 'id' ? 'Total Estimasi:' : 'Total Estimate:'}</span>
                    <div className="text-right">
                      <span className={`text-2xl font-black font-[family-name:var(--font-display)] ${isHoneymoon ? 'text-pink-600' : 'text-toska-600'}`}>
                        {formatPrice(activePrice)}
                      </span>
                      <span className="text-[10px] text-ocean-500 block">
                        /{isHoneymoon ? t('couple') : t('pax')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleBookClick}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 ${
                      isHoneymoon
                        ? 'bg-pink-500 hover:bg-pink-600 hover:shadow-pink-500/25'
                        : 'bg-toska-500 hover:bg-toska-600 hover:shadow-toska-500/25'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {locale === 'id' ? 'Pesan Sekarang' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, ChevronUp, Hotel, Users, Check, Calendar, Send, Heart, X, Sparkles } from 'lucide-react';
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

interface PackageCardProps {
  pkg: PackageData;
  index: number;
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

function isPaxPricing(prices: Record<string, number>): boolean {
  return Object.keys(prices).every(key => key in paxLabels);
}

export default function PackageCard({ pkg, index, onSelect }: PackageCardProps) {
  const { t, locale, translateText } = useI18n();
  const [showItinerary, setShowItinerary] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeHotel, setActiveHotel] = useState(0);

  const firstHotel = pkg.included?.hotels?.[0];
  const lowestPrice = firstHotel?.prices 
    ? Math.min(...Object.values(firstHotel.prices)) 
    : pkg.price || 0;
  
  const isHoneymoon = pkg.category === 'Honeymoon';
  // Jika bukan honeymoon, kita asumsikan ini paket reguler yang menggunakan sistem pilihan hotel & harga per pax
  const usePaxPricing = !isHoneymoon && (pkg.included?.hotels?.length ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-ocean-100"
    >
      {/* Image Header */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={pkg.image_url}
          alt={translateText(pkg.name)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/80 via-ocean-900/30 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
            isHoneymoon ? 'bg-pink-500' : 'bg-toska-500'
          }`}>
            {isHoneymoon && <Heart className="w-3 h-3 fill-white" />}
            {translateText(pkg.category)}
          </span>
          <span className="bg-white/90 backdrop-blur-sm text-ocean-800 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {translateText(pkg.duration)}
          </span>
        </div>
        <div className="absolute bottom-4 left-6 right-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-display)] mb-1">
            {translateText(pkg.name)}
          </h3>
          <p className="text-white/80 text-sm line-clamp-2">{translateText(pkg.description)}</p>
        </div>
      </div>

      <div className="p-7">
        {/* Highlights */}
        <div className="mb-6">
          <p className="text-xs font-bold text-ocean-800 uppercase tracking-wider mb-3">{t('destinationsLabel')}</p>
          <div className="flex flex-wrap gap-1.5">
            {pkg.highlights?.slice(0, 6).map((h, j) => (
              <span key={j} className={`text-xs px-3 py-1 rounded-full font-medium ${
                isHoneymoon ? 'bg-pink-50 text-pink-700' : 'bg-ocean-50 text-ocean-700'
              }`}>{translateText(h)}</span>
            ))}
            {(pkg.highlights?.length ?? 0) > 6 && (
              <span className="bg-toska-50 text-toska-700 text-xs px-3 py-1 rounded-full font-medium">
                +{pkg.highlights.length - 6} {locale === 'id' ? 'lainnya' : 'others'}
              </span>
            )}
          </div>
        </div>

        {/* Itinerary Toggle */}
        <button
          onClick={() => setShowItinerary(!showItinerary)}
          className="w-full flex items-center justify-between bg-ocean-50 hover:bg-ocean-100 transition-colors rounded-xl px-5 py-3.5 mb-4"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-ocean-800">
            <Calendar className="w-4 h-4 text-toska-500" />
            {t('viewFullItinerary')}
          </span>
          {showItinerary ? (
            <ChevronUp className="w-5 h-5 text-toska-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-ocean-400" />
          )}
        </button>

        {/* Itinerary */}
        <AnimatePresence>
          {showItinerary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-4">
                {pkg.included?.itinerary?.map((day) => (
                  <div key={day.day} className={`border-l-2 pl-4 ${isHoneymoon ? 'border-pink-300' : 'border-toska-300'}`}>
                    <h4 className="text-sm font-bold text-ocean-900 mb-2.5">{translateText(day.title)}</h4>
                    <ul className="space-y-1">
                      {day.activities?.map((act, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ocean-600">
                          <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHoneymoon ? 'text-pink-500' : 'text-toska-500'}`} />
                          <span>{translateText(act)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Includes/Excludes Toggle */}
        {(pkg.included?.includes_list || pkg.included?.excludes_list) && (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between bg-sand-100 hover:bg-sand-200 transition-colors rounded-xl px-5 py-3.5 mb-4"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ocean-800">
                <Sparkles className="w-4 h-4 text-pink-500" />
                {t('includedExcludedDetails')}
              </span>
              {showDetails ? (
                <ChevronUp className="w-5 h-5 text-toska-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-ocean-400" />
              )}
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  {pkg.included?.includes_list && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {t('includedInPackage')}
                      </p>
                      <ul className="space-y-1">
                        {pkg.included?.includes_list?.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ocean-600">
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            <span>{translateText(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.included?.excludes_list && (
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> {t('notIncluded')}
                      </p>
                      <ul className="space-y-1">
                        {pkg.included?.excludes_list?.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ocean-600">
                            <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <span>{translateText(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Hotel Tabs & Pricing Section */}
        <div className="mb-7">
          <p className="text-xs font-bold text-ocean-800 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Hotel className={`w-3.5 h-3.5 ${isHoneymoon ? 'text-pink-500' : 'text-toska-500'}`} /> 
            {isHoneymoon ? t('hotelOptionsCouple') : t('hotelOptions')}
          </p>

          {usePaxPricing ? (
            <>
              {/* Regular: Tabs per hotel, grid of pax prices */}
              <div className="flex flex-wrap gap-2 mb-5">
                {pkg.included?.hotels?.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveHotel(i)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeHotel === i
                        ? 'bg-ocean-900 text-white shadow-md'
                        : 'bg-ocean-50 text-ocean-700 hover:bg-ocean-100'
                    }`}
                  >
                    {h.hotel}
                  </button>
                ))}
              </div>

              <div className="bg-sand-50 rounded-xl border border-sand-200 overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-sand-200">
                  {(() => {
                    const activeHotelObj = pkg.included?.hotels?.[activeHotel];
                    if (!activeHotelObj?.prices) {
                      return (
                        <div className="bg-white p-4 col-span-2 sm:col-span-3 text-center text-xs text-ocean-500">
                          {locale === 'id' ? 'Harga tidak tersedia untuk hotel ini.' : 'Price not available for this hotel.'}
                        </div>
                      );
                    }
                    return Object.entries(activeHotelObj.prices).map(([pax, price]) => (
                      <div key={pax} className="bg-white p-3 text-center hover:bg-toska-50 transition-colors">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-3 h-3 text-ocean-400" />
                          <span className="text-xs font-semibold text-ocean-800">{paxLabels[pax] || pax}</span>
                        </div>
                        <span className="text-sm font-bold text-toska-600">{formatPrice(price)}</span>
                        <span className="text-xs text-ocean-500 block">/{t('pax')}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Honeymoon: Simple hotel-price list */}
              <div className="bg-sand-50 rounded-xl border border-sand-200 overflow-hidden">
                <div className="divide-y divide-sand-200">
                  {firstHotel?.prices ? (
                    Object.entries(firstHotel.prices).map(([hotelName, price]) => (
                      <button
                        key={hotelName}
                        type="button"
                        onClick={() => onSelect(pkg, hotelName, '1 Couple', price)}
                        className="w-full bg-white p-4 flex items-center justify-between hover:bg-pink-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-50 text-pink-500 shrink-0">
                            <Hotel className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-ocean-900">{hotelName}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-bold text-toska-600">{formatPrice(price)}</span>
                          <span className="text-xs text-ocean-500 block">/{t('couple')}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-ocean-500 bg-white">
                      {locale === 'id' ? 'Detail harga hotel tidak tersedia untuk paket ini.' : 'Hotel price details not available for this package.'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Starting Price & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-ocean-100">
          <div>
            <p className="text-xs text-ocean-500">{t('startingFrom')}</p>
            <p className="text-2xl font-bold text-toska-600 font-[family-name:var(--font-display)]">{formatPrice(lowestPrice)}</p>
            <p className="text-xs text-ocean-500">/{isHoneymoon ? t('couple') : t('pax')}</p>
          </div>
          
          <button
            onClick={() => {
              const activeHotelObj = pkg.included?.hotels?.[activeHotel];
              if (usePaxPricing && activeHotelObj) {
                const firstPax = Object.keys(activeHotelObj.prices)[0] || '2pax';
                onSelect(pkg, activeHotelObj.hotel, firstPax, activeHotelObj.prices[firstPax] || lowestPrice);
              } else {
                onSelect(pkg, firstHotel?.hotel || 'Standard Hotel', '1 Couple', lowestPrice);
              }
            }}
            className={`w-full sm:w-auto justify-center px-6 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg flex items-center gap-2 text-white ${
              isHoneymoon 
                ? 'bg-pink-500 hover:bg-pink-600 hover:shadow-pink-500/25' 
                : 'bg-toska-500 hover:bg-toska-600 hover:shadow-toska-500/25'
            }`}
          >
            <Send className="w-4 h-4" />
            {t('bookingNow')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
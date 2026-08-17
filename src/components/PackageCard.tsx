import { motion } from 'framer-motion';
import { Clock, Heart } from 'lucide-react';
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
  onViewDetails: (pkg: PackageData) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

export default function PackageCard({ pkg, index, onViewDetails }: PackageCardProps) {
  const { t, locale, translateText } = useI18n();

  const firstHotel = pkg.included?.hotels?.[0];
  const lowestPrice = firstHotel?.prices 
    ? Math.min(...Object.values(firstHotel.prices)) 
    : pkg.price || 0;
  
  const isHoneymoon = pkg.category === 'Honeymoon';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-ocean-100 flex flex-col h-full"
    >
      {/* Image Header */}
      <div className="relative h-64 overflow-hidden shrink-0">
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
            <Clock className="w-3 h-3 text-toska-500" /> {translateText(pkg.duration)}
          </span>
        </div>
        <div className="absolute bottom-4 left-6 right-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-display)] mb-1">
            {translateText(pkg.name)}
          </h3>
        </div>
      </div>

      <div className="p-7 flex flex-col flex-1 justify-between">
        {/* Description & Highlights */}
        <div className="space-y-5">
          <p className="text-ocean-600 text-sm line-clamp-3 leading-relaxed">{translateText(pkg.description)}</p>
          
          <div>
            <p className="text-xs font-bold text-ocean-800 uppercase tracking-wider mb-3">{t('destinationsLabel')}</p>
            <div className="flex flex-wrap gap-1.5">
              {pkg.highlights?.slice(0, 4).map((h, j) => (
                <span key={j} className={`text-xs px-3 py-1 rounded-full font-medium ${
                  isHoneymoon ? 'bg-pink-50 text-pink-700' : 'bg-ocean-50 text-ocean-700'
                }`}>{translateText(h)}</span>
              ))}
              {(pkg.highlights?.length ?? 0) > 4 && (
                <span className="bg-toska-50 text-toska-700 text-xs px-3 py-1 rounded-full font-medium">
                  +{pkg.highlights.length - 4} {locale === 'id' ? 'lainnya' : 'others'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Starting Price & CTA */}
        <div className="flex items-center justify-between gap-4 pt-5 mt-5 border-t border-ocean-100 shrink-0">
          <div className="space-y-0.5">
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${isHoneymoon ? 'text-pink-400' : 'text-toska-400'}`}>
              {t('startingFrom')}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-extrabold font-[family-name:var(--font-display)] ${isHoneymoon ? 'text-pink-600' : 'text-toska-600'}`}>
                {formatPrice(lowestPrice)}
              </span>
              <span className="text-xs font-medium text-ocean-400">
                /{isHoneymoon ? t('couple') : t('pax')}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => onViewDetails(pkg)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg flex items-center gap-2 text-white shrink-0 ${
              isHoneymoon 
                ? 'bg-pink-500 hover:bg-pink-600 hover:shadow-pink-500/25' 
                : 'bg-toska-500 hover:bg-toska-600 hover:shadow-toska-500/25'
            }`}
          >
            {locale === 'id' ? 'Detail & Pesan' : 'Details & Book'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
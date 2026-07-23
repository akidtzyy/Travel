import { motion } from 'framer-motion';
import { MapPin, Star, ChevronDown, Shield, Clock } from 'lucide-react';
import { useI18n } from '../lib/I18nContext';

export default function Hero() {
  const { t, locale } = useI18n();

  return (
    <section id="beranda" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with subtle zoom effect */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bali.jpg"
          alt="Bali Paradise"
          className="w-full h-full object-cover scale-105 animate-hero-zoom"
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-900/70 via-ocean-900/30 to-ocean-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-900/40 via-transparent to-transparent" />
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-toska-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-ocean-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-20 w-full">

        {/* Location Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full mb-8 shadow-lg">
            <MapPin className="w-4 h-4 text-toska-300" />
            <span className="text-white/90 text-sm font-medium tracking-wide">{t('baliParadise')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white font-[family-name:var(--font-display)] leading-[1.05] mb-6"
        >
          {t('exploreBali')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-toska-300 via-toska-400 to-toska-500">
            {t('pulauBali')}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t('heroSubtitle')}
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full text-white/80 text-xs font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            {locale === 'id' ? 'Terpercaya & Berlisensi' : 'Trusted & Licensed'}
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full text-white/80 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-toska-300" />
            {locale === 'id' ? 'Respon Cepat 24 Jam' : '24-Hour Fast Response'}
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full text-white/80 text-xs font-medium">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            4.9 / 5 Rating
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#paket"
            className="group relative overflow-hidden bg-toska-500 hover:bg-toska-600 text-white px-9 py-4 rounded-full text-base font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-toska-500/40 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="relative z-10">{t('viewTourPackages')}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-toska-400 to-toska-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <a
            href="/sewa-mobil"
            className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-9 py-4 rounded-full text-base font-semibold transition-all duration-300 border border-white/25 hover:border-white/40 hover:-translate-y-0.5"
          >
            {t('carRental')}
          </a>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex items-center justify-center gap-0 mt-20"
        >
          {[
            { value: '500+', label: t('tripsCompleted') },
            { value: '4.9 ★', label: t('rating') },
            { value: '1000+', label: t('happyTravelers') },
          ].map((stat, i) => (
            <div key={i} className="flex items-center">
              <div className="text-center px-8 sm:px-12">
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-white/55 text-xs sm:text-sm mt-1">{stat.label}</div>
              </div>
              {i < 2 && <div className="w-px h-10 bg-white/20 shrink-0" />}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
      >
        <span className="text-white/40 text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-6 h-6 text-white/50" />
      </motion.div>
    </section>
  );
}

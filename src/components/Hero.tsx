import { motion } from 'framer-motion';
import { MapPin, Star, ChevronDown } from 'lucide-react';

export default function Hero() {
  return (
    <section id="beranda" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/hero-bali.jpg"
          alt="Bali Paradise"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-900/60 via-ocean-900/40 to-ocean-900/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2 rounded-full mb-6">
            <MapPin className="w-4 h-4 text-toska-300" />
            <span className="text-white/90 text-sm font-medium">Pulau Dewata, Indonesia</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white font-[family-name:var(--font-display)] leading-tight mb-6"
        >
          Jelajahi Keindahan
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-toska-300 to-toska-500">
            Pulau Bali
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8"
        >
          Temukan pengalaman liburan tak terlupakan dengan paket wisata premium, 
          sewa mobil terpercaya, dan layanan terbaik untuk perjalanan impian Anda di Bali.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#paket"
            className="bg-toska-500 hover:bg-toska-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-toska-500/30 hover:-translate-y-0.5"
          >
            Lihat Paket Wisata
          </a>
          <a
            href="/sewa-mobil"
            className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-8 py-4 rounded-full text-lg font-semibold transition-all border border-white/20"
          >
            Sewa Mobil
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex items-center justify-center gap-8 mt-12"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-white/60 text-sm">Trip Selesai</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="flex items-center gap-1 text-3xl font-bold text-white">
              4.9 <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="text-white/60 text-sm">Rating</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">1000+</div>
            <div className="text-white/60 text-sm">Happy Traveler</div>
          </div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <ChevronDown className="w-8 h-8 text-white/60" />
      </motion.div>
    </section>
  );
}

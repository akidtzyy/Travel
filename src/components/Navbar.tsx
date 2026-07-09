import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Palmtree } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { href: '/#beranda', label: 'Beranda' },
    { href: '/#paket', label: 'Paket Wisata' },
    { href: '/sewa-mobil', label: 'Sewa Mobil' },
    { href: '/#destinasi', label: 'Destinasi' },
    { href: '/#testimoni', label: 'Testimoni' },
    { href: '/#faq', label: 'FAQ' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2">
            <Palmtree className={`w-8 h-8 ${scrolled ? 'text-toska-500' : 'text-white'}`} />
            <span className={`text-xl font-bold font-[family-name:var(--font-display)] ${scrolled ? 'text-ocean-900' : 'text-white'}`}>
              ClickAndGo Journey
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              link.href.startsWith('/') && link.href.includes('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-toska-400 ${
                    scrolled ? 'text-ocean-800' : 'text-white/90'
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-toska-400 ${
                    scrolled ? 'text-ocean-800' : 'text-white/90'
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
            <a
              href="/#booking"
              className="bg-toska-500 hover:bg-toska-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-toska-500/25"
            >
              Booking Sekarang
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-ocean-900' : 'text-white'}`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-md border-t border-ocean-100"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(link => (
                link.href.includes('#') && !link.href.startsWith('/sewa') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block px-4 py-3 text-ocean-800 hover:bg-ocean-50 rounded-lg font-medium"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="block px-4 py-3 text-ocean-800 hover:bg-ocean-50 rounded-lg font-medium"
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <a
                href="/#booking"
                className="block text-center bg-toska-500 text-white px-6 py-3 rounded-full font-semibold mt-4"
              >
                Booking Sekarang
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

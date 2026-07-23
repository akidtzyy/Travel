import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Lock, ArrowLeft } from 'lucide-react';
import { useI18n } from '../lib/I18nContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Legal() {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive activeTab directly from searchParams (no useState or useEffect needed)
  const activeTab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'terms';

  const handleTabChange = (tab: 'terms' | 'privacy') => {
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center text-sm font-semibold text-toska-600 hover:text-toska-700 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {locale === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
          </Link>

          {/* Header Title */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ocean-900 font-[family-name:var(--font-display)] tracking-tight mb-4">
              {locale === 'id' ? 'Legalitas & Aturan' : 'Legal & Rules'}
            </h1>
            <p className="text-ocean-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {locale === 'id'
                ? 'Informasi penting mengenai aturan penggunaan layanan kami dan bagaimana kami melindungi data pribadi Anda.'
                : 'Important information regarding the rules of using our services and how we protect your personal data.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-ocean-100/60 backdrop-blur-md rounded-2xl max-w-md mx-auto mb-10 border border-ocean-200">
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 ${
                activeTab === 'terms'
                  ? 'bg-white text-toska-600 shadow-sm'
                  : 'text-ocean-500 hover:text-ocean-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              {t('termsTitle')}
            </button>
            <button
              onClick={() => handleTabChange('privacy')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 ${
                activeTab === 'privacy'
                  ? 'bg-white text-toska-600 shadow-sm'
                  : 'text-ocean-500 hover:text-ocean-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              {t('privacyTitle')}
            </button>
          </div>

          {/* Content Card with Framer Motion */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-ocean-100/85 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'terms' ? (
                <motion.div
                  key="terms"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  <div className="border-b border-ocean-100 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-ocean-900 font-[family-name:var(--font-display)]">
                      {t('termsTitle')}
                    </h2>
                    <p className="text-sm text-ocean-500 mt-2">{t('termsSubtitle')}</p>
                  </div>

                  {/* Section A: Pembayaran */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-toska-500" />
                      {t('termsPaymentTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-toska-400">
                      <li>{t('termsPayment1')}</li>
                      <li>{t('termsPayment2')}</li>
                    </ul>
                  </div>

                  {/* Section B: Pembatalan */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-toska-500" />
                      {t('termsCancelTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-toska-400">
                      <li>{t('termsCancel1')}</li>
                      <li>{t('termsCancel2')}</li>
                      <li>{t('termsCancel3')}</li>
                    </ul>
                  </div>

                  {/* Section C: Persyaratan Sewa */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-toska-500" />
                      {t('termsRentalTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-toska-400">
                      <li>{t('termsRental1')}</li>
                      <li>{t('termsRental2')}</li>
                      <li>{t('termsRental3')}</li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  <div className="border-b border-ocean-100 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-ocean-900 font-[family-name:var(--font-display)]">
                      {t('privacyTitle')}
                    </h2>
                    <p className="text-sm text-ocean-500 mt-2">{t('privacySubtitle')}</p>
                  </div>

                  {/* Section A: Pengumpulan Data */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-toska-500" />
                      {t('privacyCollectTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-toska-400">
                      <li>{t('privacyCollect1')}</li>
                    </ul>
                  </div>

                  {/* Section B: Penggunaan Data */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-toska-500" />
                      {t('privacyUsageTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-toska-400">
                      <li>{t('privacyUsage1')}</li>
                    </ul>
                  </div>

                  {/* Section C: Keamanan Data */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-toska-500" />
                      {t('privacySecurityTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-toska-400">
                      <li>{t('privacySecurity1')}</li>
                    </ul>
                  </div>

                  {/* Section D: Pihak Ketiga */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-toska-500" />
                      {t('privacyShareTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-toska-400">
                      <li>{t('privacyShare1')}</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

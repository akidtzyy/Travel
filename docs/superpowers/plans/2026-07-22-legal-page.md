# Legal Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated terms and privacy page (`/ketentuan-privasi`) with dynamic tabs, deep-linking, i18n support, and remove the corresponding sections from the home page.

**Architecture:** Create a React component `src/pages/Legal.tsx` using `react-router-dom`'s `useSearchParams` for deep-linking, render `Navbar` and `Footer` in it, and update the routing structure in `src/App.tsx`. Link the Navbar and Footer to the new `/ketentuan-privasi?tab=terms` and `/ketentuan-privasi?tab=privacy` paths.

**Tech Stack:** React, Tailwind CSS, Framer Motion, Lucide React, React Router Dom

## Global Constraints
- Do not use Tailwind CSS utility classes that require arbitrary packages unless standard in the project.
- Follow existing i18n implementation using the custom `useI18n` context hook in the codebase.
- Maintain smooth Lenis scrolling compatibility where needed.
- Ensure TypeScript types are strictly adhered to.

---

### Task 1: Create the Legal page component

**Files:**
- Create: `src/pages/Legal.tsx`

**Interfaces:**
- Consumes: `Navbar` from `src/components/Navbar`, `Footer` from `src/components/Footer`, `useI18n` from `src/lib/I18nContext`, Lucide icons (`FileText`, `Lock`, `ArrowLeft`), `Link`, `useSearchParams` from `react-router-dom`, and `motion` from `framer-motion`.
- Produces: `Legal` component page.

- [ ] **Step 1: Write the component code in `src/pages/Legal.tsx`**

Create `src/pages/Legal.tsx` with a modern tabbed layout:
```tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Lock, ArrowLeft } from 'lucide-react';
import { useI18n } from '../lib/I18nContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Legal() {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  // Sync tab state with query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'terms' || tabParam === 'privacy') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'terms' | 'privacy') => {
    setActiveTab(tab);
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

          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-ocean-900 font-[family-name:var(--font-display)] mb-4">
              {locale === 'id' ? 'Legalitas & Aturan' : 'Legal & Rules'}
            </h1>
            <p className="text-ocean-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              {locale === 'id'
                ? 'Informasi penting mengenai aturan penggunaan layanan kami dan bagaimana kami melindungi data pribadi Anda.'
                : 'Important information regarding the rules of using our services and how we protect your personal data.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-ocean-100/60 backdrop-blur-md rounded-2xl max-w-md mx-auto mb-12 border border-ocean-200">
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
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
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'privacy'
                  ? 'bg-white text-ocean-700 shadow-sm'
                  : 'text-ocean-500 hover:text-ocean-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              {t('privacyTitle')}
            </button>
          </div>

          {/* Content Card with Framer Motion */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-ocean-100/80 min-h-[400px]">
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
                      <span className="w-2 h-2 rounded-full bg-ocean-500" />
                      {t('privacyCollectTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-ocean-400">
                      <li>{t('privacyCollect1')}</li>
                    </ul>
                  </div>

                  {/* Section B: Penggunaan Data */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-ocean-500" />
                      {t('privacyUsageTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-ocean-400">
                      <li>{t('privacyUsage1')}</li>
                    </ul>
                  </div>

                  {/* Section C: Keamanan Data */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-ocean-500" />
                      {t('privacySecurityTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-ocean-400">
                      <li>{t('privacySecurity1')}</li>
                    </ul>
                  </div>

                  {/* Section D: Pihak Ketiga */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-ocean-900 flex items-center gap-2 text-lg">
                      <span className="w-2 h-2 rounded-full bg-ocean-500" />
                      {t('privacyShareTitle')}
                    </h3>
                    <ul className="space-y-3 pl-4 text-sm sm:text-base text-ocean-600 leading-relaxed list-disc marker:text-ocean-400">
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
```

---

### Task 2: Configure Route in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Legal` component from `./pages/Legal`
- Produces: Updated application routes.

- [ ] **Step 1: Update routes in `src/App.tsx`**
Import the new `Legal` page and register `/ketentuan-privasi` path:
```diff
 import Home from './pages/Home';
 import CarRental from './pages/CarRental';
 import UserAuth from './pages/UserAuth';
+import Legal from './pages/Legal';
 import AdminLogin from './pages/admin/AdminLogin';
 import AdminDashboard from './pages/admin/AdminDashboard';
```
And add Route under public routes:
```diff
             {/* Public Routes */}
             <Route path="/" element={<><Navbar /><Home /></>} />
             <Route path="/sewa-mobil" element={<><Navbar /><CarRental /></>} />
+            <Route path="/ketentuan-privasi" element={<Legal />} />
```

---

### Task 3: Update Navbar and Footer Links

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Modify `src/components/Navbar.tsx`**
Update links pointing to `/#syarat-ketentuan` and `/#kebijakan-privasi` to `/ketentuan-privasi?tab=terms` and `/ketentuan-privasi?tab=privacy`.
In `src/components/Navbar.tsx` (around lines 129-138):
```diff
                 <a
-                  href="/#syarat-ketentuan"
+                  href="/ketentuan-privasi?tab=terms"
                   className="block px-5 py-2.5 text-sm text-ocean-800 hover:bg-toska-50 hover:text-toska-600 transition-colors font-medium"
                 >
                   {t('termsTitle')}
                 </a>
                 <a
-                  href="/#kebijakan-privasi"
+                  href="/ketentuan-privasi?tab=privacy"
                   className="block px-5 py-2.5 text-sm text-ocean-800 hover:bg-toska-50 hover:text-toska-600 transition-colors font-medium"
                 >
                   {t('privacyTitle')}
                 </a>
```
In mobile menu section (around lines 305-318):
```diff
                     <a
-                      href="/#syarat-ketentuan"
+                      href="/ketentuan-privasi?tab=terms"
                       onClick={() => setIsOpen(false)}
                       className="block px-4 py-2.5 text-sm text-ocean-700 hover:bg-ocean-50 rounded-lg font-medium"
                     >
                       {t('termsTitle')}
                     </a>
                     <a
-                      href="/#kebijakan-privasi"
+                      href="/ketentuan-privasi?tab=privacy"
                       onClick={() => setIsOpen(false)}
                       className="block px-4 py-2.5 text-sm text-ocean-700 hover:bg-ocean-50 rounded-lg font-medium"
                     >
                       {t('privacyTitle')}
                     </a>
```

- [ ] **Step 2: Modify `src/components/Footer.tsx`**
Update links in `src/components/Footer.tsx` (around lines 72-73):
```diff
-              <li><a href="/#syarat-ketentuan" className="hover:text-toska-400 transition-colors">{t('termsTitle')}</a></li>
-              <li><a href="/#kebijakan-privasi" className="hover:text-toska-400 transition-colors">{t('privacyTitle')}</a></li>
+              <li><Link to="/ketentuan-privasi?tab=terms" className="hover:text-toska-400 transition-colors">{t('termsTitle')}</Link></li>
+              <li><Link to="/ketentuan-privasi?tab=privacy" className="hover:text-toska-400 transition-colors">{t('privacyTitle')}</Link></li>
```

---

### Task 4: Remove legal section from Home.tsx

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Delete Syarat & Kebijakan section from `src/pages/Home.tsx`**
Remove lines 1040 to 1200 of `src/pages/Home.tsx` containing the `<section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fefcf3 0%, #f0fdfa 50%, #f0f9ff 100%)' }}>` container, including all the inner motion elements and details.

---

### Task 5: Compilation and Lint verification

- [ ] **Step 1: Check typescript compilation**
Command: `npm run build`
Expected: Success with no errors.

- [ ] **Step 2: Run linter**
Command: `npm run lint`
Expected: Passes clean.

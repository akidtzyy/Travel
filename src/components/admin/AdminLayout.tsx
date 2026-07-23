import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, LogOut, Menu, X,
  Palmtree, ChevronRight, Globe, CalendarCheck, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/I18nContext';
import type { Locale } from '../../lib/i18n';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/admin/bookings', icon: CalendarCheck, label: t('bookingManagement') },
    { path: '/admin/stock', icon: Package, label: t('stockManagement') },
    { path: '/admin/customers', icon: Users, label: t('customerDatabase') },
    { path: '/admin/users', icon: ShieldCheck, label: 'User Management' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white fixed inset-y-0 left-0 z-30 print:hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-toska-400 to-toska-600 rounded-xl flex items-center justify-center shadow-lg shadow-toska-500/20">
            <Palmtree className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-[family-name:var(--font-display)] leading-tight">
              ClickAndGo Journey
            </h1>
            <span className="text-[10px] text-toska-400 font-medium uppercase tracking-wider">
              {t('adminPanel')}
            </span>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${isActive(item.path)
                  ? 'bg-toska-500/15 text-toska-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-toska-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
              {isActive(item.path) && (
                <ChevronRight className="w-4 h-4 ml-auto text-toska-400" />
              )}
            </Link>
          ))}
        </nav>

        {/* Language Switcher */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 font-medium">{t('language')}</span>
          </div>
          <div className="flex gap-2 px-2">
            <button
              onClick={() => setLocale('id' as Locale)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${locale === 'id'
                  ? 'bg-toska-500/15 text-toska-400'
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
                }`}
            >
              🇮🇩 {t('indonesian')}
            </button>
            <button
              onClick={() => setLocale('en' as Locale)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${locale === 'en'
                  ? 'bg-toska-500/15 text-toska-400'
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
                }`}
            >
              🇬🇧 {t('english')}
            </button>
          </div>
        </div>

        {/* User Info + Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'clickandgojourney@gmail.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 lg:hidden flex flex-col"
            >
              {/* Close Button */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-toska-400 to-toska-600 rounded-xl flex items-center justify-center">
                    <Palmtree className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold font-[family-name:var(--font-display)]">ClickAndGo Journey</h1>
                    <span className="text-[10px] text-toska-400 font-medium uppercase tracking-wider">{t('adminPanel')}</span>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(item.path)
                        ? 'bg-toska-500/15 text-toska-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Language Switcher */}
              <div className="px-4 py-3 border-t border-white/10">
                <div className="flex gap-2 px-2">
                  <button
                    onClick={() => setLocale('id' as Locale)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${locale === 'id' ? 'bg-toska-500/15 text-toska-400' : 'text-slate-500 hover:bg-white/5'
                      }`}
                  >
                    🇮🇩 ID
                  </button>
                  <button
                    onClick={() => setLocale('en' as Locale)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${locale === 'en' ? 'bg-toska-500/15 text-toska-400' : 'text-slate-500 hover:bg-white/5'
                      }`}
                  >
                    🇬🇧 EN
                  </button>
                </div>
              </div>

              {/* Mobile Logout */}
              <div className="px-4 py-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen min-w-0 print:ml-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200 print:hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-xs text-slate-500 hover:text-toska-500 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                {t('backToHome')}
              </Link>
              <div className="w-9 h-9 bg-gradient-to-br from-toska-400 to-toska-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

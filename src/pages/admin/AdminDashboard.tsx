import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Car, Users, CalendarCheck, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useI18n } from '../../lib/I18nContext';
import supabase from '../../lib/supabase';

interface DashboardStats {
  totalPackages: number;
  totalCars: number;
  totalCustomers: number;
  totalBookings: number;
}

interface RecentCustomer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  booking_status: string;
  date: string;
  end_date?: string | null;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalPackages: 0, totalCars: 0, totalCustomers: 0, totalBookings: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [pkgRes, carRes, custRes, bookRes] = await Promise.all([
        supabase.from('tour_packages').select('id', { count: 'exact' }),
        supabase.from('car_rentals').select('id', { count: 'exact' }),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalBookingsRes = await supabase.from('bookings').select('id', { count: 'exact' });

      setStats({
        totalPackages: pkgRes.count || 0,
        totalCars: carRes.count || 0,
        totalCustomers: custRes.count || 0,
        totalBookings: totalBookingsRes.count || 0,
      });

      if (bookRes.data) {
        setRecentCustomers(bookRes.data.map((b: any) => ({
          id: b.id,
          full_name: b.name,
          email: b.email,
          phone: b.phone,
          booking_status: b.status,
          date: b.date,
          end_date: b.end_date
        })));
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { key: 'totalPackages', value: stats.totalPackages, icon: Package, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
    { key: 'totalCars', value: stats.totalCars, icon: Car, color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50', text: 'text-sky-600' },
    { key: 'totalCustomers', value: stats.totalCustomers, icon: Users, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { key: 'totalBookings', value: stats.totalBookings, icon: CalendarCheck, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-600' },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      interested: 'bg-blue-50 text-blue-600 border-blue-200',
      booked: 'bg-amber-50 text-amber-600 border-amber-200',
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
      paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      cancelled: 'bg-red-50 text-red-600 border-red-200',
    };
    return badges[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      interested: t('interested'),
      booked: t('booked'),
      pending: t('pending'),
      confirmed: t('confirmed'),
      paid: t('paid'),
      completed: t('completed'),
      cancelled: t('cancelled'),
    };
    return labels[status] || status;
  };

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]"
        >
          {t('welcomeAdmin')} 👋
        </motion.h1>
        <p className="text-slate-500 text-sm mt-1">{t('dashboardSubtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-6 h-6 ${card.text}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
              {card.value}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {t(card.key as any)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Recent Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
                {t('recentBookings')}
              </h2>
              <p className="text-xs text-slate-500">5 {t('customerDatabase').toLowerCase()}</p>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>

        {recentCustomers.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-sm">{t('noBookings')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('fullName')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('emailAddress')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('phoneNumber')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('status')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-toska-400 to-toska-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {cust.full_name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{cust.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cust.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cust.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(cust.booking_status)}`}>
                        {getStatusLabel(cust.booking_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {cust.end_date ? `${cust.date} s/d ${cust.end_date}` : cust.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

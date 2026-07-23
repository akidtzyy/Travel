import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldOff, User, Search, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Crown, UserCircle,
  ChevronLeft, ChevronRight, Mail, Calendar
} from 'lucide-react';
import supabase from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/I18nContext';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

type RoleChanging = { [userId: string]: boolean };

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { locale } = useI18n();
  const isId = locale === 'id';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [roleChanging, setRoleChanging] = useState<RoleChanging>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    userId: string;
    userName: string;
    currentRole: 'user' | 'admin';
    newRole: 'user' | 'admin';
  } | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data as UserProfile[]);
    } catch (err: any) {
      showToast('error', isId ? 'Gagal memuat daftar user' : 'Failed to load users');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginated = filteredUsers.slice((page - 1) * perPage, page * perPage);

  const handleRoleChangeRequest = (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      showToast('error', isId
        ? 'Kamu tidak dapat mengubah role akun kamu sendiri'
        : 'You cannot change your own account role');
      return;
    }
    const newRole: 'user' | 'admin' = user.role === 'admin' ? 'user' : 'admin';
    setConfirmModal({ userId: user.id, userName: user.full_name || user.email, currentRole: user.role, newRole });
  };

  const handleConfirmRoleChange = async () => {
    if (!confirmModal || !currentUser) return;
    const { userId, newRole } = confirmModal;
    setConfirmModal(null);

    setRoleChanging(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await fetch('/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: userId,
          new_role: newRole,
          requester_id: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unknown error');
      }

      // Optimistic update
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

      showToast('success', isId
        ? `Role berhasil diubah menjadi '${newRole === 'admin' ? 'Admin' : 'User'}'`
        : `Role successfully changed to '${newRole === 'admin' ? 'Admin' : 'User'}'`);

    } catch (err: any) {
      console.error('Role update error:', err);
      showToast('error', err.message || (isId ? 'Gagal mengubah role' : 'Failed to change role'));
    } finally {
      setRoleChanging(prev => ({ ...prev, [userId]: false }));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle className="w-5 h-5 shrink-0" />
              : <XCircle className="w-5 h-5 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                confirmModal.newRole === 'admin'
                  ? 'bg-toska-100'
                  : 'bg-orange-100'
              }`}>
                {confirmModal.newRole === 'admin'
                  ? <Crown className="w-7 h-7 text-toska-600" />
                  : <ShieldOff className="w-7 h-7 text-orange-500" />
                }
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                {isId ? 'Konfirmasi Ubah Role' : 'Confirm Role Change'}
              </h3>
              <p className="text-sm text-slate-500 text-center mb-1">
                <span className="font-semibold text-slate-700">{confirmModal.userName}</span>
              </p>
              <div className="flex items-center justify-center gap-3 mb-5 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  confirmModal.currentRole === 'admin'
                    ? 'bg-toska-100 text-toska-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {confirmModal.currentRole === 'admin' ? 'Admin' : 'User'}
                </span>
                <span className="text-slate-400 text-xs">→</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  confirmModal.newRole === 'admin'
                    ? 'bg-toska-100 text-toska-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {confirmModal.newRole === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              {confirmModal.newRole === 'user' && (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs text-orange-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{isId
                    ? 'User akan kehilangan akses ke Admin Panel setelah perubahan ini.'
                    : 'This user will lose access to the Admin Panel after this change.'}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmRoleChange}
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${
                    confirmModal.newRole === 'admin'
                      ? 'bg-toska-500 hover:bg-toska-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {isId ? 'Ya, Ubah Role' : 'Yes, Change Role'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isId ? 'Manajemen User' : 'User Management'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isId
              ? 'Kelola role dan akses pengguna terdaftar'
              : 'Manage roles and access for registered users'}
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {isId ? 'Refresh' : 'Refresh'}
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isId ? 'Total User' : 'Total Users', value: users.length, icon: User, color: 'text-slate-600 bg-slate-100' },
          { label: 'Admin', value: users.filter(u => u.role === 'admin').length, icon: Crown, color: 'text-toska-600 bg-toska-100' },
          { label: 'User', value: users.filter(u => u.role === 'user').length, icon: UserCircle, color: 'text-ocean-600 bg-ocean-100' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={isId ? 'Cari nama atau email...' : 'Search name or email...'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-toska-500 focus:border-toska-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'admin', 'user'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setRoleFilter(f); setPage(1); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                roleFilter === f
                  ? 'bg-toska-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? (isId ? 'Semua' : 'All') : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-toska-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isId ? 'Tidak ada user ditemukan' : 'No users found'}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{isId ? 'Pengguna' : 'User'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{isId ? 'Terdaftar' : 'Joined'}</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{isId ? 'Ubah Role' : 'Change Role'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map(u => {
                    const isSelf = u.id === currentUser?.id;
                    const isChanging = !!roleChanging[u.id];
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                              u.role === 'admin'
                                ? 'bg-toska-100 text-toska-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {(u.full_name || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {u.full_name || '—'}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] bg-ocean-100 text-ocean-600 px-1.5 py-0.5 rounded-full font-medium">
                                    {isId ? 'Kamu' : 'You'}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-toska-100 text-toska-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role === 'admin'
                              ? <><Crown className="w-3 h-3" /> Admin</>
                              : <><UserCircle className="w-3 h-3" /> User</>
                            }
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(u.created_at)}</td>
                        <td className="px-5 py-4 text-center">
                          {isSelf ? (
                            <span className="text-xs text-slate-400 italic">—</span>
                          ) : (
                            <button
                              id={`btn-role-${u.id}`}
                              onClick={() => handleRoleChangeRequest(u)}
                              disabled={isChanging}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
                                u.role === 'admin'
                                  ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                                  : 'bg-toska-100 hover:bg-toska-200 text-toska-700'
                              }`}
                            >
                              {isChanging ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : u.role === 'admin' ? (
                                <><ShieldOff className="w-3.5 h-3.5" /> {isId ? 'Jadikan User' : 'Demote to User'}</>
                              ) : (
                                <><ShieldCheck className="w-3.5 h-3.5" /> {isId ? 'Jadikan Admin' : 'Promote to Admin'}</>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginated.map(u => {
                const isSelf = u.id === currentUser?.id;
                const isChanging = !!roleChanging[u.id];
                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          u.role === 'admin' ? 'bg-toska-100 text-toska-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {u.full_name || '—'}
                            {isSelf && <span className="ml-1.5 text-[10px] bg-ocean-100 text-ocean-600 px-1.5 py-0.5 rounded-full">{isId ? 'Kamu' : 'You'}</span>}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-toska-100 text-toska-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role === 'admin' ? <><Crown className="w-3 h-3" />Admin</> : <><UserCircle className="w-3 h-3" />User</>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(u.created_at)}</span>
                      {!isSelf && (
                        <button
                          onClick={() => handleRoleChangeRequest(u)}
                          disabled={isChanging}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
                            u.role === 'admin'
                              ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                              : 'bg-toska-100 hover:bg-toska-200 text-toska-700'
                          }`}
                        >
                          {isChanging
                            ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : u.role === 'admin'
                              ? <><ShieldOff className="w-3.5 h-3.5" />{isId ? 'Jadikan User' : 'Demote'}</>
                              : <><ShieldCheck className="w-3.5 h-3.5" />{isId ? 'Jadikan Admin' : 'Promote'}</>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {isId
              ? `${filteredUsers.length} user · Halaman ${page} dari ${totalPages}`
              : `${filteredUsers.length} users · Page ${page} of ${totalPages}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

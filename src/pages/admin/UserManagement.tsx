import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldOff, User, Search, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Crown, UserCircle,
  ChevronLeft, ChevronRight, Mail, Calendar, Lock
} from 'lucide-react';
import supabase from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/I18nContext';
import type { UserRole } from '../../lib/AuthContext';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

type RoleChanging = { [userId: string]: boolean };

// Role badge config
const roleBadge: Record<UserRole, { label: string; className: string; icon: React.FC<{ className?: string }> }> = {
  super_admin: {
    label: 'Super Admin',
    className: 'bg-violet-100 text-violet-700',
    icon: ({ className }) => <Crown className={className} />,
  },
  admin: {
    label: 'Admin',
    className: 'bg-toska-100 text-toska-700',
    icon: ({ className }) => <ShieldCheck className={className} />,
  },
  user: {
    label: 'User',
    className: 'bg-slate-100 text-slate-600',
    icon: ({ className }) => <UserCircle className={className} />,
  },
};

export default function UserManagement() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { locale } = useI18n();
  const isId = locale === 'id';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [roleChanging, setRoleChanging] = useState<RoleChanging>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    userId: string;
    userName: string;
    currentRole: UserRole;
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
        .order('role', { ascending: true })   // super_admin first alphabetically? We'll sort manually
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Sort: super_admin → admin → user
      const roleOrder: Record<UserRole, number> = { super_admin: 0, admin: 1, user: 2 };
      const sorted = (data as UserProfile[]).sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
      setUsers(sorted);
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

  const canChangeRole = (target: UserProfile): { allowed: boolean; reason?: string } => {
    // Only super_admin can change roles
    if (!isSuperAdmin) {
      return { allowed: false, reason: isId ? 'Hanya Super Admin yang bisa mengubah role' : 'Only Super Admin can change roles' };
    }
    // Cannot change own role
    if (target.id === currentUser?.id) {
      return { allowed: false, reason: isId ? 'Tidak bisa mengubah role sendiri' : 'Cannot change your own role' };
    }
    // Cannot modify other super_admin accounts
    if (target.role === 'super_admin') {
      return { allowed: false, reason: isId ? 'Akun Super Admin tidak bisa diubah' : 'Super Admin accounts cannot be modified' };
    }
    return { allowed: true };
  };

  const handleRoleChangeRequest = (user: UserProfile) => {
    const { allowed, reason } = canChangeRole(user);
    if (!allowed) {
      showToast('error', reason!);
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
      if (!res.ok) throw new Error(data.error || 'Unknown error');

      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  // If not super_admin, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Lock className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">
          {isId ? 'Akses Ditolak' : 'Access Denied'}
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          {isId
            ? 'Halaman ini hanya bisa diakses oleh Super Admin.'
            : 'This page is only accessible by Super Admin.'}
        </p>
      </div>
    );
  }

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
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
            onClick={e => { if (e.target === e.currentTarget) setConfirmModal(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                confirmModal.newRole === 'admin' ? 'bg-toska-100' : 'bg-orange-100'
              }`}>
                {confirmModal.newRole === 'admin'
                  ? <ShieldCheck className="w-7 h-7 text-toska-600" />
                  : <ShieldOff className="w-7 h-7 text-orange-500" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                {isId ? 'Konfirmasi Ubah Role' : 'Confirm Role Change'}
              </h3>
              <p className="text-sm text-slate-500 text-center mb-1">
                <span className="font-semibold text-slate-700">{confirmModal.userName}</span>
              </p>
              <div className="flex items-center justify-center gap-3 mb-5 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge[confirmModal.currentRole].className}`}>
                  {roleBadge[confirmModal.currentRole].label}
                </span>
                <span className="text-slate-400 text-xs">→</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge[confirmModal.newRole].className}`}>
                  {roleBadge[confirmModal.newRole].label}
                </span>
              </div>
              {confirmModal.newRole === 'user' && (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs text-orange-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{isId
                    ? 'User akan kehilangan akses ke Admin Panel.'
                    : 'This user will lose access to the Admin Panel.'}</span>
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {isId ? 'Manajemen User' : 'User Management'}
            </h1>
            <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" /> Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {isId
              ? 'Kelola role pengguna — hanya bisa diakses oleh Super Admin'
              : 'Manage user roles — accessible by Super Admin only'}
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: isId ? 'Total' : 'Total', value: users.length, icon: User, color: 'text-slate-600 bg-slate-100' },
          { label: 'Super Admin', value: users.filter(u => u.role === 'super_admin').length, icon: Crown, color: 'text-violet-600 bg-violet-100' },
          { label: 'Admin', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: 'text-toska-600 bg-toska-100' },
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'super_admin', 'admin', 'user'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setRoleFilter(f); setPage(1); }}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                roleFilter === f
                  ? f === 'super_admin' ? 'bg-violet-500 text-white'
                  : f === 'admin' ? 'bg-toska-500 text-white'
                  : f === 'user' ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? (isId ? 'Semua' : 'All')
               : f === 'super_admin' ? 'Super Admin'
               : f === 'admin' ? 'Admin'
               : 'User'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isId ? 'Tidak ada user ditemukan' : 'No users found'}</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
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
                    const { allowed } = canChangeRole(u);
                    const badge = roleBadge[u.role];

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.role === 'super_admin' ? 'bg-violet-50/40' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${badge.className}`}>
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            <badge.icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(u.created_at)}</td>
                        <td className="px-5 py-4 text-center">
                          {!allowed ? (
                            <span className="text-xs text-slate-300 italic flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" />
                              {u.role === 'super_admin' ? '—' : isSelf ? (isId ? 'Akun kamu' : 'Your account') : '—'}
                            </span>
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
                                <><ShieldOff className="w-3.5 h-3.5" />{isId ? 'Jadikan User' : 'Demote to User'}</>
                              ) : (
                                <><ShieldCheck className="w-3.5 h-3.5" />{isId ? 'Jadikan Admin' : 'Promote to Admin'}</>
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
                const { allowed } = canChangeRole(u);
                const badge = roleBadge[u.role];
                return (
                  <div key={u.id} className={`p-4 space-y-3 ${u.role === 'super_admin' ? 'bg-violet-50/40' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${badge.className}`}>
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                        <badge.icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(u.created_at)}</span>
                      {allowed && (
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
                              ? <><ShieldOff className="w-3.5 h-3.5" />{isId ? 'Demote' : 'Demote'}</>
                              : <><ShieldCheck className="w-3.5 h-3.5" />{isId ? 'Promote' : 'Promote'}</>}
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

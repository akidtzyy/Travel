import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, User, AlertCircle, CheckCircle, Palmtree, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/I18nContext';

type AuthMode = 'login' | 'signup';

export default function UserAuth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(t('loginFailed'));
      } else {
        // Check if user is admin after login
        // small delay to allow auth state to update
        setTimeout(() => {
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 300);
        navigate('/');
      }
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('confirmPasswordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('emailAlreadyRegistered'));
        } else {
          setError(error.message || t('genericError'));
        }
      } else {
        setSuccess(t('signUpSuccess'));
        setTimeout(() => {
          switchMode('login');
        }, 3000);
      }
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-toska-50 to-ocean-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-toska-400/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-ocean-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-toska-300/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-ocean-300/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-900 transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl shadow-ocean-500/10">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-toska-400 to-ocean-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-toska-500/30"
            >
              <Palmtree className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-ocean-900 font-[family-name:var(--font-display)]">
              {mode === 'login' ? t('signInToAccount') : t('createNewAccount')}
            </h1>
            <p className="text-ocean-500 text-sm mt-2">
              {mode === 'login'
                ? t('userSignInSubtitle')
                : t('userSignUpSubtitle')}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-ocean-50 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-ocean-900 shadow-md'
                  : 'text-ocean-500 hover:text-ocean-700'
              }`}
            >
              <LogIn className="w-4 h-4" />
              {t('loginNow')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-ocean-900 shadow-md'
                  : 'text-ocean-500 hover:text-ocean-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {t('signUp')}
            </button>
          </div>

          {/* Error Alert */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Alert */}
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 text-sm"
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-ocean-700 mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ocean-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-ocean-50/50 border border-ocean-200 rounded-xl text-ocean-900 placeholder-ocean-400 focus:ring-2 focus:ring-toska-500/50 focus:border-toska-500/50 outline-none transition-all text-sm"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-ocean-700 mb-2">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ocean-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-ocean-50/50 border border-ocean-200 rounded-xl text-ocean-900 placeholder-ocean-400 focus:ring-2 focus:ring-toska-500/50 focus:border-toska-500/50 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ocean-400 hover:text-ocean-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-toska-500 to-ocean-500 hover:from-toska-600 hover:to-ocean-600 disabled:from-toska-300 disabled:to-ocean-300 text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-toska-500/25 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('loggingIn')}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {t('loginNow')}
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignUp}
                className="space-y-5"
              >
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-ocean-700 mb-2">
                    {t('fullName')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ocean-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-ocean-50/50 border border-ocean-200 rounded-xl text-ocean-900 placeholder-ocean-400 focus:ring-2 focus:ring-toska-500/50 focus:border-toska-500/50 outline-none transition-all text-sm"
                      placeholder="Nama lengkap Anda"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-ocean-700 mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ocean-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-ocean-50/50 border border-ocean-200 rounded-xl text-ocean-900 placeholder-ocean-400 focus:ring-2 focus:ring-toska-500/50 focus:border-toska-500/50 outline-none transition-all text-sm"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-ocean-700 mb-2">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ocean-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-ocean-50/50 border border-ocean-200 rounded-xl text-ocean-900 placeholder-ocean-400 focus:ring-2 focus:ring-toska-500/50 focus:border-toska-500/50 outline-none transition-all text-sm"
                      placeholder={t('passwordMinLengthHint')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ocean-400 hover:text-ocean-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-ocean-400 mt-1">{t('passwordMinLengthHint')}</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-ocean-700 mb-2">
                    {t('confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ocean-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-ocean-50/50 border border-ocean-200 rounded-xl text-ocean-900 placeholder-ocean-400 focus:ring-2 focus:ring-toska-500/50 focus:border-toska-500/50 outline-none transition-all text-sm"
                      placeholder="Ulangi kata sandi"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-toska-500 to-ocean-500 hover:from-toska-600 hover:to-ocean-600 disabled:from-toska-300 disabled:to-ocean-300 text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-toska-500/25 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('registering')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {t('registerNow')}
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider & alternative */}
          <div className="mt-6 text-center">
            <p className="text-ocean-500 text-xs">
              {mode === 'login' ? (
                <>
                  {t('noAccountYet')}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-toska-600 font-semibold hover:text-toska-700 transition-colors"
                  >
                    {t('signUpFree')}
                  </button>
                </>
              ) : (
                <>
                  {t('alreadyHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-toska-600 font-semibold hover:text-toska-700 transition-colors"
                  >
                    {t('loginNow')}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-ocean-400 text-xs mt-6">
          {t('copyrightText')}
        </p>
      </motion.div>
    </div>
  );
}

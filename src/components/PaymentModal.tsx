import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, CreditCard, X, Loader2, AlertCircle } from 'lucide-react';

export type PaymentStep = 'confirm' | 'processing' | 'success' | 'pending' | 'failed' | 'closed';

interface PaymentModalProps {
  step: PaymentStep;
  bookingDetails: {
    itemName: string;
    totalPrice: string;
    name: string;
    date: string;
    bookingType: 'package' | 'car' | string;
  };
  onConfirm: () => void;
  onClose: () => void;
  locale?: string;
}

export default function PaymentModal({ step, bookingDetails, onConfirm, onClose, locale = 'id' }: PaymentModalProps) {
  const isId = locale === 'id';

  if (step === 'closed') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="payment-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget && step !== 'processing') onClose(); }}
      >
        <motion.div
          key="payment-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-toska-500 to-ocean-600 px-6 pt-6 pb-8 relative">
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">ClickAndGo Journey</p>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {isId ? 'Konfirmasi Pembayaran' : 'Payment Confirmation'}
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="-mt-4 bg-white rounded-t-3xl px-6 pt-6 pb-6">

            {/* CONFIRM step */}
            {step === 'confirm' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Booking summary */}
                <div className="bg-ocean-50 rounded-2xl p-4 mb-5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-ocean-500 shrink-0">{isId ? 'Paket / Kendaraan' : 'Package / Vehicle'}</span>
                    <span className="text-xs font-semibold text-ocean-900 text-right">{bookingDetails.itemName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ocean-500">{isId ? 'Atas Nama' : 'Guest Name'}</span>
                    <span className="text-xs font-semibold text-ocean-900">{bookingDetails.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ocean-500">{isId ? 'Tanggal' : 'Date'}</span>
                    <span className="text-xs font-semibold text-ocean-900">{bookingDetails.date}</span>
                  </div>
                  <div className="h-px bg-ocean-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ocean-800">{isId ? 'Total Pembayaran' : 'Total Payment'}</span>
                    <span className="text-lg font-bold text-toska-600">{bookingDetails.totalPrice}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {isId
                      ? 'Kamu akan diarahkan ke halaman pembayaran Midtrans yang aman. Tersedia metode pembayaran: QRIS, GoPay, OVO, Transfer Bank, Kartu Kredit, dll.'
                      : 'You will be redirected to secure Midtrans payment. Available methods: QRIS, GoPay, OVO, Bank Transfer, Credit Card, and more.'}
                  </p>
                </div>

                <button
                  id="btn-pay-now"
                  onClick={onConfirm}
                  className="w-full bg-gradient-to-r from-toska-500 to-ocean-500 hover:from-toska-600 hover:to-ocean-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-toska-500/25 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {isId ? 'Bayar Sekarang' : 'Pay Now'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full mt-2.5 text-ocean-500 hover:text-ocean-700 py-2 text-sm font-medium transition-colors"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
              </motion.div>
            )}

            {/* PROCESSING step */}
            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-toska-50 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-toska-500 animate-spin" />
                </div>
                <h4 className="font-bold text-ocean-900 mb-1">{isId ? 'Memproses...' : 'Processing...'}</h4>
                <p className="text-sm text-ocean-500">{isId ? 'Menghubungkan ke gateway pembayaran.' : 'Connecting to payment gateway.'}</p>
              </motion.div>
            )}

            {/* SUCCESS step */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h4 className="font-bold text-ocean-900 text-xl mb-2">
                  {isId ? 'Pembayaran Berhasil! 🎉' : 'Payment Successful! 🎉'}
                </h4>
                <p className="text-sm text-ocean-500 mb-1">{bookingDetails.itemName}</p>
                <p className="text-xs text-ocean-400 mb-5">{isId ? 'Tim kami akan menghubungi Anda dalam 1x24 jam.' : 'Our team will contact you within 24 hours.'}</p>
                <button
                  onClick={onClose}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  {isId ? 'Tutup' : 'Close'}
                </button>
              </motion.div>
            )}

            {/* PENDING step */}
            {step === 'pending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-amber-500" />
                </div>
                <h4 className="font-bold text-ocean-900 text-xl mb-2">
                  {isId ? 'Menunggu Pembayaran' : 'Payment Pending'}
                </h4>
                <p className="text-sm text-ocean-500 mb-1">{isId ? 'Selesaikan pembayaran Anda sesuai instruksi.' : 'Complete your payment according to the instructions.'}</p>
                <p className="text-xs text-ocean-400 mb-5">{isId ? 'Status akan diperbarui secara otomatis.' : 'Status will be updated automatically.'}</p>
                <button
                  onClick={onClose}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  {isId ? 'Mengerti' : 'Understood'}
                </button>
              </motion.div>
            )}

            {/* FAILED step */}
            {step === 'failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h4 className="font-bold text-ocean-900 text-xl mb-2">
                  {isId ? 'Pembayaran Gagal' : 'Payment Failed'}
                </h4>
                <p className="text-sm text-ocean-500 mb-5">{isId ? 'Silakan coba lagi atau gunakan metode pembayaran lain.' : 'Please try again or use another payment method.'}</p>
                <div className="flex gap-3">
                  <button
                    onClick={onConfirm}
                    className="bg-toska-500 hover:bg-toska-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {isId ? 'Coba Lagi' : 'Retry'}
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-ocean-100 hover:bg-ocean-200 text-ocean-700 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {isId ? 'Tutup' : 'Close'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

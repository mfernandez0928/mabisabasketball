import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, Wallet, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadFile } from '../lib/supabase';
import { Event, PaymentMethod } from '../types';

interface ReservationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ event, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    positions: [] as number[],
    paymentMethod: 'cash' as PaymentMethod,
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const togglePosition = (pos: number) => {
    setFormData(prev => {
      if (prev.positions.includes(pos)) {
        return { ...prev, positions: prev.positions.filter(p => p !== pos) };
      }
      if (prev.positions.length < 2) {
        return { ...prev, positions: [...prev.positions, pos] };
      }
      return prev;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.paymentMethod === 'gcash' && !paymentProof) {
      alert('Please upload your GCash payment proof.');
      return;
    }

    setIsSubmitting(true);
    try {
      let paymentProofUrl = '';
      if (paymentProof) {
        const fileName = `${Date.now()}_${paymentProof.name}`;
        paymentProofUrl = await uploadFile('payments', fileName, paymentProof);
      }

      await addDoc(collection(db, 'reservations'), {
        eventId: event.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        positions: formData.positions,
        paymentMethod: formData.paymentMethod,
        paymentProofUrl,
        status: formData.paymentMethod === 'gcash' ? 'pending' : 'pending_cash',
        timestamp: serverTimestamp(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({ firstName: '', lastName: '', age: '', positions: [], paymentMethod: 'cash' });
        setPaymentProof(null);
      }, 5000);
    } catch (error) {
      console.error(error);
      alert('Error submitting reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-card-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-display">Reserve Slot</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {isSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/50">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-2xl font-display text-green-500">Success!</h4>
                  <p className="text-white/80">
                    Your reservation is pending admin confirmation.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">First Name</label>
                      <input 
                        required
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Last Name</label>
                      <input 
                        required
                        type="text"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Age</label>
                    <input 
                      required
                      type="number"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Positions (Max 2)</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(pos => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => togglePosition(pos)}
                          className={cn(
                            "aspect-square rounded-xl border flex flex-col items-center justify-center transition-all",
                            formData.positions.includes(pos)
                              ? "bg-neon-blue border-neon-blue text-black"
                              : "bg-white/5 border-white/10 text-white/60"
                          )}
                        >
                          <span className="text-lg font-display">{pos}</span>
                          <span className="text-[8px] font-bold uppercase">
                            {pos === 1 ? 'PG' : pos === 2 ? 'SG' : pos === 3 ? 'SF' : pos === 4 ? 'PF' : 'C'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                        className={cn(
                          "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                          formData.paymentMethod === 'cash'
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-white/5 border-white/5 text-white/40"
                        )}
                      >
                        <Wallet size={24} />
                        <span className="text-xs font-bold uppercase">Cash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'gcash' })}
                        className={cn(
                          "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                          formData.paymentMethod === 'gcash'
                            ? "bg-[#0055ff]/20 border-[#0055ff]/40 text-[#0055ff]"
                            : "bg-white/5 border-white/5 text-white/40"
                        )}
                      >
                        <CreditCard size={24} />
                        <span className="text-xs font-bold uppercase">GCash</span>
                      </button>
                    </div>
                  </div>

                  {formData.paymentMethod === 'gcash' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-4 border-t border-white/5"
                    >
                      <div className="bg-white p-4 rounded-2xl flex flex-col items-center gap-2">
                        <div className="text-black font-bold text-xs uppercase tracking-widest">Scan to Pay</div>
                        <img 
                          src="https://picsum.photos/seed/gcash-qr/200/200" 
                          alt="GCash QR" 
                          className="w-40 h-40 object-contain"
                        />
                        <div className="text-black/60 text-[10px] font-mono">MABISA BASKETBALL CLUB</div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Upload Screenshot</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center gap-2">
                            <Upload size={20} className="text-white/40" />
                            <span className="text-xs text-white/60">
                              {paymentProof ? paymentProof.name : 'Click to upload proof'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button 
                    disabled={isSubmitting || formData.positions.length === 0}
                    className="w-full py-4 bg-neon-blue text-black font-display text-xl rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

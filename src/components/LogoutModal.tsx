import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[340px] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <LogOut size={24} />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Confirm Logout</h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed px-2">
                  আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান? লগআউট করলে পুনরায় প্রবেশ করতে আবার লগইন করতে হবে।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-md text-[10px] font-black uppercase tracking-widest border-none cursor-pointer transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="h-11 bg-black hover:bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest border-none cursor-pointer transition-all shadow-lg shadow-black/10 active:scale-[0.98] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  Logout
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 bg-transparent border-none cursor-pointer p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

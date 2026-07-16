/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function LoginPopup({ isOpen, onClose, onSuccess }: LoginPopupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setError("অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড উভয়ই প্রদান করুন।");
      return;
    }

    try {
      // Find customer in localStorage "customers" array
      const customers = JSON.parse(localStorage.getItem("customers") || "[]");
      const customer = customers.find(
        (c: any) => c.email?.toLowerCase().trim() === trimmedEmail.toLowerCase() && c.password === trimmedPass
      );

      if (customer) {
        // Store in loggedInCustomer
        localStorage.setItem("loggedInCustomer", JSON.stringify(customer));
        onSuccess(customer);
        onClose();
      } else {
        setError("দুঃখিত! ইমেইল অথবা পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error("Error logging in via popup:", err);
      setError("লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-sm w-full p-6 text-left shadow-2xl border border-gray-100 relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer border-none"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-pink-50 text-[#ff2f7d] rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={22} />
          </div>
          <h3 className="font-black text-gray-800 text-lg uppercase tracking-wider">🔒 Login Required</h3>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            রিভিউ-এর বিস্তারিত দেখতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[11px] font-bold flex items-start gap-2 mb-4">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                <Mail size={14} />
              </span>
              <input 
                type="email"
                placeholder="আপনার ইমেইল..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 border border-gray-200 bg-white rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:border-[#ff2f7d] focus:ring-1 focus:ring-[#ff2f7d] transition-all font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                <Lock size={14} />
              </span>
              <input 
                type="password"
                placeholder="আপনার পাসওয়ার্ড..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 border border-gray-200 bg-white rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:border-[#ff2f7d] focus:ring-1 focus:ring-[#ff2f7d] transition-all font-bold"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-[#ff2f7d] hover:bg-[#e02065] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10 transition-colors cursor-pointer border-none"
          >
            <LogIn size={14} />
            <span>লগইন করুন</span>
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-gray-50">
          <p className="text-[10px] text-gray-400 font-bold">
            অ্যাকাউন্ট নেই? {" "}
            <a 
              href="/account" 
              className="text-[#ff2f7d] underline font-black"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                window.location.href = '/account';
              }}
            >
              নতুন অ্যাকাউন্ট তৈরি করুন
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

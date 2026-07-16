/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, User, ShoppingBag, ShoppingCart, Heart, Zap, Grid, Tag, 
  MessageSquare, Truck, RotateCcw, CreditCard, Mail, Info, 
  Shield, Clock, Bell, MapPin, Key, Download, Lock, ChevronRight, 
  Phone, FileText, LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCompany } from '../context/CompanyContext';

interface CustomerSideMenuProps {
  onClose: () => void;
}

export default function CustomerSideMenu({ onClose }: CustomerSideMenuProps) {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showLockAlert, setShowLockAlert] = useState<string | null>(null);
  const { companySettings } = useCompany();

  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInCustomer');
    if (savedUser) {
      try {
        setLoggedInUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse loggedInUser from localStorage', e);
      }
    }
  }, []);

  // 1. Gated Items (Require Login)
  const gatedItems = [
    { label: 'My Dashboard', path: '/account?tab=dashboard', icon: <Grid size={18} /> },
    { label: 'My Orders', path: '/account?tab=orders', icon: <ShoppingBag size={18} /> },
    { label: 'Live Order Tracking', path: '/account?tab=tracking', icon: <Truck size={18} /> },
    { label: 'Wishlist', path: '/account?tab=wishlist', icon: <Heart size={18} /> },
    { label: 'Recently Viewed', path: '/account?tab=recent', icon: <Clock size={18} /> },
    { label: 'My Reviews', path: '/account?tab=reviews', icon: <RotateCcw size={18} /> },
    { label: 'Saved Address', path: '/account?tab=addresses', icon: <MapPin size={18} /> },
    { label: 'Invoice History', path: '/account?tab=invoices', icon: <FileText size={18} /> },
    { label: 'Notification Center', path: '/account?tab=notifications', icon: <Bell size={18} /> },
    { label: 'Coupon Wallet', path: '/account?tab=coupons', icon: <Tag size={18} /> },
    { label: 'Profile Settings', path: '/account?tab=profile', icon: <User size={18} /> },
    { label: 'Logout', action: 'logout', icon: <LogOut size={18} /> },
  ];

  // 2. Public Items (Always Visible)
  const publicItems = [
    { label: 'Home', path: '/', icon: <Grid size={18} /> },
    { label: 'Categories', path: '/categories', icon: <Grid size={18} /> },
    { label: 'Flash Sale', path: '/flash-sale', icon: <Zap size={18} /> },
    { label: 'Offers', path: '/offers', icon: <Tag size={18} /> },
    { label: 'My Cart', path: '/cart', icon: <ShoppingCart size={18} /> },
    { label: 'Account / Login', path: '/account', icon: <User size={18} /> },
    { label: 'Contact Us', path: '/contact', icon: <Phone size={18} /> },
    { label: 'Customer Support', path: 'https://wa.me/8801700000000', icon: <MessageSquare size={18} />, isExternal: true },
    { label: 'Privacy Policy', modalKey: 'privacy', icon: <Shield size={18} /> },
    { label: 'Terms & Conditions', modalKey: 'terms', icon: <FileText size={18} /> },
    { label: 'Return Policy', modalKey: 'return', icon: <RotateCcw size={18} /> },
  ];

  const handleItemClick = (item: any) => {
    if (item.action === 'logout') {
      localStorage.removeItem('loggedInCustomer');
      setLoggedInUser(null);
      onClose();
      navigate('/');
      return;
    }

    const isGated = gatedItems.some(gi => gi.label === item.label);
    if (isGated && !loggedInUser && item.action !== 'logout') {
      setShowLockAlert(item.label);
      return;
    }

    onClose();

    if (item.modalKey) {
      // Toggle custom drawer overlay
      setActiveModal(item.modalKey);
      return;
    }

    if (item.isExternal) {
      window.open(item.path, '_blank', 'referrer');
      return;
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  const handleAdminClick = () => {
    onClose();
    navigate('/admin');
  };

  return (
    <>
      <div className="side-menu-overlay" onClick={onClose}>
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="side-menu flex flex-col h-full bg-white max-w-[340px] w-[85%] shadow-2xl p-4 overflow-hidden" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="side-menu-header flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 max-w-[200px]">
              {companySettings.logo ? (
                <img src={companySettings.logo} alt={companySettings.name} className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {companySettings.name.charAt(0)}
                </div>
              )}
              <span className="font-extrabold text-[16px] tracking-tight text-gray-900 truncate">{companySettings.name}</span>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-1 px-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg border-none cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* List scroll container */}
          <div className="side-menu-list flex-1 overflow-y-auto pr-1 py-4 space-y-6">

            {/* Section 1: Core Shopping & Account */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <span className="w-1 h-3.5 bg-black rounded-full"></span>
                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase">
                  Explore & Login
                </span>
              </div>
              
              {publicItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="w-full h-11 border-none bg-white border-b border-gray-50 flex items-center justify-between px-2 text-slate-700 hover:text-[#ff2f7d] hover:bg-[#ff2f7d]/5 rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-400">{item.icon}</span>
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  </div>
                  <ChevronRight size={13} className="text-slate-350" />
                </button>
              ))}
            </div>

            {/* Section 2: Gated Customer Features */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <span className="w-1 h-3.5 bg-[#ff2f7d] rounded-full"></span>
                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase">
                  My Profile & History
                </span>
              </div>
              
              {gatedItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="w-full h-11 border-none bg-white border-b border-gray-50 flex items-center justify-between px-2 text-slate-700 hover:text-[#ff2f7d] hover:bg-[#ff2f7d]/5 rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={loggedInUser ? 'text-[#ff2f7d]' : 'text-slate-300'}>
                      {!loggedInUser && item.action !== 'logout' ? <Lock size={16} /> : item.icon}
                    </span>
                    <span className={`text-xs font-bold ${loggedInUser ? 'text-slate-800' : 'text-slate-400'}`}>
                      {item.label}
                    </span>
                  </div>
                  {loggedInUser ? (
                    <ChevronRight size={13} className="text-slate-350" />
                  ) : (
                    <div className="flex items-center gap-1">
                       <span className="text-[8px] bg-slate-50 text-slate-400 font-extrabold px-1.5 py-0.5 rounded-full border border-slate-100">Locked</span>
                       <Lock size={10} className="text-slate-300" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Section 3: Policies & Support */}
            <div className="space-y-1 pb-2">
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <span className="w-1 h-3.5 bg-slate-400 rounded-full"></span>
                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase">Information & Aid</span>
              </div>
              <button 
                onClick={() => { onClose(); setActiveModal('delivery'); }}
                className="w-full h-11 border-none bg-white border-b border-gray-50 flex items-center justify-between px-2 text-slate-700 hover:text-[#ff2f7d] hover:bg-[#ff2f7d]/5 rounded-xl transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400"><Truck size={18} /></span>
                  <span className="text-xs font-bold text-slate-800">Delivery Policy</span>
                </div>
                <ChevronRight size={13} className="text-slate-350" />
              </button>
              <button 
                onClick={() => { onClose(); setActiveModal('about'); }}
                className="w-full h-11 border-none bg-white border-b border-gray-50 flex items-center justify-between px-2 text-slate-700 hover:text-[#ff2f7d] hover:bg-[#ff2f7d]/5 rounded-xl transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400"><Info size={18} /></span>
                  <span className="text-xs font-bold text-slate-800">About Us</span>
                </div>
                <ChevronRight size={13} className="text-slate-350" />
              </button>
            </div>

          </div>

        </motion.div>
      </div>

      {/* 🔒 Gate Block Access Alert */}
      {showLockAlert && (
        <div 
          className="fixed inset-0 bg-black/60 z-[1002] flex items-center justify-center p-4"
          onClick={() => setShowLockAlert(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-rose-50 text-[#ff2f7d] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Lock size={26} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-[15px]">🔒 Login Required</h3>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Section <strong className="text-[#ff2f7d]">"{showLockAlert}"</strong> is locked for guests. Please log in with your Gmail/Email to gain full real-time access!
            </p>
            
            <div className="flex flex-col gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowLockAlert(null);
                  onClose();
                  navigate('/account');
                }}
                className="w-full bg-[#ff2f7d] hover:bg-pink-600 text-white font-bold py-2.5 rounded-xl border-none text-[11px] transition-all shadow cursor-pointer active:scale-95"
              >
                Sign In with Email
              </button>
              <button
                type="button"
                onClick={() => setShowLockAlert(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-2.5 rounded-xl border-none text-[11px] transition-all cursor-pointer"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📁 Policy Drawer details Overlay Modals */}
      {activeModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-[1002] flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-[#ff2f7d] text-xs uppercase tracking-wider flex items-center gap-2">
                {activeModal === 'delivery' && <Truck size={16} />}
                {activeModal === 'return' && <RotateCcw size={16} />}
                {activeModal === 'privacy' && <Shield size={16} />}
                {activeModal === 'terms' && <FileText size={16} />}
                {activeModal === 'contact' && <Phone size={16} />}
                {activeModal === 'about' && <Info size={16} />}
                <span>
                  {activeModal === 'delivery' && 'Delivery Policy'}
                  {activeModal === 'return' && 'Return Policy'}
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms & Conditions'}
                  {activeModal === 'contact' && 'Contact Us'}
                  {activeModal === 'about' && `About ${companySettings.name}`}
                </span>
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 px-2.5 text-slate-500 hover:text-black hover:bg-slate-100 rounded-lg border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-5 overflow-y-auto text-xs text-slate-600 leading-relaxed space-y-4 font-semibold">
              {activeModal === 'delivery' && (
                <div className="space-y-3">
                  <p>At <strong>NaimShop</strong>, we aim to deliver our exclusive premium traditional and casual wears quickly and safely across all regions in Bangladesh.</p>
                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-50 space-y-2">
                    <strong className="block text-slate-900 text-[11px] mb-1">📅 Expected Timelines:</strong>
                    <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-650">
                      <li><strong>Inside Dhaka City:</strong> Same/Next business day delivery. Standard courier rate is <strong>৳80</strong>.</li>
                      <li><strong>Outside Dhaka City:</strong> 2 to 3 days door-to-door delivery via trusted RedX / Pathao Logistics. Standard shipping rate is <strong>৳150</strong>.</li>
                      <li><strong>VIP Super Express:</strong> Place your order by 12:00 PM for urgent same-day courier dispatch inside Dhaka.</li>
                    </ul>
                  </div>
                  <p><strong>Free Delivery Offer:</strong> We offer complimentary premium shipping on all combined invoices exceeding <strong>৳10,000</strong>.</p>
                  <p><strong>Tracking:</strong> All orders are registered with individual delivery barcode tracking. You can track your courier instantly via the <strong>Live Order Tracking</strong> section inside your account.</p>
                </div>
              )}

              {activeModal === 'return' && (
                <div className="space-y-3">
                  <p>We work to ensure maximum client comfort. If any item is not correct in size or fitting, our returns/exchanges are simple and stress-free.</p>
                  <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100 space-y-2">
                    <strong className="block text-slate-950 text-[11px] mb-1">📁 Hassle-free 7 Days Window:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-slate-650">
                      <li>Requests must be filed within <strong>7 days</strong> of physical package reception.</li>
                      <li>Products must be completely unworn, unwashed, with tags and packaging intact.</li>
                      <li>Offer and clearance stock items cannot be returned unless received in damaged condition.</li>
                    </ul>
                  </div>
                  <p><strong>How to file a request:</strong> Simply verify your email, head to <strong>My Orders</strong>, expand the delivered transaction record, and press the <strong>Return Request</strong> or <strong>Exchange Request</strong> button to submit a ticket instantly.</p>
                  <p><strong>Refund Transfer:</strong> Approved refund balances are sent directly back to your original bKash, Rocket, or Bank account within 3 to 5 business days.</p>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="space-y-3">
                  <p>Your online privacy and information security is of critical importance at NaimShop.</p>
                  <p><strong>Data Processing:</strong> We collect only necessary delivery coordinates (Full human name, email address, physical shipping address, phone numbers) which are strictly required to verify, package, and courier your transactions.</p>
                  <p><strong>Encrypted Channel:</strong> Credit information, checkout history, and credential passwords are fully sanitized and stored using state-of-the-art secure encryptions. Payments are handled via authorized SSLCommerz / mobile payment hubs.</p>
                  <p><strong>No Selling:</strong> We guarantee that your information is never leased, sold, or shared with third-party marketing services.</p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-3 text-[11px]">
                  <p>Please carefully review our operational and sale guidelines:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Product representations:</strong> Fabric hues shown online may look slightly varied depending on screen color profiles.</li>
                    <li><strong>Cancellation:</strong> NaimShop reserves the right to hold/cancel any order in case of suspected duplicate transaction risks or fraudulent coordinates.</li>
                    <li><strong>Price shifts:</strong> Regular promotional rates or catalog pricing are subject to changes but confirmed invoice values are always non-adjustable and locked.</li>
                  </ul>
                </div>
              )}

              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <p>We are available 10:00 AM to 10:00 PM every single day to answer custom size queries, package issues, or wholesale requests!</p>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-2 bg-[#ff2f7d]/10 text-[#ff2f7d] rounded-lg">
                        <Phone size={14} />
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Phone Hotline</span>
                        <a href="tel:09612123123" className="text-slate-800 font-extrabold hover:underline text-[11px]">09612123123</a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                        <MessageSquare size={14} />
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold uppercase">WhatsApp Support</span>
                        <a 
                          href="https://wa.me/8801700000000" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-slate-800 font-extrabold hover:underline text-[11px]"
                        >
                          +880 1700-000000 (Click to chat)
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                        <Mail size={14} />
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Support Email</span>
                        <a href="mailto:info@naimshop.com" className="text-slate-800 font-extrabold hover:underline text-[11px]">info@naimshop.com</a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Main Warehouse</span>
                        <p className="text-slate-800 font-extrabold text-[10px] leading-relaxed">Shop 204, Sector 11, Landmark Tower, Uttara, Dhaka, Bangladesh.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'about' && (
                <div className="space-y-3">
                  <p className="font-black text-slate-800 text-sm">Elegant Fashion Crafted For Comfort & Culture</p>
                  <p>Established in 2020, <strong>{companySettings.name}</strong> has emerged as one of Bangladesh's premier virtual landmarks for authentic designer silk sarees, cotton punjabis, selective lifestyle garments, and premium custom clothing materials.</p>
                  <p>We collaborate directly with native weaving hubs in Tangail, Rajshahi, and Dhaka suburbs to ensure raw quality threads, exquisite design finishes, and accessible luxury pricing. Every transaction is backed by our customer protection policies to ensure a seamless shopping experience.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="bg-slate-900 text-white hover:bg-slate-800 font-extrabold px-5 py-2 rounded-xl text-[10px] border-none cursor-pointer transition-all active:scale-95 text-center"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

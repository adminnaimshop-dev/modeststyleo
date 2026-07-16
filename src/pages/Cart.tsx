/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '../utils/navigation';
import { ChevronLeft, ShoppingBag, Trash2, Plus, Minus, CheckCircle, Smartphone, Info, Copy, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useCompany } from '../context/CompanyContext';
import { updateSessionTracker, trackEvent } from '../utils/sessionTracker';
import BottomNav from '../components/BottomNav';

export default function Cart() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { cartItems, updateQty, removeFromCart, clearCart, cartCount } = useCart();
  const { companySettings } = useCompany();
  const [isOrdered, setIsOrdered] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [cusName, setCusName] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('loggedInCustomer');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setLoggedInUser(user);
        setCusName(user.name || '');
        setPhoneNumber(user.phone || '');
        setAddress(user.address || '');
      } catch (e) {
        console.error('Error parsing loggedInUser', e);
      }
    }
  }, []);

  // Load payment settings dynamically from localStorage with correct defaults
  const [paymentConfigs, setPaymentConfigs] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('naimshop_admin_payments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed loading payment configs in checkout", e);
    }
    return {
      bkash: { label: 'bKash', order: 1, hidden: false, accounts: [
        { id: '1', type: 'Personal', name: 'Naim Shop', number: '01712345678', instruction: 'Send money to our Personal bKash and confirm transaction ID.', active: true },
        { id: '2', type: 'Merchant', name: 'Naim Shop Official', number: '01998765432', instruction: 'Make Payment using merchant ID.', active: true }
      ]},
      nagad: { label: 'Nagad', order: 2, hidden: false, accounts: [
        { id: '1', type: 'Personal', name: 'Naim Shop', number: '01815151522', instruction: 'Send money using Nagad.', active: true }
      ]},
      cod: { label: 'Cash on Delivery', order: 5, hidden: false, accounts: [
        { id: '1', type: 'COD', name: 'Standard', number: 'Verified', instruction: 'Pay to courier.', active: true }
      ]}
    };
  });

  const getMethodLogo = (methodKey: string) => {
    const svgMap: Record<string, string> = {
      bkash: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23e21262"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">bKash</text></svg>',
      nagad: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23f64a1e"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">Nagad</text></svg>',
      rocket: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%238c3494"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">Rocket</text></svg>',
      bank: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%231e3a8a"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">Bank</text></svg>',
      cod: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23475569"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="24" fill="white" text-anchor="middle">COD</text></svg>',
      card: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%234f46e5"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="24" fill="white" text-anchor="middle">CARD</text></svg>'
    };
    return svgMap[methodKey] || svgMap.cod;
  };

  // Sorted and filtered active gateways
  const sortedMethods = Object.keys(paymentConfigs)
    .filter(k => !paymentConfigs[k].hidden)
    .sort((a,b) => (paymentConfigs[a].order || 0) - (paymentConfigs[b].order || 0));

  // Selection states
  const [selectedMethod, setSelectedMethod] = useState<string>(() => {
    const keys = Object.keys(paymentConfigs).filter(k => !paymentConfigs[k].hidden);
    if (keys.includes('cod')) return 'cod';
    return keys[0] || 'cod';
  });

  const [selectedAccIdx, setSelectedAccIdx] = useState(0);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const deliveryCharge = cartItems.length > 0 ? 60 : 0;
  const grandTotal = subtotal + deliveryCharge;

  // Real-time tracking of cart inputs
  React.useEffect(() => {
    updateSessionTracker(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        name: cusName,
        phone: phoneNumber,
        email: loggedInUser?.email || prev.customerInfo.email
      },
      addressProgress: {
        name: cusName.length > 2,
        phone: phoneNumber.length > 9,
        district: address.length > 3,
        address: address.length > 10,
        payment: !!selectedMethod
      },
      cartInfo: {
        itemCount: cartItems.length,
        total: grandTotal,
        items: cartItems.map(it => ({ name: it.name, price: it.price, qty: it.qty, image: it.image }))
      }
    }));
  }, [cusName, phoneNumber, address, selectedMethod, cartItems, loggedInUser, grandTotal]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cusName.trim() || !phoneNumber.trim() || !address.trim()) {
      alert("Please fill in your shipping details.");
      return;
    }

    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: orderId,
      customerId: loggedInUser?.id || 'guest',
      customerName: cusName,
      phone: phoneNumber,
      address: address,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        size: item.selectedSize,
        image: item.image
      })),
      total: grandTotal,
      deliveryCharge,
      paymentMethod: selectedMethod,
      status: 'Order Placed',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      createdAt: new Date().toISOString()
    };

    // 1. Save to Global Order List
    const allOrders = JSON.parse(localStorage.getItem('naimshop_all_orders') || '[]');
    allOrders.push(newOrder);
    localStorage.setItem('naimshop_all_orders', JSON.stringify(allOrders));

    // 2. Save to User Specific List if logged in
    if (loggedInUser) {
      const userOrders = JSON.parse(localStorage.getItem(`orders_${loggedInUser.id}`) || '[]');
      userOrders.push(newOrder);
      localStorage.setItem(`orders_${loggedInUser.id}`, JSON.stringify(userOrders));
    }

    // Track Order Placement
    updateSessionTracker(prev => ({ ...prev, status: 'Order Placed', orderId: orderId }));
    trackEvent('Order Confirmed', `Order ID: ${orderId}`);

    setIsOrdered(true);
    clearCart();
  };

  return (
    <div className="page-container min-h-screen pb-20">
      {/* Top Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[120] flex items-center justify-between h-14 px-4 border-b border-gray-100">
        <button 
          onClick={goBack} 
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>
        <span className="font-extrabold text-[12px] text-gray-900 tracking-wider uppercase">My Shopping Cart</span>
        <div className="w-16"></div> {/* Spacer balance */}
      </div>

      <div className="px-3 py-4">
        {isOrdered ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center shadow-xs my-8 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={36} />
            </div>
            <h2 className="text-lg font-black text-gray-900">Order Placed Successfully!</h2>
            <p className="text-xs text-gray-400 font-semibold mt-2 max-w-sm">
              Thank you for shopping at {companySettings.name}! Our representative will call you shortly to confirm your order details.
            </p>
            <button 
              onClick={() => {
                setIsOrdered(false);
                navigate('/');
              }} 
              className="mt-6 w-full max-w-xs bg-primary text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 active:scale-95 transition-all shadow-md"
            >
              Continue Shopping
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center shadow-xs my-8">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={28} />
            </div>
            <h2 className="text-base font-bold text-gray-800">Your Cart is Empty</h2>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              Add premium sarees, polo shirts, and trendy bags to your cart to see them here!
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="mt-6 bg-primary text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 active:scale-95 transition-all shadow-md"
            >
              Exlpore Shop
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Cart items and details */}
            <div className="lg:col-span-7 space-y-4">
              {/* Header section with active count */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">{cartCount} items in cart</h2>
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to clear your cart?")) {
                    clearCart();
                  }
                }} 
                className="text-xs font-bold text-[#ff2f7d] hover:underline"
              >
                Clear Cart
              </button>
            </div>

            {/* Cart Items List */}
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-xs">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="p-3 flex gap-3 items-center">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-14 h-14 rounded-lg object-cover bg-gray-50 shrink-0 border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs text-gray-900 truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-extrabold text-[#ff2f7d]">৳{item.price}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                        Size: {item.selectedSize}
                      </span>
                    </div>
                  </div>

                  {/* Qty changer & Delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-full p-0.5">
                      <button 
                        onClick={() => updateQty(item.id, item.selectedSize || 'M', item.qty - 1)}
                        className="p-1 text-gray-500 hover:text-black hover:bg-white rounded-full transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-gray-800">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, item.selectedSize || 'M', item.qty + 1)}
                        className="p-1 text-gray-500 hover:text-black hover:bg-white rounded-full transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedSize || 'M')}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-red-50 hover:bg-red-100 rounded-full"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>

            {/* Right Column: Checkout Form & Pricing */}
            <div className="lg:col-span-5 space-y-4">
              {/* Price Summary Card */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs space-y-2.5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pricing Detail</h3>
              <div className="flex justify-between text-xs font-semibold text-gray-500">
                <span>Subtotal</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-500">
                <span>Delivery Charge</span>
                <span>৳{deliveryCharge}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex justify-between text-sm font-black text-gray-900">
                <span>Grand Total</span>
                <span className="text-[#ff2f7d]">৳{grandTotal}</span>
              </div>
            </div>

            {/* Premium Shipping and Dynamic Checkout Form */}
            <form onSubmit={handlePlaceOrder} className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
                Order Delivery & Checkout Payment
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Your Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter full name"
                    value={cusName}
                    onChange={(e) => setCusName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:outline-none focus:border-primary transition-colors font-medium text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 text-gray-400" size={14} />
                    <input 
                      type="tel" 
                      required
                      placeholder="Enter active phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:outline-none focus:border-primary transition-colors font-medium text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Shipping address</label>
                  <textarea 
                    required
                    rows={2}
                    placeholder="Apartment, Street Name, City, Bangladesh"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:outline-none focus:border-primary transition-colors font-medium text-gray-800 resize-none animate-fade-in"
                  />
                </div>

                {/* 1. Dynamic Payment Selector - Auto-synced with toggled state from Admin */}
                <div className="space-y-4 pt-1 border-t border-gray-50/50">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Payment Method</label>
                  
                  {sortedMethods.length === 0 ? (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-center text-[10px] font-black uppercase">
                      ⚠️ No active gateways available. Contact Administrator!
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {sortedMethods.map((key) => {
                          const cfg = paymentConfigs[key];
                          const activeAccounts = cfg.accounts?.filter((a: any) => a.active) || [];
                          if (activeAccounts.length === 0 && key !== 'card') return null;
                          const isSelected = selectedMethod === key;

                          return (
                            <div
                              key={key}
                              onClick={() => {
                                setSelectedMethod(key);
                                setSelectedAccIdx(0);
                              }}
                              className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer select-none transition-all ${
                                isSelected 
                                  ? 'border-[#ff2f7d] bg-[#ff2f7d]/5' 
                                  : 'border-gray-150 bg-white hover:border-gray-300'
                              }`}
                            >
                              <img 
                                src={cfg.logo || getMethodLogo(key)} 
                                className="w-7 h-7 rounded object-contain border border-gray-100 bg-gray-50 shrink-0" 
                                alt={cfg.label} 
                              />
                              <div className="min-w-0 pr-1">
                                <div className="text-[10px] font-black text-gray-800 leading-tight truncate">
                                  {cfg.label}
                                </div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tight">
                                  {key === 'cod' ? 'Pay on Delivery' : 'Secure Channel'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Account Selection if multiple active accounts exist */}
                      {paymentConfigs[selectedMethod]?.accounts?.filter((a: any) => a.active).length > 1 && (
                        <div className="flex flex-wrap gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          {paymentConfigs[selectedMethod].accounts
                            .filter((a: any) => a.active)
                            .map((acc: any, idx: number) => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => setSelectedAccIdx(idx)}
                                className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                                  selectedAccIdx === idx
                                    ? 'bg-[#ff2f7d] text-white shadow-sm'
                                    : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                              >
                                {acc.type}
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 2. Active Payment Guidance Box */}
                {(() => {
                  const method = paymentConfigs[selectedMethod];
                  const accounts = method?.accounts?.filter((a: any) => a.active) || [];
                  const account = accounts?.[selectedAccIdx];

                  if (selectedMethod === 'card') {
                    return (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-700">After clicking Confirmation, you will be redirected to secure SSLCommerz payment portal.</p>
                      </div>
                    );
                  }

                  if (!account && selectedMethod !== 'cod') return null;
                  
                  // For COD, we might not have a full "account" object if it's simpler, but our default state provides one.
                  const currentAccount = account || (selectedMethod === 'cod' ? { number: 'Verified', name: 'Naim Shop', instruction: 'Pay to courier.' } : null);

                  return (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 animate-fade-in">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-black text-slate-400 tracking-widest uppercase">
                              {currentAccount?.type || 'Standard'}
                            </span>
                          </div>

                          <div className="space-y-2">
                             <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Account Name</p>
                                <p className="text-[11px] font-black text-slate-800">{currentAccount?.name || 'Naim Shop'}</p>
                             </div>
                             
                             <div className="space-y-1">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Payment Details</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black font-mono text-slate-900 bg-white px-2 py-1 rounded border border-slate-100">
                                    {currentAccount?.number}
                                  </span>
                                  {currentAccount?.number !== 'Verified' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(currentAccount.number);
                                        alert('Number copied!');
                                      }}
                                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-[#ff2f7d]"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                             </div>
                          </div>
                        </div>

                        {currentAccount?.qr && (
                          <div className="w-20 text-center space-y-1">
                            <div className="bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                              <img src={currentAccount.qr} alt="QR" className="w-full h-auto aspect-square object-contain" />
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Scan to Pay</p>
                          </div>
                        )}
                      </div>

                      {currentAccount?.instruction && (
                        <div className="text-[10px] font-bold text-slate-600 bg-white/60 p-2 rounded border border-dashed border-slate-200 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-[#ff2f7d] shrink-0" />
                          <span>{currentAccount.instruction}</span>
                        </div>
                      )}

                      {/* Transaction ID requirement */}
                      {selectedMethod !== 'cod' && selectedMethod !== 'card' && (
                        <div className="pt-1">
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Transaction ID / Sender Details (Required)
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Trx9812A / 017xxxxxxxx"
                            className="w-full text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-[#ff2f7d] bg-white outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

              <button 
                type="submit" 
                className="w-full bg-[#ff2f7d] text-white py-3 rounded-full font-bold text-[11px] uppercase tracking-wider hover:bg-opacity-95 active:scale-95 transition-all shadow-md mt-3"
              >
                Confirm Purchase Order (৳{grandTotal})
              </button>

              {/* Checkout Support Info & WhatsApp */}
              <div className="mt-4 p-3 bg-white border border-slate-100 rounded-xl space-y-2 text-center text-[10px] font-bold text-slate-500 shadow-sm">
                <p className="border-b border-slate-100 pb-2">Need help with checkout? Contact our support:</p>
                <div className="flex items-center justify-center gap-3">
                   <p>📞 {companySettings?.mobile}</p>
                   {companySettings?.email && <p>✉️ {companySettings?.email}</p>}
                </div>
                {companySettings?.socialLinks?.whatsapp && (
                  <a 
                    href={companySettings.socialLinks.whatsapp} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center justify-center w-full gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Chat on WhatsApp
                  </a>
                )}
              </div>
            </form>
          </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

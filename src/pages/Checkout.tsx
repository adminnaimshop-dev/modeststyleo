
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoBack } from '../utils/navigation';
import { ChevronLeft, Truck, CreditCard, Banknote, Wallet, User, Phone, MapPin, Map, Navigation, Mail, QrCode, Check, Eye, AlertTriangle, X } from 'lucide-react';
import { DIVISIONS, DISTRICTS, UPAZILAS } from '../data/bangladeshData';
import { useCompany } from '../context/CompanyContext';
import { useCart } from '../context/CartContext';
import { updateSessionTracker, trackEvent } from '../utils/sessionTracker';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useGoBack();
  const { companySettings } = useCompany();
  const { addToCart, cartCount } = useCart();
  
  const productData = location.state?.product;
  const selectedSize = location.state?.size;
  const qty = location.state?.qty || 1;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [courierCharge, setCourierCharge] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning', title: string, message: string} | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any>(null);

  const [paymentConfigs, setPaymentConfigs] = useState<any>(null);

  useEffect(() => {
    const savedPayments = localStorage.getItem('naimshop_admin_payments');
    if (savedPayments) {
      setPaymentConfigs(JSON.parse(savedPayments));
    }
  }, []);

  useEffect(() => {
    if (division) {
      if (division === 'Dhaka') {
        setCourierCharge(70);
      } else {
        setCourierCharge(130);
      }
    } else {
      setCourierCharge(0);
    }
  }, [division]);

  // Real-time tracking of checkout inputs
  useEffect(() => {
    if (!productData) return;
    const total = (productData.price * qty) + courierCharge;
    updateSessionTracker(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        name: name,
        phone: phone,
        email: email || prev.customerInfo.email
      },
      addressProgress: {
        name: name.length > 2,
        phone: phone.length > 9,
        district: district.length > 2 || address.length > 3,
        address: address.length > 10,
        payment: !!paymentMethod
      },
      cartInfo: {
        itemCount: 1,
        total: total,
        items: [{ name: productData.name, price: productData.price, qty, image: productData.image || productData.images?.[0] }]
      }
    }));
  }, [name, phone, email, address, district, division, paymentMethod, productData, qty, courierCharge]);

  const isNameValid = name.trim().length >= 3;
  const isPhoneValid = /^(?:\+88|88)?(01[3-9]\d{8})$/.test(phone.trim().replace(/[-\s]/g, ""));
  const isAddressValid = address.trim().length >= 8;
  const isDivisionValid = !!division;
  const isDistrictValid = !!district;
  const isUpazilaValid = !!upazila;
  const isPaymentValid = !!paymentMethod;

  const handleOrderConfirm = () => {
    setHasSubmitted(true);
    
    const newErrors: Record<string, boolean> = {
      name: !isNameValid,
      phone: !isPhoneValid,
      address: !isAddressValid,
      division: !isDivisionValid,
      district: !isDistrictValid,
      upazila: !isUpazilaValid,
      payment: !isPaymentValid
    };
    
    setErrors(newErrors);

    if (!isNameValid || !isPhoneValid || !isAddressValid || !isDivisionValid || !isDistrictValid || !isUpazilaValid || !isPaymentValid) {
      setToast({
        type: 'error',
        title: '❌ তথ্য অসম্পূর্ণ',
        message: 'অনুগ্রহ করে সব তারকা চিহ্নিত (*) তথ্য সঠিকভাবে পূরণ করুন।'
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    try {
      const savedUser = localStorage.getItem('loggedInCustomer');
      const loggedInCustomer = savedUser ? JSON.parse(savedUser) : null;

      const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        id: orderId,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        total: (productData?.price * qty) + courierCharge,
        status: 'Pending', // Initial status
        statusTimeline: [
          { status: 'Order Placed', date: new Date().toISOString(), completed: true }
        ],
        customerName: name,
        phone: phone,
        email: email,
        customerId: loggedInCustomer?.id || 'guest',
        customerPhone: loggedInCustomer?.phone || phone,
        shippingAddress: address,
        division: division,
        district: district,
        upazila: upazila,
        paymentMethod: paymentMethod,
        deliveryCharge: courierCharge,
        items: [{
          id: productData?.id,
          name: productData?.name,
          price: productData?.price,
          qty: qty,
          size: selectedSize,
          image: productData?.image
        }]
      };

      // Save to global orders list for Admin and Customer tracking
      try {
        const rawAll = localStorage.getItem('naimshop_all_orders');
        const allOrders = rawAll ? JSON.parse(rawAll) : [];
        if (Array.isArray(allOrders)) {
          allOrders.unshift(newOrder);
          localStorage.setItem('naimshop_all_orders', JSON.stringify(allOrders));
        } else {
          localStorage.setItem('naimshop_all_orders', JSON.stringify([newOrder]));
        }
      } catch (_) {
        localStorage.setItem('naimshop_all_orders', JSON.stringify([newOrder]));
      }

      // Also save to user specific key for backward compatibility if needed, but we'll prefer the global list
      const userSuffix = loggedInCustomer?.id || 'guest';
      const userOrdersKey = `orders_${userSuffix}`;
      try {
        const rawUser = localStorage.getItem(userOrdersKey);
        const userOrders = rawUser ? JSON.parse(rawUser) : [];
        if (Array.isArray(userOrders)) {
          userOrders.unshift(newOrder);
          localStorage.setItem(userOrdersKey, JSON.stringify(userOrders));
        } else {
          localStorage.setItem(userOrdersKey, JSON.stringify([newOrder]));
        }
      } catch (_) {
        localStorage.setItem(userOrdersKey, JSON.stringify([newOrder]));
      }

      // Track Order Placement
      updateSessionTracker(prev => ({ ...prev, status: 'Order Placed', orderId: orderId }));
      trackEvent('Order Confirmed', `Order ID: ${orderId}`);

      setOrderSuccessData(newOrder);
      setOrderSuccess(true);
    } catch (err: any) {
      console.error(err);
      let errorMsg = err?.message || 'অর্ডার সম্পন্ন করার সময় একটি সমস্যা হয়েছে।';
      if (errorMsg.includes('invalid input syntax') || errorMsg.includes('type numeric')) {
        errorMsg = 'ডেটাবেজ টাইপ ত্রুটি: অর্ডার আইডিতে অসংগতি সনাক্ত হয়েছে (টাইপ টাইপ অমিল)। অনুগ্রহ করে পেইজ রিফ্রেশ করে আবার চেষ্টা করুন।';
      }
      setToast({
        type: 'error',
        title: '❌ অর্ডার ব্যর্থ হয়েছে',
        message: errorMsg
      });
    }
  };

  const activePaymentMethods = paymentConfigs 
    ? Object.keys(paymentConfigs).filter(key => !paymentConfigs[key].hidden)
    : ['bkash', 'nagad', 'rocket', 'bank', 'cod', 'card'];

  if (orderSuccess && orderSuccessData) {
    return (
      <div className="fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-y-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
          <Check size={40} strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে</h1>
        <p className="text-gray-500 font-bold mb-8">আপনার অর্ডার আইডি: {orderSuccessData.id}</p>
        
        <div className="w-full max-w-[320px] space-y-3">
          <button 
            onClick={() => navigate(`/invoice/${orderSuccessData.id}`)}
            className="w-full h-[52px] bg-gray-900 text-white rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Eye size={18} /> ইনভয়েস দেখুন
          </button>
          <button 
            onClick={() => navigate(`/invoice/${orderSuccessData.id}?download=true`)}
            className="w-full h-[52px] bg-[#FF2E86] text-white rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF2E86]/20 transition-all active:scale-95"
          >
            <Truck size={18} /> PDF ডাউনলোড করুন
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full h-[52px] bg-white text-gray-500 rounded-xl text-[14px] font-bold transition-all active:scale-95"
          >
            হোম পেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  // Validation status helpers
  const nameStatus = isNameValid ? 'valid' : (hasSubmitted || (name.length > 0 && name.trim().length < 3) ? 'invalid' : 'neutral');
  const phoneStatus = isPhoneValid ? 'valid' : (hasSubmitted || (phone.length > 0 && !isPhoneValid) ? 'invalid' : 'neutral');
  const addressStatus = isAddressValid ? 'valid' : (hasSubmitted || (address.length > 0 && !isAddressValid) ? 'invalid' : 'neutral');
  
  const divisionStatus = isDivisionValid ? 'valid' : (hasSubmitted ? 'invalid' : 'neutral');
  const districtStatus = isDistrictValid ? 'valid' : (hasSubmitted ? 'invalid' : 'neutral');
  const upazilaStatus = isUpazilaValid ? 'valid' : (hasSubmitted ? 'invalid' : 'neutral');

  // Name classes
  const nameWrapperClass = nameStatus === 'valid'
    ? 'border-emerald-500 bg-emerald-50/10 focus-within:border-emerald-500'
    : nameStatus === 'invalid'
      ? 'border-rose-500 bg-rose-50/10 focus-within:border-rose-500'
      : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 focus-within:border-indigo-500 focus-within:bg-white';
  const nameIconColor = nameStatus === 'valid' ? 'text-emerald-500' : nameStatus === 'invalid' ? 'text-rose-500' : 'text-gray-400';
  const nameLabelColor = nameStatus === 'valid' ? 'text-emerald-500/80' : nameStatus === 'invalid' ? 'text-rose-500/80' : 'text-gray-400';

  // Phone classes
  const phoneWrapperClass = phoneStatus === 'valid'
    ? 'border-emerald-500 bg-emerald-50/10 focus-within:border-emerald-500'
    : phoneStatus === 'invalid'
      ? 'border-rose-500 bg-rose-50/10 focus-within:border-rose-500'
      : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 focus-within:border-indigo-500 focus-within:bg-white';
  const phoneIconColor = phoneStatus === 'valid' ? 'text-emerald-500' : phoneStatus === 'invalid' ? 'text-rose-500' : 'text-gray-400';
  const phoneLabelColor = phoneStatus === 'valid' ? 'text-emerald-500/80' : phoneStatus === 'invalid' ? 'text-rose-500/80' : 'text-gray-400';

  // Address classes
  const addressWrapperClass = addressStatus === 'valid'
    ? 'border-emerald-500 bg-emerald-50/10 focus-within:border-emerald-500'
    : addressStatus === 'invalid'
      ? 'border-rose-500 bg-rose-50/10 focus-within:border-rose-500'
      : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 focus-within:border-indigo-500 focus-within:bg-white';
  const addressIconColor = addressStatus === 'valid' ? 'text-emerald-500' : addressStatus === 'invalid' ? 'text-rose-500' : 'text-gray-400';
  const addressLabelColor = addressStatus === 'valid' ? 'text-emerald-500/80' : addressStatus === 'invalid' ? 'text-rose-500/80' : 'text-gray-400';

  // Division classes
  const divisionWrapperClass = divisionStatus === 'valid'
    ? 'border-emerald-500 bg-emerald-50/10'
    : divisionStatus === 'invalid'
      ? 'border-rose-500 bg-rose-50/10'
      : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 focus-within:border-indigo-500 focus-within:bg-white';
  const divisionIconColor = divisionStatus === 'valid' ? 'text-emerald-500' : divisionStatus === 'invalid' ? 'text-rose-500' : 'text-gray-400';
  const divisionLabelColor = divisionStatus === 'valid' ? 'text-emerald-500/80' : divisionStatus === 'invalid' ? 'text-rose-500/80' : 'text-gray-400';

  // District classes
  const districtWrapperClass = districtStatus === 'valid'
    ? 'border-emerald-500 bg-emerald-50/10'
    : districtStatus === 'invalid'
      ? 'border-rose-500 bg-rose-50/10'
      : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 focus-within:border-indigo-500 focus-within:bg-white';
  const districtIconColor = districtStatus === 'valid' ? 'text-emerald-500' : districtStatus === 'invalid' ? 'text-rose-500' : 'text-gray-400';
  const districtLabelColor = districtStatus === 'valid' ? 'text-emerald-500/80' : districtStatus === 'invalid' ? 'text-rose-500/80' : 'text-gray-400';

  // Upazila classes
  const upazilaWrapperClass = upazilaStatus === 'valid'
    ? 'border-emerald-500 bg-emerald-50/10'
    : upazilaStatus === 'invalid'
      ? 'border-rose-500 bg-rose-50/10'
      : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 focus-within:border-indigo-500 focus-within:bg-white';
  const upazilaIconColor = upazilaStatus === 'valid' ? 'text-emerald-500' : upazilaStatus === 'invalid' ? 'text-rose-500' : 'text-gray-400';
  const upazilaLabelColor = upazilaStatus === 'valid' ? 'text-emerald-500/80' : upazilaStatus === 'invalid' ? 'text-rose-500/80' : 'text-gray-400';

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-[920px] mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center pt-6 pb-6">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900 text-[20px]">অর্ডার কনফার্ম করুন</h1>
          <div className="w-9"></div>
        </div>

        {/* Shipping Information Compact Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Name */}
          <div className="col-span-2 sm:col-span-1">
            <div className={`h-[58px] sm:h-[64px] px-3.5 rounded-[14px] border-[1.5px] flex items-center gap-2.5 transition-all focus-within:shadow-sm ${nameWrapperClass}`}>
              <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${nameIconColor}`}>
                <User size={22} className="field-icon" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none mb-1 ${nameLabelColor}`}>নাম *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({...errors, name: false});
                  }}
                  placeholder="আপনার নাম"
                  className="w-full bg-transparent border-none text-[14px] sm:text-[15px] font-bold text-[#111827] focus:outline-none placeholder:text-[#111827]/25"
                />
              </div>
              {/* Validation Status Indicator */}
              {nameStatus === 'valid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 flex items-center gap-1 shrink-0 bg-emerald-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <Check size={11} strokeWidth={3} />
                  <span>✓ Valid</span>
                </span>
              )}
              {nameStatus === 'invalid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-rose-600 flex items-center gap-1 shrink-0 bg-rose-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <span>✗ {name.trim().length > 0 ? 'খুব ছোট' : 'প্রয়োজন'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="col-span-2 sm:col-span-1">
            <div className={`h-[58px] sm:h-[64px] px-3.5 rounded-[14px] border-[1.5px] flex items-center gap-2.5 transition-all focus-within:shadow-sm ${phoneWrapperClass}`}>
              <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${phoneIconColor}`}>
                <Phone size={22} className="field-icon" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none mb-1 ${phoneLabelColor}`}>ফোন *</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({...errors, phone: false});
                  }}
                  placeholder="মোবাইল নম্বর"
                  className="w-full bg-transparent border-none text-[14px] sm:text-[15px] font-bold text-[#111827] focus:outline-none placeholder:text-[#111827]/25"
                />
              </div>
              {/* Validation Status Indicator */}
              {phoneStatus === 'valid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 flex items-center gap-1 shrink-0 bg-emerald-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <Check size={11} strokeWidth={3} />
                  <span>✓ Valid</span>
                </span>
              )}
              {phoneStatus === 'invalid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-rose-600 flex items-center gap-1 shrink-0 bg-rose-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <span>✗ {phone.trim().length > 0 ? 'ভুল নম্বর' : 'প্রয়োজন'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Address - Full Width */}
          <div className="col-span-2">
            <div className={`h-[72px] px-3.5 rounded-[14px] border-[1.5px] flex items-center gap-2.5 transition-all focus-within:shadow-sm ${addressWrapperClass}`}>
              <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${addressIconColor}`}>
                <MapPin size={22} className="field-icon" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none mb-1 ${addressLabelColor}`}>ঠিকানা *</label>
                <input 
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({...errors, address: false});
                  }}
                  placeholder="আপনার পূর্ণ ঠিকানা লিখুন"
                  className="w-full bg-transparent border-none text-[14px] sm:text-[15px] font-bold text-[#111827] focus:outline-none placeholder:text-[#111827]/25"
                />
              </div>
              {/* Validation Status Indicator */}
              {addressStatus === 'valid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 flex items-center gap-1 shrink-0 bg-emerald-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <Check size={11} strokeWidth={3} />
                  <span>✓ Valid</span>
                </span>
              )}
              {addressStatus === 'invalid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-rose-600 flex items-center gap-1 shrink-0 bg-rose-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <span>✗ {address.trim().length > 0 ? 'অসম্পূর্ণ' : 'প্রয়োজন'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Division */}
          <div className="col-span-2 sm:col-span-1">
            <div className={`h-[58px] sm:h-[64px] px-3.5 rounded-[14px] border-[1.5px] flex items-center gap-2.5 transition-all focus-within:shadow-sm ${divisionWrapperClass}`}>
              <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${divisionIconColor}`}>
                <Map size={22} className="field-icon" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none mb-1 ${divisionLabelColor}`}>বিভাগ *</label>
                <select 
                  value={division}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    setDistrict('');
                    setUpazila('');
                    if (errors.division) setErrors({...errors, division: false});
                  }}
                  className="w-full bg-transparent border-none text-[14px] sm:text-[15px] font-bold text-[#111827] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">সিলেক্ট করুন</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {/* Validation Status Indicator */}
              {divisionStatus === 'valid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 flex items-center gap-1 shrink-0 bg-emerald-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <Check size={11} strokeWidth={3} />
                  <span>✓ Valid</span>
                </span>
              )}
              {divisionStatus === 'invalid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-rose-600 flex items-center gap-1 shrink-0 bg-rose-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <span>✗ প্রয়োজন</span>
                </span>
              )}
            </div>
          </div>

          {/* District */}
          <div className="col-span-2 sm:col-span-1">
            <div className={`h-[58px] sm:h-[64px] px-3.5 rounded-[14px] border-[1.5px] flex items-center gap-2.5 transition-all focus-within:shadow-sm ${districtWrapperClass}`}>
              <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${districtIconColor}`}>
                <MapPin size={22} className="field-icon" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none mb-1 ${districtLabelColor}`}>জেলা *</label>
                <select 
                  value={district}
                  disabled={!division}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setUpazila('');
                    if (errors.district) setErrors({...errors, district: false});
                  }}
                  className="w-full bg-transparent border-none text-[14px] sm:text-[15px] font-bold text-[#111827] focus:outline-none appearance-none disabled:opacity-50 cursor-pointer"
                >
                  <option value="">সিলেক্ট করুন</option>
                  {division && DISTRICTS[division]?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {/* Validation Status Indicator */}
              {districtStatus === 'valid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 flex items-center gap-1 shrink-0 bg-emerald-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <Check size={11} strokeWidth={3} />
                  <span>✓ Valid</span>
                </span>
              )}
              {districtStatus === 'invalid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-rose-600 flex items-center gap-1 shrink-0 bg-rose-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <span>✗ প্রয়োজন</span>
                </span>
              )}
            </div>
          </div>

          {/* Upazila */}
          <div className="col-span-2 sm:col-span-1">
            <div className={`h-[58px] sm:h-[64px] px-3.5 rounded-[14px] border-[1.5px] flex items-center gap-2.5 transition-all focus-within:shadow-sm ${upazilaWrapperClass}`}>
              <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${upazilaIconColor}`}>
                <Navigation size={22} className="field-icon" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none mb-1 ${upazilaLabelColor}`}>উপজেলা *</label>
                <select 
                  value={upazila}
                  disabled={!district}
                  onChange={(e) => {
                    setUpazila(e.target.value);
                    if (errors.upazila) setErrors({...errors, upazila: false});
                  }}
                  className="w-full bg-transparent border-none text-[14px] sm:text-[15px] font-bold text-[#111827] focus:outline-none appearance-none disabled:opacity-50 cursor-pointer"
                >
                  <option value="">সিলেক্ট করুন</option>
                  {district && (UPAZILAS[district] || [district + ' Sadar'])?.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {/* Validation Status Indicator */}
              {upazilaStatus === 'valid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-600 flex items-center gap-1 shrink-0 bg-emerald-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <Check size={11} strokeWidth={3} />
                  <span>✓ Valid</span>
                </span>
              )}
              {upazilaStatus === 'invalid' && (
                <span className="text-[10px] sm:text-[11px] font-black text-rose-600 flex items-center gap-1 shrink-0 bg-rose-100/50 px-2.5 py-1 rounded-full select-none animate-in fade-in duration-300">
                  <span>✗ প্রয়োজন</span>
                </span>
              )}
            </div>
          </div>

          {/* Gmail */}
          <div className="col-span-2 sm:col-span-1">
            <div className="h-[58px] sm:h-[64px] px-3.5 rounded-[14px] border-[1.5px] border-gray-200 bg-gray-50/30 hover:border-gray-300 focus-within:border-indigo-500 focus-within:bg-white flex items-center gap-2.5 transition-all focus-within:shadow-sm">
              <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <label className="text-[10px] sm:text-[11px] font-extrabold text-gray-400 uppercase tracking-wider leading-none mb-1">Gmail (ঐচ্ছিক)</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ইমেইল এড্রেস"
                  className="w-full bg-transparent border-none text-[14px] sm:text-[15px] font-bold text-[#111827] focus:outline-none placeholder:text-[#111827]/25"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Courier Charge Card */}
        <div className="mt-3 p-3.5 rounded-[14px] border-[1.5px] border-[#22c55e] bg-[#f0fff6] flex items-center gap-4">
          <div className="text-[#22c55e] shrink-0">
            <Truck size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-[#111827] leading-tight">কুরিয়ার চার্জ</h3>
            <p className="text-[12px] font-bold text-[#111827]/60">ঢাকার ভিতরে ৳70 | ঢাকার বাইরে ৳130</p>
            <p className="text-[10px] text-[#22c55e] font-bold italic mt-0.5">অর্ডার কনফার্ম করার পর ডেলিভারি চার্জ অটোমেটিক যোগ হবে।</p>
          </div>
        </div>

        {/* Promo Code Placeholder Section */}
        <div className="mt-6 h-[58px] px-3 rounded-[14px] border border-dashed border-gray-300 bg-gray-50 flex items-center gap-3">
          <div className="text-gray-400 shrink-0"><CreditCard size={20} /></div>
          <input 
            type="text" 
            placeholder="প্রোমো কোড ব্যবহার করুন" 
            className="flex-1 bg-transparent border-none text-[14px] font-semibold text-gray-700 focus:outline-none placeholder:text-gray-400"
          />
          <button className="text-[13px] font-bold text-[#FF2E86]">Apply</button>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 space-y-3">
          <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.15em] text-center">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            {activePaymentMethods.map(method => {
              const config = paymentConfigs?.[method] || { label: method.toUpperCase() };
              const isSelected = paymentMethod === method;
              
              const getIcon = () => {
                if (method === 'bkash') return <img src="https://upload.wikimedia.org/wikipedia/commons/8/8b/Bkash_logo.png" className="w-[30px] h-[30px] object-contain" alt="bkash" />;
                if (method === 'nagad') return <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/Nagad_Logo.svg" className="w-[30px] h-[30px] object-contain" alt="nagad" />;
                if (method === 'rocket') return <img src="https://uidownload.com/math/assets/img/icon-rocket.png" className="w-[30px] h-[30px] object-contain" alt="rocket" />;
                if (method === 'cod') return <Banknote size={22} className={isSelected ? 'text-[#FF2E86]' : 'text-gray-400'} />;
                return <CreditCard size={22} className={isSelected ? 'text-[#FF2E86]' : 'text-gray-400'} />;
              };

              return (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    if (errors.payment) setErrors({...errors, payment: false});
                  }}
                  className={`
                    h-[58px] px-3 rounded-[14px] border-[1.5px] transition-all flex items-center justify-center gap-3 active:scale-95
                    ${isSelected 
                      ? 'border-[#FF2E86] bg-[#FFF5FA]' 
                      : (errors.payment ? 'border-red-500 bg-red-50/10' : 'border-gray-100 bg-gray-50')}
                  `}
                >
                  <div className="flex items-center justify-center shrink-0">
                    {getIcon()}
                  </div>
                  <span className={`text-[13px] font-bold ${isSelected ? 'text-[#FF2E86]' : 'text-gray-700'}`}>{config.label}</span>
                </button>
              );
            })}
          </div>
          {errors.payment && <p className="text-[10px] text-red-500 font-bold text-center">অনুগ্রহ করে একটি পেমেন্ট মেথড সিলেক্ট করুন</p>}
        </div>

        {/* Order Summary */}
        <div className="mt-8 p-5 rounded-[16px] bg-gray-50 border border-gray-100 space-y-3">
          <div className="flex justify-between text-[13px] font-bold text-gray-500">
            <span>সাবটোটাল:</span>
            <span>৳{(productData?.price * qty).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[13px] font-bold text-gray-500">
            <span>ডেলিভারি চার্জ:</span>
            <span>৳{courierCharge}</span>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between text-[17px] font-black text-gray-900">
            <span>সর্বমোট:</span>
            <span>৳{((productData?.price * qty) + courierCharge).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Confirm Button Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-[12px_16px] bg-white border-t border-gray-100 flex justify-center z-[150] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="w-full max-w-[920px]">
          <button 
            onClick={handleOrderConfirm}
            className="w-full h-[52px] bg-[#FF2E86] text-white rounded-[14px] text-[18px] font-[800] shadow-lg shadow-[#FF2E86]/20 transition-all active:scale-[0.98]"
          >
            অর্ডার কনফার্ম করুন
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-in slide-in-from-top duration-300">
          <div className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
              : 'bg-rose-50 border-rose-100 text-rose-900 hover:scale-[1.01] active:scale-[0.99]'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600 animate-bounce'
            }`}>
              {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            </div>
            <div className="flex-1 space-y-0.5">
              <h5 className="text-[12px] font-black leading-tight">{toast.title}</h5>
              <p className="text-[10px] opacity-90 leading-relaxed font-bold">{toast.message}</p>
            </div>
            <button 
              type="button" 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 bg-none border-none cursor-pointer self-start p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

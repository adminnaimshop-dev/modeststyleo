/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from '../lib/safe-motion';
import { 
  User, ShieldAlert, PlusCircle, Trash2, CheckCircle, Eye, EyeOff, Tag, MessageCircle, 
  ShoppingBag, ArrowRight, Grid, Truck, Heart, RotateCcw, MapPin, Bell, Key, 
  MessageSquare, Download, RefreshCw, Send, Image, Phone, CheckCircle2, 
  ChevronRight, Calendar, Zap, AlertTriangle, Shield, AlertCircle, ShoppingCart, Star,
  Clock, Settings, HelpCircle, CreditCard, LogOut, Gift, Check, Lock, FileText
} from 'lucide-react';
import { Product, Review, Banner } from '../types';
import BottomNav from '../components/BottomNav';
import { LoggedInAccountDashboard } from '../components/LoggedInAccountDashboard';
import LogoutModal from '../components/LogoutModal';
import { useCompany } from '../context/CompanyContext';
import { authClient } from '../lib/auth';

export default function Account() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { companySettings } = useCompany();
  const currentTab = searchParams.get('tab') || 'dashboard';

  // State variables for Customer Account System
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Admin and other states
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dashboard states
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // Auth fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegisterRoute, setIsRegisterRoute] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loginTab, setLoginTab] = useState<'email' | 'phone'>('email');
  
  // Phone Login States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  // Registration States
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form State for Adding Product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Saree');
  const [prodPrice, setProdPrice] = useState('1200');
  const [prodOldPrice, setProdOldPrice] = useState('1800');
  const [prodSku, setProdSku] = useState('SAR-002');
  const [prodInitialViews, setProdInitialViews] = useState('2200'); 
  const [prodStock, setProdStock] = useState('In Stock');
  const [prodFabric, setProdFabric] = useState('Pure Cotton');
  const [prodGsm, setProdGsm] = useState('160 GSM');
  const [prodFit, setProdFit] = useState('Regular Fit');
  const [prodCare, setProdCare] = useState('Gentle Wash');
  const [prodShortDesc, setProdShortDesc] = useState('Beautiful traditional design crafted for elegant comfort.');
  const [prodFullDesc, setProdFullDesc] = useState('Soft comfortable threads designed with intricate detailing, perfect for wedding festivals and daily styling.');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80');

  // Custom options
  const [prodImagesMultiple, setProdImagesMultiple] = useState('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80, https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80');
  const [prodSizes, setProdSizes] = useState('M, L, XL, XXL');
  const [prodBrand, setProdBrand] = useState('NaimShop Premium');
  const [prodStockQty, setProdStockQty] = useState('120');
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [relatedAuto, setRelatedAuto] = useState(true);
  const [demoDataEnabled, setDemoDataEnabled] = useState(true);
  
  // Authentication listener
  useEffect(() => {
    // MySQL Auth Listener
    const { data: { subscription } } = authClient.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = session.user;
        const isAdmin = user.email === atob('YWRtaW4ubmFpbXNob3BAZ21haWwuY29t');
        
        const userData = {
          id: user.id,
          uid: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || (isAdmin ? "System Admin" : "Customer"),
          email: user.email || "",
          phone: user.phone || user.user_metadata?.phone || "",
          photo: user.user_metadata?.avatar_url || "",
          role: isAdmin ? "admin" : "customer",
          lastLogin: new Date().toISOString()
        };

        setLoggedInUser(userData);
        localStorage.setItem("loggedInCustomer", JSON.stringify(userData));
        
        if (isAdmin) {
          localStorage.setItem("adminAuth", "true");
          localStorage.setItem("adminEmail", userData.email);
          // Only redirect if we're not already on a specific tab that isn't dashboard
          if (currentTab === 'dashboard' || !currentTab) {
            navigate("/admin");
          }
        } else {
          // Ensure non-admins don't have adminAuth
          localStorage.removeItem("adminAuth");
          localStorage.removeItem("adminEmail");
        }
        await saveCustomerToDatabase(userData);
      } else {
        setLoggedInUser(null);
        localStorage.removeItem("loggedInCustomer");
        localStorage.removeItem("adminAuth");
        localStorage.removeItem("adminEmail");
        if (currentTab === 'dashboard') {
          setSearchParams({ tab: 'login' });
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(false);

    if (!regName || !regEmail || !regPwd || !regConfirmPwd) {
      setRegError("All fields are required");
      return;
    }

    if (regPwd.length < 8) {
      setRegError("Password must be at least 8 characters");
      return;
    }

    if (regPwd !== regConfirmPwd) {
      setRegError("Passwords do not match");
      return;
    }

    setIsRegistering(true);
    try {
      const { data, error } = await authClient.auth.signUp({
        email: regEmail,
        password: regPwd,
        options: {
          data: {
            full_name: regName,
          }
        }
      });

      if (error) throw error;
      
      if (data.session) {
        setRegSuccess(true);
        // Save user as customer explicitly in DB
        const userData = {
          id: data.user?.id,
          uid: data.user?.id,
          name: regName,
          email: regEmail,
          role: "customer",
          lastLogin: new Date().toISOString()
        };
        await saveCustomerToDatabase(userData);
        
        setTimeout(() => {
          setIsRegisterRoute(false);
          setSearchParams({ tab: 'dashboard' });
          navigate("/account");
        }, 1500);
      } else {
        alert("Registration successful! Please check your email for a confirmation link before logging in.");
        setIsRegisterRoute(false);
      }
    } catch(err: any) {
      console.error("Registration error:", err);
      setRegError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };
    
  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) {
        throw new Error(error.message || "Invalid email or password. Please try again.");
      }

      if (data?.user) {
        const user = data.user;
        setLoggedInUser(user);
        localStorage.setItem("loggedInCustomer", JSON.stringify(user));

        if (user.role === 'admin') {
          localStorage.setItem("adminAuth", "true");
          localStorage.setItem("adminEmail", user.email || "");
          navigate("/admin");
        } else {
          setSearchParams({ tab: 'dashboard' });
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      alert("Please enter your email address first.");
      return;
    }
    try {
      const { error } = await authClient.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: window.location.origin + '/account?tab=reset-password',
      });
      if (error) throw error;
      alert("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) return;
    
    setOtpLoading(true);
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+880${phoneNumber.replace(/^0/, '')}`;
    
    try {
      const { error } = await authClient.auth.signInWithOtp({
        phone: formattedPhone,
      });
      if (error) throw error;
      setIsOtpSent(true);
      setResendTimer(60);
      setOtpLoading(false);
    } catch (error: any) {
      console.error(error);
      alert("Error sending OTP: " + error.message);
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !phoneNumber) return;
    
    setOtpLoading(true);
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+880${phoneNumber.replace(/^0/, '')}`;
    try {
      const { data, error } = await authClient.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });
      if (error) throw error;
      
      if (data.session) {
        setSearchParams({ tab: 'dashboard' });
      }
      setOtpLoading(false);
    } catch (error: any) {
      console.error(error);
      alert("Invalid OTP, please try again.");
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);
  
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setLoading(true);
      await authClient.auth.signOut();
      
      // Clear all potential auth-related storage
      localStorage.removeItem("loggedInCustomer");
      localStorage.removeItem("customer");
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("adminEmail");
      
      // Reset state
      setLoggedInUser(null);
      setShowLogoutModal(false);
      
      // Force redirect to login tab
      setSearchParams({ tab: 'login' });
      navigate('/account', { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomerToDatabase = async (customerData: any) => {
    // API registration saves to DB already.
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await authClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/account'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login Error:", error);
      alert("Login failed, please try again");
    }
  };

  const loginWithFacebook = async () => {
    try {
      const { error } = await authClient.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/account'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login Error:", error);
      alert("Login failed, please try again");
    }
  };

  useEffect(() => {
    // MySQL handles session recovery automatically on load
  }, []);

  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);

  useEffect(() => {
    if (loggedInUser) {
      setProfileName(loggedInUser.name || '');
      setProfilePhone(loggedInUser.phone || '');
      setProfileAddress(loggedInUser.address || '');
      setProfilePassword(loggedInUser.password || '');
    }
  }, [loggedInUser]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;

    const customers = JSON.parse(localStorage.getItem("customers") || "[]");
    const index = customers.findIndex((c: any) => c.id === loggedInUser.id);
    
    if (index > -1) {
      const updatedUser = {
        ...customers[index],
        name: profileName,
        phone: profilePhone,
        address: profileAddress,
        password: profilePassword
      };
      
      customers[index] = updatedUser;
      localStorage.setItem("customers", JSON.stringify(customers));
      localStorage.setItem("loggedInCustomer", JSON.stringify(updatedUser));
      setLoggedInUser(updatedUser);
      setProfileUpdateSuccess(true);
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!loggedInUser) return;
    const updated = addresses.filter(addr => addr.id !== addrId);
    setAddresses(updated);
  };

  const renderAuthTabs = () => {
    const themeColor = companySettings.authSettings?.themeColor || '#4f46e5';
    const buttonColor = companySettings.authSettings?.buttonColor || '#000000';

    if (currentTab === 'reset-password') {
      return (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="w-full max-w-sm mx-auto space-y-6 text-left py-8"
        >
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Set New Password</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Secure your account</p>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const newPassword = (e.target as any).newPassword.value;
            const confirmPassword = (e.target as any).confirmPassword.value;
            if (newPassword !== confirmPassword) {
              alert("Passwords do not match");
              return;
            }
            const { error } = await authClient.auth.updateUser({ password: newPassword });
            if (error) {
              alert(error.message);
            } else {
              alert("Password updated successfully!");
              setSearchParams({ tab: 'dashboard' });
            }
          }} className="space-y-4">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                <Lock size={16} />
              </div>
              <input 
                name="newPassword"
                required 
                minLength={8}
                type="password" 
                placeholder="New Password" 
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 focus:outline-none focus:border-black transition-all" 
              />
            </div>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                <Shield size={16} />
              </div>
              <input 
                name="confirmPassword"
                required 
                minLength={8}
                type="password" 
                placeholder="Confirm New Password" 
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 focus:outline-none focus:border-black transition-all" 
              />
            </div>
            <button 
              type="submit" 
              style={{ backgroundColor: buttonColor }}
              className="w-full h-12 text-white font-black rounded-lg shadow-lg shadow-black/5 mt-4 border-none cursor-pointer transition-all active:scale-[0.98] uppercase tracking-widest text-[10px] hover:brightness-110"
            >
              Update Password
            </button>
          </form>
        </motion.div>
      );
    }

    if (isRegisterRoute) {
      return (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="w-full max-w-sm mx-auto space-y-6 text-left py-8"
        >
          <div className="text-center space-y-2 mb-6">
            <img 
              src={companySettings.logo} 
              alt="Logo" 
              className="h-10 mx-auto object-contain" 
            />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{companySettings.name}</h2>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Join us today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            {regError && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-center gap-2 text-rose-600 animate-shake mb-4">
                <AlertCircle size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">{regError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                  <User size={16} />
                </div>
                <input 
                  required 
                  type="text" 
                  value={regName} 
                  onChange={e=>setRegName(e.target.value)} 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-black transition-all" 
                  placeholder="Full Name" 
                />
              </div>

              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                  <FileText size={16} />
                </div>
                <input 
                  required 
                  type="text" 
                  value={regEmail} 
                  onChange={e=>setRegEmail(e.target.value)} 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-black transition-all" 
                  placeholder="Email or Phone Number" 
                />
              </div>

              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  required 
                  minLength={8}
                  type={showPwd ? 'text' : 'password'} 
                  value={regPwd} 
                  onChange={e=>setRegPwd(e.target.value)} 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 font-bold text-slate-800 focus:outline-none focus:border-black transition-all" 
                  placeholder="Password" 
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                  <Shield size={16} />
                </div>
                <input 
                  required 
                  minLength={8}
                  type={showPwd ? 'text' : 'password'} 
                  value={regConfirmPwd} 
                  onChange={e=>setRegConfirmPwd(e.target.value)} 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 focus:outline-none focus:border-black transition-all" 
                  placeholder="Confirm Password" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isRegistering}
              style={{ backgroundColor: buttonColor }}
              className="w-full h-12 text-white font-black rounded-lg shadow-lg shadow-black/5 mt-4 border-none cursor-pointer transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] hover:brightness-110"
            >
              {isRegistering ? <RefreshCw className="animate-spin" size={16} /> : 'Create Account'}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-400 bg-white px-3 tracking-[0.2em]">Or sign up with</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={loginWithGoogle} className="h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
              <img src="https://uidownload.com/math/assets/img/icon-google.png" alt="Google" className="w-4 h-4 object-contain" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Google</span>
            </button>
            <button onClick={loginWithFacebook} className="h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Facebook</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button 
              type="button"
              className="text-[10px] text-slate-500 font-bold cursor-pointer hover:text-slate-900 border-none bg-transparent uppercase tracking-wider" 
              onClick={() => setIsRegisterRoute(false)}
            >
              Already have an account? <span style={{ color: themeColor }}>Sign In</span>
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="w-full max-w-sm mx-auto space-y-6 text-left py-8"
      >
        <div className="text-center space-y-1.5 mb-6">
          <img 
            src={companySettings.logo} 
            alt="Logo" 
            className="h-10 mx-auto object-contain" 
          />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{companySettings.name}</h2>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{companySettings.authSettings?.loginSubtitle || 'Welcome Back'}</p>
        </div>

        {/* Custom Tabs - More compact and slight radius */}
        <div className="bg-slate-100/50 p-1 rounded-lg flex items-center gap-1">
          <button 
            onClick={() => setLoginTab('email')}
            className={`flex-1 h-9 rounded-md font-black text-[9px] uppercase tracking-widest transition-all border-none cursor-pointer ${
              loginTab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'
            }`}
          >
            Email
          </button>
          <button 
            onClick={() => setLoginTab('phone')}
            className={`flex-1 h-9 rounded-md font-black text-[9px] uppercase tracking-widest transition-all border-none cursor-pointer ${
              loginTab === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'
            }`}
          >
            Phone
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loginTab === 'email' ? (
            <motion.form 
              key="email-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLocalLogin} 
              className="space-y-3"
            >
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                  <User size={16} />
                </div>
                <input 
                  required 
                  type="email" 
                  placeholder="Email Address" 
                  value={loginEmail} 
                  onChange={e=>setLoginEmail(e.target.value)} 
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-black transition-all" 
                />
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  required 
                  type={showPwd ? 'text' : 'password'} 
                  placeholder="Password" 
                  value={loginPassword} 
                  onChange={e=>setLoginPassword(e.target.value)} 
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-black transition-all" 
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer outline-none tracking-widest">Forgot Password?</button>
              </div>
              <button 
                type="submit" 
                style={{ backgroundColor: buttonColor }}
                className="w-full h-11 text-white font-black rounded-lg shadow-xl shadow-black/10 mt-1 border-none cursor-pointer transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:brightness-125 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Sign In
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="phone-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} 
              className="space-y-3"
            >
              <div className="flex gap-2">
                <div className="w-16 h-11 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-black text-slate-500 text-[11px]">
                  +880
                </div>
                <div className="relative flex-1 group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                    <Phone size={16} />
                  </div>
                  <input 
                    required 
                    type="tel" 
                    placeholder="Phone Number" 
                    value={phoneNumber} 
                    onChange={e=>setPhoneNumber(e.target.value)} 
                    disabled={isOtpSent}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-black transition-all disabled:opacity-60" 
                  />
                </div>
              </div>

              {isOtpSent && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors">
                      <Shield size={16} />
                    </div>
                    <input 
                      required 
                      type="text" 
                      placeholder="Enter 6-digit OTP" 
                      value={otp} 
                      onChange={e=>setOtp(e.target.value)} 
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-black transition-all tracking-[0.5em]" 
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-slate-400">Resend in {resendTimer}s</span>
                    <button 
                      type="button" 
                      onClick={() => { setIsOtpSent(false); setVerificationId(null); }}
                      className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-transparent border-none cursor-pointer tracking-wider"
                    >
                      Change
                    </button>
                  </div>
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={otpLoading}
                style={{ backgroundColor: buttonColor }}
                className="w-full h-11 text-white font-black rounded-lg shadow-xl shadow-black/10 mt-1 border-none cursor-pointer transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:brightness-125 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                {otpLoading ? <RefreshCw className="animate-spin" size={16} /> : (isOtpSent ? 'Verify & Sign In' : 'Send OTP')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-400 bg-white px-3 tracking-[0.2em]">Or continue with</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={loginWithGoogle} className="h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
            <img src="https://uidownload.com/math/assets/img/icon-google.png" alt="Google" className="w-4 h-4 object-contain" />
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Google</span>
          </button>
          <button onClick={loginWithFacebook} className="h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">Facebook</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <button 
            type="button" 
            onClick={() => setIsRegisterRoute(true)} 
            className="bg-transparent border-none text-[10px] text-slate-500 font-bold cursor-pointer hover:text-slate-900 uppercase tracking-widest"
          >
            Don't have an account? <span style={{ color: themeColor }}>Create Account</span>
          </button>
        </div>
      </motion.div>
    );
  };

  
  const [banTitle, setBanTitle] = useState('Exclusive Collection');
  const [banSubtitle, setBanSubtitle] = useState('Limited Time offer');
  const [banBadge, setBanBadge] = useState('Trending');
  const [banBgColor, setBanBgColor] = useState('#0f7eb5');
  const [banImagesMultiple, setBanImagesMultiple] = useState('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80, https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&q=80');
  const [banStatus, setBanStatus] = useState(true);
  const [banSerial, setBanSerial] = useState('1');
  const [banCategorySlug, setBanCategorySlug] = useState('saree');

  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAdminData = () => {
    setIsRefreshing(true);
    // Fetch live products
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(err => console.error(err));

    // Fetch live banners
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBanners(data);
      })
      .catch(err => console.error(err));

    // Fetch live reviews
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(err => console.error(err))
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setFeedback("❌ Product Name is required!");
      return;
    }

    const payload = {
      name: prodName,
      category: prodCategory,
      price: Number(prodPrice) || 0,
      oldPrice: Number(prodOldPrice) || undefined,
      sku: prodSku,
      views: Number(prodInitialViews) || 2200, // Product Initial View Count: Default 2200
      stock: prodStock,
      fabric: prodFabric,
      gsm: prodGsm,
      fit: prodFit,
      care: prodCare,
      shortDescription: prodShortDesc,
      fullDescription: prodFullDesc,
      image: prodImage,

      // Additional payload keys
      images: prodImagesMultiple.split(',').map(s => s.trim()).filter(Boolean),
      sizes: prodSizes.split(',').map(s => s.trim()).filter(Boolean),
      brand: prodBrand,
      stockQty: Number(prodStockQty) || 120,
      reviewsEnabled,
      relatedAuto,
      demoDataEnabled
    };

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) {
          setFeedback("🎉 Product uploaded successfully to inventory!");
          // Reset form fields
          setProdName('');
          setProdPrice('1200');
          setProdOldPrice('1800');
          fetchAdminData();
        } else {
          setFeedback("❌ Upload failed!");
        }
      })
      .catch(() => setFeedback("❌ Database API offline, failed to process upload."));
    
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteReview = (reviewId: string) => {
    fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setReviews(prev => prev.filter(r => r.id !== reviewId));
          setFeedback("🗑️ Customer review removed successfully!");
        } else {
          setFeedback("❌ Delete failed!");
        }
      })
      .catch(() => {
        // Fallback simulate delete
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setFeedback("🗑️ Review deleted locally!");
      });

    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banImagesMultiple.trim()) {
      setFeedback("❌ At least one image is required!");
      return;
    }

    const payload = {
      title: banTitle,
      subtitle: banSubtitle,
      badge: banBadge,
      bgColor: banBgColor,
      image: banImagesMultiple,
      status: banStatus,
      serial: Number(banSerial) || 1,
      categorySlug: banCategorySlug,
      type: "main"
    };

    fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) {
          setFeedback("🎉 Banners uploaded successfully to Slider!");
          setBanImagesMultiple('');
          fetchAdminData();
        } else {
          setFeedback("❌ Upload failed!");
        }
      })
      .catch(() => setFeedback("❌ Database API offline, failed to upload banners."));

    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteBanner = (bannerId: string) => {
    fetch(`/api/banners/${bannerId}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setBanners(prev => prev.filter(b => b.id !== bannerId));
          setFeedback("🗑️ Banner removed successfully!");
        } else {
          setFeedback("❌ Delete failed!");
        }
      })
      .catch(() => {
        setBanners(prev => prev.filter(b => b.id !== bannerId));
        setFeedback("🗑️ Banner deleted locally!");
      });

    setTimeout(() => setFeedback(null), 4000);
  };

  const getProductName = (id: string) => {
    const found = products.find(p => p.id === id);
    return found ? found.name : "Target Product (" + id + ")";
  };

  
  const renderSubPage = () => {
    return (
      <div className="bg-white min-h-[70vh] rounded-t-3xl shadow-sm animate-fade-in">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pt-5 pb-3 px-4 border-b border-slate-100 flex items-center gap-3 rounded-t-3xl">
          <button onClick={() => navigate('/account')} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-900 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors shrink-0">
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {currentTab === 'orders' && 'My Orders'}
            {currentTab === 'tracking' && 'Live Order Tracking'}
            {currentTab === 'wishlist' && 'My Wishlist'}
            {currentTab === 'addresses' && 'My Addresses'}
            {currentTab === 'reviews' && 'My Reviews'}
            {currentTab === 'chat' && 'Live Chat Support'}
            {currentTab === 'coupons' && 'My Coupons'}
            {currentTab === 'help' && 'Help Center'}
            {currentTab === 'profile' && 'Profile Settings'}
            {currentTab === 'invoices' && 'Invoice History'}
            {currentTab === 'notifications' && 'Notification Center'}
            {currentTab === 'recent' && 'Recently Viewed'}
            {!['orders','tracking','wishlist','addresses','reviews','chat','coupons','help', 'profile', 'invoices', 'notifications', 'recent'].includes(currentTab) && currentTab}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {currentTab === 'orders' && (
            orders.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">No orders found</p> : 
            orders.map((o: any, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-slate-900">#{o.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                    o.status === 'Delivered' ? 'bg-green-50 text-green-600' : 
                    o.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-500'
                  }`}>{o.status}</span>
                </div>
                <div className="flex flex-col gap-1 mb-3">
                   <span className="text-[10px] text-slate-500 font-semibold">{o.date}</span>
                   <span className="text-[10px] text-slate-500 font-semibold">Total: ৳{o.total}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSearchParams({ tab: 'tracking', id: o.id })}
                    className="flex-1 h-8 text-[10px] font-bold text-white bg-slate-900 border-none rounded-lg cursor-pointer hover:bg-black flex items-center justify-center gap-2"
                  >
                    <Truck size={12} /> Track
                  </button>
                  <button 
                    onClick={() => setSearchParams({ tab: 'invoices', id: o.id })}
                    className="flex-1 h-8 text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 flex items-center justify-center gap-2"
                  >
                    <FileText size={12} /> Invoice
                  </button>
                </div>
              </div>
            ))
          )}

          {currentTab === 'tracking' && (
            (() => {
              const trackingId = searchParams.get('id');
              const order = orders.find(o => o.id === trackingId) || orders[0];
              
              if (!order) return <p className="text-xs text-slate-400 text-center py-10">No order selected for tracking</p>;
              
              const statuses = ['Order Placed', 'Confirmed', 'Packaging', 'Courier Assigned', 'On Delivery', 'Delivered'];
              const currentStatusIndex = statuses.indexOf(order.status || 'Order Placed');
              
              return (
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="grid grid-cols-2 gap-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</p>
                        <p className="text-xs font-black text-slate-900">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Date</p>
                        <p className="text-xs font-bold text-slate-800">{order.date}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
                        <p className="text-xs font-bold text-slate-800 uppercase">{order.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
                        <p className="text-xs font-black text-rose-500">৳{order.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {statuses.map((status, idx) => {
                      const isCompleted = idx <= currentStatusIndex;
                      const isCurrent = idx === currentStatusIndex;
                      
                      return (
                        <div key={status} className="relative">
                          <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center z-10 ${
                            isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {isCompleted ? <Check size={12} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                          
                          <div>
                            <p className={`text-xs font-black ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                              {status}
                              {isCurrent && <span className="ml-2 text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Live</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {isCompleted ? (idx === 0 ? `Your order was placed on ${order.date}` : `Updated status to ${status.toLowerCase()}`) : 'Awaiting processing'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => navigate('/account?tab=orders')}
                    className="w-full h-11 bg-slate-900 text-white font-bold rounded-xl text-xs border-none cursor-pointer active:scale-95 transition-all"
                  >
                    View All Orders
                  </button>
                </div>
              );
            })()
          )}

          {currentTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4 animate-fade-in">
              {profileUpdateSuccess && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Profile updated successfully!</span>
                </div>
              )}
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Full Name</label>
                <input required type="text" value={profileName} onChange={e=>setProfileName(e.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-3 font-bold focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Phone Number</label>
                <input required type="tel" value={profilePhone} onChange={e=>setProfilePhone(e.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-3 font-bold focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Shipping Address</label>
                <textarea required value={profileAddress} onChange={e=>setProfileAddress(e.target.value)} className="w-full min-h-[80px] border border-slate-200 rounded-xl p-3 font-bold focus:outline-none focus:border-black resize-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Password</label>
                <input required type="password" value={profilePassword} onChange={e=>setProfilePassword(e.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-3 font-bold focus:outline-none focus:border-black" />
              </div>
              <button type="submit" className="w-full h-12 bg-black text-white font-bold rounded-xl shadow mt-2 border-none cursor-pointer hover:bg-slate-900 transition-all active:scale-95">
                Save Changes
              </button>
            </form>
          )}

          {currentTab === 'invoices' && (
            (() => {
              const invoiceId = searchParams.get('id');
              const order = orders.find(o => o.id === invoiceId) || orders[0];
              
              if (!order) return <p className="text-xs text-slate-400 text-center py-10">No orders found for invoices</p>;
              
              return (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                      <FileText className="text-slate-900" size={24} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">Invoice #{order.id}</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Generated on {order.date}</p>
                    
                    <div className="mt-6 space-y-3 border-t border-slate-200 pt-6 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</span>
                        <span className="text-xs font-bold text-slate-900">৳{order.total - (order.deliveryCharge || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Shipping</span>
                        <span className="text-xs font-bold text-slate-900">৳{order.deliveryCharge || 0}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                        <span className="text-xs font-black text-slate-900 uppercase">Total Amount</span>
                        <span className="text-base font-black text-rose-500">৳{order.total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="h-11 bg-slate-100 text-slate-700 font-bold rounded-xl text-[11px] border-none cursor-pointer flex items-center justify-center gap-2">
                      <Download size={16} /> Download
                    </button>
                    <button className="h-11 bg-slate-900 text-white font-bold rounded-xl text-[11px] border-none cursor-pointer flex items-center justify-center gap-2">
                      <Send size={16} /> Share
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Order Items</h4>
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-2xl">
                         <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                         <div className="flex-grow">
                           <p className="text-xs font-bold text-slate-900">{item.name}</p>
                           <p className="text-[10px] text-slate-500">Qty: {item.quantity || 1} • Size: {item.size || 'N/A'}</p>
                         </div>
                         <p className="text-xs font-black text-slate-900">৳{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}

          {currentTab === 'recent' && (
            recentlyViewed.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">No recently viewed products</p> : 
            recentlyViewed.map((p: any, idx) => (
              <div key={idx} className="flex items-center gap-3 border border-slate-100 rounded-2xl p-3 shadow-sm cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                <img src={p.image} alt="" className="w-16 h-16 object-cover rounded-xl" />
                <div className="flex-grow">
                  <h4 className="text-xs font-black text-slate-900">{p.name}</h4>
                  <p className="text-[11px] font-bold text-rose-500">৳{p.price}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))
          )}

          {currentTab === 'wishlist' && (
            wishlist.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">No items in wishlist</p> : 
            wishlist.map((w: any, idx) => (
              <div key={idx} className="flex items-center gap-3 border border-slate-100 rounded-2xl p-3 shadow-sm">
                <img src={w.image} alt="" className="w-16 h-16 object-cover rounded-xl" />
                <div className="flex-grow">
                  <h4 className="text-xs font-black text-slate-900">{w.name}</h4>
                  <p className="text-[11px] font-bold text-rose-500">৳{w.price}</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center border-none cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}

          {currentTab === 'addresses' && (
            addresses.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">No saved addresses</p> : 
            addresses.map((a: any, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl p-4 shadow-sm relative">
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{a.type}</span>
                <h4 className="text-sm font-black text-slate-900 mb-1">{a.name}</h4>
                <p className="text-xs font-semibold text-slate-600 mb-1">{a.phone}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{a.address}, {a.area}</p>
                <button onClick={() => handleDeleteAddress(a.id)} className="mt-3 text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border-none cursor-pointer">Delete Address</button>
              </div>
            ))
          )}

          {currentTab === 'reviews' && (
            reviewsList.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">No reviews yet</p> : 
            reviewsList.map((r: any, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-black text-slate-900">{r.productName}</h4>
                  <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">{r.rating} <Star size={10} className="fill-amber-500" /></span>
                </div>
                <p className="text-xs text-slate-600 italic mb-2">"{r.text}"</p>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{r.date} • {r.status}</span>
              </div>
            ))
          )}

          {currentTab === 'chat' && (
            <div className="flex flex-col h-[50vh]">
               <div className="flex-grow overflow-y-auto space-y-3 p-2">
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-3 w-max max-w-[80%]">
                    <p className="text-xs text-slate-700 font-medium">Hi! How can we help you today?</p>
                  </div>
               </div>
               <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100">
                  <input type="text" className="flex-grow h-10 border border-slate-200 rounded-xl px-3 text-xs focus:outline-none focus:border-black" placeholder="Type message..." />
                  <button className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center rounded-xl border-none cursor-pointer">
                    <Send size={16} />
                  </button>
               </div>
            </div>
          )}

          {['coupons', 'help'].includes(currentTab) && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
               <p className="text-xs font-bold uppercase">Coming Soon</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container pb-32 relative">
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-slate-900" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Processing...</p>
          </div>
        </div>
      )}
      {!loggedInUser && (
        <div className="bg-white sticky top-0 z-50 px-4 py-3 border-b border-slate-100 flex shadow-sm">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Account</h1>
        </div>
      )}

      <div className="p-4">
        {loggedInUser ? (
          currentTab === 'dashboard' ? (
            <LoggedInAccountDashboard 
              loggedInUser={loggedInUser} 
              recentlyViewed={recentlyViewed} 
              handleLogout={handleLogout} 
              navigate={navigate}
              orders={orders}
              wishlist={wishlist}
            />
          ) : renderSubPage()
        ) : renderAuthTabs()}
      </div>

      <BottomNav />
      <div id="recaptcha-container"></div>
    </div>
  );
}


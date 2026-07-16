import React from 'react';
import { 
  Settings, ChevronRight, Key, CheckCircle2, ShieldAlert, Truck, CheckCircle, 
  MessageSquare, RotateCcw, Heart, Tag, MapPin, AlertCircle, Gift, RefreshCw,
  HelpCircle, MessageCircle, CreditCard, LogOut, XCircle, Search, Star,
  Clock, Ticket, HeadphonesIcon, Bell, Shield, FileText, Info,
  Scissors, ShoppingBag, ShoppingCart
} from 'lucide-react';

export const LoggedInAccountDashboard = ({ loggedInUser, recentlyViewed, handleLogout, navigate, orders = [], wishlist = [] }: any) => {
  const totalSpent = orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
  const pendingOrders = orders.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const deliveredOrders = orders.filter((o: any) => o.status === 'Delivered').length;

  return (
    <div className="space-y-4 animate-fade-in text-left pb-4">
      {/* Header: My Account + Settings */}
      <div className="flex justify-between items-center mb-0 px-1 pt-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Account</h1>
        <button onClick={() => navigate('/account?tab=profile')} className="bg-transparent border-none text-slate-900 cursor-pointer p-1">
          <Settings size={24} />
        </button>
      </div>

      {/* Profile Card Upgrade */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10 w-full">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center shadow-md shrink-0">
            <span className="text-2xl font-black text-white uppercase">{loggedInUser.name.charAt(0)}</span>
          </div>
          <div className="flex flex-col flex-grow">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 capitalize leading-tight">{loggedInUser.name}</h2>
              {loggedInUser.role === 'admin' && (
                <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Admin</span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">{loggedInUser.email}</p>
            {loggedInUser.phone && <p className="text-xs text-slate-600 font-medium">{loggedInUser.phone}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                {loggedInUser.role === 'admin' ? 'Authorized Administrator' : 'Verified Customer'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => navigate('/account?tab=profile')} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1">
                Edit Profile <ChevronRight size={12} />
              </button>
              {loggedInUser.role === 'admin' && (
                <button onClick={() => navigate('/admin')} className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1 hover:bg-black transition-colors">
                  <Shield size={12} /> Admin Panel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Statistics Card (Premium Feature) */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <span className="text-sm font-black text-slate-900">{orders.length}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 text-center leading-tight tracking-wider">Total<br/>Orders</span>
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <span className="text-sm font-black text-slate-900">{pendingOrders}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 text-center leading-tight tracking-wider">Running<br/>Orders</span>
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <span className="text-sm font-black text-slate-900">{deliveredOrders}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 text-center leading-tight tracking-wider">Delivered<br/>Orders</span>
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <span className="text-sm font-black text-slate-900">{wishlist.length}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 text-center leading-tight tracking-wider">Wishlist<br/>Items</span>
        </div>
      </div>

      {/* Wallet & Rewards Upgrade */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm flex items-center gap-3 cursor-pointer hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Reward Points</span>
            <span className="block text-[10px] items-center text-slate-500 mt-0.5">0 Points</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm flex items-center gap-3 cursor-pointer hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <RotateCcw size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Cashback</span>
            <span className="block text-[10px] items-center text-slate-500 mt-0.5">৳0.00</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm flex items-center gap-3 cursor-pointer hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
            <Ticket size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Coupons</span>
            <span className="block text-[10px] items-center text-slate-500 mt-0.5">0 Available</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm flex items-center gap-3 cursor-pointer hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
            <Gift size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Referrals</span>
            <span className="block text-[10px] items-center text-slate-500 mt-0.5">৳0.00</span>
          </div>
        </div>
      </div>

      {/* My Orders Section Upgrade */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm font-black text-slate-900">My Orders</h3>
          <button onClick={() => navigate('/account?tab=orders')} className="text-[10px] text-slate-500 font-bold uppercase bg-transparent border-none cursor-pointer hover:text-black flex items-center gap-1">View All <ChevronRight size={12} /></button>
        </div>
        <div className="grid grid-cols-4 gap-y-6 gap-x-2">
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors"><ShieldAlert size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">To Pay</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors"><Truck size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">To Ship</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors relative"><CheckCircle size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">To Receive</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors"><MessageSquare size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">To Review</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors"><RotateCcw size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">Returns</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors"><XCircle size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">Cancelled</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors"><ShoppingCart size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">Completed</span>
          </button>
          <button onClick={() => navigate('/account?tab=tracking')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <div className="text-slate-400 group-hover:text-black transition-colors"><Search size={22} /></div>
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-black text-center">Tracking</span>
          </button>
        </div>
      </div>

      {/* Customer Services Section Upgrade */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm">
        <h3 className="text-sm font-black text-slate-900 mb-5">Customer Services</h3>
        <div className="grid grid-cols-4 gap-y-7 gap-x-2">
          <button onClick={() => navigate('/account?tab=wishlist')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Heart size={22} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Wishlist</span>
          </button>
          <button onClick={() => navigate('/account?tab=coupons')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Tag size={22} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">My Coupons</span>
          </button>
          <button onClick={() => navigate('/account?tab=addresses')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <MapPin size={22} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Addresses</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <AlertCircle size={22} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Requests</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Gift size={22} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Refer & Earn</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <RefreshCw size={22} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Refunds</span>
          </button>
          <button onClick={() => navigate('/account?tab=reviews')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Star size={22} className="text-slate-400 group-hover:text-orange-400 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">My Reviews</span>
          </button>
          <button onClick={() => navigate('/account?tab=recent')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Clock size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Recently<br/>Viewed</span>
          </button>
          <button onClick={() => navigate('/account?tab=invoices')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <FileText size={22} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Invoice<br/>History</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <HeadphonesIcon size={22} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Live Chat</span>
          </button>
        </div>
      </div>

      {/* My Measurements */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Scissors size={20} className="text-slate-900" />
            <h3 className="text-sm font-black text-slate-900">My Measurements</h3>
          </div>
          <button className="text-[10px] text-indigo-500 font-bold uppercase bg-transparent border-none cursor-pointer hover:text-indigo-600">Edit</button>
        </div>
        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
          Save your measurements for tailored size recommendations during shopping.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-[10px] text-slate-500 font-semibold mb-1">Height</span>
             <span className="text-xs font-black text-slate-900">5'8"</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-[10px] text-slate-500 font-semibold mb-1">Weight</span>
             <span className="text-xs font-black text-slate-900">70 kg</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-[10px] text-slate-500 font-semibold mb-1">Shirt</span>
             <span className="text-xs font-black text-slate-900">M / 38</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-[10px] text-slate-500 font-semibold mb-1">T-Shirt</span>
             <span className="text-xs font-black text-slate-900">L</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center">
             <span className="text-[10px] text-slate-500 font-semibold mb-1">Punjabi</span>
             <span className="text-xs font-black text-slate-900">40</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center border-dashed cursor-pointer hover:bg-slate-100 transition-colors">
             <span className="text-xs font-black text-slate-400">+ Add</span>
          </div>
        </div>
      </div>

      {/* Recently Viewed / Ordered Section Upgrade */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-slate-900">Recently Viewed / Ordered</h3>
          <button className="text-[10px] text-slate-500 font-bold uppercase bg-transparent border-none cursor-pointer hover:text-black flex items-center gap-1">View All <ChevronRight size={12} /></button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {recentlyViewed.length > 0 ? recentlyViewed.map((item: any, idx: number) => (
            <div key={idx} className="shrink-0 w-28 space-y-1.5 cursor-pointer group">
              <img src={item.image} alt="recent" className="w-full h-28 object-cover rounded-xl border border-slate-100 group-hover:border-slate-300 transition-colors" />
              <p className="text-[10px] font-bold text-slate-800 truncate px-1">{item.name}</p>
              <p className="text-[11px] font-black text-rose-500 px-1">৳{item.price}</p>
            </div>
          )) : (
            <p className="text-xs text-slate-400 italic">No products viewed yet.</p>
          )}
        </div>
      </div>

      {/* More Options Section Upgrade */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm">
        <h3 className="text-sm font-black text-slate-900 mb-5">More Options</h3>
        <div className="grid grid-cols-4 gap-y-7 gap-x-2">
          <button onClick={() => navigate('/account?tab=chat')} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <MessageCircle size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Contact<br/>Support</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <CreditCard size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Payment<br/>Methods</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Bell size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Notifications</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Shield size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Privacy</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <FileText size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Terms &<br/>Conditions</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Truck size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Delivery<br/>Policy</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <RotateCcw size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">Return<br/>Policy</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <Info size={22} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-900 text-center">About Us</span>
          </button>
          
          <button onClick={handleLogout} className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group">
            <LogOut size={22} className="text-red-400 group-hover:text-red-600 transition-colors" />
            <span className="text-[9px] font-bold text-red-500 group-hover:text-red-600 text-center">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};


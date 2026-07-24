/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { RouteTracker } from './utils/navigation';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Reviews from './pages/Reviews';
import Account from './pages/Account';
import AdminPage from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import CategoryDetailsPage from './pages/CategoryDetails';
import Categories from './pages/Categories';
import Offers from './pages/Offers';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Invoice from './pages/Invoice';
import FlashSalePage from './pages/FlashSale';
import MessengerPage from './pages/Messenger';
import BottomNav from './components/BottomNav';
import { CartProvider } from './context/CartContext';
import { CompanyProvider } from './context/CompanyContext';

// For demo purposes
if (typeof window !== 'undefined') {
  (window as any).loadDemoData = async () => {
    await import('./utils/loadDemoData');
    console.log('Demo data loaded');
  };
}

export default function App() {
  return (
    <CompanyProvider>
      <CartProvider>
        <BrowserRouter>
          <RouteTracker />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/product/:id/reviews" element={<Reviews />} />
          <Route path="/category/:slug" element={<CategoryDetailsPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/invoice/:id" element={<Invoice />} />
          <Route path="/flash-sale" element={<FlashSalePage />} />
          <Route path="/contact" element={<Placeholder title="Contact Us" mode="contact" />} />
          <Route path="/about" element={<Placeholder title="About Us" mode="about" />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/messenger" element={<MessengerPage />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Account />} />
          <Route path="/auth/callback" element={<Account />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
    </CompanyProvider>
  );
}

import { useCompany } from './context/CompanyContext';

function Placeholder({ title, mode }: { title: string, mode?: string }) {
  const navigate = useNavigate();
  const { companySettings } = useCompany();

  return (
    <div className="page-container flex flex-col items-center justify-center gap-4 text-center mt-10">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {mode === 'contact' ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4 text-sm font-semibold max-w-sm w-full mx-auto border border-gray-100">
           {companySettings.logo && <img src={companySettings.logo} className="h-16 w-auto mx-auto mb-4" />}
           <p className="text-lg font-black text-[#ff2f7d]">{companySettings.name}</p>
           <div className="text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
             <p className="flex items-center justify-center gap-2 mb-2">📞 {companySettings.mobile}</p>
             <p className="flex items-center justify-center gap-2 mb-2">🟢 {companySettings.whatsapp}</p>
             <p className="flex items-center justify-center gap-2 mb-2">📧 {companySettings.email}</p>
             {companySettings.email2 && <p className="flex items-center justify-center gap-2 mb-2">📧 {companySettings.email2}</p>}
             <p className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-gray-500">📍 {companySettings.address}</p>
           </div>
           <div className="flex gap-4 justify-center pt-2">
             {companySettings.socialLinks?.fbPage && <a href={companySettings.socialLinks.fbPage} className="text-blue-600 font-bold">Facebook</a>}
             {companySettings.socialLinks?.youtube && <a href={companySettings.socialLinks.youtube} className="text-red-600 font-bold">YouTube</a>}
           </div>
        </div>
      ) : mode === 'about' ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4 max-w-sm w-full mx-auto border border-gray-100">
           {companySettings.logo && <img src={companySettings.logo} className="h-16 w-auto mx-auto mb-4" />}
           <h2 className="text-xl font-black text-gray-900">{companySettings.name}</h2>
           <p className="text-gray-600 font-semibold leading-relaxed">
             Welcome to {companySettings.name}! We are a premium e-commerce business dedicated to bringing you the best products. 
           </p>
           <p className="text-gray-600 font-semibold text-xs border-t pt-4">
             Support Hours: {companySettings.supportTime}
             <br/>Website: <a href={companySettings.website} className="text-[#ff2f7d]">{companySettings.website}</a>
           </p>
        </div>
      ) : (
        <p className="text-gray-500 font-semibold">This section is coming soon!</p>
      )}
      <button 
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-full font-bold shadow-lg transition-colors mt-4"
      >
        Back to Home
      </button>
      <BottomNav />
    </div>
  );
}



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Timer, Tag, Percent, Zap, Gift, Home, ArrowRight } from 'lucide-react';
import { Product, Banner } from '../types';
import ProductCard from '../components/ProductCard';
import BottomNav from '../components/BottomNav';
import { useCart } from '../context/CartContext';

import { motion, AnimatePresence } from '../lib/safe-motion';
import { getCachedProducts, fetchProductsAndCache, getCachedBanners, fetchBannersAndCache } from '../utils/productCache';

export default function OffersPage() {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [products, setProducts] = useState<Product[]>(getCachedProducts());
  const [banners, setBanners] = useState<Banner[]>(getCachedBanners());
  const [loading, setLoading] = useState(false); // Cache first, no spinner or delay
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodsData, bannersData] = await Promise.all([
          fetchProductsAndCache(true),
          fetchBannersAndCache()
        ]);

        if (Array.isArray(prodsData)) {
          // Auto calculate discount percentage if not present but prices exist
          const processedProds = prodsData.map(p => {
             if (!p.discount && p.oldPrice && p.oldPrice > p.price) {
                const pct = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
                return { ...p, discount: `${pct}% OFF` };
             }
             return p;
          });
          setProducts(processedProds);
        }
        if (Array.isArray(bannersData)) {
          // Filter for offer-specific banners if type exists, otherwise just main banners for now
          setBanners(bannersData.filter(b => b.status !== false));
        }
      } catch (err) {
        console.error("Error loading offers", err);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, []);


  // Banner slider logic
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const offerProducts = products.filter(p => 
    p.status === 'published' && p.isDeleted !== true && 
    (p.isOffer || p.isFlashSale || (p.oldPrice && p.oldPrice > p.price))
  );

  const flashSaleProducts = products.filter(p => p.isFlashSale && p.status === 'published' && p.isDeleted !== true);

  // Countdown logic for Flash Sale
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 12,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#FF2E86] rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Finding Best Deals...</p>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen pb-32 bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-[120] border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-[15px] font-black text-gray-900 uppercase tracking-wider">অফারসমূহ</h1>
        </div>
        <button 
          onClick={() => navigate('/cart')}
          className="relative bg-gray-50 border border-gray-100 rounded-lg p-2 text-gray-700"
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF2E86] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Banner Slider */}
      {banners.length > 0 ? (
        <div className="relative aspect-[21/9] sm:aspect-[21/7] overflow-hidden bg-gray-100">
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeBannerIndex}
              className="w-full h-full relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={banners[activeBannerIndex].image}
                alt={banners[activeBannerIndex].title}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex flex-col justify-center px-6 sm:px-12">
                 <motion.span 
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="px-2 py-0.5 bg-[#FF2E86] text-white text-[9px] font-black uppercase tracking-widest w-fit rounded mb-2"
                 >
                   {banners[activeBannerIndex].badge || 'Exclusive Deal'}
                 </motion.span>
                 <motion.h2 
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.1 }}
                   className="text-white text-xl sm:text-3xl font-black leading-tight max-w-[200px] sm:max-w-[500px] uppercase tracking-tighter"
                 >
                   {banners[activeBannerIndex].title}
                 </motion.h2>
                 <motion.p 
                   initial={{ y: 10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.2 }}
                   className="text-white/80 text-[11px] sm:text-sm font-bold mt-1 max-w-[250px] sm:max-w-[400px]"
                 >
                   {banners[activeBannerIndex].subtitle}
                 </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
          {/* Indicators */}
          <div className="absolute bottom-3 right-6 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveBannerIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeBannerIndex === i ? 'w-8 bg-[#FF2E86]' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-r from-[#FF2E86] to-pink-500 flex flex-col items-center justify-center text-white">
           <Gift size={40} className="mb-2 opacity-50" />
           <h2 className="font-black text-xl uppercase tracking-widest">Premium Collection Offers</h2>
        </div>
      )}

      {/* Offer Categories / Tabs */}
      <div className="sticky top-14 bg-white/80 backdrop-blur-md z-[110] border-b border-gray-100 overflow-x-auto no-scrollbar py-3 px-4 flex gap-3">
        {[
          { icon: Zap, label: 'Flash Sale', color: 'bg-orange-50 text-orange-600 border-orange-100' },
          { icon: Gift, label: 'Eid Special', color: 'bg-green-50 text-green-600 border-green-100' },
          { icon: Percent, label: 'Big Discount', color: 'bg-purple-50 text-purple-600 border-purple-100' },
          { icon: Tag, label: 'New Arrivals', color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { icon: Zap, label: 'Combo Deal', color: 'bg-pink-50 text-pink-600 border-pink-100' }
        ].map((item, i) => (
          <div key={i} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-[11px] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:shadow-md transition-all ${item.color}`}>
            <item.icon size={14} />
            {item.label}
          </div>
        ))}
      </div>

      <div className="px-4 py-6 space-y-10">
        {/* Flash Sale Section */}
        {flashSaleProducts.length > 0 && (
          <section className="bg-white rounded-3xl p-5 border border-orange-100 shadow-xl shadow-orange-500/5 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-50" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                    <Zap size={22} fill="white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-black text-lg uppercase tracking-tight">Flash Sale Live</h3>
                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Ending Soon - Hurry Up!</p>
                  </div>
                </div>
                
                {/* Countdown Timer */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Time Left:</span>
                  <div className="flex gap-1.5">
                    {[
                      { val: timeLeft.days, unit: 'D' },
                      { val: timeLeft.hours, unit: 'H' },
                      { val: timeLeft.minutes, unit: 'M' },
                      { val: timeLeft.seconds, unit: 'S' }
                    ].map((t, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center text-[15px] font-black shadow-lg">
                          {String(t.val).padStart(2, '0')}
                        </div>
                        <span className="text-[8px] font-black text-gray-400 mt-1">{t.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {flashSaleProducts.map(p => (
                  <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
                ))}
              </div>
              
              <button 
                onClick={() => navigate('/flash-sale')}
                className="w-full mt-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[12px] font-black text-gray-900 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
              >
                View All Flash Deals <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {/* Offer Products Grid */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FF2E86] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#FF2E86]/30">
              <Percent size={22} />
            </div>
            <div>
              <h3 className="text-gray-900 font-black text-lg uppercase tracking-tight">Best Deals For You</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Premium Quality, Lowest Price</p>
            </div>
          </div>

          {offerProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {offerProducts.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                <Gift size={32} className="text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-black text-lg">🎁 বর্তমানে কোনো অফার চালু নেই</h3>
              <p className="text-gray-400 text-[11px] font-bold mt-2 uppercase tracking-widest mb-8">We are preparing new surprises for you. Stay tuned!</p>
              <button 
                onClick={() => navigate('/')}
                className="px-10 h-14 bg-white border-2 border-gray-100 rounded-2xl text-[13px] font-black text-gray-900 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mx-auto shadow-sm"
              >
                <Home size={18} /> হোম পেজে ফিরুন
              </button>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

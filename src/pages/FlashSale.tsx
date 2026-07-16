/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Flame } from 'lucide-react';
import { getCachedProducts, fetchProductsAndCache } from '../utils/productCache';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import BottomNav from '../components/BottomNav';
import { useCart } from '../context/CartContext';


export default function FlashSalePage() {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [products, setProducts] = useState<Product[]>(getCachedProducts());

  useEffect(() => {
    fetchProductsAndCache(true)
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setProducts(data);
        }
      })
      .catch(err => console.error("Error loading products", err));
    window.scrollTo(0, 0);
  }, []);


  // Filter products by flash sale, offer deal, or having discount, and active status
  const flashSaleProducts = products.filter(
    p => p.status === 'published' && p.isDeleted !== true && (p.isFlashSale === true || p.isOffer === true || (p.discountPrice && p.discountPrice < p.price))
  );

  const finalProducts = flashSaleProducts;

  return (
    <div className="page-container min-h-screen pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[120] flex items-center justify-between h-14 px-4 border-b border-gray-100">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-all cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Home</span>
        </button>
        <span className="font-extrabold text-[12px] text-[#ff2f7d] tracking-wider uppercase flex items-center gap-1">
          <Flame size={14} fill="#ff2f7d" className="animate-pulse" />
          <span>Flash Sale Offer</span>
        </span>
        <button 
          onClick={() => navigate('/cart')}
          className="icon-btn relative bg-gray-50 border border-gray-100 rounded-full p-2 cursor-pointer hover:bg-gray-100 text-gray-700"
        >
          <ShoppingCart size={16} />
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">
            {cartCount}
          </span>
        </button>
      </div>

      <div className="px-3">
        {/* Flash Sale Banner */}
        <div className="bg-gradient-to-r from-red-500 to-[#ff2f7d] rounded-xl p-6 text-white my-4 shadow-sm relative overflow-hidden flex flex-col justify-end min-h-[110px]">
          <div className="absolute right-3 top-3 opacity-15 rotate-15 scroll-smooth">
            <Flame size={120} />
          </div>
          <p className="text-[10px] font-black tracking-widest text-red-100 uppercase">Limited Time Active Deals</p>
          <h2 className="text-xl font-black mt-1 leading-tight tracking-tight">UP TO 50% EXTRA OFFERS</h2>
          <p className="text-xs text-red-100 font-medium mt-0.5">Grab your premium products at unbeatable discounted rates</p>
        </div>

        {/* Products Grid */}
        <div className="category-products-grid">
          {finalProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={() => navigate(`/product/${product.id}`)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

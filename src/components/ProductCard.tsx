/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from '../types';
import { Star, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  key?: string | number;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();

  const formatViews = (views: number) => {
    if (views >= 1000) return (views / 1000).toFixed(1) + "k views";
    return views + " views";
  };

  const handleCardClick = () => {
    if (onClick) onClick();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div className="product-card group cursor-pointer" onClick={handleCardClick}>
      {/* Dynamic Floating Badges Stack */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        {product.discount && (
          <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
            {product.discount}
          </span>
        )}
        {product.isFeatured && (
          <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
            ★ Featured
          </span>
        )}
        {product.isOffer && (
          <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
            🔥 Special Offer
          </span>
        )}
        {product.stock === 'Out of Stock' && (
          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
            Out of Stock
          </span>
        )}
      </div>
      
      <div className="product-img-container">
        <img 
          src={product.image} 
          alt={product.name} 
          className="product-img group-hover:scale-110 transition-transform duration-500" 
        />
      </div>

      <div className="product-info">
        <div className="flex items-center justify-between">
          <div className="rating">
            <Star size={10} fill="currentColor" className="text-yellow-400" />
            <span className="font-bold">{product.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Eye size={10} />
            <span>{formatViews(product.views)}</span>
          </div>
        </div>
        
        <h3 className="product-name font-medium">{product.name}</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="price">৳{product.price.toLocaleString()}</span>
            {product.oldPrice && (
              <span className="old-price">৳{product.oldPrice.toLocaleString()}</span>
            )}
          </div>
        </div>

        <button 
          className="w-full h-[30px] bg-primary text-white text-[12px] font-bold rounded-md mt-2 flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
          onClick={handleAddToCart}
        >
          🛒 Add
        </button>
      </div>
    </div>
  );
}

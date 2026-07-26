/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart } from 'lucide-react';
import { PRODUCTS } from '../data';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import BottomNav from '../components/BottomNav';
import { useCart } from '../context/CartContext';

import { getCachedProducts, fetchProductsAndCache, getCachedCategories, fetchCategoriesAndCache } from '../utils/productCache';

// Helper to resolve slugs to human readable categories & custom banner images
export function getCategoryBySlug(slug: string) {
  const norm = slug.toLowerCase();
  
  if (norm === 'saree' || norm === 'saree-collection') {
    return {
      name: 'Saree Collection',
      slug: 'saree',
      queryName: 'Saree',
      banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80'
    };
  }
  if (norm === 'polo-shirt' || norm === 'polo' || norm === 'premium-polo') {
    return {
      name: 'Premium Polo',
      slug: 'polo-shirt',
      queryName: 'Polo Shirt',
      banner: 'https://images.unsplash.com/photo-1625910513397-2856037042a4?w=800&q=80'
    };
  }
  if (norm === 'bags' || norm === 'trendy-bags') {
    return {
      name: 'Trendy Bags',
      slug: 'bags',
      queryName: 'Bags',
      banner: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80'
    };
  }
  if (norm === 'punjabi') {
    return {
      name: 'Punjabi Collection',
      slug: 'punjabi',
      queryName: 'Punjabi',
      banner: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&q=80'
    };
  }
  if (norm === 't-shirt') {
    return {
      name: 'T-Shirt Collection',
      slug: 't-shirt',
      queryName: 'T-Shirt',
      banner: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'
    };
  }
  if (norm === 'shoes') {
    return {
      name: 'Men\'s Shoes',
      slug: 'shoes',
      queryName: 'Shoes',
      banner: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'
    };
  }
  if (norm === 'watches') {
    return {
      name: 'Premium Watches',
      slug: 'watches',
      queryName: 'Watches',
      banner: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80'
    };
  }

  // Generic fallback matching name
  return {
    name: slug.charAt(0).toUpperCase() + slug.slice(1) + ' Collection',
    slug: slug,
    queryName: slug.charAt(0).toUpperCase() + slug.slice(1),
    banner: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'
  };
}

export default function CategoryDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [products, setProducts] = useState<Product[]>(getCachedProducts());
  const [categories, setCategories] = useState<Category[]>(getCachedCategories());
  const [loading, setLoading] = useState(false); // Cache first, no initial spinner

  // Find category matching slug
  const activeCategory = categories.find(cat => (cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')) === slug?.toLowerCase());
  
  const categoryName = activeCategory ? activeCategory.name : getCategoryBySlug(slug || 'saree').name;
  const categoryBanner = activeCategory ? (activeCategory.mainBanner || activeCategory.iconImage || activeCategory.image) : getCategoryBySlug(slug || 'saree').banner;
  const queryName = activeCategory ? activeCategory.name : getCategoryBySlug(slug || 'saree').queryName;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Run fetches in parallel for maximum performance
        const [prodsData, catsData] = await Promise.all([
          fetchProductsAndCache(true),
          fetchCategoriesAndCache()
        ]);

        if (Array.isArray(prodsData)) setProducts(prodsData);
        if (Array.isArray(catsData)) setCategories(catsData);
      } catch (err) {
        console.error("Error loading category details", err);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [slug]);


  const filteredProducts = products
    .filter(p => (
      p.categoryId === activeCategory?.id || 
      (p.categorySlug && slug && p.categorySlug.toLowerCase() === slug.toLowerCase()) ||
      (activeCategory?.slug && p.categorySlug && activeCategory.slug.toLowerCase() === p.categorySlug.toLowerCase()) ||
      (p.categoryName && queryName && p.categoryName.toLowerCase() === queryName.toLowerCase()) ||
      (p.category && queryName && p.category.toLowerCase() === queryName.toLowerCase())
    ) && p.status === 'published' && p.isDeleted !== true)
    .sort((a, b) => (Number(a.sortOrder) || 99) - (Number(b.sortOrder) || 99));

  const finalProducts = filteredProducts;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#FF2E86] rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Collection...</p>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen pb-32 bg-gray-50/30">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-[120] flex items-center justify-between h-14 px-4 border-b border-gray-100">
        <button 
          onClick={() => navigate('/categories')} 
          className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-black text-[13px] truncate text-gray-900 tracking-wider uppercase">
          {categoryName}
        </span>
        <button 
          onClick={() => navigate('/cart')}
          className="relative bg-gray-50 border border-gray-100 rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition-all text-gray-700"
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF2E86] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Hero Banner Section */}
      <div className="category-main-banner relative overflow-hidden">
        <img 
          src={categoryBanner} 
          alt={categoryName}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
          <h2 className="text-white text-2xl sm:text-4xl font-black tracking-tighter drop-shadow-lg mb-1">
            {categoryName}
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded text-[10px] font-black text-white uppercase tracking-widest">
              {finalProducts.length} Premium Products
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 py-6">
        {finalProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {finalProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-[320px] mx-auto text-center py-20">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-100 border border-gray-50">
              <ShoppingCart size={32} className="text-gray-200" />
            </div>
            <h3 className="text-gray-900 font-black text-lg mb-2 tracking-tight">এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট নেই</h3>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-8 leading-relaxed">
              We are working hard to bring you the best collection. Stay tuned!
            </p>
            <button 
              onClick={() => navigate('/categories')}
              className="w-full h-12 bg-white border border-gray-200 rounded-xl text-[12px] font-black text-gray-900 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ChevronLeft size={18} /> Back to Categories
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

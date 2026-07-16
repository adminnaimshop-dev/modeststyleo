
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Category, Product } from '../types';
import BottomNav from '../components/BottomNav';

import { getCachedProducts, fetchProductsAndCache, getCachedCategories, fetchCategoriesAndCache } from '../utils/productCache';

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(
    getCachedCategories().filter(c => c.status !== false)
  );
  const [products, setProducts] = useState<Product[]>(
    getCachedProducts().filter(p => p.status === 'published' && p.isDeleted !== true)
  );
  const [loading, setLoading] = useState(false); // Cache first, zero loading spinner delay
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsData, prodsData] = await Promise.all([
          fetchCategoriesAndCache(),
          fetchProductsAndCache(true)
        ]);

        if (Array.isArray(catsData)) {
          setCategories(catsData.filter(c => c.status !== false));
        }
        if (Array.isArray(prodsData)) {
          setProducts(prodsData.filter(p => p.status === 'published' && p.isDeleted !== true));
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      }
    };


    fetchData();
    window.scrollTo(0, 0);
  }, []);


  const getProductCount = (category: Category) => {
    return products.filter(p => 
      p.categoryId === category.id || 
      p.categoryName?.toLowerCase() === category.name.toLowerCase()
    ).length;
  };

  const filteredCategories = activeTab === 'All' 
    ? categories 
    : categories.filter(c => c.name.toLowerCase().includes(activeTab.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#FF2E86] rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Collections...</p>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen pb-32 bg-gray-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-[120] border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-[15px] font-black text-gray-900 uppercase tracking-wider">Categories</h1>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="sticky top-14 bg-white/80 backdrop-blur-md z-[110] border-b border-gray-100 overflow-x-auto no-scrollbar py-2 px-4 flex gap-2">
        {['All', ...categories.slice(0, 5).map(c => c.name)].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-[#FF2E86] text-white shadow-md shadow-[#FF2E86]/20' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredCategories.map((category) => {
            const prodCount = getProductCount(category);
            const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
            const categoryImage = category.mainBanner || category.iconImage || category.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80';

            return (
              <div 
                key={category.id}
                onClick={() => navigate(`/category/${slug}`)}
                className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Banner Image */}
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img 
                    src={categoryImage} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  {/* Floating Count */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-md text-[9px] font-black text-gray-900 uppercase tracking-tighter shadow-sm">
                    {prodCount} Items
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3">
                    <h3 className="text-white font-black text-[13px] leading-tight tracking-tight mb-2 drop-shadow-md truncate">
                      {category.name}
                    </h3>
                    <div className="w-full py-1.5 bg-white text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 group-hover:bg-[#FF2E86] group-hover:text-white transition-all">
                      View Products <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <ChevronLeft size={24} className="text-gray-300 rotate-180" />
            </div>
            <h3 className="text-gray-900 font-black">No Categories Found</h3>
            <p className="text-gray-400 text-[12px] font-bold mt-1 uppercase tracking-wider">Try searching for something else</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

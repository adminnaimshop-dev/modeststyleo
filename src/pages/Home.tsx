/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import CategoryRow from '../components/CategoryRow';
import CollectionBanner from '../components/CollectionBanner';
import Header from '../components/Header';
import HeroBanner from '../components/HeroBanner';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import { CATEGORIES, COLLECTION_BANNERS, MAIN_HERO, PRODUCTS } from '../data';
import { getCachedProducts, fetchProductsAndCache, getCachedCategories, getCachedBanners, fetchCategoriesAndCache, fetchBannersAndCache } from '../utils/productCache';
import { Flame, SearchX, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Product, Category, Banner } from '../types';
import CustomerFooter from '../components/CustomerFooter';

const getCategorySectionBgColor = (cat: any) => {
  const nameLower = cat.name.toLowerCase();
  if (nameLower.includes('saree')) return '#b50f4e';
  if (nameLower.includes('polo')) return '#16a34a';
  if (nameLower.includes('bag')) return '#8b5cf6';
  if (nameLower.includes('punjabi')) return '#0f7eb5';
  if (nameLower.includes('t-shirt')) return '#da5811';
  if (nameLower.includes('shoe')) return '#4f46e5';
  if (nameLower.includes('watch')) return '#1e293b';
  return '#ff2f7d';
};

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Dynamic products state - initialize instantly from memory cache (with high quality static fallbacks)
  const [products, setProducts] = useState<Product[]>(getCachedProducts());
  const [categoriesDb, setCategoriesDb] = useState<Category[]>(getCachedCategories());
  const categories = categoriesDb.filter(c => c.status !== false);
  const banners = COLLECTION_BANNERS;
  const [bannersDb, setBannersDb] = useState<any[]>(getCachedBanners());

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const flashSaleRef = useRef<HTMLDivElement>(null);

  // Filter active and sort by dynamic catalog sort sequence
  const displayableProducts = products
    .filter(p => p.status === 'published' && p.isDeleted !== true)
    .sort((a, b) => (Number(a.sortOrder) || 99) - (Number(b.sortOrder) || 99));

  // Search logic
  const filteredProducts = displayableProducts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    const searchFields = [
      p.name,
      p.category,
      p.categoryName,
      p.brand,
      p.sku,
      p.fabric,
      p.gsm,
      p.googleKeywords,
      ...(p.websiteKeywords || []),
      ...(p.facebookKeywords || []),
      ...(p.tiktokKeywords || []),
      ...(p.youtubeKeywords || []),
      ...(p.banglaKeywords || []),
      ...(p.englishKeywords || []),
      ...(p.wrongSpellingKeywords || []),
      ...(p.hashtagKeywords || []),
      ...(p.colors || []),
      ...(p.sizes || [])
    ].filter(Boolean).map(f => String(f).toLowerCase());

    return searchFields.some(field => field.includes(q));
  });

  // Category Wise Auto Add for Flash Sale Section
  const categoryWiseFlashProducts = filteredProducts.filter(p =>
    p.isFlashSale === true || p.isOffer === true || (p.discountPrice && p.discountPrice < p.price)
  );

  const finalFlashProducts = categoryWiseFlashProducts;

  useEffect(() => {
    // Background parallel silent fetches to optimize latency
    // This updates the local state silently without layout flickering
    fetchProductsAndCache(true)
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(err => console.error("Error loading products from cache/API", err));

    fetchBannersAndCache()
      .then(data => {
        // Initial fallback
      })
      .catch(err => console.error(err));
      
    fetchCategoriesAndCache().then(data => {
        if (Array.isArray(data)) {
          setCategoriesDb(data);
        }
      })
      .catch(err => console.error("Error loading categories from cache/API", err));


    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Flash Sale Autoplay Slider Setup (Runs every 3 seconds)
  useEffect(() => {
    const el = flashSaleRef.current;
    if (!el || finalFlashProducts.length === 0) return;

    const interval = setInterval(() => {
      const cardWidth = 177; // card width (165px) + gap (12px)
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [finalFlashProducts]);

  const handleProductClick = (id: string) => {
    // Navigate instantly without blocking
    navigate(`/product/${id}`);

    // Fire view count increment asynchronously in background
    fetch(`/api/products/${id}/view`, { method: "POST" })
      .then(res => res.json())
      .then(() => console.log(`Views count incremented on server for product ${id}`))
      .catch(err => console.error(err));
  };

  const mainBanners = bannersDb.filter(b => b.type === "main" && b.status === true);

  const categoryMainBanners = categoriesDb
    .filter(cat => cat.status !== false && cat.mainBanner)
    .map(cat => ({
      id: `cat-main-${cat.id}`,
      title: cat.name,
      subtitle: cat.shortTitle || "Traditional Luxury Series",
      badge: "Category Exclusive",
      image: cat.mainBanner!,
      bgColor: getCategorySectionBgColor(cat),
      type: "main",
      status: true,
      serial: cat.serialNumber || 1,
      categorySlug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
    }));

  const interleavedBanners = [];
  let catIdx = 0;
  let mainIdx = 0;
  while (catIdx < categoryMainBanners.length || mainIdx < mainBanners.length) {
    if (catIdx < categoryMainBanners.length) {
      interleavedBanners.push(categoryMainBanners[catIdx]);
      catIdx++;
    }
    if (mainIdx < mainBanners.length) {
      interleavedBanners.push(mainBanners[mainIdx]);
      mainIdx++;
    }
  }
  const allMainBanners = interleavedBanners;

  return (
    <div className="page-container">
      <Header />

      <main className="flex flex-col">
        {searchQuery ? (
          <div className="p-4 pt-6">
            <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Search size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Search Results</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Found {filteredProducts.length} items for "{searchQuery}"</p>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p.id)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <SearchX className="text-gray-300" size={32} />
                </div>
                <h3 className="text-sm font-black text-gray-900 mb-1">No products found</h3>
                <p className="text-xs font-bold text-gray-400 px-10">Try searching with different keywords or category.</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-6 text-xs font-black text-primary border-b border-primary pb-0.5"
                >
                  Clear search and show all
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <HeroBanner banners={allMainBanners} />
            <CategoryRow categories={categories} />

            {finalFlashProducts.length > 0 && (
              <>
                <SectionHeader 
                  title="Flash Sale" 
                  icon={<Flame size={20} fill="#ff2f7d" />} 
                  onViewAll={() => navigate('/flash-sale')}
                />
                <div ref={flashSaleRef} className="flash-sale-scroll">
                  {finalFlashProducts.map(p => (
                    <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p.id)} />
                  ))}
                </div>
              </>
            )}

            {categories.map(cat => {
              const catProducts = filteredProducts.filter(p => 
                p.categoryId === cat.id ||
                (p.categorySlug && cat.slug && p.categorySlug.toLowerCase() === cat.slug.toLowerCase()) ||
                (p.categoryName && cat.name && p.categoryName.toLowerCase() === cat.name.toLowerCase()) ||
                (p.category && cat.name && p.category.toLowerCase() === cat.name.toLowerCase())
              );
              if (catProducts.length === 0) return null;

              const displayedCatProducts = catProducts.slice(0, 4);
              const customSectionBanner = cat.sectionBanner || cat.mainBanner || cat.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80";

              return (
                <section key={cat.id} className="category-section">
                  <div className="category-section-head">
                    <h3 className="font-bold">{cat.name}</h3>
                    <button 
                      className="text-xs font-semibold text-primary"
                      onClick={() => navigate(`/category/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`)}
                    >
                      View All ›
                    </button>
                  </div>

                  <div className="mb-4">
                    <CollectionBanner 
                      banner={{
                        id: `cat-sec-${cat.id}`,
                        title: cat.name,
                        subtitle: "Premium Collection",
                        image: customSectionBanner,
                        bgColor: getCategorySectionBgColor(cat),
                        type: "section",
                        status: true
                      }} 
                    />
                  </div>

                  <div className="product-grid">
                    {displayedCatProducts.map(p => (
                      <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p.id)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>

      <CustomerFooter />
      <BottomNav />
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoBack } from '../utils/navigation';
import { updateSessionTracker, trackEvent } from '../utils/sessionTracker';
import { PRODUCTS, DEMO_REVIEWS } from '../data';
import { getCachedProductById, getCachedProducts, fetchProductsAndCache } from '../utils/productCache';
import { 
  ChevronLeft, ShoppingCart, Star, Share2, Eye, CheckCircle2, Heart,
  Minus, Plus, Shield, ShieldCheck, Truck, RotateCcw, Award, Sparkles,
  MessageSquare, HelpCircle, Phone, Send, Copy, FileText, BadgeCheck,
  Check, Info, Box, ClipboardList, Scissors, Scale, HelpCircle as FitIcon,
  RefreshCw, Layers, Banknote, Lock, Zap, Wind, Sun, Flame
} from 'lucide-react';
import { Product, Review } from '../types';
import ProductCard from '../components/ProductCard';
import BottomNav from '../components/BottomNav';
import { useCart } from '../context/CartContext';
import ReviewFormModal from '../components/ReviewFormModal';
import FullScreenPreview from '../components/FullScreenPreview';
import LoginPopup from '../components/LoginPopup';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { addToCart, cartCount } = useCart();
  
  // Dynamic API product fetching with fallback - instant loading from cache
  const cachedProds = getCachedProducts();
  const cachedCurrent = id ? getCachedProductById(id) : undefined;

  const [productsList, setProductsList] = useState<Product[]>(
    cachedProds.filter(p => p.status === 'published' && p.isDeleted !== true)
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(cachedCurrent);
  const [isLoading, setIsLoading] = useState(!cachedCurrent);
  
  // Multiple images state
  const [selectedImage, setSelectedImage] = useState<string>('');
 
  // State variables for color, size, quantity, reviews, toast and full details toggler
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // New dynamic states
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [previewReviewImage, setPreviewReviewImage] = useState<string | null>(null);
  const [reviewsReloadKey, setReviewsReloadKey] = useState(0);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch full list of products and set current active product
  useEffect(() => {
    // Attempt instant retrieval from local cache to eliminate loading delays
    const initialProduct = id ? getCachedProductById(id) : undefined;
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    // Parallel fetch & background sync to check for updates silently
    fetchProductsAndCache(true)
      .then(data => {
        if (Array.isArray(data)) {
          const activeProducts = data.filter(p => p.status === 'published' && p.isDeleted !== true);
          setProductsList(activeProducts);
          const current = activeProducts.find(p => p.id === id);
          if (current) {
            setSelectedProduct(current);
            setIsLoading(false);
          } else if (!initialProduct) {
            setSelectedProduct(undefined);
            setIsLoading(false);
          }
        }
      })
      .catch(err => {
        console.error("Error updating cache in background", err);
        setIsLoading(false);
      });

    // Handle session tracking and page analytics
    const activeProd = initialProduct || (id ? getCachedProductById(id) : undefined);
    if (activeProd) {
      updateSessionTracker(prev => {
        const existing = prev.viewedProducts.find(vp => vp.id === activeProd.id);
        let newViewed = [...prev.viewedProducts];
        if (existing) {
          newViewed = newViewed.map(vp => vp.id === activeProd.id ? { ...vp, count: vp.count + 1, lastViewed: new Date().toISOString() } : vp);
        } else {
          newViewed.push({ id: activeProd.id, name: activeProd.name, image: activeProd.images?.[0] || activeProd.image, count: 1, lastViewed: new Date().toISOString() });
        }
        return {
          ...prev,
          status: prev.status === 'Order Placed' ? prev.status : 'Product Viewed',
          viewedProducts: newViewed
        };
      });
      trackEvent('Product View', activeProd.name);
    }
    
    // Clear size and quantity selections on change
    setSelectedSize('');
    setQty(1);
    window.scrollTo(0, 0);
  }, [id]);

  // View count increment and parallel api data fetching
  useEffect(() => {
    if (selectedProduct?.id) {
      // Parallelize: 1. Send view POST request (non-blocking)
      fetch(`/api/products/${selectedProduct.id}/view`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSelectedProduct(prev => prev && prev.id === selectedProduct.id ? { ...prev, views: data.views } : prev);
          }
        })
        .catch(err => console.error("Error incrementing views", err));

      // Synchronize primary preview image
      setSelectedImage(selectedProduct.images?.[0] || selectedProduct.image);

      // Save to recently viewed list (client-side only)
      try {
        const storedViews = localStorage.getItem('recently_viewed');
        let viewsList = storedViews ? JSON.parse(storedViews) : [];
        if (!Array.isArray(viewsList)) viewsList = [];
        viewsList = viewsList.filter((item: any) => item && item.id !== selectedProduct.id);
        viewsList.unshift({
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          oldPrice: selectedProduct.oldPrice,
          image: selectedProduct.image,
          category: selectedProduct.category,
          rating: selectedProduct.rating
        });
        if (viewsList.length > 12) viewsList.pop();
        localStorage.setItem('recently_viewed', JSON.stringify(viewsList));
      } catch (err) {
        console.error("Error setting recently viewed list", err);
      }

      // Parallelize: 2. Fetch reviews (non-blocking)
      fetch(`/api/reviews?productId=${selectedProduct.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setReviews(data);
          } else {
            setReviews(DEMO_REVIEWS.filter(r => r.productId === selectedProduct.id));
          }
        })
        .catch(() => {
          setReviews(DEMO_REVIEWS.filter(r => r.productId === selectedProduct.id));
        });
    }
  }, [selectedProduct?.id, reviewsReloadKey]);

  // Load recently viewed products list on change
  useEffect(() => {
    if (selectedProduct?.id) {
      try {
        const stored = localStorage.getItem('recently_viewed');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentlyViewed(parsed.filter(p => p && p.id !== selectedProduct.id));
          }
        }
      } catch (e) {
        console.error("Error parsing recently viewed items", e);
      }
    }
  }, [selectedProduct?.id]);

  // SKELETON UI FOR SLOW CONNECTIONS (Saves users from seeing a separate white/loading screen)
  if (isLoading && !selectedProduct) {
    return (
      <div className="page-container product-details-page relative min-h-screen bg-white">
        {/* Skeleton Top Header Bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[120] flex items-center justify-between h-14 px-4 border-b border-gray-100">
          <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-full" />
          <div className="w-24 h-4 bg-gray-200 animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Skeleton Body Layout matches actual details layout exactly */}
        <main className="flex flex-col mt-3 px-3 space-y-4">
          {/* Gallery Block */}
          <div className="w-full aspect-square bg-gray-100 animate-pulse rounded-2xl shadow-inner" />
          <div className="flex gap-2 pb-2">
            <div className="w-14 h-14 bg-gray-100 animate-pulse rounded-xl" />
            <div className="w-14 h-14 bg-gray-100 animate-pulse rounded-xl" />
            <div className="w-14 h-14 bg-gray-100 animate-pulse rounded-xl" />
          </div>

          {/* Product Title Card */}
          <div className="border border-gray-100 p-4 rounded-xl bg-white space-y-3 shadow-xs">
            <div className="w-16 h-5 bg-gray-150 animate-pulse rounded-full" />
            <div className="w-3/4 h-6 bg-gray-150 animate-pulse rounded" />
            <div className="flex gap-2 pt-1">
              <div className="w-12 h-4 bg-gray-100 animate-pulse rounded" />
              <div className="w-16 h-4 bg-gray-100 animate-pulse rounded" />
              <div className="w-20 h-4 bg-gray-100 animate-pulse rounded" />
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
              <div className="w-24 h-8 bg-gray-200 animate-pulse rounded-lg" />
              <div className="w-16 h-5 bg-gray-100 animate-pulse rounded" />
            </div>
          </div>

          {/* Selectors */}
          <div className="border border-gray-100 p-4 rounded-xl bg-white space-y-3 shadow-xs">
            <div className="w-20 h-4 bg-gray-150 animate-pulse rounded" />
            <div className="flex gap-2.5">
              <div className="w-12 h-9 bg-gray-100 animate-pulse rounded-lg" />
              <div className="w-12 h-9 bg-gray-100 animate-pulse rounded-lg" />
              <div className="w-12 h-9 bg-gray-100 animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Button actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-12 bg-gray-150 animate-pulse rounded-xl" />
            <div className="h-12 bg-gray-200 animate-pulse rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Box className="text-gray-400" size={40} />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-8 font-medium">The product you are looking for might have been removed or is no longer available.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  // Related Products - strictly by category, excluding current product, only published & not deleted
  const finalRelatedProducts = productsList.filter(p =>
    p.id !== selectedProduct.id &&
    p.categoryId === selectedProduct.categoryId &&
    p.status === 'published' &&
    p.isDeleted !== true
  ).slice(0, 8);

  const handleShareProduct = () => {
    const shareData = {
      title: selectedProduct.name,
      text: selectedProduct.shortDescription || 'Check out this premium item on NaimShop!',
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => showToast("📤 Shared successfully!"))
        .catch(() => {
          navigator.clipboard.writeText(window.location.href);
          showToast("📋 Link copied to clipboard!");
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("📋 Link copied to clipboard!");
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000) return (views / 1000).toFixed(1) + "k views";
    return views + " views";
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast("Please select size first");
      return;
    }
    addToCart(selectedProduct, selectedSize, qty);
    
    // Track Add to Cart
    updateSessionTracker(prev => ({ ...prev, status: prev.status === 'Order Placed' ? prev.status : 'Add to Cart' }));
    trackEvent('Add to Cart', `${selectedProduct.name} (${selectedSize}, qty: ${qty})`);
    
    showToast(`🛒 Added to Cart! Size: ${selectedSize}, Qty: ${qty}`);
  };

  const handleOrderNow = () => {
    if (!selectedSize) {
      showToast("Please select size first");
      return;
    }
    
    // Track Buy Now
    updateSessionTracker(prev => ({ ...prev, status: prev.status === 'Order Placed' ? prev.status : 'Checkout Started' }));
    trackEvent('Buy Now', `${selectedProduct.name} (${selectedSize}, qty: ${qty})`);
    
    // Navigate to checkout with product info
    navigate('/checkout', { 
      state: { 
        product: selectedProduct, 
        size: selectedSize, 
        qty: qty 
      } 
    });
  };

  const handleViewAllReviewsClick = () => {
    const savedUser = localStorage.getItem('loggedInCustomer');
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    if (!currentUser?.email) {
      setIsLoginPopupOpen(true);
      return;
    }
    navigate(`/product/${selectedProduct.id}/reviews`);
  };

  const regularPrice = selectedProduct.oldPrice || (selectedProduct.price * 1.25);
  const discountPercent = Math.round(((regularPrice - selectedProduct.price) / regularPrice) * 100);

  // Detail Sub-component Helper
  const Detail = ({ label, value }: { label: string; value?: string }) => (
    <div className="detail-row">
      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{label}</span>
      <span className="text-gray-800 font-bold text-xs">{value || 'N/A'}</span>
    </div>
  );

  // Helper for multiple images array
  const productImages = selectedProduct.images && selectedProduct.images.length > 0
    ? selectedProduct.images
    : [selectedProduct.image];

  return (
    <div className="page-container product-details-page relative min-h-screen">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-black text-white px-5 py-3 rounded-xl border border-gray-800 text-xs font-bold text-center shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Detailed Zoom Overlay */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-black/90 z-[2000] flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <img 
            src={selectedImage || selectedProduct.image} 
            alt="Zoomed preview" 
            className="max-w-full max-h-[80vh] object-contain rounded-xl animate-fade-in"
            referrerPolicy="no-referrer"
          />
          <span className="text-white text-xs mt-4 font-bold bg-white/10 px-4 py-2 rounded-full uppercase tracking-wider">
            Tap anywhere to close
          </span>
        </div>
      )}

      {/* 1. Header/Top Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[120] flex items-center justify-between h-14 px-4 border-b border-gray-100">
        <button onClick={goBack} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>
        <span className="font-extrabold text-[10px] max-w-[150px] truncate text-gray-400 tracking-widest">{selectedProduct.category.toUpperCase()} VIEW</span>
        <div className="flex items-center gap-2">
          <button onClick={handleShareProduct} className="p-2 text-gray-600 hover:text-primary transition-colors"><Share2 size={18} /></button>
          <button onClick={() => navigate('/cart')} className="p-2 relative text-gray-600 hover:text-primary transition-colors cursor-pointer">
            <ShoppingCart size={18} />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      <main className="flex flex-col mt-3">
        {/* 2. Main Product Image + 3. Thumbnail Scroll */}
        <div className="product-gallery px-2 relative">
          <div className="relative overflow-hidden rounded-xl cursor-zoom-in group" onClick={() => setIsZoomed(true)}>
            {/* Thumbnail-first blurred background placeholder */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-50 transition-opacity duration-500"
              style={{ backgroundImage: `url(${selectedProduct.image})` }}
            />
            <img 
              className="main-product-image shadow-sm mb-2 transition-all duration-300 hover:scale-105 relative z-10 w-full h-auto object-cover" 
              src={selectedImage || selectedProduct.image} 
              alt={selectedProduct.name}
              referrerPolicy="no-referrer"
              loading="eager"
            />
            {/* Zoom Hint Badge */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-1 rounded z-20">
              🔍 Tap to Zoom
            </div>
          </div>

          {/* 1. Wishlist Heart icon */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
              showToast(isWishlisted ? "💔 Removed from Wishlist" : "💖 Added to Wishlist!");
            }}
            className="absolute top-4 right-6 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg border border-gray-100 z-10 hover:scale-110 active:scale-95 transition-all"
          >
            <Heart 
              size={18} 
              fill={isWishlisted ? "#ff2f7d" : "none"} 
              className={isWishlisted ? "text-[#ff2f7d]" : "text-gray-500"} 
            />
          </button>

          <div className="thumbnail-scroll">
            {productImages.map((img, index) => (
              <button
                key={index}
                className={`thumb ${selectedImage === img ? "active ring-2 ring-primary" : "ring-1 ring-gray-200"}`}
                onClick={() => {
                  setSelectedImage(img);
                  const colorMatch = selectedProduct.colorsList?.find(c => c.imageUrl === img);
                  if (colorMatch) {
                    setSelectedColor(colorMatch.name);
                  }
                }}
              >
                <img 
                  src={img} 
                  alt="thumbnail" 
                  referrerPolicy="no-referrer" 
                  loading="lazy"
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Padding Box wrapper for metadata and controls */}
        <div className="px-2 mt-2">
          {/* 4. Product Name + Rating + Views + Stock + SKU */}
          <div className="product-info-box border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
            <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
              {selectedProduct.category}
            </span>
            <h1 className="font-extrabold text-gray-900 leading-tight text-lg mb-2">
              {selectedProduct.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 font-medium pb-4">
              <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded font-bold">
                <Star size={12} fill="currentColor" />
                <span>⭐ {selectedProduct.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded font-bold">
                <span>👁 {formatViews(selectedProduct.views)}</span>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold">
                <span className="stock">● In Stock</span>
              </div>
              <div className="ml-auto text-gray-400 font-bold">
                SKU: <span className="text-gray-900 font-bold">{selectedProduct.sku || 'SAR-001'}</span>
              </div>
            </div>

            {/* 5. Price + Discount */}
            <div className="price-row mt-3 pt-3 border-t border-gray-50 flex items-baseline gap-2.5">
              <b className="text-primary text-2xl font-black">৳{(selectedProduct.discountPrice || selectedProduct.price).toLocaleString()}</b>
              {regularPrice && (
                <>
                  <del className="text-xs text-gray-400">৳{regularPrice.toLocaleString()}</del>
                  <span className="bg-primary/10 text-primary font-black px-2.5 py-0.5 rounded text-[10px]">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 6. Size Select */}
          {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
            <div className="size-section border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">SELECT SIZE *</h4>
              <div className="flex gap-2.5 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                {selectedProduct.sizes.map(size => (
                  <button
                    key={size}
                    className={`
                      min-w-[48px] h-[36px] rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0
                      ${selectedSize === size 
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105' 
                        : 'bg-white text-gray-600 border-gray-200'}
                    `}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. Quantity Select & Dynamic Stock Information */}
          {(() => {
            const activeVariant = selectedProduct.variants?.find(v => 
              (!selectedColor || v.color === selectedColor) && 
              (!selectedSize || v.size === selectedSize)
            );

            const stockValue = activeVariant 
              ? (activeVariant.stock !== undefined ? activeVariant.stock : 10) 
              : (typeof selectedProduct.stock === 'number' 
                  ? selectedProduct.stock 
                  : (selectedProduct.stock === 'Out of Stock' ? 0 : 50));

            const isOutOfStock = stockValue === 0 || selectedProduct.stock === 'Out of Stock';

            // Auto-adjust qty limit
            if (qty > stockValue && stockValue > 0) {
              setQty(stockValue);
            }

            return (
              <div className="quantity-row border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">SELECT QUANTITY</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Adjust the order count</p>
                  </div>
                  {isOutOfStock ? (
                    <div className="bg-red-50 text-red-600 font-black text-xs px-3.5 py-1.5 rounded-lg border border-red-100 animate-pulse">
                      সোল্ড আউট / স্টক আউট 
                    </div>
                  ) : (
                    <div className="qty-box flex items-center gap-1.5 border border-gray-200 rounded-xl p-1 bg-gray-50">
                      <button 
                        type="button" 
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        disabled={qty <= 1}
                        className="w-8 h-8 flex items-center justify-center font-bold text-gray-650 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-gray-850">{qty}</span>
                      <button 
                        type="button" 
                        onClick={() => setQty(Math.min(stockValue, qty + 1))}
                        disabled={qty >= stockValue}
                        className="w-8 h-8 flex items-center justify-center font-bold text-gray-650 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {!isOutOfStock && (
                  <p className="text-[10px] text-indigo-600 font-bold mt-2.5 bg-indigo-50/50 p-2 rounded-lg flex items-center gap-1.5">
                    <Sparkles size={11} className="text-indigo-500 animate-bounce" />
                    <span>হাতে আছে মাত্র <b>{stockValue}টি</b>! দ্রুত অর্ডার করুন।</span>
                  </p>
                )}
              </div>
            );
          })()}

          {/* Short Description */}
          {selectedProduct.shortDescription && (
            <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Short Description</h4>
              <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                {selectedProduct.shortDescription}
              </p>
            </div>
          )}

          {/* Product Highlights */}
          {(() => {
            const highlightsList = selectedProduct.highlights || [
              '১০০% প্রিমিয়াম কোয়ালিটি ও চমৎকার ফিনিশিং',
              'আরামদায়ক ও আধুনিক স্টাইলিশ ফিটিং',
              'সহজ ওয়াশ ও টেকসই দীর্ঘস্থায়ী রঙ',
              'রিল্যাক্সড ক্যাজুয়াল বা সেমি-ফরমাল পরিধানের উপযোগী'
            ];
            return (
              <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Product Highlights</h4>
                <div className="space-y-2">
                  {highlightsList.map((hl, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700 font-semibold">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Product Specifications (Detailed Sheet) */}
          <div className="details-box border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">Specification Sheet</h4>
            
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Scissors size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">Fabric</span>
                  <span className="font-bold text-gray-800">{selectedProduct.fabric || 'Premium Silk Weave'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Scale size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">GSM</span>
                  <span className="font-bold text-gray-800">{selectedProduct.gsm || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FitIcon size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">Fit</span>
                  <span className="font-bold text-gray-800">{selectedProduct.fit || 'Regular Fit'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RotateCcw size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">Care</span>
                  <span className="font-bold text-gray-800">{selectedProduct.care || 'Gentle Hand Wash'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">Brand</span>
                  <span className="font-bold text-gray-800">{selectedProduct.brand || 'NaimShop Premium'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Layers size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">Category</span>
                  <span className="font-bold text-gray-800">{selectedProduct.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Eye size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">Views</span>
                  <span className="font-bold text-gray-800">{formatViews(selectedProduct.views || 2200)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ShoppingCart size={13} className="text-gray-400" />
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase">Total Sold</span>
                  <span className="font-bold text-gray-850">{(selectedProduct.sold !== undefined ? selectedProduct.sold : 138)} units</span>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-50 pt-3">
              <p className={`text-xs text-gray-650 leading-relaxed font-semibold ${isDescExpanded ? '' : 'line-clamp-3'}`}>
                {selectedProduct.fullDescription || 'Elegant lightweight traditional wear designed for comfortable styling and maximum durability.'}
              </p>
              <button 
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="read-more text-[10px] font-black text-primary uppercase tracking-wider mt-1.5 block cursor-pointer"
              >
                {isDescExpanded ? 'Show Less Details' : 'Full Product Details'}
              </button>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4 space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-50">Delivery Information</h4>
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Truck size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase">Inside Dhaka</p>
                  <p>৳{selectedProduct.deliveryInsideDhaka !== undefined ? selectedProduct.deliveryInsideDhaka : 70} Flat Rate Delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Truck size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase">Outside Dhaka</p>
                  <p>৳{selectedProduct.deliveryOutsideDhaka !== undefined ? selectedProduct.deliveryOutsideDhaka : 130} Flat Rate Delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Check size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase">Estimated Time</p>
                  <p>{selectedProduct.deliveryTime || '২-৩ দিন'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Return Policy */}
          {(() => {
            const policies = selectedProduct.returnPolicy || [
              '৭ দিনের মধ্যে সহজ রিটার্ন সুবিধা',
              'ত্রুটিযুক্ত বা ভুল সাইজের পণ্য ১০০% পরিবর্তনযোগ্য',
              'পণ্য রিটার্ন করার সময় আসল প্যাকেজিং ও ট্যাগ থাকতে হবে'
            ];
            return (
              <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4 space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-50">Return Policy</h4>
                <div className="space-y-2">
                  {policies.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 font-semibold">
                      <RotateCcw size={13} className="text-indigo-600 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Return Policy */}
          {(() => {
            const policies = selectedProduct.returnPolicy || [
              '৭ দিনের মধ্যে সহজ রিটার্ন সুবিধা',
              'ত্রুটিযুক্ত বা ভুল সাইজের পণ্য ১০০% পরিবর্তনযোগ্য',
              'পণ্য রিটার্ন করার সময় আসল প্যাকেজিং ও ট্যাগ থাকতে হবে'
            ];
            return (
              <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4 space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-50">Return Policy</h4>
                <div className="space-y-2">
                  {policies.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 font-semibold">
                      <RotateCcw size={13} className="text-indigo-600 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ================= EXTRA DYNAMIC MARKETING & PREMIUM SECTIONS ================= */}

          {/* 10. People Viewing (এখন দেখছেন) */}
          {(() => {
            const viewing = selectedProduct.peopleViewingCount !== undefined 
              ? selectedProduct.peopleViewingCount 
              : (8 + (selectedProduct.name.length % 5));
            if (viewing <= 0) return null;
            return (
              <div className="border border-emerald-100 p-3.5 rounded-xl bg-emerald-50/40 shadow-xs mb-4 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>এখন <b>{viewing} জন</b> এই প্রোডাক্টটি দেখছেন!</span>
                </div>
                <Eye size={14} className="text-emerald-600" />
              </div>
            );
          })()}

          {/* 9. Recently Bought (গত ২৪ ঘণ্টায় কেনা হয়েছে) */}
          {(() => {
            const bought = selectedProduct.recentBoughtCount !== undefined 
              ? selectedProduct.recentBoughtCount 
              : (12 + (selectedProduct.name.length % 6));
            if (bought <= 0) return null;
            return (
              <div className="border border-amber-100 p-3.5 rounded-xl bg-amber-50/40 shadow-xs mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-amber-850">
                  <Flame size={14} className="text-amber-500 animate-bounce" />
                  <span>গত ২৪ ঘণ্টায় <b>{bought} জন</b> এটি কিনেছেন!</span>
                </div>
                <Sparkles size={13} className="text-amber-500" />
              </div>
            );
          })()}

          {/* 11. Offers & Promos (উপলব্ধ অফারসমূহ) */}
          {(() => {
            const offerText = selectedProduct.offersInfo?.discountText;
            const freeDel = selectedProduct.offersInfo?.freeDelivery;
            const coupon = selectedProduct.offersInfo?.couponCode;

            if (!offerText && !freeDel && !coupon && !selectedProduct.isOffer) return null;

            return (
              <div className="border border-indigo-100 p-4 rounded-xl bg-indigo-50/30 shadow-sm mb-4 space-y-3">
                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={13} />
                  <span>উপলব্ধ অফারসমূহ / OFFERS</span>
                </h4>

                <div className="space-y-2">
                  {offerText && (
                    <div className="bg-white p-2.5 rounded-lg border border-indigo-100/60 text-xs font-bold text-indigo-900 flex items-center gap-2">
                      <Zap size={14} className="text-amber-500 shrink-0" />
                      <span>{offerText}</span>
                    </div>
                  )}

                  {freeDel && (
                    <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <Truck size={14} className="text-emerald-500 shrink-0" />
                      <span>আজ অর্ডার করলেই পাচ্ছেন সম্পূর্ণ <b>ফ্রি ডেলিভারি</b> সুবিধা!</span>
                    </div>
                  )}

                  {coupon && (
                    <div className="bg-white p-2.5 rounded-lg border border-dashed border-indigo-300 flex items-center justify-between text-xs">
                      <div className="font-bold text-gray-700">
                        কুপন কোড: <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black uppercase tracking-wider">{coupon}</span>
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(coupon);
                          showToast("📋 Coupon copied to clipboard!");
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase cursor-pointer"
                      >
                        Copy Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 1. Our Commitment (আমাদের প্রতিশ্রুতি) */}
          <div className="border border-gray-150 p-4 rounded-xl bg-white shadow-xs mb-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center mb-3">🛡️ আমাদের প্রতিশ্রুতি (Commitment)</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                <BadgeCheck className="text-emerald-500 mx-auto mb-1" size={18} />
                <p className="text-[10px] font-black text-slate-800 leading-tight">100% Original</p>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">গ্যারান্টি</p>
              </div>

              <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                <Truck className="text-blue-500 mx-auto mb-1" size={18} />
                <p className="text-[10px] font-black text-slate-800 leading-tight">Fast Delivery</p>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">দ্রুত ডেলিভারি</p>
              </div>

              <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                <Banknote className="text-amber-500 mx-auto mb-1" size={18} />
                <p className="text-[10px] font-black text-slate-800 leading-tight">Cash on Del.</p>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">হাতে পেয়ে পেমেন্ট</p>
              </div>

              <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                <RotateCcw className="text-pink-500 mx-auto mb-1" size={18} />
                <p className="text-[10px] font-black text-slate-800 leading-tight">Easy Return</p>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">৭ দিনের রিটার্ন</p>
              </div>

              <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                <Lock className="text-indigo-600 mx-auto mb-1" size={18} />
                <p className="text-[10px] font-black text-slate-800 leading-tight">Secure Pay</p>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">১০০% নিরাপদ</p>
              </div>

              <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                <Award className="text-purple-600 mx-auto mb-1" size={18} />
                <p className="text-[10px] font-black text-slate-800 leading-tight">Trusted Seller</p>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">সেরা কাস্টমার সেবা</p>
              </div>
            </div>
          </div>

          {/* 4. Available Colors & Dynamic Image Swap */}
          {selectedProduct.colorsList && selectedProduct.colorsList.length > 0 && (
            <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">🎨 Available Colors (রঙসমূহ)</h4>
              <p className="text-[9px] text-gray-400 font-extrabold uppercase mb-2.5">ট্যাপ করলে প্রোডাক্টের ছবি পরিবর্তন হবে</p>
              
              <div className="flex flex-wrap gap-2.5">
                {selectedProduct.colorsList.map((c, i) => {
                  const isCurrentlySelected = selectedColor === c.name;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.name);
                        if (c.imageUrl) {
                          setSelectedImage(c.imageUrl);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isCurrentlySelected
                          ? 'border-indigo-600 bg-indigo-50/50 scale-105 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-350 shadow-xs" style={{ backgroundColor: c.code }} />
                      <span className="text-xs font-bold text-gray-750">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Package Contents (📦 প্যাকেজে যা পাবেন) */}
          <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">📦 প্যাকেজে যা পাবেন / Package Contents</h4>
            
            <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              {(() => {
                const contents = selectedProduct.packageContents && selectedProduct.packageContents.length > 0
                  ? selectedProduct.packageContents
                  : [
                      `১× প্রিমিয়াম কোয়ালিটি ${selectedProduct.name}`,
                      'NaimShop অফিশিয়াল ব্র্যান্ড ট্যাগ',
                      'প্রিমিয়াম ওয়াটারপ্রুফ পলি ব্যাগ',
                      'ডেলিভারি চালানের কপি ও ক্যাশ ইনভয়েস'
                    ];

                return contents.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-700 font-bold">
                    <span className="text-indigo-500 font-black">✓</span>
                    <span>{item}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* 3. Size Guide Layout */}
          <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">📏 Size Guide (সাইজ চার্ট)</h4>
            
            {selectedProduct.sizeGuideImage ? (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase">আপনার সঠিক সাইজটি মিলিয়ে নিন</p>
                <img 
                  src={selectedProduct.sizeGuideImage} 
                  className="w-full object-contain rounded-lg border border-gray-200 max-h-64 cursor-zoom-in"
                  onClick={() => {
                    setSelectedImage(selectedProduct.sizeGuideImage || '');
                    setIsZoomed(true);
                  }}
                  alt="Size guide chart"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase">স্ট্যান্ডার্ড বডি মেজারমেন্ট গাইড</p>
                
                <div className="overflow-hidden rounded-xl border border-gray-150 text-center text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 font-black text-gray-500 uppercase text-[9px]">
                        <th className="p-2">Size</th>
                        <th className="p-2 border-l border-gray-150">Chest (ইঞ্চি)</th>
                        <th className="p-2 border-l border-gray-150">Length (ইঞ্চি)</th>
                        <th className="p-2 border-l border-gray-150">উচ্চতা সাজেশন</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-gray-700">
                      <tr className="border-b border-gray-150">
                        <td className="p-2 font-black">M</td>
                        <td className="p-2 border-l border-gray-150">৩৮"</td>
                        <td className="p-2 border-l border-gray-150">২৭"</td>
                        <td className="p-2 border-l border-gray-150 bg-indigo-50/20 text-indigo-700 text-[10px] font-black">5'4" - 5'6"</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="p-2 font-black">L</td>
                        <td className="p-2 border-l border-gray-150">৪০"</td>
                        <td className="p-2 border-l border-gray-150">২৮"</td>
                        <td className="p-2 border-l border-gray-150 bg-indigo-50/20 text-indigo-700 text-[10px] font-black">5'7" - 5'9"</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="p-2 font-black">XL</td>
                        <td className="p-2 border-l border-gray-150">৪২"</td>
                        <td className="p-2 border-l border-gray-150">২৯"</td>
                        <td className="p-2 border-l border-gray-150 bg-indigo-50/20 text-indigo-700 text-[10px] font-black">5'10" - 6'0"</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-black">XXL</td>
                        <td className="p-2 border-l border-gray-150">৪৪"</td>
                        <td className="p-2 border-l border-gray-150">৩০"</td>
                        <td className="p-2 border-l border-gray-150 bg-indigo-50/20 text-indigo-700 text-[10px] font-black">6'1" +</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 5. Real Customer Photo Gallery */}
          {(() => {
            const gallery = selectedProduct.customerGallery && selectedProduct.customerGallery.length > 0
              ? selectedProduct.customerGallery
              : [
                  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60',
                  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&auto=format&fit=crop&q=60'
                ];
            return (
              <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">📸 Real Customer Gallery</h4>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-2.5">কাস্টমারদের পাঠানো বাস্তব ছবিসমূহ</p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {gallery.map((url, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden border border-gray-150 bg-slate-50 aspect-square group cursor-zoom-in" onClick={() => {
                      setSelectedImage(url);
                      setIsZoomed(true);
                    }}>
                      <img src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-2 left-2 bg-black/75 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                        <BadgeCheck size={10} className="text-emerald-400" />
                        <span>Verified Buyer</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 6. Why Choose Us (কেন আমাদের কাছ থেকে কিনবেন) */}
          <div className="border border-gray-150 p-4 rounded-xl bg-white shadow-xs mb-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center mb-3">❤️ কেন আমাদের কাছ থেকে কিনবেন?</h4>
            
            <div className="grid grid-cols-2 gap-2.5">
              {(() => {
                const reasons = selectedProduct.whyChooseUs && selectedProduct.whyChooseUs.length > 0
                  ? selectedProduct.whyChooseUs
                  : [
                      '১০০% এক্সপোর্ট কোয়ালিটি সুতি ফেব্রিক্স',
                      'অত্যন্ত আরামদায়ক ও ঘাম শোষণকারী বুনন',
                      '১০০% রঙের স্থায়িত্ব গ্যারান্টি',
                      'আধুনিক ট্রেন্ডি ডিজাইনার কালার প্যানেল',
                      '৭ দিনের সহজ ও নিশ্চিত রিটার্ন পলিসি',
                      'সরাসরি ম্যানুফ্যাকচারার রেট ও প্রিমিয়াম ফিনিশিং'
                    ];

                const iconsMap = [
                  <Sparkles size={16} className="text-amber-500 shrink-0" />,
                  <Scissors size={16} className="text-indigo-500 shrink-0" />,
                  <Wind size={16} className="text-blue-500 shrink-0" />,
                  <Heart size={16} className="text-red-500 shrink-0" />,
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />,
                  <Award size={16} className="text-purple-500 shrink-0" />
                ];

                return reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    {iconsMap[i % iconsMap.length]}
                    <span className="text-xs font-bold text-gray-700 leading-tight">{r}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* 7. Brand Information */}
          <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4 space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-50">🏷️ Brand Information</h4>
            
            <div className="flex items-center gap-3.5">
              {selectedProduct.brandInfo?.logo ? (
                <img src={selectedProduct.brandInfo.logo} className="w-11 h-11 rounded-xl object-cover border border-gray-200" alt="Brand Logo" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 font-black text-lg flex items-center justify-center">
                  {(selectedProduct.brandInfo?.name || selectedProduct.brand || 'N').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-0.5">
                <p className="text-sm font-extrabold text-gray-850 leading-none">{selectedProduct.brandInfo?.name || selectedProduct.brand || 'NaimShop Premium'}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-gray-400">
                  <span>দেশ: <b>{selectedProduct.brandInfo?.country || 'Bangladesh'}</b></span>
                  <span className="text-gray-300">•</span>
                  <span>ওয়ারেন্টি: <b>{selectedProduct.brandInfo?.warranty || '৬ মাসের গ্যারান্টি'}</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* 8. Care Instructions (যত্ন নির্দেশিকা) */}
          <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">❓ Care Instructions (যত্ন নেওয়ার নির্দেশিকা)</h4>
            
            <div className="grid grid-cols-2 gap-2.5">
              {(() => {
                const instructions = selectedProduct.careInstructions && selectedProduct.careInstructions.length > 0
                  ? selectedProduct.careInstructions
                  : [
                      'হালকা কুসুম গরম পানিতে ওয়াশ করুন',
                      'উল্টো করে হালকা তাপে আয়রন করুন',
                      'ব্লিচ ব্যবহার করা থেকে বিরত থাকুন',
                      'সরাসরি কড়া রোদে না দিয়ে ছায়ায় শুকান'
                    ];

                const icons = [
                  <RotateCcw size={14} className="text-blue-500 shrink-0" />,
                  <Flame size={14} className="text-orange-500 shrink-0" />,
                  <ShieldCheck size={14} className="text-red-500 shrink-0" />,
                  <Sun size={14} className="text-amber-500 shrink-0" />
                ];

                return instructions.map((inst, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-700 font-bold">
                    {icons[idx % icons.length]}
                    <span>{inst}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Customer Reviews & Ratings Summary */}
          {(() => {
            if (selectedProduct.reviewSettings?.enabled === false) return null;
            
            // Calculate rating averages or default reviews counts
            const totalReviewsCount = reviews.length;
            const avgStars = totalReviewsCount > 0
              ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1))
              : Number(selectedProduct.rating) || 5.0;

            // Stars breakdown percentages
            const breakDown = [5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : (stars === 5 ? 85 : stars === 4 ? 12 : 3);
              return { stars, pct };
            });

            return (
              <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Reviews ({totalReviewsCount})</h4>
                    <button 
                      onClick={handleViewAllReviewsClick}
                      className="text-xs font-bold cursor-pointer transition-transform active:scale-95 border-none inline-flex items-center shrink-0"
                      style={{
                        backgroundColor: '#FDF2F7',
                        color: '#F72585',
                        borderRadius: '14px',
                        fontSize: '12px',
                        padding: '8px 14px'
                      }}
                    >
                      সব দেখুন
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsWriteReviewOpen(true)}
                    className="text-[10px] font-black text-[#ff2f7d] bg-[#ff2f7d]/5 hover:bg-[#ff2f7d]/10 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border-none"
                  >
                    Write Review
                  </button>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/50 p-3.5 rounded-xl">
                  <div className="text-center shrink-0">
                    <p className="text-3xl font-black text-gray-900 leading-none">{avgStars.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 justify-center mt-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={11} fill={star <= Math.round(avgStars) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Rating Summary</p>
                  </div>

                  <div className="flex-1 space-y-1">
                    {breakDown.map(({ stars, pct }) => {
                      return (
                        <div key={stars} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                          <span className="w-2">{stars}</span>
                          <span className="text-[8px] text-amber-400">★</span>
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right font-black">{Math.round(pct)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-2.5">
                    {reviews.slice(0, 3).map((rev, i) => {
                      // Parse user avatar details if present
                      let avatarBg = "bg-pink-500";
                      let initial = (rev.customerName || rev.userName || "U").charAt(0).toUpperCase();
                      if (rev.avatar && rev.avatar.includes('|')) {
                        const parts = rev.avatar.split('|');
                        avatarBg = parts[0] || "bg-pink-500";
                        initial = parts[1] || initial;
                      }

                      return (
                        <div key={i} className="text-xs bg-slate-50/50 p-3 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${avatarBg} text-white flex items-center justify-center font-black text-[10px]`}>
                                {initial}
                              </div>
                              <span className="font-extrabold text-gray-800">{rev.customerName || rev.userName}</span>
                            </div>
                            <span className="text-[9px] text-gray-400 font-bold">{rev.date || 'আজ'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400 my-1">
                            {[1, 2, 3, 4, 5].map(st => (
                              <Star key={st} size={9} fill={st <= rev.rating ? "currentColor" : "none"} />
                            ))}
                            {rev.verified && (
                              <span className="text-[9px] font-extrabold text-emerald-600 flex items-center gap-0.5 ml-2 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                <BadgeCheck size={10} /> Verified Purchase
                              </span>
                            )}
                          </div>
                          <p className="text-gray-650 font-semibold leading-relaxed">{rev.text || rev.comment}</p>
                          
                          {rev.images && rev.images.length > 0 && (
                            <div className="flex gap-1.5 pt-1">
                              {rev.images.map((img, idx) => (
                                <img 
                                  key={idx} 
                                  src={img} 
                                  alt="Preview thumbnail" 
                                  onClick={() => setPreviewReviewImage(img)}
                                  className="w-10 h-10 object-cover rounded-lg border border-gray-100 shadow-sm shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                                  referrerPolicy="no-referrer"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic text-center py-2">কোনো কাস্টমার রিভিউ পাওয়া যায়নি।</p>
                )}
              </div>
            );
          })()}

          {/* Customer Questions & Answers (FAQ) Accordion */}
          {(() => {
            const faqList = selectedProduct.qnas || [
              { question: 'ঢাকার বাইরে কীভাবে অর্ডার করবো?', answer: 'ঢাকার বাইরে ডেলিভারি চার্জ ১৩০ টাকা অগ্রিম পরিশোধ করে ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবেন।' },
              { question: 'কালার বা ফেব্রিক নিয়ে কোনো গ্যারান্টি আছে?', answer: 'জি, ১০০% কালার গ্যারান্টি এবং হাই-কোয়ালিটি সুতি সুতার বুনন গ্যারান্টি।' },
              { question: 'পণ্য পছন্দ না হলে কি রিটার্ন করা যাবে?', answer: 'ডেলিভারি ম্যান থাকা অবস্থায় পণ্য চেক করে না লাগলে রিটার্ন করতে পারবেন।' }
            ];

            return (
              <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4 space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Questions & Answers (FAQ)</h4>
                
                <div className="space-y-2">
                  {faqList.map((faq, idx) => {
                    const isExpanded = expandedFaqIndex === idx;
                    return (
                      <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                          className="w-full p-3 text-left font-extrabold text-gray-750 bg-gray-50/50 hover:bg-gray-100 flex items-center justify-between"
                        >
                          <span>Q: {faq.question}</span>
                          <span className="text-lg leading-none font-bold text-gray-400">{isExpanded ? '−' : '+'}</span>
                        </button>
                        {isExpanded && (
                          <div className="p-3 bg-white border-t border-gray-50 text-gray-650 font-semibold leading-relaxed animate-fade-in">
                            A: {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Share Product */}
          {selectedProduct.shareSettings?.enabled !== false && (
            <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Share This Product</h4>
              
              <div className="flex items-center justify-center gap-4">
                {selectedProduct.shareSettings?.facebook !== false && (
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-blue-50 text-blue-650 hover:bg-blue-100 rounded-full transition-all flex items-center justify-center cursor-pointer"
                    title="Facebook Share"
                  >
                    <Share2 size={16} />
                  </a>
                )}

                {selectedProduct.shareSettings?.messenger !== false && (
                  <a 
                    href={`fb-messenger://share/?link=${encodeURIComponent(window.location.href)}`}
                    className="p-2.5 bg-blue-50 text-cyan-600 hover:bg-cyan-100 rounded-full transition-all flex items-center justify-center cursor-pointer"
                    title="Messenger Share"
                  >
                    <MessageSquare size={16} />
                  </a>
                )}

                {selectedProduct.shareSettings?.whatsapp !== false && (
                  <a 
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${selectedProduct.name} - ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-all flex items-center justify-center cursor-pointer"
                    title="WhatsApp Share"
                  >
                    <Phone size={16} />
                  </a>
                )}

                {selectedProduct.shareSettings?.copyLink !== false && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast("📋 Link copied to clipboard!");
                    }}
                    className="p-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-full transition-all flex items-center justify-center cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trust Badges */}
          {(() => {
            const badgesList = selectedProduct.trustBadges || [
              { title: 'Secure Payment', icon: 'Secure Payment', description: 'SSL safe checkout' },
              { title: 'Cash on Delivery', icon: 'Cash on Delivery', description: 'Pay upon receiving' }
            ];

            const getBadgeIcon = (name: string) => {
              if (name === 'Secure Payment') return <ShieldCheck className="text-emerald-500" size={18} />;
              if (name === 'Cash on Delivery') return <Banknote className="text-amber-500" size={18} />;
              if (name === 'Fast Delivery') return <Truck className="text-blue-500" size={18} />;
              if (name === 'Original Product') return <Sparkles className="text-indigo-500" size={18} />;
              if (name === 'Easy Return') return <RotateCcw className="text-pink-500" size={18} />;
              return <ShieldCheck className="text-gray-500" size={18} />;
            };

            return (
              <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">NaimShop Guarantees</h4>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {badgesList.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/40 text-left">
                      {getBadgeIcon(badge.icon || badge.title)}
                      <div>
                        <p className="text-[10px] font-black text-gray-850 leading-tight">{badge.title}</p>
                        {badge.description && <p className="text-[8px] text-gray-400 font-extrabold uppercase mt-0.5">{badge.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Recently Viewed Products */}
          {recentlyViewed.length > 0 && (
            <div className="border border-gray-100 p-4 rounded-xl bg-white shadow-sm mb-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Recently Viewed</h4>
              
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                {recentlyViewed.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigate(`/product/${p.id}`);
                      window.scrollTo(0, 0);
                    }}
                    className="w-24 shrink-0 text-left cursor-pointer border-none bg-none outline-none focus:outline-none"
                  >
                    <img src={p.image} className="w-24 h-24 object-cover rounded-lg shadow-sm border border-gray-100" />
                    <p className="text-[10px] font-black text-gray-800 truncate mt-1.5 leading-tight">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-black text-primary">৳{p.price}</span>
                      {p.rating && <span className="text-[8px] text-amber-500 font-black">★ {p.rating}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 11. OTHER CATEGORY PRODUCTS SECTION */}
          <section className="other-products-section mt-8 mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">OTHER CATEGORY PRODUCTS</h3>
            
            <div className="other-products-scroll">
              {finalRelatedProducts.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onClick={() => {
                    navigate(`/product/${p.id}`);
                    window.scrollTo(0, 0);
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Fixed Actions Button Overlays */}
      <div className="product-fixed-action">
        <button className="cart-btn" onClick={handleAddToCart}>Add to Cart</button>
        <button className="order-btn" onClick={handleOrderNow}>Order Now</button>
      </div>

      <ReviewFormModal 
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        productId={selectedProduct.id}
        productName={selectedProduct.name}
        onSuccess={() => setReviewsReloadKey(prev => prev + 1)}
      />

      <FullScreenPreview 
        imageUrl={previewReviewImage}
        onClose={() => setPreviewReviewImage(null)}
      />

      <LoginPopup 
        isOpen={isLoginPopupOpen}
        onClose={() => setIsLoginPopupOpen(false)}
        onSuccess={(user) => {
          navigate(`/product/${selectedProduct.id}/reviews`);
        }}
      />
    </div>
  );
}

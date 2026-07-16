/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, BadgeCheck, RotateCcw, RefreshCw } from 'lucide-react';
import { PRODUCTS, DEMO_REVIEWS } from '../data';
import { Product, Review } from '../types';
import BottomNav from '../components/BottomNav';
import ReviewFormModal from '../components/ReviewFormModal';
import FullScreenPreview from '../components/FullScreenPreview';

export default function Reviews() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Selected product state
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reviews state
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [settings, setSettings] = useState<any>({
    enabled: true,
    adminApproval: false,
    maxImages: 2,
    cameraEnabled: true,
    galleryEnabled: true,
    verifiedPurchaseOnly: false
  });

  const loadData = () => {
    if (!id) return;
    setIsRefreshing(true);
    setIsLoading(true);
    
    // Fetch settings
    fetch('/api/settings/reviews')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err));
 
    // Fetch matched product from database api
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find((p: Product) => p.id === id && p.status === 'published' && p.isDeleted !== true);
          if (found) {
            setProduct(found);
          } else {
            setProduct(undefined);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));

    // Fetch dynamic reviews
    fetch(`/api/reviews?productId=${id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Display reviews matching status approved
          setReviewsList(data);
        } else {
          setReviewsList(DEMO_REVIEWS.filter(r => r.productId === id));
        }
      })
      .catch(() => {
        setReviewsList(DEMO_REVIEWS.filter(r => r.productId === id));
      })
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInCustomer');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthChecking(false);
      loadData();
    } else {
      alert("দুঃখিত! সব রিভিউ দেখার জন্য আপনাকে অবশ্যই লগইন করতে হবে।");
      navigate(`/product/${id || 'p1'}`);
    }
    window.scrollTo(0, 0);
  }, [id, navigate]);

  if (isAuthChecking || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="text-primary animate-spin mb-4" size={24} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Checking Permission...</p>
      </div>
    );
  }
 
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-xl font-black text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-400 text-sm mb-8">The reviews you are looking for are not available.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-white font-black px-8 py-3 rounded-xl shadow-lg">Return to Shop</button>
      </div>
    );
  }

  // Compute stats rating summary
  const totalReviews = reviewsList.length;
  const averageRating = totalReviews > 0
    ? Number((reviewsList.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : Number(product.rating) || 5.0;

  // Breakdown based on actual reviews ratings
  const starsBreakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = reviewsList.filter(r => r.rating === stars).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : (stars === 5 ? 85 : stars === 4 ? 12 : 3);
    return { stars, count, pct };
  });

  return (
    <div className="page-container relative min-h-screen pb-40 bg-slate-50/50">
      {/* Header Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[120] flex items-center justify-between h-14 px-4 border-b border-gray-100">
        <button 
          onClick={() => navigate(`/product/${product.id}`)} 
          className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Product</span>
        </button>
        <span className="font-extrabold text-[11px] truncate text-gray-400 tracking-wider">REVIEWS ({totalReviews})</span>
        <div className="w-[60px] text-right">
          <button onClick={loadData} className="text-xs font-bold text-primary">
            {isRefreshing ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      <main className="px-4 mt-4">
        {/* Rating Summary Box */}
        <div className="bg-white border border-gray-100/80 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-6 pb-4 border-b border-gray-50">
            <div className="text-center shrink-0">
              <span className="text-4xl font-black text-gray-900 block leading-none">{averageRating.toFixed(1)}</span>
              <div className="flex items-center justify-center gap-0.5 text-yellow-400 mt-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={13} 
                    fill={i < Math.round(averageRating) ? "currentColor" : "none"} 
                    className={i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-200"}
                  />
                ))}
              </div>
              <span className="text-[9px] text-gray-400 font-extrabold block mt-2 tracking-wider uppercase">{totalReviews} Reviews</span>
            </div>

            <div className="flex-1 space-y-1.5">
              {starsBreakdown.map(({ stars, pct, count }) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 min-w-[8px]">{stars}</span>
                  <div className="flex-1 h-2 bg-gray-50 border border-gray-100/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-gray-400 w-8 text-right">
                    {reviewsList.length > 0 ? `${Math.round(pct)}%` : (stars === 5 ? '85%' : stars === 4 ? '12%' : '3%')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-800">100% Cotton & Material Audit</p>
              <p className="text-[9px] text-gray-400 font-bold">Authentic buyer feedback verified by NaimShop</p>
            </div>
            
            {settings.enabled !== false && (
              <button 
                onClick={() => setIsFormOpen(true)}
                className="bg-[#ff2f7d] hover:bg-[#e02065] text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-pink-500/10 cursor-pointer transition-colors"
              >
                Write Review
              </button>
            )}
          </div>
        </div>

        {/* Authenticated Reviews Feed List */}
        <div className="space-y-4">
          {reviewsList.length > 0 ? (
            reviewsList.map(review => {
              // Parse user avatar details
              let avatarBg = "bg-pink-500";
              let initial = (review.customerName || "U").charAt(0).toUpperCase();
              if (review.avatar && review.avatar.includes('|')) {
                const parts = review.avatar.split('|');
                avatarBg = parts[0] || "bg-pink-500";
                initial = parts[1] || initial;
              }

              return (
                <div key={review.id} className="bg-white border border-gray-100/80 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${avatarBg} text-white flex items-center justify-center font-black text-sm shadow-sm`}>
                        {initial}
                      </div>
                      <div>
                        <b className="text-xs text-gray-800 font-black block">{review.customerName}</b>
                        <div className="flex gap-0.5 text-yellow-400 mt-0.5">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} size={10} fill={idx < review.rating ? "currentColor" : "none"} className={idx < review.rating ? "text-yellow-400" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded-full">{review.date}</span>
                  </div>
                  
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold pl-1">{review.text}</p>
                  
                  <div className="flex items-center justify-between pt-1">
                    {review.verified ? (
                      <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <BadgeCheck size={11} /> Verified Purchase
                      </span>
                    ) : (
                      <span />
                    )}

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-1.5">
                        {review.images.map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt="review attach" 
                            onClick={() => setPreviewImage(img)}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-100 shadow-sm shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all" 
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-400 font-bold">No customer reviews published yet.</p>
              {settings.enabled !== false && (
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="text-[#ff2f7d] font-black text-xs mt-2 underline"
                >
                  Write the very first review!
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Write a Review Modal Form Sheet */}
      <ReviewFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productId={product.id}
        productName={product.name}
        onSuccess={loadData}
      />

      {/* Full screen Image preview popup */}
      <FullScreenPreview 
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Persistence of bottom Nav */}
      <BottomNav />
    </div>
  );
}

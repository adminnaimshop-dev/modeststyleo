/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Star, Camera, Image as ImageIcon, Send, X, ShieldAlert } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSuccess: () => void;
}

export default function ReviewFormModal({ isOpen, onClose, productId, productName, onSuccess }: ReviewFormModalProps) {
  const [custName, setCustName] = useState('');
  const [custRating, setCustRating] = useState(5);
  const [custText, setCustText] = useState('');
  const [custImages, setCustImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [settings, setSettings] = useState<any>({
    enabled: true,
    adminApproval: false,
    maxImages: 2,
    cameraEnabled: true,
    galleryEnabled: true,
    verifiedPurchaseOnly: false
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch settings on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/reviews')
        .then(res => res.json())
        .then(data => {
          setSettings(data);
        })
        .catch(err => console.error("Error fetching review settings:", err));
      
      // Reset form
      setCustName('');
      setCustRating(5);
      setCustText('');
      setCustImages([]);
      setErrorMsg(null);
      setShowOptions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function compressReviewImage(file: File) {
    try {
      return await imageCompression(file, {
        maxSizeMB: 0.25, // compress near 250KB limit as requested
        maxWidthOrHeight: 800,
        useWebWorker: true
      });
    } catch (err) {
      console.error("Compression failed, using original file", err);
      return file;
    }
  }

  const processFile = async (file: File) => {
    if (custImages.length >= (settings.maxImages || 2)) {
      showToast(`⚠️ You can upload a maximum of ${settings.maxImages || 2} images.`);
      return;
    }

    try {
      const compressed = await compressReviewImage(file);
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressed);
      });

      setCustImages(prev => {
        const updated = [...prev, base64];
        return updated.slice(0, settings.maxImages || 2);
      });
      showToast("📸 Image auto-compressed below 250KB successfully!");
    } catch (error) {
      console.error("Error reading file", error);
      showToast("❌ Failed to process image.");
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    setShowOptions(false);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    setShowOptions(false);
  };

  const checkIsVerifiedPurchase = (name: string) => {
    try {
      const allOrdersStr = localStorage.getItem('naimshop_all_orders');
      if (allOrdersStr) {
        const allOrders = JSON.parse(allOrdersStr);
        if (Array.isArray(allOrders)) {
          return allOrders.some((ord: any) => {
            const hasProduct = ord.items?.some((item: any) => item.id === productId || item.productId === productId);
            const nameMatches = !name ? false : ord.customerName?.toLowerCase().trim() === name.toLowerCase().trim();
            return hasProduct && nameMatches;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = custName.trim();
    if (!trimmedName) {
      setErrorMsg("আপনার নাম দিতে হবে।");
      return;
    }

    if (!custText.trim()) {
      setErrorMsg("রিভিউ মন্তব্য লিখতে হবে।");
      return;
    }

    // Check Verified Purchase Only setting
    const isVerified = checkIsVerifiedPurchase(trimmedName);
    if (settings.verifiedPurchaseOnly && !isVerified) {
      setErrorMsg("❌ দুঃখিত, শুধুমাত্র প্রোডাক্টটি ক্রয়কারী গ্রাহকরাই রিভিউ দিতে পারবেন।");
      return;
    }

    setIsSubmitting(true);

    // Dynamic random avatar background color
    const colors = ["bg-red-500", "bg-pink-500", "bg-purple-500", "bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-emerald-500", "bg-amber-500", "bg-orange-500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const avatarData = `${randomColor}|${trimmedName.charAt(0).toUpperCase()}`;

    fetch('/api/reviews', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        productName,
        customerName: trimmedName,
        text: custText.trim(),
        rating: custRating,
        images: custImages,
        verified: isVerified,
        avatar: avatarData
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsSubmitting(false);
        if (settings.adminApproval) {
          alert("🎉 রিভিউ সফলভাবে জমা দেওয়া হয়েছে! এটি অ্যাডমিনের অনুমোদনের পর প্রদর্শিত হবে।");
        } else {
          alert("🎉 রিভিউ সফলভাবে প্রকাশিত হয়েছে!");
        }
        onSuccess();
        onClose();
      })
      .catch(err => {
        console.error(err);
        setIsSubmitting(false);
        setErrorMsg("রিভিউ জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      {toastMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[400] bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <div 
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Star size={16} className="text-[#ff2f7d] fill-[#ff2f7d]" />
          <span>Write a Review</span>
        </h3>
        <p className="text-[10px] text-gray-400 font-bold mb-4">Sharing experiences for: {productName}</p>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[11px] font-bold flex items-start gap-2 mb-4">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Your Name</label>
            <input 
              type="text"
              placeholder="আপনার নাম লিখুন..."
              value={custName}
              onChange={e => setCustName(e.target.value)}
              className="w-full h-10 border border-gray-200 bg-white rounded-xl px-3 text-xs focus:outline-none focus:border-[#ff2f7d] focus:ring-1 focus:ring-[#ff2f7d] transition-all font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCustRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star 
                    size={26} 
                    fill={star <= custRating ? "#eab308" : "none"} 
                    className={star <= custRating ? "text-yellow-500" : "text-gray-300"} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Your Review</label>
            <textarea 
              placeholder="Write your review..."
              value={custText}
              onChange={e => setCustText(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#ff2f7d] focus:ring-1 focus:ring-[#ff2f7d] transition-all font-semibold resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Upload Photo</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                disabled={custImages.length >= (settings.maxImages || 2)}
                className="w-full h-11 border border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:border-[#ff2f7d] hover:text-[#ff2f7d] transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-500"
              >
                <Camera size={16} />
                <span>Choose Image ({custImages.length}/{settings.maxImages || 2})</span>
              </button>

              {showOptions && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-gray-100 shadow-xl rounded-xl p-2 z-10 flex gap-2 animate-fade-in">
                  {settings.cameraEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera size={14} />
                      <span>Camera</span>
                    </button>
                  )}
                  {settings.galleryEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex-1 py-2 bg-gray-50 hover:bg-pink-50 hover:text-pink-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ImageIcon size={14} />
                      <span>Gallery</span>
                    </button>
                  )}
                </div>
              )}

              {/* Hidden camera input */}
              <input 
                type="file" 
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleCameraChange}
                className="hidden"
              />

              {/* Hidden gallery input */}
              <input 
                type="file" 
                ref={galleryInputRef}
                accept="image/*"
                onChange={handleGalleryChange}
                className="hidden"
              />
            </div>

            {custImages.length > 0 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto py-1">
                {custImages.map((img, i) => (
                  <div key={i} className="relative shrink-0 w-16 h-16 rounded-xl border border-gray-100 overflow-hidden shadow-sm group">
                    <img src={img} className="w-full h-full object-cover" alt="preview" />
                    <button
                      type="button"
                      onClick={() => setCustImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !custName.trim() || !custText.trim()}
            className="w-full h-11 bg-[#ff2f7d] hover:bg-[#e02065] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

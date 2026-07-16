/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Banner } from '../types';
import { useNavigate } from 'react-router-dom';

interface HeroBannerProps {
  banners: Banner[];
}

export default function HeroBanner({ banners }: HeroBannerProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Auto scroll every 2.5 seconds (complying with 1-3 seconds requirement)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % banners.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[activeIndex] || banners[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next banner
        setActiveIndex(prev => (prev + 1) % banners.length);
      } else {
        // swipe right -> previous banner
        setActiveIndex(prev => (prev - 1 + banners.length) % banners.length);
      }
    }
    touchStartX.current = null;
  };

  const handleBannerClick = () => {
    if (currentBanner.buttonLink) {
      if (currentBanner.buttonLink.startsWith('http')) {
        window.open(currentBanner.buttonLink, '_blank');
      } else {
        navigate(currentBanner.buttonLink);
      }
    } else if (currentBanner.categorySlug) {
      navigate(`/category/${currentBanner.categorySlug}`);
    } else {
      // Default fallback
    }
  };

  return (
    <div 
      className="main-hero-slider main-banner relative select-none cursor-pointer group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleBannerClick}
    >
      <div className="absolute inset-0 transition-all duration-700 ease-in-out">
        {/* Full coverage main banner image */}
        <img 
          src={currentBanner.image} 
          alt={currentBanner.title} 
          className="w-full h-full object-cover block"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-black/20 flex flex-col justify-center px-6 sm:px-12 text-white z-10 transition-opacity duration-500">
          <div className="max-w-[80%] sm:max-w-[60%] flex flex-col gap-1 sm:gap-2">
            {currentBanner.badge && (
              <span className="bg-[#ff2f7d] text-white text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md self-start tracking-wider uppercase">
                {currentBanner.badge}
              </span>
            )}
            {currentBanner.title && (
              <h1 className="text-xl sm:text-4xl font-black leading-tight tracking-tight uppercase drop-shadow-lg">
                {currentBanner.title}
              </h1>
            )}
            {currentBanner.subtitle && (
              <p className="text-[11px] sm:text-lg opacity-90 font-medium drop-shadow-md">
                {currentBanner.subtitle}
              </p>
            )}
            {(currentBanner.buttonText || currentBanner.title || currentBanner.subtitle) && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick();
                }}
                className="bg-[#ff2f7d] text-white border-none px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-[10px] sm:text-sm font-black uppercase tracking-widest w-fit mt-2 sm:mt-4 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {currentBanner.buttonText || 'Shop Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slider dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 border-none p-0 outline-none cursor-pointer ${idx === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
}

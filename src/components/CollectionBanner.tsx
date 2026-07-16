/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Banner } from '../types';

interface CollectionBannerProps {
  banner: Banner;
}

export default function CollectionBanner({ banner }: CollectionBannerProps) {
  return (
    <div 
      className="main-banner collection-banner category-banner category-section-banner shadow-sm relative overflow-hidden group"
    >
      {/* Background Image full-fill */}
      <img 
        src={banner.image} 
        alt={banner.title} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      
      {/* Gradient Overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-6 sm:px-10 text-white z-10 transition-opacity duration-500">
        <div className="flex flex-col gap-0.5 sm:gap-1 max-w-[70%]">
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight drop-shadow-md">{banner.title}</h2>
          <p className="text-xs sm:text-base opacity-90 font-medium drop-shadow-sm">{banner.subtitle}</p>
          <button className="bg-[#ff2f7d] text-white border-none px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest w-fit mt-3 shadow-lg hover:opacity-90 active:scale-95 transition-all">
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface FullScreenPreviewProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function FullScreenPreview({ imageUrl, onClose }: FullScreenPreviewProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
      >
        <X size={20} />
      </button>

      <img 
        src={imageUrl} 
        alt="Full screen preview" 
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up" 
        onClick={e => e.stopPropagation()}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

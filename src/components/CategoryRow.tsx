/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../types';

interface CategoryRowProps {
  categories: Category[];
}

export default function CategoryRow({ categories }: CategoryRowProps) {
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto scroll every 3 seconds (complying with 1-4 seconds requirement)
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      const itemWidth = 100; // item width (82px) + gap (18px)
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 10) {
        // Reset to beginning smoothly
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Move to next item
        el.scrollBy({ left: itemWidth, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [categories]);

  const getCategorySlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div ref={sliderRef} className="category-slider">
      {categories.map((cat) => {
        const slug = cat.slug || getCategorySlug(cat.name);
        return (
          <div 
            key={cat.id} 
            className="category-item cursor-pointer"
            onClick={() => navigate(`/category/${slug}`)}
          >
            <img 
              src={cat.iconImage || cat.image} 
              alt={cat.name} 
              referrerPolicy="no-referrer"
            />
            <p className="category-name font-medium">{cat.name}</p>
          </div>
        );
      })}
    </div>
  );
}

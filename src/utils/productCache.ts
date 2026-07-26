/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Category } from '../types';
import { PRODUCTS, CATEGORIES, COLLECTION_BANNERS } from '../data';

// In-memory caches with default fallbacks to ensure instant first render
let memoryProductsCache: Product[] = [];
let memoryCategoriesCache: Category[] = CATEGORIES;
let memoryBannersCache: any[] = [];

// Fallback banners mapping to match server.ts structures in case of empty local storage
const defaultBanners = [
  {
    id: "b_1",
    title: "Exclusive Fashion",
    subtitle: "Up to 50% Off",
    badge: "New Arrival",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    bgColor: "#0f7eb5",
    type: "main",
    status: true,
    serial: 1,
    categorySlug: "saree"
  },
  {
    id: "b_2",
    title: "Premium Punjabis",
    subtitle: "Traditional Wear",
    badge: "Festive Collection",
    image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&q=80",
    bgColor: "#b50f4e",
    type: "main",
    status: true,
    serial: 2,
    categorySlug: "punjabi"
  }
];

let isFetchingPromise: Promise<Product[]> | null = null;
let isFetchingCategoriesPromise: Promise<Category[]> | null = null;
let isFetchingBannersPromise: Promise<any[]> | null = null;

// Initialize caches from localStorage if available, or fall back to high-quality offline structures
try {
  const storedProducts = localStorage.getItem('naimshop_products_cache');
  if (storedProducts) {
    const parsed = JSON.parse(storedProducts);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryProductsCache = parsed;
    }
  }
} catch (e) {
  console.error('Failed to parse cached products', e);
}

// Fallback products mapping to match default PRODUCTS if empty
if (memoryProductsCache.length === 0) {
  memoryProductsCache = [...PRODUCTS].map(p => {
    return {
      ...p,
      title: p.title || p.name || "",
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      status: p.status || "published",
      isDeleted: false,
      stock: p.stock || "In Stock"
    };
  });
}

try {
  const storedCategories = localStorage.getItem('naimshop_categories_cache');
  if (storedCategories) {
    const parsed = JSON.parse(storedCategories);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryCategoriesCache = parsed;
    }
  }
} catch (e) {
  console.error('Failed to parse cached categories', e);
}

try {
  const storedBanners = localStorage.getItem('naimshop_banners_cache');
  if (storedBanners) {
    const parsed = JSON.parse(storedBanners);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryBannersCache = parsed;
    }
  }
} catch (e) {
  console.error('Failed to parse cached banners', e);
}

if (memoryBannersCache.length === 0) {
  memoryBannersCache = defaultBanners;
}

/**
 * Preloads product images in the background to make details load instantly
 */
export function preloadProductImages(products: Product[]) {
  if (typeof window === 'undefined') return;
  
  // Only preload first 20 products to save bandwidth, focusing on primary images
  const productsToPreload = products.slice(0, 20);
  
  productsToPreload.forEach(product => {
    const imagesToLoad = [];
    if (product.image) imagesToLoad.push(product.image);
    if (product.images && product.images.length > 0) {
      imagesToLoad.push(...product.images.slice(0, 4)); // Preload first 4 gallery images
    }
    
    // De-duplicate images to preload
    const uniqueImages = Array.from(new Set(imagesToLoad));
    
    uniqueImages.forEach(src => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  });
}

/**
 * Fetches products from API, updates memory and localStorage cache, and returns them.
 * If silent is true, it won't throw errors but will resolve to current cached values.
 */
export async function fetchProductsAndCache(silent = false): Promise<Product[]> {
  if (isFetchingPromise) {
    return isFetchingPromise;
  }

  isFetchingPromise = (async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        memoryProductsCache = data;
        
        // Persist to localStorage
        try {
          localStorage.setItem('naimshop_products_cache', JSON.stringify(data));
        } catch (storageError) {
          console.warn('Storage quota exceeded, caching in memory only');
        }

        // Preload images in background
        setTimeout(() => preloadProductImages(data), 100);
        
        return data;
      }
      return memoryProductsCache;
    } catch (error) {
      console.error('Error fetching/caching products:', error);
      if (silent) {
        return memoryProductsCache;
      }
      throw error;
    } finally {
      isFetchingPromise = null;
    }
  })();

  return isFetchingPromise;
}

/**
 * Fetches categories from API, updates memory and localStorage cache.
 */
export async function fetchCategoriesAndCache(): Promise<Category[]> {
  if (isFetchingCategoriesPromise) {
    return isFetchingCategoriesPromise;
  }

  isFetchingCategoriesPromise = (async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          memoryCategoriesCache = data;
          try {
            localStorage.setItem('naimshop_categories_cache', JSON.stringify(data));
            localStorage.setItem('naimshop_categories', JSON.stringify(data));
          } catch (e) {
            console.warn('Storage quota exceeded for categories');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      isFetchingCategoriesPromise = null;
    }
    return memoryCategoriesCache;
  })();

  return isFetchingCategoriesPromise;
}

/**
 * Fetches banners from API, updates memory and localStorage cache.
 */
export async function fetchBannersAndCache(): Promise<any[]> {
  if (isFetchingBannersPromise) {
    return isFetchingBannersPromise;
  }

  isFetchingBannersPromise = (async () => {
    try {
      const response = await fetch('/api/banners');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          memoryBannersCache = data;
          try {
            localStorage.setItem('naimshop_banners_cache', JSON.stringify(data));
          } catch (e) {
            console.warn('Storage quota exceeded for banners');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      isFetchingBannersPromise = null;
    }
    return memoryBannersCache;
  })();

  return isFetchingBannersPromise;
}

/**
 * Gets cached products list instantly from memory.
 */
export function getCachedProducts(): Product[] {
  return memoryProductsCache;
}

/**
 * Gets cached categories list instantly from memory.
 */
export function getCachedCategories(): Category[] {
  return memoryCategoriesCache;
}

/**
 * Gets cached banners list instantly from memory.
 */
export function getCachedBanners(): any[] {
  return memoryBannersCache;
}

/**
 * Gets a specific product by ID from the cache instantly.
 */
export function getCachedProductById(id: string): Product | undefined {
  return memoryProductsCache.find(p => p.id === id);
}

/**
 * Updates cache for a specific product and syncs to disk
 */
export function updateCachedProduct(product: Product) {
  const index = memoryProductsCache.findIndex(p => p.id === product.id);
  if (index !== -1) {
    memoryProductsCache[index] = product;
  } else {
    memoryProductsCache.unshift(product);
  }
  
  try {
    localStorage.setItem('naimshop_products_cache', JSON.stringify(memoryProductsCache));
  } catch (e) {
    console.error('Failed to write updated product cache to localStorage', e);
  }
}


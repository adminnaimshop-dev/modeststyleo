/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  title?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  categoryMainBanner?: string;
  categorySectionBanner?: string;
  images?: string[];
  price: number;
  stock?: string;
  status?: string;
  isDeleted?: boolean;
  name: string; 
  image: string; 
  // other existing fields
  oldPrice?: number;
  discountPrice?: number;
  isFlashSale?: boolean;
  views: number;
  sku?: string;
  fabric?: string;
  gsm?: string;
  fit?: string;
  care?: string;
  sizes?: string[];
  shortDescription?: string;
  fullDescription?: string;
  rating: number;
  discount?: string;
  category: string;
  isFeatured?: boolean;
  isOffer?: boolean;
  sortOrder?: number;
  lowStockQuantity?: number;
  variants?: Array<{ id: string; color?: string; size?: string; stock?: number; price?: number }>;
  colors?: string[];
  deliveryCharge?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoScore?: number;
  focusKeywords?: string;
  tags?: string[];
  searchKeywords?: string;
  googleKeywords?: string;
  websiteKeywords?: string[];
  facebookKeywords?: string[];
  tiktokKeywords?: string[];
  youtubeKeywords?: string[];
  banglaKeywords?: string[];
  englishKeywords?: string[];
  wrongSpellingKeywords?: string[];
  instagramKeywords?: string[];
  whatsappKeywords?: string[];
  longtailKeywords?: string[];
  intentKeywords?: string[];
  trendingKeywords?: string[];
  relatedKeywords?: string[];
  hashtagKeywords?: string[];
  slug?: string;
  imageAlt?: string;

  // MySQL specific fields
  product_name?: string;
  product_slug?: string;
  regular_price?: number;
  sale_price?: number;
  stock_qty?: number;
  brand_name?: string;

  facebookTitle?: string;
  facebookDescription?: string;
  facebookImageAlt?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  productSchema?: string;
  brand?: string;
  sold?: number;
  highlights?: string[];
  returnPolicy?: string[];
  qnas?: Array<{ question: string; answer: string }>;
  trustBadges?: Array<{ title: string; description?: string; icon?: string }>;
  deliveryInsideDhaka?: number;
  deliveryOutsideDhaka?: number;
  deliveryTime?: string;
  shareSettings?: {
    enabled?: boolean;
    facebook?: boolean;
    messenger?: boolean;
    whatsapp?: boolean;
    copyLink?: boolean;
  };
  reviewSettings?: {
    enabled?: boolean;
    imageReview?: boolean;
    videoReview?: boolean;
    verifiedOnly?: boolean;
  };
  relatedProductMode?: 'auto' | 'manual';
  manualRelatedIds?: string[];
  packageContents?: string[];
  sizeGuideImage?: string;
  colorsList?: Array<{ name: string; code: string; imageUrl?: string }>;
  customerGallery?: string[];
  whyChooseUs?: string[];
  brandInfo?: {
    logo?: string;
    name?: string;
    country?: string;
    warranty?: string;
  };
  careInstructions?: string[];
  recentBoughtCount?: number;
  peopleViewingCount?: number;
  offersInfo?: {
    discountText?: string;
    freeDelivery?: boolean;
    couponCode?: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  text: string;
  rating: number;
  images: string[];
  date: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  iconImage?: string;
  mainBanner?: string;
  sectionBanner?: string;
  status?: boolean;
  serialNumber?: number;
  updatedAt?: string;
  lastEdited?: string; 
  image: string;
  shortTitle?: string;
}

export interface Banner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  status?: boolean;
  serial?: number;
  categorySlug?: string;
  badge?: string;
  bgColor?: string;
  type?: string;
}

export interface MessengerMessage {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhoto?: string;
  message: string;
  replyBy: 'ai' | 'human' | 'customer';
  timestamp: string;
  type: 'text' | 'image';
  status?: 'sending' | 'delivered' | 'failed';
}

export interface MessengerClickLog {
  id: string;
  type: 'whatsapp' | 'messenger' | 'email' | 'call';
  customerId?: string;
  timestamp: string;
}

export interface Customer {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  provider: string;
  lastLogin: string;
  status: 'active' | 'blocked';
  totalOrders: number;
  totalSpend: number;
  tags: string[];
  notes: string[];
  addresses: Array<{
    id: string;
    division: string;
    district: string;
    upazila: string;
    address: string;
    phone: string;
    isDefault: boolean;
  }>;
  isDeleted?: boolean;
}

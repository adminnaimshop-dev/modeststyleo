/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Banner, Category, Product, Review } from './types';

export const CATEGORIES: Category[] = [];

export const MAIN_HERO: Banner = {
  id: 'hero',
  title: 'Welcome to our shop',
  subtitle: 'Fresh and Real Products Only',
  badge: 'Exclusive',
  image: '',
  bgColor: '#000000',
};

export const COLLECTION_BANNERS: Record<string, Banner> = {};

export const PRODUCTS: Product[] = [];

export const DEMO_REVIEWS: Review[] = [];

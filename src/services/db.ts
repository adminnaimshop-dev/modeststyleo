import type { Category } from '../types';
import { getApiBaseUrl, safeParseJson } from '../utils/api';

export const CategoryService = {
  async getCategories(): Promise<Category[]> {
    const baseUrl = getApiBaseUrl();
    const requestUrl = `${baseUrl}/api/categories`;
    const res = await fetch(requestUrl);
    
    const rawText = await res.text();
    if (!res.ok) {
      console.error('Error fetching categories from API:', rawText);
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }
    
    const data = await safeParseJson(res, rawText);
    return data || [];
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    let res: Response;
    const baseUrl = getApiBaseUrl();
    const requestUrl = `${baseUrl}/api/categories`;
    try {
      res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
    } catch (err: any) {
      console.error("🔍 [Category API Diagnostic] Network/Fetch Error:", {
        url: requestUrl,
        error: err?.message || err
      });
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error('Network error: The image or payload might be too large, or the server dropped the connection.');
      }
      throw err;
    }

    const headersObj: Record<string, string> = {};
    res.headers.forEach((val, key) => { headersObj[key] = val; });

    const rawText = await res.text();

    console.group("🔍 [Category API Diagnostic]");
    console.log("Request URL:", requestUrl);
    console.log("HTTP Status:", res.status, res.statusText);
    console.log("Response Headers:", headersObj);
    console.log("Response Body (Raw):", rawText);
    console.groupEnd();

    const data = await safeParseJson(res, rawText);

    if (!res.ok) {
      console.error('❌ [Category API Diagnostic] Error creating category via API:', data);
      throw new Error(data.message || data.error || 'Failed to create category');
    }

    return data;
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.createCategory({ ...category, id });
  },

  async deleteCategory(id: string): Promise<void> {
    const baseUrl = getApiBaseUrl();
    const requestUrl = `${baseUrl}/api/categories/${id}`;
    const res = await fetch(requestUrl, {
      method: 'DELETE'
    });

    const rawText = await res.text();
    if (!res.ok) {
      let data;
      try { data = await safeParseJson(res, rawText); } catch(e) {}
      console.error('Error deleting category via API:', data);
      throw new Error(data?.message || data?.error || 'Failed to delete category');
    }
  }
};

import type { Category } from '../types';

export const CategoryService = {
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) {
      const err = await res.text();
      console.error('Error fetching categories from API:', err);
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }
    const data = await res.json();
    return data || [];
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    let res: Response;
    try {
      res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        console.error('Network error or Payload Too Large:', err);
        throw new Error('Network error: The image or payload might be too large, or the server dropped the connection.');
      }
      throw err;
    }

    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const rawText = await res.text();
      console.error("Non-JSON response from server:", rawText);
      throw new Error(`Server returned invalid response (${res.status}).`);
    }

    if (!res.ok) {
      console.error('Error creating category via API:', data);
      throw new Error(data.message || data.error || 'Failed to create category');
    }

    return data;
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.createCategory({ ...category, id });
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      let data;
      try { data = await res.json(); } catch(e) {}
      console.error('Error deleting category via API:', data);
      throw new Error(data?.message || data?.error || 'Failed to delete category');
    }
  }
};

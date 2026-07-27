import { supabase } from '../lib/supabase';
import type { Category } from '../types';

export const CategoryService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.category_name,
      slug: row.slug,
      image: row.image || '',
      iconImage: row.icon_image || row.image || '',
      banner: row.banner || '',
      mainBanner: row.banner || '',
      sectionBanner: row.section_banner || '',
      description: row.description || '',
      status: row.status !== false,
      serialNumber: row.serial_number || 0,
      displayOrder: row.display_order || row.serial_number || 0,
      seoTitle: row.seo_title || '',
      seoDescription: row.seo_description || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
      lastEdited: row.last_edited || '',
      shortTitle: row.short_title || row.category_name
    }));
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    const nowStr = new Date().toISOString();
    const payload = {
      id: category.id || `cat_${Date.now()}`,
      category_name: category.name || '',
      slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || '',
      image: category.image || '',
      icon_image: category.iconImage || category.image || '',
      banner: category.banner || '',
      section_banner: category.sectionBanner || '',
      description: category.description || '',
      status: category.status !== false,
      display_order: category.displayOrder || 0,
      serial_number: category.serialNumber || category.displayOrder || 0,
      seo_title: category.seoTitle || category.name || '',
      seo_description: category.seoDescription || category.description || '',
      created_at: category.createdAt || nowStr,
      updated_at: nowStr,
      last_edited: nowStr,
      short_title: category.shortTitle || category.name || ''
    };

    const { data, error } = await supabase
      .from('categories')
      .upsert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating category in Supabase:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.category_name,
      slug: data.slug,
      image: data.image || '',
      iconImage: data.icon_image || data.image || '',
      banner: data.banner || '',
      mainBanner: data.banner || '',
      sectionBanner: data.section_banner || '',
      description: data.description || '',
      status: data.status !== false,
      serialNumber: data.serial_number || 0,
      displayOrder: data.display_order || 0,
      seoTitle: data.seo_title || '',
      seoDescription: data.seo_description || '',
      createdAt: data.created_at || '',
      updatedAt: data.updated_at || '',
      lastEdited: data.last_edited || '',
      shortTitle: data.short_title || data.category_name
    };
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.createCategory({ ...category, id });
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category from Supabase:', error);
      throw error;
    }
  }
};

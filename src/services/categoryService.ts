import { categoryRepository } from '../repository/categoryRepository';
import { Category } from '../types/db';

export const categoryService = {
  async createCategory(name: string): Promise<Category> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Category name is required.');
    }

    // Check duplicate (case-insensitive)
    const existing = await categoryRepository.getAllCategories();
    const isDuplicate = existing.some(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Category "${trimmedName}" already exists.`);
    }

    return await categoryRepository.createCategory(trimmedName);
  },

  async getCategoryById(id: string): Promise<Category | null> {
    if (!id.trim()) {
      throw new Error('Invalid category ID.');
    }
    return await categoryRepository.getCategoryById(id);
  },

  async getAllCategories(): Promise<Category[]> {
    return await categoryRepository.getAllCategories();
  },

  async updateCategory(id: string, name: string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Category name is required.');
    }

    const category = await categoryRepository.getCategoryById(id);
    if (!category) {
      throw new Error('Category could not be found.');
    }

    // Check duplicate with another category
    const existing = await categoryRepository.getAllCategories();
    const isDuplicate = existing.some(
      (cat) => cat.id !== id && cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Category "${trimmedName}" already exists.`);
    }

    await categoryRepository.updateCategory(id, trimmedName);
  },

  async deleteCategory(id: string): Promise<void> {
    const category = await categoryRepository.getCategoryById(id);
    if (!category) {
      throw new Error('Category could not be found.');
    }

    // Safety check: check if it contains products
    const products = await categoryRepository.getCategoryProducts(id);
    if (products.length > 0) {
      throw new Error('Category cannot be deleted because it still contains products.');
    }

    await categoryRepository.deleteCategory(id);
  }
};

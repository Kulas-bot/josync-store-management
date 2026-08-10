import { getDatabase } from '../database';
import { Category, Product } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const categoryRepository = {
  async createCategory(name: string): Promise<Category> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO categories (id, name, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, NULL);`,
      [id, name, now, now]
    );

    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error(`Failed to retrieve newly created category with ID ${id}`);
    }
    return category;
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Category>(
      `SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getAllCategories(): Promise<Category[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Category>(
      `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC;`
    );
    return results;
  },

  async updateCategory(id: string, name: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE categories SET name = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [name, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to update category: Category not found or already deleted.`);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete category: Category not found or already deleted.`);
    }
  },

  async getCategoryProducts(categoryId: string): Promise<Product[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Product>(
      `SELECT * FROM products WHERE category_id = ? AND deleted_at IS NULL ORDER BY name ASC;`,
      [categoryId]
    );
    return results;
  }
};

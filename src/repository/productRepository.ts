import { getDatabase } from '../database';
import { Product } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const productRepository = {
  async createProduct(
    categoryId: string,
    name: string,
    stockStatus: 'high' | 'low' | 'out',
    storeId?: string | null
  ): Promise<Product> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO products (id, category_id, store_id, name, stock_status, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL);`,
      [id, categoryId, storeId ?? null, name, stockStatus, now, now]
    );

    const product = await this.getProductById(id);
    if (!product) {
      throw new Error(`Failed to retrieve newly created product with ID ${id}`);
    }
    return product;
  },

  async getProductById(id: string): Promise<Product | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Product>(
      `SELECT * FROM products WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getAllProducts(): Promise<Product[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Product>(
      `SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC;`
    );
    return results;
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Product>(
      `SELECT * FROM products WHERE category_id = ? AND deleted_at IS NULL ORDER BY name ASC;`,
      [categoryId]
    );
    return results;
  },

  async getProductsByStore(storeId: string): Promise<Product[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Product>(
      `SELECT * FROM products WHERE store_id = ? AND deleted_at IS NULL ORDER BY name ASC;`,
      [storeId]
    );
    return results;
  },

  async updateProduct(
    id: string,
    name: string,
    categoryId: string,
    stockStatus?: 'high' | 'low' | 'out',
    storeId?: string | null
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new Error(`Failed to update product: Product not found or already deleted.`);
    }

    const resolvedStatus = stockStatus ?? existing.stock_status;
    const resolvedStoreId = storeId !== undefined ? storeId : existing.store_id ?? null;

    const result = await db.runAsync(
      `UPDATE products SET name = ?, category_id = ?, store_id = ?, stock_status = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [name, categoryId, resolvedStoreId, resolvedStatus, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to update product: Product not found or already deleted.`);
    }
  },

  async updateStockStatus(id: string, stockStatus: 'high' | 'low' | 'out'): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE products SET stock_status = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [stockStatus, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to update stock status: Product not found or already deleted.`);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE products SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete product: Product not found or already deleted.`);
    }
  }
};

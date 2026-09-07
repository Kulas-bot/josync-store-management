import { getDatabase } from '../database';
import { Store, Product } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const storeRepository = {
  async createStore(name: string): Promise<Store> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO stores (id, name, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, NULL);`,
      [id, name, now, now]
    );

    const store = await this.getStoreById(id);
    if (!store) {
      throw new Error(`Failed to retrieve newly created store with ID ${id}`);
    }
    return store;
  },

  async getStoreById(id: string): Promise<Store | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Store>(
      `SELECT * FROM stores WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getStoreByName(name: string): Promise<Store | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Store>(
      `SELECT * FROM stores WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL;`,
      [name.trim()]
    );
    return result;
  },

  async getAllStores(): Promise<Store[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Store>(
      `SELECT * FROM stores WHERE deleted_at IS NULL ORDER BY name ASC;`
    );
    return results;
  },

  async updateStore(id: string, name: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE stores SET name = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [name, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to update store: Store not found or already deleted.`);
    }
  },

  async deleteStore(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE stores SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete store: Store not found or already deleted.`);
    }
  },

  async getStoreProducts(storeId: string): Promise<Product[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Product>(
      `SELECT * FROM products WHERE store_id = ? AND deleted_at IS NULL ORDER BY name ASC;`,
      [storeId]
    );
    return results;
  }
};

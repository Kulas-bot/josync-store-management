import { getDatabase } from '../database';
import { ShoppingList } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const shoppingListRepository = {
  async createShoppingList(shoppingDate: string, status: 'active' | 'completed'): Promise<ShoppingList> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO shopping_lists (id, shopping_date, status, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, NULL);`,
      [id, shoppingDate, status, now, now]
    );

    const list = await this.getShoppingListById(id);
    if (!list) {
      throw new Error(`Failed to retrieve newly created shopping list with ID ${id}`);
    }
    return list;
  },

  async getShoppingListById(id: string): Promise<ShoppingList | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<ShoppingList>(
      `SELECT * FROM shopping_lists WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getAllShoppingLists(): Promise<ShoppingList[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<ShoppingList>(
      `SELECT * FROM shopping_lists WHERE deleted_at IS NULL ORDER BY shopping_date DESC;`
    );
    return results;
  },

  async getActiveShoppingList(): Promise<ShoppingList | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<ShoppingList>(
      `SELECT * FROM shopping_lists WHERE status = 'active' AND deleted_at IS NULL ORDER BY shopping_date DESC LIMIT 1;`
    );
    return result;
  },

  async updateShoppingList(id: string, updates: Partial<Pick<ShoppingList, 'shopping_date' | 'status'>>): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await this.getShoppingListById(id);
    if (!existing) {
      throw new Error(`Failed to update shopping list: List not found or already deleted.`);
    }

    const shoppingDate = updates.shopping_date ?? existing.shopping_date;
    const status = updates.status ?? existing.status;

    const result = await db.runAsync(
      `UPDATE shopping_lists SET shopping_date = ?, status = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL;`,
      [shoppingDate, status, now, id]
    );

    if (result.changes === 0) {
      throw new Error(`Failed to update shopping list: List not found or already deleted.`);
    }
  },

  async deleteShoppingList(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE shopping_lists SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete shopping list: List not found or already deleted.`);
    }
  }
};

import { getDatabase } from '../database';
import { ShoppingListItem } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const shoppingListItemRepository = {
  async createShoppingListItem(
    shoppingListId: string,
    productId: string,
    statusAtCreation: 'low' | 'out'
  ): Promise<ShoppingListItem> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO shopping_list_items (id, shopping_list_id, product_id, status_at_creation, purchased, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, NULL);`,
      [id, shoppingListId, productId, statusAtCreation, now, now]
    );

    const item = await this.getShoppingListItemById(id);
    if (!item) {
      throw new Error(`Failed to retrieve newly created shopping list item with ID ${id}`);
    }
    return item;
  },

  async getShoppingListItemById(id: string): Promise<ShoppingListItem | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<ShoppingListItem>(
      `SELECT * FROM shopping_list_items WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getItemsByShoppingList(shoppingListId: string): Promise<ShoppingListItem[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<ShoppingListItem>(
      `SELECT * FROM shopping_list_items WHERE shopping_list_id = ? AND deleted_at IS NULL;`,
      [shoppingListId]
    );
    return results;
  },

  async getItemsByProduct(productId: string): Promise<ShoppingListItem[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<ShoppingListItem>(
      `SELECT * FROM shopping_list_items WHERE product_id = ? AND deleted_at IS NULL;`,
      [productId]
    );
    return results;
  },

  async updateShoppingListItem(id: string, updates: Partial<Pick<ShoppingListItem, 'purchased'>>): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await this.getShoppingListItemById(id);
    if (!existing) {
      throw new Error(`Failed to update shopping list item: Item not found or already deleted.`);
    }

    const purchased = updates.purchased !== undefined ? updates.purchased : existing.purchased;

    const result = await db.runAsync(
      `UPDATE shopping_list_items SET purchased = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL;`,
      [purchased, now, id]
    );

    if (result.changes === 0) {
      throw new Error(`Failed to update shopping list item: Item not found or already deleted.`);
    }
  },

  async markItemAsPurchased(id: string, purchased: boolean): Promise<void> {
    await this.updateShoppingListItem(id, { purchased: purchased ? 1 : 0 });
  },

  async deleteShoppingListItem(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE shopping_list_items SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete shopping list item: Item not found or already deleted.`);
    }
  }
};

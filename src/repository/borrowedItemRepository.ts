import { getDatabase } from '../database';
import { BorrowedItem } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const borrowedItemRepository = {
  async createBorrowedItem(
    borrowerId: string,
    itemType: 'product' | 'cash',
    itemName: string,
    amount: number,
    productId?: string | null,
    notes?: string | null,
    borrowedAt?: string
  ): Promise<BorrowedItem> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    const finalBorrowedAt = borrowedAt ?? now;

    await db.runAsync(
      `INSERT INTO borrowed_items (
        id, borrower_id, product_id, item_type, item_name, amount, notes, borrowed_at, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        borrowerId,
        productId ?? null,
        itemType,
        itemName,
        amount,
        notes ?? null,
        finalBorrowedAt,
        now,
        now
      ]
    );

    const item = await this.getBorrowedItemById(id);
    if (!item) {
      throw new Error(`Failed to retrieve newly created borrowed item with ID ${id}`);
    }
    return item;
  },

  async getBorrowedItemById(id: string): Promise<BorrowedItem | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<BorrowedItem>(
      `SELECT * FROM borrowed_items WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getBorrowedItemsByBorrower(borrowerId: string): Promise<BorrowedItem[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<BorrowedItem>(
      `SELECT * FROM borrowed_items WHERE borrower_id = ? AND deleted_at IS NULL ORDER BY borrowed_at DESC;`,
      [borrowerId]
    );
    return results;
  },

  async updateBorrowedItem(
    id: string,
    updates: Partial<Pick<BorrowedItem, 'item_name' | 'amount' | 'notes'>>
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await this.getBorrowedItemById(id);
    if (!existing) {
      throw new Error(`Failed to update borrowed item: Item not found or already deleted.`);
    }

    const itemName = updates.item_name ?? existing.item_name;
    const amount = updates.amount ?? existing.amount;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;

    const result = await db.runAsync(
      `UPDATE borrowed_items SET item_name = ?, amount = ?, notes = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL;`,
      [itemName, amount, notes, now, id]
    );

    if (result.changes === 0) {
      throw new Error(`Failed to update borrowed item: Item not found or already deleted.`);
    }
  },

  async deleteBorrowedItem(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE borrowed_items SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete borrowed item: Item not found or already deleted.`);
    }
  },

  async getAllBorrowedItems(): Promise<BorrowedItem[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<BorrowedItem>(
      `SELECT * FROM borrowed_items WHERE deleted_at IS NULL ORDER BY borrowed_at DESC;`
    );
    return results;
  }
};

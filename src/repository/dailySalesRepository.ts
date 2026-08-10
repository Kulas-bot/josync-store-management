import { getDatabase } from '../database';
import { DailySale } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const dailySalesRepository = {
  async createDailySale(salesDate: string, totalAmount: number, notes?: string | null): Promise<DailySale> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO daily_sales (id, sales_date, total_amount, notes, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL);`,
      [id, salesDate, totalAmount, notes ?? null, now, now]
    );

    const sale = await this.getDailySaleById(id);
    if (!sale) {
      throw new Error(`Failed to retrieve newly created daily sale with ID ${id}`);
    }
    return sale;
  },

  async getDailySaleById(id: string): Promise<DailySale | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<DailySale>(
      `SELECT * FROM daily_sales WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getSalesByDate(salesDate: string): Promise<DailySale | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<DailySale>(
      `SELECT * FROM daily_sales WHERE sales_date = ? AND deleted_at IS NULL;`,
      [salesDate]
    );
    return result;
  },

  async getSalesBetweenDates(startDate: string, endDate: string): Promise<DailySale[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<DailySale>(
      `SELECT * FROM daily_sales WHERE sales_date >= ? AND sales_date <= ? AND deleted_at IS NULL ORDER BY sales_date DESC;`,
      [startDate, endDate]
    );
    return results;
  },

  async getAllDailySales(): Promise<DailySale[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<DailySale>(
      `SELECT * FROM daily_sales WHERE deleted_at IS NULL ORDER BY sales_date DESC;`
    );
    return results;
  },

  async updateDailySale(id: string, updates: Partial<Pick<DailySale, 'total_amount' | 'notes'>>): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await this.getDailySaleById(id);
    if (!existing) {
      throw new Error(`Failed to update daily sale: Sale record not found or already deleted.`);
    }

    const totalAmount = updates.total_amount ?? existing.total_amount;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;

    const result = await db.runAsync(
      `UPDATE daily_sales SET total_amount = ?, notes = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL;`,
      [totalAmount, notes, now, id]
    );

    if (result.changes === 0) {
      throw new Error(`Failed to update daily sale: Sale record not found or already deleted.`);
    }
  },

  async deleteDailySale(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE daily_sales SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete daily sale: Sale record not found or already deleted.`);
    }
  }
};

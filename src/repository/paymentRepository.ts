import { getDatabase } from '../database';
import { Payment } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const paymentRepository = {
  async createPayment(borrowerId: string, amount: number, paymentDate: string, notes?: string | null): Promise<Payment> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO payments (id, borrower_id, amount, payment_date, notes, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL);`,
      [id, borrowerId, amount, paymentDate, notes ?? null, now, now]
    );

    const payment = await this.getPaymentById(id);
    if (!payment) {
      throw new Error(`Failed to retrieve newly created payment with ID ${id}`);
    }
    return payment;
  },

  async getPaymentById(id: string): Promise<Payment | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Payment>(
      `SELECT * FROM payments WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );
    return result;
  },

  async getPaymentsByBorrower(borrowerId: string): Promise<Payment[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Payment>(
      `SELECT * FROM payments WHERE borrower_id = ? AND deleted_at IS NULL ORDER BY payment_date DESC;`,
      [borrowerId]
    );
    return results;
  },

  async getAllPayments(): Promise<Payment[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Payment>(
      `SELECT * FROM payments WHERE deleted_at IS NULL ORDER BY payment_date DESC;`
    );
    return results;
  },

  async updatePayment(id: string, updates: Partial<Pick<Payment, 'amount' | 'payment_date' | 'notes'>>): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await this.getPaymentById(id);
    if (!existing) {
      throw new Error(`Failed to update payment: Payment not found or already deleted.`);
    }

    const amount = updates.amount ?? existing.amount;
    const paymentDate = updates.payment_date ?? existing.payment_date;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;

    const result = await db.runAsync(
      `UPDATE payments SET amount = ?, payment_date = ?, notes = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL;`,
      [amount, paymentDate, notes, now, id]
    );

    if (result.changes === 0) {
      throw new Error(`Failed to update payment: Payment not found or already deleted.`);
    }
  },

  async deletePayment(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE payments SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete payment: Payment not found or already deleted.`);
    }
  }
};

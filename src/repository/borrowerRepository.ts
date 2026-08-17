import { getDatabase } from '../database';
import { Borrower } from '../types/db';
import { generateUUID } from '../utils/uuid';

export const borrowerRepository = {
  async createBorrower(name: string, contactNumber?: string, address?: string, notes?: string): Promise<Borrower> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO borrowers (id, name, contact_number, address, notes, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL);`,
      [id, name, contactNumber ?? null, address ?? null, notes ?? null, now, now]
    );

    const borrower = await this.getBorrowerById(id);
    if (!borrower) {
      throw new Error(`Failed to retrieve newly created borrower with ID ${id}`);
    }
    return borrower;
  },

  async getBorrowerById(id: string): Promise<Borrower | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<Borrower>(
      `SELECT * FROM borrowers WHERE id = ?;`,
      [id]
    );
    return result;
  },

  async getAllBorrowers(): Promise<Borrower[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Borrower>(
      `SELECT * FROM borrowers WHERE deleted_at IS NULL ORDER BY name ASC;`
    );
    return results;
  },

  async updateBorrower(id: string, updates: Partial<Pick<Borrower, 'name' | 'contact_number' | 'address' | 'notes'>>): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Fetch existing borrower to apply partial updates
    const existing = await this.getBorrowerById(id);
    if (!existing) {
      throw new Error(`Failed to update borrower: Borrower not found or already deleted.`);
    }

    const name = updates.name ?? existing.name;
    const contactNumber = updates.contact_number !== undefined ? updates.contact_number : existing.contact_number;
    const address = updates.address !== undefined ? updates.address : existing.address;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;

    const result = await db.runAsync(
      `UPDATE borrowers SET name = ?, contact_number = ?, address = ?, notes = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL;`,
      [name, contactNumber, address, notes, now, id]
    );

    if (result.changes === 0) {
      throw new Error(`Failed to update borrower: Borrower not found or already deleted.`);
    }
  },

  async deleteBorrower(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE borrowers SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL;`,
      [now, now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to delete borrower: Borrower not found or already deleted.`);
    }
  },

  async getArchivedBorrowers(): Promise<Borrower[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<Borrower>(
      `SELECT * FROM borrowers WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC;`
    );
    return results;
  },

  async restoreBorrower(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE borrowers SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL;`,
      [now, id]
    );
    if (result.changes === 0) {
      throw new Error(`Failed to restore borrower: Borrower not found or not archived.`);
    }
  }
};

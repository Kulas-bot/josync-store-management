import { dailySalesRepository } from '../repository/dailySalesRepository';
import { DailySale } from '../types/db';

export interface SalesSummary {
  totalSales: number;
  daysCount: number;
  highestDay: DailySale | null;
  lowestDay: DailySale | null;
  averageDailySales: number;
}

export const dailySalesService = {
  async recordDailySale(salesDate: string, totalAmount: number, notes?: string | null): Promise<DailySale> {
    if (!salesDate || !salesDate.trim()) {
      throw new Error('Sales date is required.');
    }

    // Check valid date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(salesDate)) {
      throw new Error('Invalid sales date.');
    }

    if (totalAmount === undefined || totalAmount === null) {
      throw new Error('Sales amount is required.');
    }

    if (isNaN(totalAmount)) {
      throw new Error('Sales amount must be numeric.');
    }

    if (totalAmount < 0) {
      throw new Error('Sales amount cannot be negative.');
    }

    const trimmedNotes = notes ? notes.trim() : null;

    // Check if record exists for this date
    const existing = await dailySalesRepository.getSalesByDate(salesDate);

    if (existing) {
      // Update existing record
      await dailySalesRepository.updateDailySale(existing.id, {
        total_amount: totalAmount,
        notes: trimmedNotes
      });
      const updated = await dailySalesRepository.getDailySaleById(existing.id);
      if (!updated) {
        throw new Error('Daily sales could not be saved.');
      }
      return updated;
    } else {
      // Create new record
      return await dailySalesRepository.createDailySale(salesDate, totalAmount, trimmedNotes);
    }
  },

  async getSalesByDate(salesDate: string): Promise<DailySale | null> {
    if (!salesDate || !salesDate.trim()) {
      throw new Error('Sales date is required.');
    }
    return await dailySalesRepository.getSalesByDate(salesDate);
  },

  async getTodaySales(): Promise<DailySale | null> {
    const todayStr = new Date().toISOString().split('T')[0];
    return await this.getSalesByDate(todayStr);
  },

  async getSalesBetweenDates(startDate: string, endDate: string): Promise<DailySale[]> {
    if (!startDate || !startDate.trim() || !endDate || !endDate.trim()) {
      throw new Error('Start date and end date are required.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid sales date.');
    }

    if (start > end) {
      throw new Error('Start date cannot be after end date.');
    }

    return await dailySalesRepository.getSalesBetweenDates(startDate, endDate);
  },

  async getAllDailySales(): Promise<DailySale[]> {
    return await dailySalesRepository.getAllDailySales();
  },

  async updateDailySale(id: string, updates: Partial<Pick<DailySale, 'total_amount' | 'notes'>>): Promise<void> {
    const sale = await dailySalesRepository.getDailySaleById(id);
    if (!sale) {
      throw new Error('Daily sales record could not be found.');
    }

    if (updates.total_amount !== undefined) {
      if (isNaN(updates.total_amount)) {
        throw new Error('Sales amount must be numeric.');
      }
      if (updates.total_amount < 0) {
        throw new Error('Sales amount cannot be negative.');
      }
    }

    if (updates.notes !== undefined && updates.notes !== null) {
      updates.notes = updates.notes.trim();
    }

    await dailySalesRepository.updateDailySale(id, updates);
  },

  async deleteDailySale(id: string): Promise<void> {
    const sale = await dailySalesRepository.getDailySaleById(id);
    if (!sale) {
      throw new Error('Daily sales record could not be found.');
    }
    await dailySalesRepository.deleteDailySale(id);
  },

  async getTotalSalesBetweenDates(startDate: string, endDate: string): Promise<number> {
    const sales = await this.getSalesBetweenDates(startDate, endDate);
    return sales.reduce((sum, s) => sum + s.total_amount, 0);
  },

  async getSalesSummary(): Promise<SalesSummary> {
    const sales = await dailySalesRepository.getAllDailySales();
    const daysCount = sales.length;

    if (daysCount === 0) {
      return {
        totalSales: 0,
        daysCount: 0,
        highestDay: null,
        lowestDay: null,
        averageDailySales: 0
      };
    }

    const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
    
    let highestDay = sales[0];
    let lowestDay = sales[0];

    for (const s of sales) {
      if (s.total_amount > highestDay.total_amount) {
        highestDay = s;
      }
      if (s.total_amount < lowestDay.total_amount) {
        lowestDay = s;
      }
    }

    const averageDailySales = totalSales / daysCount;

    return {
      totalSales,
      daysCount,
      highestDay,
      lowestDay,
      averageDailySales
    };
  }
};

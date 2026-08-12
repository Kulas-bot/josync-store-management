import { borrowerRepository } from '../repository/borrowerRepository';
import { borrowedItemRepository } from '../repository/borrowedItemRepository';
import { paymentRepository } from '../repository/paymentRepository';
import { productRepository } from '../repository/productRepository';
import { Borrower, BorrowedItem, Payment } from '../types/db';

export interface BorrowerSummary {
  borrower: Borrower;
  totalBorrowed: number;
  totalPayments: number;
  currentBalance: number;
  borrowedTransactionsCount: number;
  mostRecentBorrowingDate: string | null;
  mostRecentPaymentDate: string | null;
}

export interface LedgerSummaryItem {
  id: string;
  name: string;
  contact_number: string | null;
  address: string | null;
  notes: string | null;
  totalBorrowed: number;
  totalPayments: number;
  currentBalance: number;
  status: 'NEW' | 'PAID' | 'PARTIAL' | 'UNPAID';
  created_at: string;
}

export const borrowerService = {
  async createBorrower(name: string, contactNumber?: string, address?: string, notes?: string): Promise<Borrower> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Borrower name is required.');
    }
    return await borrowerRepository.createBorrower(trimmedName, contactNumber, address, notes);
  },

  async getBorrowerById(id: string): Promise<Borrower | null> {
    return await borrowerRepository.getBorrowerById(id);
  },

  async getAllBorrowers(): Promise<Borrower[]> {
    return await borrowerRepository.getAllBorrowers();
  },

  async updateBorrower(id: string, updates: Partial<Pick<Borrower, 'name' | 'contact_number' | 'address' | 'notes'>>): Promise<void> {
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName) {
        throw new Error('Borrower name is required.');
      }
      updates.name = trimmedName;
    }
    await borrowerRepository.updateBorrower(id, updates);
  },

  async deleteBorrower(id: string): Promise<void> {
    await borrowerRepository.deleteBorrower(id);
  },

  async searchBorrowers(nameQuery: string): Promise<Borrower[]> {
    const all = await borrowerRepository.getAllBorrowers();
    const query = nameQuery.toLowerCase().trim();
    return all.filter((b) => b.name.toLowerCase().includes(query));
  },

  async getBorrowerDetails(id: string): Promise<{ borrower: Borrower; borrowedItems: BorrowedItem[]; payments: Payment[]; currentBalance: number }> {
    const borrower = await borrowerRepository.getBorrowerById(id);
    if (!borrower) {
      throw new Error('Borrower could not be found.');
    }

    const borrowedItems = await borrowedItemRepository.getBorrowedItemsByBorrower(id);
    const payments = await paymentRepository.getPaymentsByBorrower(id);
    const currentBalance = await this.getCurrentBalance(id);

    return {
      borrower,
      borrowedItems,
      payments,
      currentBalance
    };
  },

  async createBorrowedItem(
    borrowerId: string,
    itemType: 'product' | 'cash',
    amount: number,
    productId?: string | null,
    notes?: string | null,
    borrowedAt?: string,
    quantity: number = 1
  ): Promise<BorrowedItem> {
    // Validate borrower exists
    const borrower = await borrowerRepository.getBorrowerById(borrowerId);
    if (!borrower) {
      throw new Error('Borrower could not be found.');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Borrowed amount must be greater than zero.');
    }

    // Validate itemType
    if (itemType !== 'product' && itemType !== 'cash') {
      throw new Error('Invalid borrowed item type.');
    }

    let finalItemName = 'Cash';
    let finalProductId = null;

    if (itemType === 'product') {
      if (!productId) {
        throw new Error('Product is required for product borrowing.');
      }
      const product = await productRepository.getProductById(productId);
      if (!product) {
        throw new Error('Product could not be found.');
      }
      finalItemName = product.name;
      finalProductId = productId;
    }

    return await borrowedItemRepository.createBorrowedItem(
      borrowerId,
      itemType,
      finalItemName,
      amount,
      finalProductId,
      notes,
      borrowedAt,
      quantity
    );
  },

  async getBorrowedItemsByBorrower(borrowerId: string): Promise<BorrowedItem[]> {
    return await borrowedItemRepository.getBorrowedItemsByBorrower(borrowerId);
  },

  async deleteBorrowedItem(id: string): Promise<void> {
    await borrowedItemRepository.deleteBorrowedItem(id);
  },

  async getCurrentBalance(borrowerId: string): Promise<number> {
    const items = await borrowedItemRepository.getBorrowedItemsByBorrower(borrowerId);
    const payments = await paymentRepository.getPaymentsByBorrower(borrowerId);

    const totalBorrowed = items.reduce((sum, item) => sum + item.amount, 0);
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);

    const balance = totalBorrowed - totalPayments;
    if (balance < 0) {
      throw new Error('Payments exceed total borrowed amount.');
    }
    return balance;
  },

  async getBorrowerSummary(borrowerId: string): Promise<BorrowerSummary> {
    const borrower = await borrowerRepository.getBorrowerById(borrowerId);
    if (!borrower) {
      throw new Error('Borrower could not be found.');
    }

    const items = await borrowedItemRepository.getBorrowedItemsByBorrower(borrowerId);
    const payments = await paymentRepository.getPaymentsByBorrower(borrowerId);

    const totalBorrowed = items.reduce((sum, item) => sum + item.amount, 0);
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const currentBalance = totalBorrowed - totalPayments;

    if (currentBalance < 0) {
      throw new Error('Payments exceed total borrowed amount.');
    }

    const mostRecentBorrowingDate = items.length > 0 ? items[0].borrowed_at : null;
    const mostRecentPaymentDate = payments.length > 0 ? payments[0].payment_date : null;

    return {
      borrower,
      totalBorrowed,
      totalPayments,
      currentBalance,
      borrowedTransactionsCount: items.length,
      mostRecentBorrowingDate,
      mostRecentPaymentDate
    };
  },

  async getLedgerSummary(): Promise<LedgerSummaryItem[]> {
    const borrowers = await borrowerRepository.getAllBorrowers();
    const summaryList: LedgerSummaryItem[] = [];

    for (const b of borrowers) {
      const items = await borrowedItemRepository.getBorrowedItemsByBorrower(b.id);
      const payments = await paymentRepository.getPaymentsByBorrower(b.id);

      const totalBorrowed = items.reduce((sum, item) => sum + item.amount, 0);
      const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);
      const currentBalance = totalBorrowed - totalPayments;

      if (currentBalance < 0) {
        // Safe check per customer ledger records
        continue;
      }

      summaryList.push({
        id: b.id,
        name: b.name,
        contact_number: b.contact_number,
        address: b.address,
        notes: b.notes,
        totalBorrowed,
        totalPayments,
        currentBalance,
        status: totalBorrowed === 0 ? 'NEW' : (currentBalance <= 0 ? 'PAID' : (totalPayments > 0 ? 'PARTIAL' : 'UNPAID')),
        created_at: b.created_at
      });
    }

    return summaryList;
  }
};

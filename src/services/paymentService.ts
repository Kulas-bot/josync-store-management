import { paymentRepository } from '../repository/paymentRepository';
import { borrowerRepository } from '../repository/borrowerRepository';
import { borrowerService } from './borrowerService';
import { Payment } from '../types/db';

// Recent payment cache for double payment prevention
interface RecentPayment {
  borrowerId: string;
  amount: number;
  timestamp: number;
}

const recentPaymentsCache: RecentPayment[] = [];
const DEBOUNCE_TIME_MS = 5000; // 5 seconds threshold

export const paymentService = {
  async validatePayment(borrowerId: string, amount: number, paymentDate: string): Promise<number> {
    if (amount === undefined || amount === null) {
      throw new Error('Payment amount is required.');
    }

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    if (!paymentDate || !paymentDate.trim()) {
      throw new Error('Payment date is required.');
    }

    const pDate = new Date(paymentDate);
    const today = new Date();
    pDate.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    if (pDate.getTime() > today.getTime()) {
      throw new Error('Hindi maaaring pumili ng petsa sa hinaharap.');
    }

    // Get current balance
    const currentBalance = await borrowerService.getCurrentBalance(borrowerId);
    if (currentBalance === 0) {
      throw new Error('No outstanding balance.');
    }

    if (amount > currentBalance) {
      throw new Error('Payment cannot be greater than the current balance.');
    }

    return currentBalance;
  },

  async recordPayment(borrowerId: string, amount: number, paymentDate: string, notes?: string | null): Promise<{ payment: Payment; updatedBalance: number }> {
    // 1. Validate borrower exists
    const borrower = await borrowerRepository.getBorrowerById(borrowerId);
    if (!borrower) {
      throw new Error('Borrower could not be found.');
    }

    // 2. Validate payment (fetches fresh balance inside validatePayment)
    await this.validatePayment(borrowerId, amount, paymentDate);

    // 3. Double payment protection
    const now = Date.now();
    
    // Cleanup old items from cache
    const cutoff = now - DEBOUNCE_TIME_MS;
    const activeCache = recentPaymentsCache.filter((p) => p.timestamp > cutoff);
    recentPaymentsCache.length = 0;
    recentPaymentsCache.push(...activeCache);

    // Check if duplicate entry exists
    const isDuplicate = recentPaymentsCache.some(
      (p) => p.borrowerId === borrowerId && p.amount === amount && (now - p.timestamp) < DEBOUNCE_TIME_MS
    );
    if (isDuplicate) {
      throw new Error('Duplicate payment submission detected. Please wait a moment.');
    }

    // 4. Save Payment
    const payment = await paymentRepository.createPayment(
      borrowerId,
      amount,
      paymentDate,
      notes ? notes.trim() : null
    );

    // Add to debounce cache
    recentPaymentsCache.push({ borrowerId, amount, timestamp: now });

    // 5. Recalculate balance
    const updatedBalance = await borrowerService.getCurrentBalance(borrowerId);

    return {
      payment,
      updatedBalance
    };
  },

  async getPaymentById(id: string): Promise<Payment | null> {
    return await paymentRepository.getPaymentById(id);
  },

  async getBorrowerPaymentHistory(borrowerId: string): Promise<Payment[]> {
    return await paymentRepository.getPaymentsByBorrower(borrowerId);
  },

  async getPaymentSummary(borrowerId: string): Promise<{ totalPayments: number; count: number; mostRecentPayment: Payment | null; mostRecentPaymentDate: string | null }> {
    const payments = await paymentRepository.getPaymentsByBorrower(borrowerId);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments,
      count: payments.length,
      mostRecentPayment: payments.length > 0 ? payments[0] : null,
      mostRecentPaymentDate: payments.length > 0 ? payments[0].payment_date : null
    };
  }
};

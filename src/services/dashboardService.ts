import { productService } from './productService';
import { borrowerService } from './borrowerService';
import { dailySalesService } from './dailySalesService';
import { shoppingListService } from './shoppingListService';
import { paymentRepository } from '../repository/paymentRepository';
import { borrowedItemRepository } from '../repository/borrowedItemRepository';
import { dailySalesRepository } from '../repository/dailySalesRepository';
import { borrowerRepository } from '../repository/borrowerRepository';

export interface DashboardInventorySummary {
  highCount: number;
  lowCount: number;
  outCount: number;
  totalCount: number;
}

export interface DashboardBorrowerSummary {
  totalActive: number;
  withBalanceCount: number;
  paidCount: number;
  totalOwed: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'payment' | 'borrowed' | 'sale' | 'shopping_list';
  title: string;
  subtitle: string;
  value: string;
  date: string;
  rawDate: string;
}

export interface DashboardSummary {
  todaySales: number;
  inventorySummary: DashboardInventorySummary;
  borrowerSummary: DashboardBorrowerSummary;
  paymentsTodayAmount: number;
  paymentsTodayCount: number;
  recentActivities: RecentActivityItem[];
}

export const dashboardService = {
  async getDashboardTodaySales(): Promise<number> {
    const today = await dailySalesService.getTodaySales();
    return today ? today.total_amount : 0;
  },

  async getDashboardInventorySummary(): Promise<DashboardInventorySummary> {
    const products = await productService.getAllProducts();
    let highCount = 0;
    let lowCount = 0;
    let outCount = 0;

    for (const p of products) {
      if (p.stock_status === 'high') {
        highCount++;
      } else if (p.stock_status === 'low') {
        lowCount++;
      } else if (p.stock_status === 'out') {
        outCount++;
      }
    }

    return {
      highCount,
      lowCount,
      outCount,
      totalCount: products.length
    };
  },

  async getDashboardBorrowerSummary(): Promise<DashboardBorrowerSummary> {
    const ledger = await borrowerService.getLedgerSummary();
    let withBalanceCount = 0;
    let paidCount = 0;
    let totalOwed = 0;

    for (const item of ledger) {
      if (item.status === 'HAS BALANCE') {
        withBalanceCount++;
        totalOwed += item.currentBalance;
      } else {
        paidCount++;
      }
    }

    return {
      totalActive: ledger.length,
      withBalanceCount,
      paidCount,
      totalOwed
    };
  },

  async getTodayPayments(): Promise<{ amount: number; count: number }> {
    const todayStr = new Date().toISOString().split('T')[0];
    const allPayments = await paymentRepository.getAllPayments();
    
    let amount = 0;
    let count = 0;

    for (const p of allPayments) {
      if (p.payment_date === todayStr) {
        amount += p.amount;
        count++;
      }
    }

    return { amount, count };
  },

  async getRecentActivities(): Promise<RecentActivityItem[]> {
    const activities: RecentActivityItem[] = [];

    // 1. Fetch recent payments
    const payments = await paymentRepository.getAllPayments();
    const recentPayments = payments.slice(0, 5);
    for (const p of recentPayments) {
      const borrower = await borrowerRepository.getBorrowerById(p.borrower_id);
      activities.push({
        id: p.id,
        type: 'payment',
        title: borrower ? borrower.name : 'Nangutang',
        subtitle: p.notes || 'Nagbayad ng utang',
        value: `₱${p.amount.toFixed(2)}`,
        date: p.payment_date,
        rawDate: p.created_at
      });
    }

    // 2. Fetch recent borrowed items
    const borrowedItems = await borrowedItemRepository.getAllBorrowedItems();
    const recentBorrowed = borrowedItems.slice(0, 5);
    for (const b of recentBorrowed) {
      const borrower = await borrowerRepository.getBorrowerById(b.borrower_id);
      activities.push({
        id: b.id,
        type: 'borrowed',
        title: borrower ? borrower.name : 'Nangutang',
        subtitle: `Hiram: ${b.item_name}`,
        value: `₱${b.amount.toFixed(2)}`,
        date: b.borrowed_at,
        rawDate: b.created_at
      });
    }

    // 3. Fetch recent daily sales
    const sales = await dailySalesRepository.getAllDailySales();
    const recentSales = sales.slice(0, 5);
    for (const s of recentSales) {
      activities.push({
        id: s.id,
        type: 'sale',
        title: 'Benta ng Araw',
        subtitle: s.notes || 'Kabuuang benta',
        value: `₱${s.total_amount.toFixed(2)}`,
        date: s.sales_date,
        rawDate: s.created_at
      });
    }

    // 4. Fetch recent shopping lists
    const shoppingLists = await shoppingListService.getAllShoppingLists();
    const recentLists = shoppingLists.slice(0, 3);
    for (const list of recentLists) {
      const summary = await shoppingListService.getShoppingListSummary(list.id);
      activities.push({
        id: list.id,
        type: 'shopping_list',
        title: 'Listahan ng Bibilhin',
        subtitle: list.status === 'active' ? 'Kasalukuyang namimili' : 'Tapos na ang pagbili',
        value: `${summary.unpurchasedItems} natitira`,
        date: list.shopping_date,
        rawDate: list.created_at
      });
    }

    // Sort all activities newest first by rawDate
    activities.sort((a, b) => b.rawDate.localeCompare(a.rawDate));

    return activities.slice(0, 10);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const todaySales = await this.getDashboardTodaySales();
    const inventorySummary = await this.getDashboardInventorySummary();
    const borrowerSummary = await this.getDashboardBorrowerSummary();
    const todayPayments = await this.getTodayPayments();
    const recentActivities = await this.getRecentActivities();

    return {
      todaySales,
      inventorySummary,
      borrowerSummary,
      paymentsTodayAmount: todayPayments.amount,
      paymentsTodayCount: todayPayments.count,
      recentActivities
    };
  }
};

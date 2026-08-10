import { productService } from './productService';
import { borrowerService } from './borrowerService';
import { dailySalesService } from './dailySalesService';
import { shoppingListService } from './shoppingListService';
import { categoryService } from './categoryService';
import { borrowedItemRepository } from '../repository/borrowedItemRepository';
import { paymentRepository } from '../repository/paymentRepository';
import { DailySale, Product, ShoppingList } from '../types/db';

export interface SalesReport {
  totalSales: number;
  averageSales: number;
  highestSalesDay: DailySale | null;
  lowestSalesDay: DailySale | null;
  recordedDaysCount: number;
  salesData: DailySale[];
}

export interface BorrowerReport {
  totalActiveBorrowers: number;
  borrowersWithBalance: number;
  borrowersPaid: number;
  totalOwedAmount: number;
  totalBorrowedInRange: number;
  totalPaymentsInRange: number;
}

export interface CategoryProductCount {
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface InventoryReport {
  highStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalActiveProducts: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  categoryProductCounts: CategoryProductCount[];
}

export interface ShoppingListReport {
  activeListTotalItems: number;
  activeListPurchasedItems: number;
  activeListUnpurchasedItems: number;
  completedListsCount: number;
  recentLists: ShoppingList[];
}

export const reportService = {
  validateDates(startDate: string, endDate: string): void {
    if (!startDate || !startDate.trim() || !endDate || !endDate.trim()) {
      throw new Error('Invalid report date range.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid report date range.');
    }

    if (start > end) {
      throw new Error('Invalid report date range.');
    }
  },

  async getSalesReport(startDate: string, endDate: string): Promise<SalesReport> {
    this.validateDates(startDate, endDate);

    const salesData = await dailySalesService.getSalesBetweenDates(startDate, endDate);
    const recordedDaysCount = salesData.length;

    if (recordedDaysCount === 0) {
      return {
        totalSales: 0,
        averageSales: 0,
        highestSalesDay: null,
        lowestSalesDay: null,
        recordedDaysCount: 0,
        salesData: []
      };
    }

    const totalSales = salesData.reduce((sum, s) => sum + s.total_amount, 0);
    const averageSales = totalSales / recordedDaysCount;

    let highestSalesDay = salesData[0];
    let lowestSalesDay = salesData[0];

    for (const s of salesData) {
      if (s.total_amount > highestSalesDay.total_amount) {
        highestSalesDay = s;
      }
      if (s.total_amount < lowestSalesDay.total_amount) {
        lowestSalesDay = s;
      }
    }

    return {
      totalSales,
      averageSales,
      highestSalesDay,
      lowestSalesDay,
      recordedDaysCount,
      salesData
    };
  },

  async getBorrowerReport(startDate: string, endDate: string): Promise<BorrowerReport> {
    this.validateDates(startDate, endDate);

    const ledger = await borrowerService.getLedgerSummary();
    const totalActiveBorrowers = ledger.length;

    let borrowersWithBalance = 0;
    let borrowersPaid = 0;
    let totalOwedAmount = 0;

    for (const item of ledger) {
      if (item.status === 'HAS BALANCE') {
        borrowersWithBalance++;
        totalOwedAmount += item.currentBalance;
      } else {
        borrowersPaid++;
      }
    }

    // Get total borrowed and paid in range
    const allBorrowedItems = await borrowedItemRepository.getAllBorrowedItems();
    const allPayments = await paymentRepository.getAllPayments();

    let totalBorrowedInRange = 0;
    for (const b of allBorrowedItems) {
      const bDate = b.borrowed_at.split('T')[0];
      if (bDate >= startDate && bDate <= endDate) {
        totalBorrowedInRange += b.amount;
      }
    }

    let totalPaymentsInRange = 0;
    for (const p of allPayments) {
      const pDate = p.payment_date.split('T')[0];
      if (pDate >= startDate && pDate <= endDate) {
        totalPaymentsInRange += p.amount;
      }
    }

    return {
      totalActiveBorrowers,
      borrowersWithBalance,
      borrowersPaid,
      totalOwedAmount,
      totalBorrowedInRange,
      totalPaymentsInRange
    };
  },

  async getInventoryReport(): Promise<InventoryReport> {
    const products = await productService.getAllProducts();
    const categories = await categoryService.getAllCategories();

    let highStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockProducts: Product[] = [];
    const outOfStockProducts: Product[] = [];

    const productCountsByCategory: Record<string, number> = {};

    for (const p of products) {
      productCountsByCategory[p.category_id] = (productCountsByCategory[p.category_id] || 0) + 1;

      if (p.stock_status === 'high') {
        highStockCount++;
      } else if (p.stock_status === 'low') {
        lowStockCount++;
        lowStockProducts.push(p);
      } else if (p.stock_status === 'out') {
        outOfStockCount++;
        outOfStockProducts.push(p);
      }
    }

    const categoryProductCounts: CategoryProductCount[] = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      count: productCountsByCategory[cat.id] || 0
    }));

    return {
      highStockCount,
      lowStockCount,
      outOfStockCount,
      totalActiveProducts: products.length,
      lowStockProducts,
      outOfStockProducts,
      categoryProductCounts
    };
  },

  async getShoppingListReport(): Promise<ShoppingListReport> {
    const active = await shoppingListService.getActiveShoppingList();
    
    let activeListTotalItems = 0;
    let activeListPurchasedItems = 0;
    let activeListUnpurchasedItems = 0;

    if (active) {
      const summary = await shoppingListService.getShoppingListSummary(active.id);
      activeListTotalItems = summary.totalItems;
      activeListPurchasedItems = summary.purchasedItems;
      activeListUnpurchasedItems = summary.unpurchasedItems;
    }

    const allLists = await shoppingListService.getAllShoppingLists();
    const completedListsCount = allLists.filter((l) => l.status === 'completed').length;
    const recentLists = allLists.slice(0, 5);

    return {
      activeListTotalItems,
      activeListPurchasedItems,
      activeListUnpurchasedItems,
      completedListsCount,
      recentLists
    };
  }
};

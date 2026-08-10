export * from './categoryService';
export * from './productService';
export * from './borrowerService';
export * from './paymentService';
export * from './dailySalesService';
export * from './shoppingListService';
export * from './dashboardService';
export * from './reportService';

export const syncService = {
  sync: async () => {
    console.log('Syncing data with server...');
  }
};

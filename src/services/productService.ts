import { productRepository } from '../repository/productRepository';
import { categoryRepository } from '../repository/categoryRepository';
import { storeRepository } from '../repository/storeRepository';
import { Product } from '../types/db';

export const productService = {
  async createProduct(
    categoryId: string,
    name: string,
    stockStatus: 'high' | 'low' | 'out',
    storeId?: string | null
  ): Promise<Product> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Product name is required.');
    }

    if (!categoryId.trim()) {
      throw new Error('Please select a category.');
    }

    // Verify category exists
    const category = await categoryRepository.getCategoryById(categoryId);
    if (!category) {
      throw new Error('Category could not be found.');
    }

    // Verify store exists if provided
    if (storeId && storeId.trim()) {
      const store = await storeRepository.getStoreById(storeId);
      if (!store) {
        throw new Error('Store could not be found.');
      }
    }

    // Validate stock status
    const validStatuses = ['high', 'low', 'out'];
    if (!validStatuses.includes(stockStatus)) {
      throw new Error('Invalid stock status.');
    }

    // Prevent duplicate product names within the same category
    const existingProducts = await productRepository.getProductsByCategory(categoryId);
    const isDuplicate = existingProducts.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Product "${trimmedName}" already exists in this category.`);
    }

    return await productRepository.createProduct(categoryId, trimmedName, stockStatus, storeId);
  },

  async getProductById(id: string): Promise<Product | null> {
    return await productRepository.getProductById(id);
  },

  async getAllProducts(): Promise<Product[]> {
    return await productRepository.getAllProducts();
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await productRepository.getProductsByCategory(categoryId);
  },

  async getProductsByStore(storeId: string): Promise<Product[]> {
    return await productRepository.getProductsByStore(storeId);
  },

  async updateProduct(
    id: string,
    name: string,
    categoryId: string,
    stockStatus?: 'high' | 'low' | 'out',
    storeId?: string | null
  ): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Product name is required.');
    }

    if (!categoryId.trim()) {
      throw new Error('Please select a category.');
    }

    if (stockStatus) {
      const validStatuses = ['high', 'low', 'out'];
      if (!validStatuses.includes(stockStatus)) {
        throw new Error('Invalid stock status.');
      }
    }

    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new Error('Product could not be found.');
    }

    // Verify category exists
    const category = await categoryRepository.getCategoryById(categoryId);
    if (!category) {
      throw new Error('Category could not be found.');
    }

    // Verify store exists if provided
    if (storeId && storeId.trim()) {
      const store = await storeRepository.getStoreById(storeId);
      if (!store) {
        throw new Error('Store could not be found.');
      }
    }

    // Check duplicate product name in target category
    const existingProducts = await productRepository.getProductsByCategory(categoryId);
    const isDuplicate = existingProducts.some(
      (p) => p.id !== id && p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Product "${trimmedName}" already exists in this category.`);
    }

    await productRepository.updateProduct(id, trimmedName, categoryId, stockStatus, storeId);
  },

  async updateStockStatus(id: string, stockStatus: 'high' | 'low' | 'out', bypassLock: boolean = false): Promise<void> {
    const validStatuses = ['high', 'low', 'out'];
    if (!validStatuses.includes(stockStatus)) {
      throw new Error('Invalid stock status.');
    }

    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new Error('Product could not be found.');
    }

    // If attempting to revert to 'high', verify if restocking lock is active
    if (stockStatus === 'high' && !bypassLock) {
      const { shoppingListService } = await import('./shoppingListService');
      const isLocked = await shoppingListService.isProductOnActiveShoppingList(id);
      if (isLocked) {
        throw new Error('Ang panindang ito ay kasalukuyang nasa Listahan ng Bibilhin. Tapusin muna ang pagbili sa listahan para maibalik sa Marami.');
      }
    }

    await productRepository.updateStockStatus(id, stockStatus);
  },

  async deleteProduct(id: string): Promise<void> {
    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new Error('Product could not be found.');
    }

    await productRepository.deleteProduct(id);
  },

  async getProductsByStockStatus(stockStatus: 'high' | 'low' | 'out'): Promise<Product[]> {
    const validStatuses = ['high', 'low', 'out'];
    if (!validStatuses.includes(stockStatus)) {
      throw new Error('Invalid stock status.');
    }

    const all = await productRepository.getAllProducts();
    return all.filter((p) => p.stock_status === stockStatus);
  },

  async getProductsGroupedByCategory(): Promise<Record<string, Product[]>> {
    const allProducts = await productRepository.getAllProducts();
    const groups: Record<string, Product[]> = {};

    for (const prod of allProducts) {
      if (!groups[prod.category_id]) {
        groups[prod.category_id] = [];
      }
      groups[prod.category_id].push(prod);
    }
    return groups;
  }
};

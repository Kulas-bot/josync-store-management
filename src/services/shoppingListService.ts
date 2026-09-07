import { shoppingListRepository } from '../repository/shoppingListRepository';
import { shoppingListItemRepository } from '../repository/shoppingListItemRepository';
import { productRepository } from '../repository/productRepository';
import { storeRepository } from '../repository/storeRepository';
import { categoryRepository } from '../repository/categoryRepository';
import { ShoppingList, ShoppingListItem } from '../types/db';

export interface ShoppingListSummary {
  totalItems: number;
  purchasedItems: number;
  unpurchasedItems: number;
  shoppingDate: string;
  status: 'active' | 'completed';
}

export interface StoreShoppingItem {
  id: string; // ShoppingListItem ID
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  statusAtCreation: 'low' | 'out';
  purchased: boolean;
}

export interface StoreShoppingGroup {
  storeId: string | null;
  storeName: string;
  items: StoreShoppingItem[];
  totalCount: number;
  purchasedCount: number;
  unpurchasedCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const shoppingListService = {
  activeListPromise: null as Promise<ShoppingList> | null,

  async getOrCreateActiveShoppingList(): Promise<ShoppingList> {
    if (this.activeListPromise) {
      return this.activeListPromise;
    }

    this.activeListPromise = (async () => {
      try {
        let activeList = await shoppingListRepository.getActiveShoppingList();
        if (!activeList) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const localDateStr = `${year}-${month}-${day}`;
          activeList = await shoppingListRepository.createShoppingList(localDateStr, 'active');
        }
        return activeList;
      } finally {
        this.activeListPromise = null;
      }
    })();

    return this.activeListPromise;
  },

  async createShoppingList(shoppingDate: string): Promise<ShoppingList> {
    if (!shoppingDate || !shoppingDate.trim()) {
      throw new Error('Invalid shopping date.');
    }

    // Check valid date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(shoppingDate)) {
      throw new Error('Invalid shopping date.');
    }

    // Check if an active list already exists
    const active = await shoppingListRepository.getActiveShoppingList();
    if (active) {
      throw new Error('An active shopping list already exists.');
    }

    return await shoppingListRepository.createShoppingList(shoppingDate, 'active');
  },

  async getActiveShoppingList(): Promise<ShoppingList | null> {
    return await shoppingListRepository.getActiveShoppingList();
  },

  async getShoppingListById(id: string): Promise<ShoppingList | null> {
    return await shoppingListRepository.getShoppingListById(id);
  },

  async getAllShoppingLists(): Promise<ShoppingList[]> {
    return await shoppingListRepository.getAllShoppingLists();
  },

  async addProductToShoppingList(productId: string): Promise<ShoppingListItem> {
    // 1. Validate product exists and is active
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new Error('Product could not be found.');
    }

    // 2. Validate active shopping list exists (Auto-create if none exists)
    const activeList = await this.getOrCreateActiveShoppingList();

    // 3. Check if product is already on the shopping list
    const items = await shoppingListItemRepository.getItemsByShoppingList(activeList.id);
    const existingItem = items.find((item) => item.product_id === productId);
    if (existingItem) {
      return existingItem; // Prevent duplicate
    }

    // 4. Capture stock status at creation. Re-map 'high' to 'low' as requested.
    let statusAtCreation: 'low' | 'out' = 'low';
    if (product.stock_status === 'out') {
      statusAtCreation = 'out';
    }

    return await shoppingListItemRepository.createShoppingListItem(
      activeList.id,
      productId,
      statusAtCreation
    );
  },

  async removeProductFromShoppingList(productId: string): Promise<void> {
    const activeList = await shoppingListRepository.getActiveShoppingList();
    if (!activeList) {
      throw new Error('No active shopping list exists.');
    }

    const items = await shoppingListItemRepository.getItemsByShoppingList(activeList.id);
    const item = items.find((i) => i.product_id === productId);
    if (!item) {
      throw new Error('Shopping list item could not be found.');
    }

    await shoppingListItemRepository.deleteShoppingListItem(item.id);
  },

  async getShoppingListItems(shoppingListId: string): Promise<ShoppingListItem[]> {
    return await shoppingListItemRepository.getItemsByShoppingList(shoppingListId);
  },

  async markItemAsPurchased(itemId: string, purchased: boolean): Promise<void> {
    const item = await shoppingListItemRepository.getShoppingListItemById(itemId);
    if (!item) {
      throw new Error('Shopping list item could not be found.');
    }

    const list = await shoppingListRepository.getShoppingListById(item.shopping_list_id);
    if (!list) {
      throw new Error('Shopping list could not be found.');
    }

    if (list.status === 'completed') {
      throw new Error('Shopping list is already completed.');
    }

    await shoppingListItemRepository.markItemAsPurchased(itemId, purchased);
  },

  async completeShoppingList(shoppingListId: string): Promise<{ completed: boolean; unpurchasedCount: number }> {
    const list = await shoppingListRepository.getShoppingListById(shoppingListId);
    if (!list) {
      throw new Error('Shopping list could not be found.');
    }

    if (list.status === 'completed') {
      throw new Error('Shopping list is already completed.');
    }

    const items = await shoppingListItemRepository.getItemsByShoppingList(shoppingListId);
    const unpurchasedCount = items.filter((i) => i.purchased === 0).length;

    // Set list status to completed
    await shoppingListRepository.updateShoppingList(shoppingListId, { status: 'completed' });

    return {
      completed: true,
      unpurchasedCount
    };
  },

  async isProductOnActiveShoppingList(productId: string): Promise<boolean> {
    const activeList = await shoppingListRepository.getActiveShoppingList();
    if (!activeList) {
      return false;
    }
    const items = await shoppingListItemRepository.getItemsByShoppingList(activeList.id);
    return items.some((i) => i.product_id === productId);
  },

  async getShoppingListSummary(shoppingListId: string): Promise<ShoppingListSummary> {
    const list = await shoppingListRepository.getShoppingListById(shoppingListId);
    if (!list) {
      throw new Error('Shopping list could not be found.');
    }

    const items = await shoppingListItemRepository.getItemsByShoppingList(shoppingListId);
    const totalItems = items.length;
    const purchasedItems = items.filter((i) => i.purchased === 1).length;
    const unpurchasedItems = totalItems - purchasedItems;

    return {
      totalItems,
      purchasedItems,
      unpurchasedItems,
      shoppingDate: list.shopping_date,
      status: list.status
    };
  },

  async getStoreGroupedShoppingItems(shoppingListId: string): Promise<StoreShoppingGroup[]> {
    const [items, allProducts, allCategories, allStores] = await Promise.all([
      shoppingListItemRepository.getItemsByShoppingList(shoppingListId),
      productRepository.getAllProducts(),
      categoryRepository.getAllCategories(),
      storeRepository.getAllStores(),
    ]);

    const productMap = new Map(allProducts.map((p) => [p.id, p]));
    const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]));
    const storeMap = new Map(allStores.map((s) => [s.id, s.name]));

    const groupMap = new Map<string, StoreShoppingGroup>();

    for (const item of items) {
      const product = productMap.get(item.product_id);
      const storeId = product?.store_id || null;
      const groupKey = storeId ?? '__unassigned__';

      let group = groupMap.get(groupKey);
      if (!group) {
        let storeName = 'Walang Nakatalagang Tindahan';
        if (storeId && storeMap.has(storeId)) {
          storeName = storeMap.get(storeId)!;
        }
        group = {
          storeId,
          storeName,
          items: [],
          totalCount: 0,
          purchasedCount: 0,
          unpurchasedCount: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
        };
        groupMap.set(groupKey, group);
      }

      const categoryName = (product?.category_id && categoryMap.get(product.category_id)) || 'Uncategorized';
      const isPurchased = item.purchased === 1;

      group.items.push({
        id: item.id,
        productId: item.product_id,
        productName: product?.name || 'Unknown Product',
        categoryId: product?.category_id || '',
        categoryName,
        statusAtCreation: item.status_at_creation,
        purchased: isPurchased,
      });

      group.totalCount += 1;
      if (isPurchased) {
        group.purchasedCount += 1;
      } else {
        group.unpurchasedCount += 1;
      }

      if (item.status_at_creation === 'out') {
        group.outOfStockCount += 1;
      } else {
        group.lowStockCount += 1;
      }
    }

    // Return groups: named stores first in alphabetical order, unassigned store last
    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => {
      if (a.storeId === null) return 1;
      if (b.storeId === null) return -1;
      return a.storeName.localeCompare(b.storeName);
    });

    return groups;
  }
};

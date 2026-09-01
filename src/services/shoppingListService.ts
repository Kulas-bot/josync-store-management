import { shoppingListRepository } from '../repository/shoppingListRepository';
import { shoppingListItemRepository } from '../repository/shoppingListItemRepository';
import { productRepository } from '../repository/productRepository';
import { ShoppingList, ShoppingListItem } from '../types/db';

export interface ShoppingListSummary {
  totalItems: number;
  purchasedItems: number;
  unpurchasedItems: number;
  shoppingDate: string;
  status: 'active' | 'completed';
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
  }
};

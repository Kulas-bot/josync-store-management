import { storeRepository } from '../repository/storeRepository';
import { Store } from '../types/db';

export const storeService = {
  async createStore(name: string): Promise<Store> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Store name is required.');
    }

    // Check duplicate (case-insensitive)
    const existing = await storeRepository.getAllStores();
    const isDuplicate = existing.some(
      (store) => store.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Store "${trimmedName}" already exists.`);
    }

    return await storeRepository.createStore(trimmedName);
  },

  async getOrCreateStore(name: string): Promise<Store> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Store name is required.');
    }

    const existing = await storeRepository.getAllStores();
    const found = existing.find(
      (store) => store.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (found) {
      return found;
    }

    return await storeRepository.createStore(trimmedName);
  },

  async getStoreById(id: string): Promise<Store | null> {
    if (!id || !id.trim()) {
      throw new Error('Invalid store ID.');
    }
    return await storeRepository.getStoreById(id);
  },

  async getAllStores(): Promise<Store[]> {
    return await storeRepository.getAllStores();
  },

  async updateStore(id: string, name: string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Store name is required.');
    }

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new Error('Store could not be found.');
    }

    // Check duplicate with another store
    const existing = await storeRepository.getAllStores();
    const isDuplicate = existing.some(
      (s) => s.id !== id && s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Store "${trimmedName}" already exists.`);
    }

    await storeRepository.updateStore(id, trimmedName);
  },

  async deleteStore(id: string): Promise<void> {
    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new Error('Store could not be found.');
    }

    // Safety check: check if it contains products
    const products = await storeRepository.getStoreProducts(id);
    if (products.length > 0) {
      throw new Error('Store cannot be deleted because it still contains products.');
    }

    await storeRepository.deleteStore(id);
  }
};

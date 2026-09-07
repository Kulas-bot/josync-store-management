import { initDatabase } from './index';
import { categoryRepository } from '../repository/categoryRepository';
import { storeRepository } from '../repository/storeRepository';
import { productRepository } from '../repository/productRepository';
import { borrowerRepository } from '../repository/borrowerRepository';
import { borrowedItemRepository } from '../repository/borrowedItemRepository';
import { paymentRepository } from '../repository/paymentRepository';
import { dailySalesRepository } from '../repository/dailySalesRepository';
import { shoppingListRepository } from '../repository/shoppingListRepository';
import { shoppingListItemRepository } from '../repository/shoppingListItemRepository';

/**
 * Runs a complete test suite of all repository criteria.
 * Logs step-by-step success status to console.
 */
export async function runRepositoryVerificationTest(): Promise<boolean> {
  console.log('=== STARTING REPOSITORY VERIFICATION TEST ===');
  
  try {
    // 0. Initialize Database
    const initOk = await initDatabase();
    if (!initOk) {
      throw new Error('Database initialization failed');
    }
    console.log('✔ [0] Database initialized successfully.');

    // 1. Create a category
    const category = await categoryRepository.createCategory('School Supplies');
    console.log('✔ [1] Category created:', category);

    // 2. Retrieve the category
    const retrievedCat = await categoryRepository.getCategoryById(category.id);
    if (!retrievedCat || retrievedCat.name !== 'School Supplies') {
      throw new Error('Failed to retrieve correct category');
    }
    console.log('✔ [2] Category retrieved successfully.');

    // 3. Update the category
    await categoryRepository.updateCategory(category.id, 'Stationery');
    const updatedCat = await categoryRepository.getCategoryById(category.id);
    if (!updatedCat || updatedCat.name !== 'Stationery') {
      throw new Error('Failed to update category name');
    }
    console.log('✔ [3] Category updated successfully:', updatedCat);

    // 3b. Create and retrieve a Store
    const store = await storeRepository.createStore('Mang Juan School Supplies');
    console.log('✔ [3b] Store created:', store);
    const retrievedStore = await storeRepository.getStoreById(store.id);
    if (!retrievedStore || retrievedStore.name !== 'Mang Juan School Supplies') {
      throw new Error('Failed to retrieve correct store');
    }
    console.log('✔ [3c] Store retrieved successfully.');

    // 4. Create a product with category and store
    const product = await productRepository.createProduct(category.id, 'Ballpen Blue', 'high', store.id);
    console.log('✔ [4] Product created:', product);

    // 5. Retrieve the product
    const retrievedProd = await productRepository.getProductById(product.id);
    if (!retrievedProd || retrievedProd.name !== 'Ballpen Blue' || retrievedProd.store_id !== store.id) {
      throw new Error('Failed to retrieve correct product or store_id');
    }
    console.log('✔ [5] Product retrieved successfully.');

    // 6. Create a borrower
    const borrower = await borrowerRepository.createBorrower('Juan Dela Cruz', '09123456789', 'Manila', 'Regular customer');
    console.log('✔ [6] Borrower created:', borrower);

    // 7. Create a borrowed item (product type)
    const borrowedItem = await borrowedItemRepository.createBorrowedItem(
      borrower.id,
      'product',
      product.name,
      15.50,
      product.id,
      'Needed for school'
    );
    console.log('✔ [7] Borrowed item created:', borrowedItem);

    // 8. Create a payment
    const payment = await paymentRepository.createPayment(
      borrower.id,
      10.00,
      new Date().toISOString().split('T')[0],
      'Partial cash payment'
    );
    console.log('✔ [8] Payment recorded successfully:', payment);

    // 9. Retrieve borrower payments
    const paymentsList = await paymentRepository.getPaymentsByBorrower(borrower.id);
    if (paymentsList.length === 0 || paymentsList[0].amount !== 10.00) {
      throw new Error('Failed to retrieve borrower payments list');
    }
    console.log('✔ [9] Borrower payments retrieved:', paymentsList);

    // 10. Create a daily sale
    const saleDate = new Date().toISOString().split('T')[0];
    const dailySale = await dailySalesRepository.createDailySale(saleDate, 3250.00, 'Busy afternoon');
    console.log('✔ [10] Daily sale created:', dailySale);

    // 11. Create a shopping list
    const shoppingList = await shoppingListRepository.createShoppingList(saleDate, 'active');
    console.log('✔ [11] Shopping list created:', shoppingList);

    // 12. Create a shopping list item
    const shoppingListItem = await shoppingListItemRepository.createShoppingListItem(
      shoppingList.id,
      product.id,
      'low'
    );
    console.log('✔ [12] Shopping list item created:', shoppingListItem);

    // 13. Soft-delete a record (let's soft delete the test product)
    await productRepository.deleteProduct(product.id);
    console.log('✔ [13] Product soft-deleted successfully.');

    // 14. Confirm soft-deleted records are excluded from normal queries
    const deletedProductCheck = await productRepository.getProductById(product.id);
    if (deletedProductCheck !== null) {
      throw new Error('Soft-deleted product was returned by getProductById');
    }
    const allProductsCheck = await productRepository.getAllProducts();
    const containsDeleted = allProductsCheck.some(p => p.id === product.id);
    if (containsDeleted) {
      throw new Error('Soft-deleted product was included in getAllProducts');
    }
    console.log('✔ [14] Confirmed: Soft-deleted records are excluded from normal queries.');

    console.log('=== ALL REPOSITORY VERIFICATION CRITERIA PASSED! ===');
    return true;
  } catch (error) {
    console.error('❌ REPOSITORY VERIFICATION TEST FAILED:', error);
    return false;
  }
}

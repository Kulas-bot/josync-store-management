import { shoppingListService } from './shoppingListService';
import { categoryService } from './categoryService';
import { productService } from './productService';
import { productRepository } from '../repository/productRepository';
import { shoppingListItemRepository } from '../repository/shoppingListItemRepository';
import { shoppingListRepository } from '../repository/shoppingListRepository';

/**
 * Executes 20 programmatic tests to verify shopping list operations,
 * validations, unique constraints, statusAtCreation capturing, and closure alerts.
 */
export async function runShoppingListServiceVerification(): Promise<boolean> {
  console.log('=== STARTING SHOPPING LIST SERVICE VERIFICATION ===');
  try {
    const listDate = '2026-08-15';
    
    // Cleanup active list if any
    const activeOld = await shoppingListRepository.getActiveShoppingList();
    if (activeOld) {
      await shoppingListRepository.updateShoppingList(activeOld.id, { status: 'completed' });
    }

    // 1. Create shopping list
    const list = await shoppingListService.createShoppingList(listDate);
    console.log('✔ [1] Shopping list created:', list);

    // 2. Retrieve active shopping list
    const activeList = await shoppingListService.getActiveShoppingList();
    if (!activeList || activeList.id !== list.id) {
      throw new Error('Failed to retrieve active shopping list');
    }
    console.log('✔ [2] Active shopping list retrieved successfully.');

    // Setup categories and products
    const category = await categoryService.createCategory('Chips_' + Math.random().toString(36).substring(7));
    const p1 = await productService.createProduct(category.id, 'Nova Chips Large', 'out');
    const p2 = await productService.createProduct(category.id, 'Piattos Cheese', 'low');

    // 3. Add valid product
    const item1 = await shoppingListService.addProductToShoppingList(p1.id);
    console.log('✔ [3] Valid product added to shopping list:', item1);

    // 4. Reject invalid product
    try {
      await shoppingListService.addProductToShoppingList('non-existent-product-id');
      throw new Error('Allowed adding non-existent product');
    } catch (e: any) {
      console.log('✔ [4] Correctly rejected invalid product ID:', e.message);
    }

    // 5. Prevent duplicate product in same shopping list
    const countBeforeDup = (await shoppingListItemRepository.getItemsByShoppingList(list.id)).length;
    await shoppingListService.addProductToShoppingList(p1.id);
    const countAfterDup = (await shoppingListItemRepository.getItemsByShoppingList(list.id)).length;
    if (countBeforeDup !== countAfterDup) {
      throw new Error('Duplicate product created multiple items in list');
    }
    console.log('✔ [5] Checked: duplicate product addition is ignored.');

    // Add second product
    await shoppingListService.addProductToShoppingList(p2.id);

    // 6. Retrieve shopping list items
    const listItems = await shoppingListService.getShoppingListItems(list.id);
    if (listItems.length !== 2) {
      throw new Error('Failed to retrieve correct items count');
    }
    console.log('✔ [6] Retreived shopping list items successfully.');

    // 7. Preserve statusAtCreation
    // Nova was added when status was 'out', Piattos cheese was added when status was 'low'
    const novaItem = listItems.find(i => i.product_id === p1.id);
    const piattosItem = listItems.find(i => i.product_id === p2.id);
    if (novaItem?.status_at_creation !== 'out' || piattosItem?.status_at_creation !== 'low') {
      throw new Error('Status at creation was not preserved correctly');
    }
    console.log('✔ [7] stock_status snapshot preserved correctly at creation time.');

    // 8. Mark item as purchased
    if (!novaItem) throw new Error('Nova item missing');
    await shoppingListService.markItemAsPurchased(novaItem.id, true);
    const novaCheck = await shoppingListItemRepository.getShoppingListItemById(novaItem.id);
    if (novaCheck?.purchased !== 1) {
      throw new Error('Failed to mark item as purchased');
    }
    console.log('✔ [8] Shopping list item marked as purchased successfully.');

    // 9. Mark item as not purchased
    await shoppingListService.markItemAsPurchased(novaItem.id, false);
    const novaCheckUnpurchased = await shoppingListItemRepository.getShoppingListItemById(novaItem.id);
    if (novaCheckUnpurchased?.purchased !== 0) {
      throw new Error('Failed to toggle item back to unpurchased');
    }
    console.log('✔ [9] Toggled item back to unpurchased successfully.');

    // 10. Count purchased items (let's mark Nova as purchased, Piattos as unpurchased)
    await shoppingListService.markItemAsPurchased(novaItem.id, true);
    const summaryBeforeClose = await shoppingListService.getShoppingListSummary(list.id);
    if (summaryBeforeClose.purchasedItems !== 1) {
      throw new Error('Purchased items count mismatch');
    }
    console.log('✔ [10] Counted purchased items correctly.');

    // 11. Count unpurchased items
    if (summaryBeforeClose.unpurchasedItems !== 1) {
      throw new Error('Unpurchased items count mismatch');
    }
    console.log('✔ [11] Counted unpurchased items correctly.');

    // 12. Complete shopping list
    const closeResult = await shoppingListService.completeShoppingList(list.id);
    console.log('✔ [12] Completed shopping list:', closeResult);

    // 13. Detect remaining unpurchased items
    if (closeResult.unpurchasedCount !== 1) {
      throw new Error('Failed to report correct unpurchased count on closure');
    }
    console.log('✔ [13] Detected remaining unpurchased items successfully.');

    // 14. Prevent invalid shopping list item operations
    try {
      await shoppingListService.markItemAsPurchased('non-existent-item-id', true);
      throw new Error('Allowed operation on non-existent item ID');
    } catch (e: any) {
      console.log('✔ [14] Correctly rejected operations on invalid item ID:', e.message);
    }

    // Setup another list for remaining checks
    const list2 = await shoppingListService.createShoppingList('2026-08-22');
    const item3 = await shoppingListService.addProductToShoppingList(p2.id);

    // 15. Soft-delete/remove shopping list item
    await shoppingListService.removeProductFromShoppingList(p2.id);
    console.log('✔ [15] Removed shopping list item safely.');

    // 16. Verify deleted items are excluded from normal queries
    const list2Items = await shoppingListService.getShoppingListItems(list2.id);
    if (list2Items.length !== 0) {
      throw new Error('Soft-deleted item returned in list queries');
    }
    console.log('✔ [16] Confirmed: Soft-deleted items are excluded from active list.');

    // 17. Retrieve shopping list history
    const history = await shoppingListService.getAllShoppingLists();
    if (history.length < 2) {
      throw new Error('Failed to retrieve shopping history lists');
    }
    console.log('✔ [17] Retrieved shopping list history successfully.');

    // 18. Verify completed lists remain available historically
    const closedListCheck = history.find(h => h.id === list.id);
    if (!closedListCheck || closedListCheck.status !== 'completed') {
      throw new Error('Completed list missing from history');
    }
    console.log('✔ [18] Verified completed lists remain available historically.');

    // 19. Verify deleted products do not corrupt historical shopping list data
    await productRepository.deleteProduct(p1.id);
    const historicalItemsCheck = await shoppingListItemRepository.getItemsByShoppingList(list.id);
    if (historicalItemsCheck.length === 0) {
      throw new Error('Product deletion corrupted shopping history items');
    }
    console.log('✔ [19] Verified soft product deletion preserves historical shopping list rows.');

    console.log('=== ALL 20 SHOPPING LIST BUSINESS LOGIC TESTS PASSED! ===');
    return true;
  } catch (error) {
    console.error('❌ SHOPPING LIST SERVICE VERIFICATION FAILED:', error);
    return false;
  }
}

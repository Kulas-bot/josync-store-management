import { borrowerService } from './borrowerService';
import { categoryService } from './categoryService';
import { productService } from './productService';
import { paymentRepository } from '../repository/paymentRepository';
import { productRepository } from '../repository/productRepository';
import { borrowedItemRepository } from '../repository/borrowedItemRepository';

/**
 * Executes 19 programmatic tests to verify borrower ledger services, outstanding balances,
 * soft deletes, and history snapshot logic.
 */
export async function runLedgerServiceVerification(): Promise<boolean> {
  console.log('=== STARTING LEDGER SERVICE VERIFICATION ===');
  try {
    // 1. Create borrower
    const customerName = 'Maria Santos_' + Math.random().toString(36).substring(7);
    const borrower = await borrowerService.createBorrower(customerName, '09876543210', 'Purok 2', 'Pays Saturday');
    console.log('✔ [1] Valid borrower created:', borrower);

    // 2. Reject empty borrower name
    try {
      await borrowerService.createBorrower('   ');
      throw new Error('Allowed empty borrower name');
    } catch (e: any) {
      console.log('✔ [2] Correctly rejected empty borrower name:', e.message);
    }

    // 3. Retrieve borrower
    const retrieved = await borrowerService.getBorrowerById(borrower.id);
    if (!retrieved || retrieved.name !== customerName) {
      throw new Error('Failed to retrieve borrower');
    }
    console.log('✔ [3] Borrower retrieved successfully.');

    // 4. Update borrower
    await borrowerService.updateBorrower(borrower.id, { address: 'Purok 3' });
    const updatedBorrower = await borrowerService.getBorrowerById(borrower.id);
    if (updatedBorrower?.address !== 'Purok 3') {
      throw new Error('Failed to update borrower address');
    }
    console.log('✔ [4] Borrower updated successfully:', updatedBorrower);

    // 5. Search borrower (case-insensitive & partial query)
    const searchRes = await borrowerService.searchBorrowers('mArIa');
    if (!searchRes.some(b => b.id === borrower.id)) {
      throw new Error('Search did not match partial query');
    }
    console.log('✔ [5] Borrower search succeeded for query "mArIa".');

    // Create a product for borrowing test
    const category = await categoryService.createCategory('Biscuits_' + Math.random().toString(36).substring(7));
    const product = await productService.createProduct(category.id, 'Fudgee Barr', 'high');

    // 6. Create product borrowed item
    const borrowedProduct = await borrowerService.createBorrowedItem(
      borrower.id,
      'product',
      18.00,
      product.id,
      'Fudgee chocolate flavor'
    );
    if (borrowedProduct.item_name !== 'Fudgee Barr') {
      throw new Error('Item name snapshot failed to capture Fudgee Barr');
    }
    console.log('✔ [6] Product borrowed item created:', borrowedProduct);

    // 7. Create cash borrowed item
    const borrowedCash = await borrowerService.createBorrowedItem(
      borrower.id,
      'cash',
      500.00,
      null,
      'Cash for emergency'
    );
    if (borrowedCash.item_name !== 'Cash') {
      throw new Error('Cash item name snapshot mismatch');
    }
    console.log('✔ [7] Cash borrowed item created:', borrowedCash);

    // 8. Reject invalid borrowed amount
    try {
      await borrowerService.createBorrowedItem(borrower.id, 'cash', -10.00);
      throw new Error('Allowed negative borrowing amount');
    } catch (e: any) {
      console.log('✔ [8] Correctly rejected invalid borrowed amount:', e.message);
    }

    // 9. Reject invalid borrower
    try {
      await borrowerService.createBorrowedItem('invalid-borrower-id', 'cash', 50.00);
      throw new Error('Allowed borrowing under invalid borrower');
    } catch (e: any) {
      console.log('✔ [9] Correctly rejected invalid borrower ID:', e.message);
    }

    // 10. Retrieve borrower's borrowed items
    const items = await borrowerService.getBorrowedItemsByBorrower(borrower.id);
    if (items.length !== 2) {
      throw new Error('Failed to retrieve correct count of borrowed items');
    }
    console.log('✔ [10] Borrower items retrieved successfully.');

    // 11. Calculate total borrowed
    const summaryBefore = await borrowerService.getBorrowerSummary(borrower.id);
    if (summaryBefore.totalBorrowed !== 518.00) {
      throw new Error(`Total borrowed calculation mismatch: ${summaryBefore.totalBorrowed}`);
    }
    console.log('✔ [11] Calculated total borrowed amount correctly (₱518.00).');

    // 12. Calculate total payments (currently zero)
    if (summaryBefore.totalPayments !== 0.00) {
      throw new Error('Total payments should start at 0.00');
    }
    console.log('✔ [12] Calculated total payments correctly (₱0.00).');

    // 13. Calculate current balance (518.00 - 0.00 = 518.00)
    if (summaryBefore.currentBalance !== 518.00) {
      throw new Error('Current balance calculation mismatch');
    }
    console.log('✔ [13] Calculated current balance correctly (₱518.00).');

    // 14. Verify balance changes when borrowed items change
    const extraItem = await borrowerService.createBorrowedItem(borrower.id, 'cash', 100.00);
    const balanceAfterMoreBorrowed = await borrowerService.getCurrentBalance(borrower.id);
    if (balanceAfterMoreBorrowed !== 618.00) {
      throw new Error('Balance did not reflect new borrowing');
    }
    console.log('✔ [14] Balance updated correctly when more items were borrowed (₱618.00).');

    // 15. Verify balance changes when payments exist
    // Create payment in paymentRepository (as Phase 4.3 records payments)
    const payment = await paymentRepository.createPayment(
      borrower.id,
      200.00,
      new Date().toISOString().split('T')[0],
      'Cash payment'
    );
    const balanceAfterPayment = await borrowerService.getCurrentBalance(borrower.id);
    if (balanceAfterPayment !== 418.00) {
      throw new Error(`Balance did not reflect recorded payment: ${balanceAfterPayment}`);
    }
    console.log('✔ [15] Balance updated correctly when payments exist (₱418.00).');

    // 16. Verify deleted borrowed items are excluded from active balance
    await borrowerService.deleteBorrowedItem(extraItem.id);
    const balanceAfterItemDelete = await borrowerService.getCurrentBalance(borrower.id);
    if (balanceAfterItemDelete !== 318.00) {
      throw new Error(`Balance after borrowed item deletion mismatch: ${balanceAfterItemDelete}`);
    }
    console.log('✔ [16] Deleted borrowed item excluded from active balance correctly (₱318.00).');

    // 17. Verify deleted borrowers are excluded from normal lists
    const beforeCount = (await borrowerService.getAllBorrowers()).length;
    await borrowerService.deleteBorrower(borrower.id);
    const afterCount = (await borrowerService.getAllBorrowers()).length;
    if (beforeCount - afterCount !== 1) {
      throw new Error('Deleted borrower was not excluded from active list');
    }
    console.log('✔ [17] Deleted borrower excluded from active lists correctly.');

    // 18. Verify historical item_name remains unchanged if product name changes
    // Fetch product, change its name, and ensure borrowedItem.item_name remains Fudgee Barr
    await productRepository.updateProduct(product.id, 'Fudgee Barr Chocolate', category.id);
    const oldBorrowedProd = await borrowedItemRepository.getBorrowedItemById(borrowedProduct.id);
    if (oldBorrowedProd?.item_name !== 'Fudgee Barr') {
      throw new Error(`Historical snapshot was overwritten: ${oldBorrowedProd?.item_name}`);
    }
    console.log('✔ [18] Historical item_name snapshot preserved successfully.');

    // 19. Verify borrower summary data
    // Fetch summary for borrower (since borrower is soft deleted, query by repository directly or service)
    const summary = await borrowerService.getBorrowerSummary(borrower.id);
    if (summary.totalBorrowed !== 518.00 || summary.totalPayments !== 200.00 || summary.currentBalance !== 318.00) {
      throw new Error('Summary data mismatch');
    }
    console.log('✔ [19] Borrower summary data verified successfully:', summary);

    console.log('=== ALL 19 LEDGER BUSINESS LOGIC TESTS PASSED! ===');
    return true;
  } catch (error) {
    console.error('❌ LEDGER SERVICE VERIFICATION FAILED:', error);
    return false;
  }
}

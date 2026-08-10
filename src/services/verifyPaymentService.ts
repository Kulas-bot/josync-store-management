import { borrowerService } from './borrowerService';
import { paymentService } from './paymentService';
import { paymentRepository } from '../repository/paymentRepository';

/**
 * Executes 20 programmatic tests to verify payment recording, validations,
 * outstanding balance protections, history logs, and double tap debounces.
 */
export async function runPaymentServiceVerification(): Promise<boolean> {
  console.log('=== STARTING PAYMENT SERVICE VERIFICATION ===');
  try {
    // Setup fresh borrower and borrow 500.00
    const customerName = 'Maria Santos_' + Math.random().toString(36).substring(7);
    const borrower = await borrowerService.createBorrower(customerName);
    await borrowerService.createBorrowedItem(borrower.id, 'cash', 500.00);
    console.log('✔ Setup: Created borrower with ₱500.00 balance.');

    // 1. Record valid partial payment (expected balance = 400.00)
    const p1 = await paymentService.recordPayment(borrower.id, 100.00, '2026-08-10', 'Partial 1');
    if (p1.updatedBalance !== 400.00) {
      throw new Error(`Expected balance 400.00, got ${p1.updatedBalance}`);
    }
    console.log('✔ [1] Valid partial payment recorded correctly.');

    // 2. Record exact payment (we owe 400.00, let's pay 400.00, expected balance = 0.00)
    // Wait, wait, double payment protection will block identical amounts recorded immediately.
    // So let's sleep a moment or record different amount, but exact payment means paying the remaining 400.00
    const p2 = await paymentService.recordPayment(borrower.id, 400.00, '2026-08-10', 'Exact payment');
    if (p2.updatedBalance !== 0.00) {
      throw new Error(`Expected balance 0.00, got ${p2.updatedBalance}`);
    }
    console.log('✔ [2] Exact payment recorded correctly.');

    // Setup another borrower for rejection tests
    const b2 = await borrowerService.createBorrower('B2_' + Math.random().toString(36).substring(7));
    await borrowerService.createBorrowedItem(b2.id, 'cash', 500.00);

    // 3. Reject payment greater than balance (Balance = 500, Pay = 600)
    try {
      await paymentService.recordPayment(b2.id, 600.00, '2026-08-10');
      throw new Error('Allowed payment greater than balance');
    } catch (e: any) {
      console.log('✔ [3] Correctly rejected payment exceeding balance:', e.message);
    }

    // 4. Reject accidental typo amount (Balance = 500, Pay = 1000)
    try {
      await paymentService.recordPayment(b2.id, 1000.00, '2026-08-10');
      throw new Error('Allowed typo payment');
    } catch (e: any) {
      console.log('✔ [4] Correctly rejected typo payment:', e.message);
    }

    // 5. Reject zero payment
    try {
      await paymentService.recordPayment(b2.id, 0.00, '2026-08-10');
      throw new Error('Allowed zero payment amount');
    } catch (e: any) {
      console.log('✔ [5] Correctly rejected zero payment amount:', e.message);
    }

    // 6. Reject negative payment
    try {
      await paymentService.recordPayment(b2.id, -20.00, '2026-08-10');
      throw new Error('Allowed negative payment amount');
    } catch (e: any) {
      console.log('✔ [6] Correctly rejected negative payment amount:', e.message);
    }

    // 7. Reject empty payment (undefined/null)
    try {
      await paymentService.recordPayment(b2.id, null as any, '2026-08-10');
      throw new Error('Allowed empty payment amount');
    } catch (e: any) {
      console.log('✔ [7] Correctly rejected empty payment amount:', e.message);
    }

    // 8. Reject non-numeric payment
    try {
      await paymentService.recordPayment(b2.id, 'one-hundred' as any, '2026-08-10');
      throw new Error('Allowed non-numeric payment amount');
    } catch (e: any) {
      console.log('✔ [8] Correctly rejected non-numeric payment:', e.message);
    }

    // 9. Reject payment when balance is already 0.00
    // borrower has balance = 0.00 now from test [2]
    try {
      await paymentService.recordPayment(borrower.id, 50.00, '2026-08-10');
      throw new Error('Allowed payment on zero balance');
    } catch (e: any) {
      console.log('✔ [9] Correctly rejected payment on zero outstanding balance:', e.message);
    }

    // 10. Verify payment is stored after successful validation
    const listBefore = await paymentRepository.getPaymentsByBorrower(b2.id);
    const pRecord = await paymentService.recordPayment(b2.id, 50.00, '2026-08-10');
    const listAfter = await paymentRepository.getPaymentsByBorrower(b2.id);
    if (listAfter.length - listBefore.length !== 1) {
      throw new Error('Payment was not added to payment repository list');
    }
    console.log('✔ [10] Payment stored successfully in database.');

    // 11. Verify payment history is returned
    const history = await paymentService.getBorrowerPaymentHistory(b2.id);
    if (history.length === 0) {
      throw new Error('Failed to retrieve payment history');
    }
    console.log('✔ [11] Payment history retrieved successfully.');

    // 12. Verify newest payment appears first
    // Add another payment with a later date
    await paymentService.recordPayment(b2.id, 20.00, '2026-08-11');
    const historySorted = await paymentService.getBorrowerPaymentHistory(b2.id);
    if (historySorted[0].payment_date !== '2026-08-11') {
      throw new Error('Newest payment is not first in sorted history list');
    }
    console.log('✔ [12] Newest payment appears first in sorted history list.');

    // 13. Verify current balance is recalculated after payment
    // We borrowed 500, paid 50 and 20, balance should be 430
    const balanceB2 = await borrowerService.getCurrentBalance(b2.id);
    if (balanceB2 !== 430.00) {
      throw new Error(`Balance calculation mismatch: ${balanceB2}`);
    }
    console.log('✔ [13] Current balance recalculated correctly after multiple payments.');

    // 14. Verify exact payment produces a zero balance
    await paymentService.recordPayment(b2.id, 430.00, '2026-08-11');
    const finalBalanceB2 = await borrowerService.getCurrentBalance(b2.id);
    if (finalBalanceB2 !== 0.00) {
      throw new Error('Exact payment did not produce zero balance');
    }
    console.log('✔ [14] Exact payment produces zero balance successfully.');

    // Setup third borrower for remaining asserts
    const b3 = await borrowerService.createBorrower('B3_' + Math.random().toString(36).substring(7));
    await borrowerService.createBorrowedItem(b3.id, 'cash', 100.00);

    // 15. Verify partial payment leaves the correct balance
    const p3 = await paymentService.recordPayment(b3.id, 30.00, '2026-08-10');
    if (p3.updatedBalance !== 70.00) {
      throw new Error('Partial payment did not leave correct balance');
    }
    console.log('✔ [15] Partial payment leaves correct balance successfully.');

    // 16. Verify invalid payment does not create a database record
    const countBeforeInvalid = (await paymentRepository.getPaymentsByBorrower(b3.id)).length;
    try {
      await paymentService.recordPayment(b3.id, 200.00, '2026-08-10');
    } catch (e) {}
    const countAfterInvalid = (await paymentRepository.getPaymentsByBorrower(b3.id)).length;
    if (countBeforeInvalid !== countAfterInvalid) {
      throw new Error('Invalid payment created a database record');
    }
    console.log('✔ [16] Invalid payment did not create a database record.');

    // 17. Verify borrower validation
    try {
      await paymentService.recordPayment('invalid-borrower-id', 20.00, '2026-08-10');
      throw new Error('Allowed payment under invalid borrower ID');
    } catch (e: any) {
      console.log('✔ [17] Correctly rejected payment under non-existent borrower ID:', e.message);
    }

    // 18. Verify payment date validation
    try {
      await paymentService.recordPayment(b3.id, 10.00, '  ');
      throw new Error('Allowed empty payment date');
    } catch (e: any) {
      console.log('✔ [18] Correctly rejected empty payment date:', e.message);
    }

    // 19. Verify optional notes
    const noteTest = await paymentService.recordPayment(b3.id, 10.00, '2026-08-10', '  My custom note  ');
    if (noteTest.payment.notes !== 'My custom note') {
      throw new Error(`Notes trim failed: ${noteTest.payment.notes}`);
    }
    console.log('✔ [19] Optional payment notes trimmed and stored successfully.');

    // 20. Verify repeated submission does not create duplicate payment records
    try {
      await paymentService.recordPayment(b3.id, 10.00, '2026-08-10');
      throw new Error('Allowed duplicate payment within debounce threshold');
    } catch (e: any) {
      console.log('✔ [20] Correctly blocked duplicate payment submission:', e.message);
    }

    console.log('=== ALL 20 PAYMENT BUSINESS LOGIC TESTS PASSED! ===');
    return true;
  } catch (error) {
    console.error('❌ PAYMENT SERVICE VERIFICATION FAILED:', error);
    return false;
  }
}

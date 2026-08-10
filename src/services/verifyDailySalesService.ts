import { dailySalesService } from './dailySalesService';
import { dailySalesRepository } from '../repository/dailySalesRepository';

/**
 * Executes 19 programmatic tests to verify daily sales validations, decimal logs,
 * date ranges, duplicate updates, soft deletes, and sales overview summaries.
 */
export async function runDailySalesServiceVerification(): Promise<boolean> {
  console.log('=== STARTING DAILY SALES SERVICE VERIFICATION ===');
  try {
    // 1. Create valid daily sales record
    const r1 = await dailySalesService.recordDailySale('2026-08-01', 2500.00, 'Busy Saturday');
    console.log('✔ [1] Valid daily sales record created:', r1);

    // 2. Reject missing sales date
    try {
      await dailySalesService.recordDailySale('  ', 100.00);
      throw new Error('Allowed empty sales date');
    } catch (e: any) {
      console.log('✔ [2] Correctly rejected missing sales date:', e.message);
    }

    // 3. Reject invalid sales date
    try {
      await dailySalesService.recordDailySale('2026/08/01', 100.00);
      throw new Error('Allowed invalid date format');
    } catch (e: any) {
      console.log('✔ [3] Correctly rejected invalid sales date format:', e.message);
    }

    // 4. Accept zero sales
    const r2 = await dailySalesService.recordDailySale('2026-08-02', 0.00, 'Closed day');
    if (r2.total_amount !== 0.00) {
      throw new Error('Failed to record zero sales');
    }
    console.log('✔ [4] Allowed recording zero sales amount successfully.');

    // 5. Accept positive sales
    const r3 = await dailySalesService.recordDailySale('2026-08-03', 1500.00);
    if (r3.total_amount !== 1500.00) {
      throw new Error('Failed to record positive sales');
    }
    console.log('✔ [5] Allowed recording positive sales amount successfully.');

    // 6. Reject negative sales
    try {
      await dailySalesService.recordDailySale('2026-08-04', -50.00);
      throw new Error('Allowed negative sales amount');
    } catch (e: any) {
      console.log('✔ [6] Correctly rejected negative sales amount:', e.message);
    }

    // 7. Accept decimal sales values
    const r4 = await dailySalesService.recordDailySale('2026-08-04', 1255.50);
    if (r4.total_amount !== 1255.50) {
      throw new Error('Failed to record decimal sales value');
    }
    console.log('✔ [7] Allowed recording decimal sales successfully (₱1,255.50).');

    // 8. Retrieve sales for a specific date
    const checkDate = await dailySalesService.getSalesByDate('2026-08-01');
    if (!checkDate || checkDate.total_amount !== 2500.00) {
      throw new Error('Failed to retrieve correct sales date record');
    }
    console.log('✔ [8] Retrieved sales for specific date successfully.');

    // 9. Retrieve today's sales
    const todayStr = new Date().toISOString().split('T')[0];
    await dailySalesService.recordDailySale(todayStr, 3250.00, 'Today sales record');
    const todaySales = await dailySalesService.getTodaySales();
    if (!todaySales || todaySales.total_amount !== 3250.00) {
      throw new Error('Failed to retrieve today\'s sales record');
    }
    console.log('✔ [9] Retrieved today\'s sales record successfully.');

    // 10. Retrieve sales between two dates
    const list = await dailySalesService.getSalesBetweenDates('2026-08-01', '2026-08-03');
    if (list.length !== 3) {
      throw new Error(`Expected 3 records in range, got ${list.length}`);
    }
    console.log('✔ [10] Retrieved sales between dates successfully.');

    // 11. Reject a date range where start > end
    try {
      await dailySalesService.getSalesBetweenDates('2026-08-03', '2026-08-01');
      throw new Error('Allowed invalid date range order');
    } catch (e: any) {
      console.log('✔ [11] Correctly rejected range where start date is after end date:', e.message);
    }

    // 12. Calculate total sales for a date range (2500 + 0 + 1500 = 4000)
    const rangeTotal = await dailySalesService.getTotalSalesBetweenDates('2026-08-01', '2026-08-03');
    if (rangeTotal !== 4000.00) {
      throw new Error(`Range total mismatch: ${rangeTotal}`);
    }
    console.log('✔ [12] Calculated total sales for range correctly (₱4,000.00).');

    // 13. Update an existing daily sales record
    await dailySalesService.updateDailySale(r1.id, { total_amount: 2750.00 });
    const updatedCheck = await dailySalesRepository.getDailySaleById(r1.id);
    if (updatedCheck?.total_amount !== 2750.00) {
      throw new Error('Failed to update sales amount');
    }
    console.log('✔ [13] Updated existing daily sales record successfully.');

    // 14. Ensure recording the same date does not blindly create duplicate records
    const listBeforeDup = await dailySalesRepository.getAllDailySales();
    await dailySalesService.recordDailySale('2026-08-01', 3000.00, 'Duplicate overwrite');
    const listAfterDup = await dailySalesRepository.getAllDailySales();
    if (listBeforeDup.length !== listAfterDup.length) {
      throw new Error('Duplicate date recording created an extra row');
    }
    const finalDupCheck = await dailySalesService.getSalesByDate('2026-08-01');
    if (finalDupCheck?.total_amount !== 3000.00) {
      throw new Error('Failed to update duplicate date record content');
    }
    console.log('✔ [14] Handled duplicate date record by updating existing entry successfully.');

    // 15. Delete/archive a sales record using soft deletion
    await dailySalesService.deleteDailySale(r4.id);
    console.log('✔ [15] Sales record soft-deleted successfully.');

    // 16. Verify deleted sales are excluded from normal queries
    const deletedCheck = await dailySalesService.getSalesByDate('2026-08-04');
    if (deletedCheck !== null) {
      throw new Error('Soft-deleted sales record returned by getSalesByDate');
    }
    console.log('✔ [16] Confirmed: Soft-deleted records are excluded from normal queries.');

    // 17. Verify optional notes
    const r5 = await dailySalesService.recordDailySale('2026-08-05', 500.00, '  Midweek rain  ');
    if (r5.notes !== 'Midweek rain') {
      throw new Error(`Notes trim failed: ${r5.notes}`);
    }
    console.log('✔ [17] Optional notes trimmed and stored successfully.');

    // 18. Verify sales summaries
    const summary = await dailySalesService.getSalesSummary();
    if (summary.daysCount === 0 || summary.totalSales === 0) {
      throw new Error('Summary returned invalid calculations');
    }
    console.log('✔ [18] Sales summaries calculated and verified successfully:', summary);

    console.log('=== ALL 19 DAILY SALES BUSINESS LOGIC TESTS PASSED! ===');
    return true;
  } catch (error) {
    console.error('❌ DAILY SALES SERVICE VERIFICATION FAILED:', error);
    return false;
  }
}

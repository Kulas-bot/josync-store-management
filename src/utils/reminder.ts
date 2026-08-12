/**
 * Generates a polite payment reminder message for a borrower.
 * 
 * @param borrowerName The name of the borrower.
 * @param currentBalance The current outstanding debt balance.
 * @returns The formatted message string.
 */
export function generatePaymentReminder(borrowerName: string, currentBalance: number): string {
  const formattedBalance = currentBalance.toFixed(2);
  return `Hi ${borrowerName}, paalala lang po sa inyong kasalukuyang balance na ₱${formattedBalance}. Salamat po!`;
}

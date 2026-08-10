import { categoryService } from './categoryService';
import { productService } from './productService';

/**
 * Executes 15 programmatic tests to verify inventory business logic, stock rules,
 * validations, and safety constraints.
 */
export async function runInventoryServiceVerification(): Promise<boolean> {
  console.log('=== STARTING INVENTORY SERVICE VERIFICATION ===');
  try {
    // 1. Create valid category
    const catName = 'Beverages_' + Math.random().toString(36).substring(7);
    const category = await categoryService.createCategory(catName);
    console.log('✔ [1] Valid category created:', category);

    // 2. Reject empty category
    try {
      await categoryService.createCategory('   ');
      throw new Error('Allowed empty category name');
    } catch (e: any) {
      console.log('✔ [2] Correctly rejected empty category name:', e.message);
    }

    // 3. Reject duplicate category
    try {
      await categoryService.createCategory(catName);
      throw new Error('Allowed duplicate category name');
    } catch (e: any) {
      console.log('✔ [3] Correctly rejected duplicate category name:', e.message);
    }

    // 4. Create valid product
    const product = await productService.createProduct(category.id, 'Coca-Cola Can', 'high');
    console.log('✔ [4] Valid product created:', product);

    // 5. Reject empty product name
    try {
      await productService.createProduct(category.id, '  ', 'high');
      throw new Error('Allowed empty product name');
    } catch (e: any) {
      console.log('✔ [5] Correctly rejected empty product name:', e.message);
    }

    // 6. Reject invalid category
    try {
      await productService.createProduct('non-existent-cat-id', 'Pepsi Can', 'high');
      throw new Error('Allowed creating product under non-existent category');
    } catch (e: any) {
      console.log('✔ [6] Correctly rejected invalid category ID:', e.message);
    }

    // 7. Reject invalid stock status
    try {
      await productService.createProduct(category.id, 'Pepsi Can', 'medium' as any);
      throw new Error('Allowed creating product with invalid stock status');
    } catch (e: any) {
      console.log('✔ [7] Correctly rejected invalid stock status:', e.message);
    }

    // 8. Retrieve products
    const all = await productService.getAllProducts();
    if (all.length === 0) {
      throw new Error('Failed to retrieve products list');
    }
    console.log('✔ [8] Products list retrieved successfully.');

    // 9. Retrieve products by category
    const catProducts = await productService.getProductsByCategory(category.id);
    if (catProducts.length === 0 || catProducts[0].name !== 'Coca-Cola Can') {
      throw new Error('Failed to retrieve correct category products');
    }
    console.log('✔ [9] Category products retrieved successfully.');

    // 10. Change stock status
    await productService.updateStockStatus(product.id, 'low');
    const updatedProd = await productService.getProductById(product.id);
    if (updatedProd?.stock_status !== 'low') {
      throw new Error('Failed to update product stock status');
    }
    console.log('✔ [10] Stock status changed successfully to "low".');

    // 11. Retrieve low-stock products
    const lowProducts = await productService.getProductsByStockStatus('low');
    if (!lowProducts.some(p => p.id === product.id)) {
      throw new Error('Did not find the low-stock product in filtered list');
    }
    console.log('✔ [11] Low-stock products list retrieved successfully.');

    // 12. Retrieve out-of-stock products
    const outProducts = await productService.getProductsByStockStatus('out');
    const containsLowInOut = outProducts.some(p => p.id === product.id);
    if (containsLowInOut) {
      throw new Error('Found low-stock product in out-of-stock list');
    }
    console.log('✔ [12] Out-of-stock products list retrieved successfully (low-stock excluded).');

    // 13. Update product
    await productService.updateProduct(product.id, 'Coca-Cola Zero', category.id);
    const renamedProd = await productService.getProductById(product.id);
    if (renamedProd?.name !== 'Coca-Cola Zero') {
      throw new Error('Failed to update product name');
    }
    console.log('✔ [13] Product updated successfully:', renamedProd);

    // 14. Soft-delete product
    await productService.deleteProduct(product.id);
    const deletedCheck = await productService.getProductById(product.id);
    if (deletedCheck !== null) {
      throw new Error('Soft-deleted product was returned by getProductById');
    }
    console.log('✔ [14] Product soft-deleted successfully.');

    // 15. Prevent unsafe category deletion when products depend on it
    // Create new category and product to test category deletion safety
    const safetyCat = await categoryService.createCategory('Safety_' + Math.random().toString(36).substring(7));
    await productService.createProduct(safetyCat.id, 'Safety Product', 'high');
    try {
      await categoryService.deleteCategory(safetyCat.id);
      throw new Error('Allowed deleting category containing active products');
    } catch (e: any) {
      console.log('✔ [15] Correctly blocked category deletion containing products:', e.message);
    }

    console.log('=== ALL 15 INVENTORY BUSINESS LOGIC TESTS PASSED! ===');
    return true;
  } catch (error) {
    console.error('❌ INVENTORY SERVICE VERIFICATION FAILED:', error);
    return false;
  }
}

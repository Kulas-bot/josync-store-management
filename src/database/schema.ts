// JoSync Database Schema - SQL DDL Definitions
// Version 1

export const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
`;

export const CREATE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    stock_status TEXT NOT NULL CHECK(stock_status IN ('high', 'low', 'out')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
  );
`;

export const CREATE_BORROWERS_TABLE = `
  CREATE TABLE IF NOT EXISTS borrowers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    contact_number TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
`;

export const CREATE_BORROWED_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS borrowed_items (
    id TEXT PRIMARY KEY NOT NULL,
    borrower_id TEXT NOT NULL,
    product_id TEXT,
    item_type TEXT NOT NULL CHECK(item_type IN ('product', 'cash')),
    item_name TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    notes TEXT,
    borrowed_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (borrower_id) REFERENCES borrowers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL ON UPDATE CASCADE
  );
`;

export const CREATE_PAYMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY NOT NULL,
    borrower_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    payment_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (borrower_id) REFERENCES borrowers (id) ON DELETE RESTRICT ON UPDATE CASCADE
  );
`;

export const CREATE_DAILY_SALES_TABLE = `
  CREATE TABLE IF NOT EXISTS daily_sales (
    id TEXT PRIMARY KEY NOT NULL,
    sales_date TEXT NOT NULL UNIQUE,
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
`;

export const CREATE_SHOPPING_LISTS_TABLE = `
  CREATE TABLE IF NOT EXISTS shopping_lists (
    id TEXT PRIMARY KEY NOT NULL,
    shopping_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'completed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
`;

export const CREATE_SHOPPING_LIST_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS shopping_list_items (
    id TEXT PRIMARY KEY NOT NULL,
    shopping_list_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    status_at_creation TEXT NOT NULL CHECK(status_at_creation IN ('low', 'out')),
    purchased INTEGER NOT NULL CHECK(purchased IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
  );
`;

// Index DDL statements
export const CREATE_INDEX_PRODUCTS_CATEGORY = `
  CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
`;

export const CREATE_INDEX_BORROWED_ITEMS_BORROWER = `
  CREATE INDEX IF NOT EXISTS idx_borrowed_items_borrower ON borrowed_items (borrower_id);
`;

export const CREATE_INDEX_BORROWED_ITEMS_PRODUCT = `
  CREATE INDEX IF NOT EXISTS idx_borrowed_items_product ON borrowed_items (product_id);
`;

export const CREATE_INDEX_PAYMENTS_BORROWER = `
  CREATE INDEX IF NOT EXISTS idx_payments_borrower ON payments (borrower_id);
`;

export const CREATE_INDEX_SHOPPING_LIST_ITEMS_LIST = `
  CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items (shopping_list_id);
`;

export const CREATE_INDEX_SHOPPING_LIST_ITEMS_PRODUCT = `
  CREATE INDEX IF NOT EXISTS idx_shopping_list_items_product ON shopping_list_items (product_id);
`;

export const CREATE_INDEX_DAILY_SALES_DATE = `
  CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales (sales_date);
`;

export const SCHEMA_V1_QUERIES = [
  CREATE_CATEGORIES_TABLE,
  CREATE_PRODUCTS_TABLE,
  CREATE_BORROWERS_TABLE,
  CREATE_BORROWED_ITEMS_TABLE,
  CREATE_PAYMENTS_TABLE,
  CREATE_DAILY_SALES_TABLE,
  CREATE_SHOPPING_LISTS_TABLE,
  CREATE_SHOPPING_LIST_ITEMS_TABLE,
  CREATE_INDEX_PRODUCTS_CATEGORY,
  CREATE_INDEX_BORROWED_ITEMS_BORROWER,
  CREATE_INDEX_BORROWED_ITEMS_PRODUCT,
  CREATE_INDEX_PAYMENTS_BORROWER,
  CREATE_INDEX_SHOPPING_LIST_ITEMS_LIST,
  CREATE_INDEX_SHOPPING_LIST_ITEMS_PRODUCT,
  CREATE_INDEX_DAILY_SALES_DATE,
];

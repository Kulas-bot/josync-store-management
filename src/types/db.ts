export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Store {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  id: string;
  category_id: string;
  store_id?: string | null;
  name: string;
  stock_status: 'high' | 'low' | 'out';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Borrower {
  id: string;
  name: string;
  contact_number: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BorrowedItem {
  id: string;
  borrower_id: string;
  product_id: string | null;
  item_type: 'product' | 'cash';
  item_name: string;
  amount: number;
  notes: string | null;
  borrowed_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  quantity: number;
}

export interface Payment {
  id: string;
  borrower_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DailySale {
  id: string;
  sales_date: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ShoppingList {
  id: string;
  shopping_date: string;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  product_id: string;
  status_at_creation: 'low' | 'out';
  purchased: number; // SQLite uses 0 or 1 for boolean check
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

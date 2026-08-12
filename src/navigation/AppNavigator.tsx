import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import CategoryProductsScreen from '../screens/CategoryProducts/CategoryProductsScreen';
import AddCategoryScreen from '../screens/Inventory/AddCategoryScreen';
import AddProductScreen from '../screens/Inventory/AddProductScreen';
import ShoppingListScreen from '../screens/ShoppingList/ShoppingListScreen';
import SalesScreen from '../screens/Sales/SalesScreen';
import LedgerScreen from '../screens/Ledger/LedgerScreen';
import BorrowerDetailsScreen from '../screens/Ledger/BorrowerDetailsScreen';
import AddBorrowedItemScreen from '../screens/Ledger/AddBorrowedItemScreen';
import RecordPaymentScreen from '../screens/Ledger/RecordPaymentScreen';
import PaymentHistoryScreen from '../screens/Ledger/PaymentHistoryScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import AllBorrowersScreen from '../screens/Ledger/AllBorrowersScreen';
import AddBorrowerScreen from '../screens/Ledger/AddBorrowerScreen';
import SplashScreen from '../screens/Splash/SplashScreen';
import SalesHistoryScreen from '../screens/Sales/SalesHistoryScreen';

export type RootStackParamList = {
  Splash: undefined;
  Dashboard: undefined;
  Inventory: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  AddCategory: undefined;
  AddProduct: { categoryId: string; categoryName: string };
  ShoppingList: undefined;
  DailySales: undefined;
  SalesHistory: undefined;
  Ledger: undefined;
  BorrowerDetails: { borrowerId: string; borrowerName: string };
  AddBorrowedItem: { borrowerId: string; borrowerName: string };
  RecordPayment: { borrowerId: string; borrowerName: string };
  PaymentHistory: { borrowerId: string; borrowerName: string };
  Reports: undefined;
  AllBorrowers: undefined;
  AddBorrower: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false, // Each screen manages its own custom header row
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
        <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
        <Stack.Screen name="DailySales" component={SalesScreen} />
        <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} />
        <Stack.Screen name="Ledger" component={LedgerScreen} />
        <Stack.Screen name="BorrowerDetails" component={BorrowerDetailsScreen} />
        <Stack.Screen name="AddBorrowedItem" component={AddBorrowedItemScreen} />
        <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="AllBorrowers" component={AllBorrowersScreen} />
        <Stack.Screen name="AddBorrower" component={AddBorrowerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

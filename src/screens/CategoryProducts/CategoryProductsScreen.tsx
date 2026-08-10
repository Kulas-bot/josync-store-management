import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { productService, categoryService } from '../../services';
import { Product } from '../../types/db';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryProducts'>;

type StockStatus = 'HIGH' | 'LOW' | 'OUT';

interface ProductUI extends Product {
  iconName: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Removed mock data

// ─── Product Card Component ──────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductUI;
  isEditing: boolean;
  onPress: (product: ProductUI) => void;
  onDelete: (product: ProductUI) => void;
}

function ProductCard({ product, isEditing, onPress, onDelete }: ProductCardProps) {
  // Styles for stock pills based on status
  let pillBg = '#E2F7E6';
  let pillText = '#2D8A4E';
  let statusDotColor = '#15803D';
  let labelText = 'Marami';

  if (product.stock_status === 'low') {
    pillBg = '#FDF0DC';
    pillText = '#C87619';
    statusDotColor = '#F59E0B';
    labelText = 'Kaunti';
  } else if (product.stock_status === 'out') {
    pillBg = '#FCE4E4';
    pillText = '#D32F2F';
    statusDotColor = '#DC2626';
    labelText = 'Ubos';
  }

  return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.75}
      onPress={() => isEditing ? onDelete(product) : onPress(product)}
    >
      {/* Icon badge left */}
      <View style={styles.productIconBadge}>
        <MaterialCommunityIcons name={product.iconName as any} size={22} color={COLORS.primary} />
      </View>

      {/* Name and status dot underneath */}
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
      </View>

      {/* Right container: Status pill + right chevron arrow OR delete bin icon */}
      <View style={styles.productRight}>
        {isEditing ? (
          <View style={styles.deleteIconCircle}>
            <Feather name="trash-2" size={18} color="#D32F2F" />
          </View>
        ) : (
          <>
            <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
              <Text style={[styles.statusPillText, { color: pillText }]}>{labelText}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CategoryProductsScreen({ route, navigation }: Props) {
  const { categoryId, categoryName } = route.params;

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const category = await categoryService.getCategoryById(categoryId);
      const iconName = 'folder-outline'; // Category has no icon in DB
      
      const categoryProducts = await productService.getProductsByCategory(categoryId);
      const uiProducts: ProductUI[] = categoryProducts.map(p => ({
        ...p,
        iconName,
      }));
      setProducts(uiProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [categoryId])
  );

  const filteredProducts = products.filter((product) => {
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Tab pill filter
    if (activeFilter === 'LOW') return product.stock_status === 'low';
    if (activeFilter === 'OUT') return product.stock_status === 'out';
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock_status === 'low').length;

  const handleProductPress = (product: ProductUI) => {
    // TODO: Navigate to Edit Product / Product Details Screen
    console.log('Product pressed:', product.name);
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct', { categoryId, categoryName });
  };

  const handleMoreOptions = () => {
    setIsEditing(!isEditing);
  };

  const handleDeleteProduct = (product: ProductUI) => {
    Alert.alert(
      'Kumpirmahin',
      `Sigurado ka bang gusto mong burahin ang panindang "${product.name}"?`,
      [
        { text: 'Kanselahin', style: 'cancel' },
        {
          text: 'Burahin',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await productService.deleteProduct(product.id);
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Hindi nabura ang paninda.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.logoContainer}>
          <FontAwesome5 name="shopping-basket" size={16} color={COLORS.primary} />
          <Text style={styles.logoText}>JoSync</Text>
        </View>

        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={17} color="#FFFFFF" />
        </View>
      </View>

      {/* 2. Category Header & Actions */}
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryTitle}>{categoryName || 'Category'}</Text>
            <Text style={styles.categorySubtitle}>I-manage ang mga paninda sa kategoryang ito</Text>
          </View>
        </View>

        <View style={styles.categoryHeaderRight}>
          <TouchableOpacity 
            style={[styles.actionIconBtn, isEditing && { backgroundColor: '#FDE8E8' }]} 
            onPress={handleMoreOptions}
          >
            <Feather name="more-vertical" size={20} color={isEditing ? COLORS.primary : COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Maghanap ng paninda..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 4. Filter Pills Bar */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* All */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'ALL' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setActiveFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'ALL' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Lahat
            </Text>
            <View
              style={[
                styles.pillBadge,
                activeFilter === 'ALL' ? styles.pillBadgeActive : styles.pillBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.pillBadgeText,
                  activeFilter === 'ALL' ? styles.pillBadgeTextActive : styles.pillBadgeTextInactive,
                ]}
              >
                {products.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Low Stock */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'LOW' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setActiveFilter('LOW')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'LOW' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Kaunti
            </Text>
            <View
              style={[
                styles.pillBadge,
                activeFilter === 'LOW' ? styles.pillBadgeActive : styles.pillBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.pillBadgeText,
                  activeFilter === 'LOW' ? styles.pillBadgeTextActive : styles.pillBadgeTextInactive,
                ]}
              >
                {lowStockCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Out of Stock */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'OUT' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setActiveFilter('OUT')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'OUT' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Ubos
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 5. Product List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard 
              product={item} 
              isEditing={isEditing} 
              onPress={handleProductPress} 
              onDelete={handleDeleteProduct} 
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Walang nahanap na paninda sa filter na ito.</Text>
            </View>
          }
        />
      )}

      {/* 6. Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleAddProduct}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Magdagdag ng Paninda</Text>
      </TouchableOpacity>

      {/* 7. Mock Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        {/* Home */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialCommunityIcons name="storefront-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Bahay</Text>
        </TouchableOpacity>

        {/* Inventory (active) */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Inventory')}
        >
          <View style={styles.activeTabOutline}>
            <MaterialCommunityIcons name="archive" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.activeTabText}>Paninda</Text>
        </TouchableOpacity>

        {/* List */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ShoppingList')}
        >
          <MaterialCommunityIcons name="format-list-bulleted" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Listahan</Text>
        </TouchableOpacity>

        {/* Ledger */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Ledger')}
        >
          <Feather name="book-open" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Utang</Text>
        </TouchableOpacity>

        {/* Reports */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Reports')}
        >
          <Ionicons name="bar-chart-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Buod</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header Bar ──
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Category Header & Actions ──
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  categorySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionIconBtn: {
    padding: SPACING.xs,
  },

  // ── Search Section ──
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDE4', // soft gray-cream background
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },

  // ── Filter Section ──
  filterSection: {
    paddingVertical: SPACING.md,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ROUNDS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterPillInactive: {
    backgroundColor: '#EFECE9',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: COLORS.text,
  },
  pillBadge: {
    borderRadius: ROUNDS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: SPACING.xs,
  },
  pillBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillBadgeInactive: {
    backgroundColor: '#D1CAC2',
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  pillBadgeTextActive: {
    color: '#FFFFFF',
  },
  pillBadgeTextInactive: {
    color: COLORS.text,
  },

  // ── Product List ──
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Safe padding for FAB
    gap: SPACING.sm,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FAF5EE', // soft cream background for line art badge
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusPill: {
    borderRadius: ROUNDS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty List
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: 84, // Stits just above tab bar
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },

  // ── Bottom Nav ──
  bottomTabBar: {
    height: 68,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeTabOutline: {
    backgroundColor: COLORS.activeTabBg,
    borderRadius: ROUNDS.lg,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 2,
  },
  activeTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  inactiveTabText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

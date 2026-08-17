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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import HeaderBar from '../../components/HeaderBar';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { productService, categoryService, shoppingListService } from '../../services';
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
  onPress: (product: ProductUI) => void;
  onActionPress: (product: ProductUI) => void;
  onDelete: (product: ProductUI) => void;
}

function ProductCard({ product, onPress, onActionPress, onDelete }: ProductCardProps) {
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
      onPress={() => onPress(product)}
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

      {/* Right container: Status pill + right three-dot menu button */}
      <View style={styles.productRight}>
        <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
          <Text style={[styles.statusPillText, { color: pillText }]}>{labelText}</Text>
        </View>
        <TouchableOpacity onPress={() => onActionPress(product)} style={{ padding: 6 }}>
          <Feather name="more-vertical" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CategoryProductsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom;
  const barHeight = 68 + bottomPadding;
  const { categoryId, categoryName } = route.params;

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductUI | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [promptModalVisible, setPromptModalVisible] = useState(false);
  
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
  const outStockCount = products.filter((p) => p.stock_status === 'out').length;

  const handleProductPress = (product: ProductUI) => {
    setSelectedProduct(product);
    setStatusModalVisible(true);
  };

  const handleStatusChange = async (newStatus: 'high' | 'low' | 'out') => {
    if (!selectedProduct) return;
    setStatusModalVisible(false);

    try {
      if (selectedProduct.stock_status !== newStatus) {
        await productService.updateStockStatus(selectedProduct.id, newStatus);
        
        // If changed to low or out, ask if user wants to add it to Shopping List
        if (newStatus === 'low' || newStatus === 'out') {
          const isAlreadyOnList = await shoppingListService.isProductOnActiveShoppingList(selectedProduct.id);
          if (!isAlreadyOnList) {
            setPromptModalVisible(true);
            return;
          }
        }
      }
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Hindi ma-update ang status.');
    }
  };

  const handleAddToShoppingList = async () => {
    if (!selectedProduct) return;
    setPromptModalVisible(false);
    try {
      await shoppingListService.addProductToShoppingList(selectedProduct.id);
      Alert.alert('Tagumpay', `Naidagdag ang "${selectedProduct.name}" sa listahan ng bibilhin.`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Hindi naidagdag sa listahan.');
    }
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct', { categoryId, categoryName });
  };

  const handleActionPress = (product: ProductUI) => {
    setSelectedProduct(product);
    setActionModalVisible(true);
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
      <HeaderBar onBack={() => navigation.goBack()} showProfile={false} />

      {/* 2. Category Header & Actions */}
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryTitle}>{categoryName || 'Category'}</Text>
            <Text style={styles.categorySubtitle}>I-manage ang mga paninda sa kategoryang ito</Text>
          </View>
        </View>

        <View style={styles.categoryHeaderRight} />
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
            <View
              style={[
                styles.pillBadge,
                activeFilter === 'OUT' ? styles.pillBadgeActive : styles.pillBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.pillBadgeText,
                  activeFilter === 'OUT' ? styles.pillBadgeTextActive : styles.pillBadgeTextInactive,
                ]}
              >
                {outStockCount}
              </Text>
            </View>
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
              onPress={handleProductPress} 
              onActionPress={handleActionPress}
              onDelete={handleDeleteProduct} 
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: barHeight + 36 }]}
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
        style={[styles.fab, { bottom: barHeight + 16 }]}
        activeOpacity={0.85}
        onPress={handleAddProduct}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Magdagdag ng Paninda</Text>
      </TouchableOpacity>

      {/* 7. Mock Bottom Navigation Bar */}
      <View style={[styles.bottomTabBar, { height: barHeight, paddingBottom: bottomPadding }]}>
        {/* Home */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialCommunityIcons name="storefront-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Home</Text>
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

      {/* Stock Status Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Baguhin ang Stock Status</Text>
            <Text style={styles.modalSubTitle}>{selectedProduct?.name}</Text>
            
            <View style={styles.statusOptionsContainer}>
              <TouchableOpacity
                style={[styles.statusOptionBtn, { backgroundColor: '#E2F7E6', borderColor: '#2D8A4E' }]}
                onPress={() => handleStatusChange('high')}
              >
                <View style={[styles.statusDot, { backgroundColor: '#15803D', marginRight: 8 }]} />
                <Text style={[styles.statusOptionText, { color: '#2D8A4E' }]}>Marami (Plentiful)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOptionBtn, { backgroundColor: '#FDF0DC', borderColor: '#C87619' }]}
                onPress={() => handleStatusChange('low')}
              >
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B', marginRight: 8 }]} />
                <Text style={[styles.statusOptionText, { color: '#C87619' }]}>Kaunti (Low Stock)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOptionBtn, { backgroundColor: '#FCE4E4', borderColor: '#D32F2F' }]}
                onPress={() => handleStatusChange('out')}
              >
                <View style={[styles.statusDot, { backgroundColor: '#DC2626', marginRight: 8 }]} />
                <Text style={[styles.statusOptionText, { color: '#D32F2F' }]}>Ubos (Out of Stock)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Kanselahin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Action Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>I-manage ang Paninda</Text>
            <Text style={styles.modalSubTitle}>{selectedProduct?.name}</Text>
            
            <View style={styles.statusOptionsContainer}>
              <TouchableOpacity
                style={[styles.statusOptionBtn, { backgroundColor: '#E8F0FE', borderColor: COLORS.primary }]}
                onPress={() => {
                  setActionModalVisible(false);
                  if (selectedProduct) {
                    navigation.navigate('AddProduct', { categoryId, categoryName, editProductId: selectedProduct.id });
                  }
                }}
              >
                <Feather name="edit-2" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.statusOptionText, { color: COLORS.primary }]}>I-edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOptionBtn, { backgroundColor: '#FCE4E4', borderColor: '#D32F2F' }]}
                onPress={() => {
                  setActionModalVisible(false);
                  if (selectedProduct) handleDeleteProduct(selectedProduct);
                }}
              >
                <Feather name="trash-2" size={16} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={[styles.statusOptionText, { color: '#D32F2F' }]}>Tanggalin</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Kanselahin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Suggest Add to Shopping List Prompt Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={promptModalVisible}
        onRequestClose={() => {
          setPromptModalVisible(false);
          loadData();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Idagdag sa Listahan?</Text>
            <Text style={styles.modalMessage}>
              Gusto mo bang idagdag ang "{selectedProduct?.name}" sa listahan ng mga bibilhin?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setPromptModalVisible(false);
                  loadData();
                }}
              >
                <Text style={styles.modalBtnCancelText}>Hindi Muna</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnFinish]}
                onPress={handleAddToShoppingList}
              >
                <Text style={styles.modalBtnFinishText}>Idagdag</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  editIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F0FE',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  modalMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: ROUNDS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modalBtnCancelText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalBtnFinish: {
    backgroundColor: COLORS.primary,
  },
  modalBtnFinishText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusOptionsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: SPACING.xs,
  },
  modalCancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
});

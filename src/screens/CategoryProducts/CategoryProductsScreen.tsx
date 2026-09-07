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
  isRestockingLocked: boolean;
}

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

  if (product.isRestockingLocked) {
    pillBg = '#FCEAE3';
    pillText = COLORS.primary;
    statusDotColor = product.stock_status === 'out' ? '#DC2626' : '#F59E0B';
    labelText = product.stock_status === 'out' ? 'Ubos' : 'Kaunti';
  } else if (product.stock_status === 'low') {
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
      style={[
        styles.productCard,
        product.isRestockingLocked && styles.productCardLocked,
      ]}
      activeOpacity={0.75}
      onPress={() => onPress(product)}
    >
      {/* Icon badge left */}
      <View style={[
        styles.productIconBadge,
        product.isRestockingLocked && styles.productIconBadgeLocked,
      ]}>
        <MaterialCommunityIcons
          name={product.isRestockingLocked ? 'cart-arrow-down' : (product.iconName as any)}
          size={22}
          color={COLORS.primary}
        />
      </View>

      {/* Name and status dot underneath */}
      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
          {product.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          {product.isRestockingLocked && (
            <Text style={styles.lockedSubtext} numberOfLines={1} ellipsizeMode="tail">
              Nasa Listahan ng Bibilhin
            </Text>
          )}
        </View>
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
  const [addToListPrompt, setAddToListPrompt] = useState<{ visible: boolean; productId: string; productName: string }>({ visible: false, productId: '', productName: '' });
  
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const iconName = 'folder-outline';
      
      const [categoryProducts, activeList] = await Promise.all([
        productService.getProductsByCategory(categoryId),
        shoppingListService.getActiveShoppingList(),
      ]);

      let activeItemProductIds = new Set<string>();
      if (activeList) {
        const activeItems = await shoppingListService.getShoppingListItems(activeList.id);
        activeItemProductIds = new Set(activeItems.map((i) => i.product_id));
      }

      const uiProducts: ProductUI[] = categoryProducts.map(p => ({
        ...p,
        iconName,
        isRestockingLocked: activeItemProductIds.has(p.id) && p.stock_status !== 'high',
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

    // Check if user is trying to revert a locked product back to 'high' from Inventory
    if (newStatus === 'high' && selectedProduct.isRestockingLocked) {
      Alert.alert(
        'Naka-lock ang Paninda (Restocking)',
        `Ang "${selectedProduct.name}" ay kasalukuyang nasa Listahan ng Bibilhin para sa restocking.\n\nTapusin ang pagbili sa "Listahan ng Bibilhin" para maibalik ito sa Marami pagkatapos mabili.`
      );
      return;
    }

    setStatusModalVisible(false);

    const productName = selectedProduct.name;
    const productId = selectedProduct.id;

    try {
      if (selectedProduct.stock_status !== newStatus) {
        await productService.updateStockStatus(productId, newStatus);

        // When transitioning to 'low' or 'out', show custom prompt
        if (newStatus === 'low' || newStatus === 'out') {
          await loadData();
          setAddToListPrompt({ visible: true, productId, productName });
          return;
        }
      }
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Hindi ma-update ang status.');
    }
  };

  const handleAddToListConfirm = async () => {
    const { productId, productName } = addToListPrompt;
    setAddToListPrompt({ visible: false, productId: '', productName: '' });
    try {
      await shoppingListService.addProductToShoppingList(productId);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Hindi naidagdag sa listahan.');
    }
  };

  const handleAddToListDismiss = () => {
    setAddToListPrompt({ visible: false, productId: '', productName: '' });
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

            {selectedProduct?.isRestockingLocked && (
              <View style={styles.lockedNoticeBox}>
                <Text style={styles.lockedNoticeText}>
                  Nasa restocking workflow ang panindang ito. Tapusin ang pagbili sa Listahan para maibalik sa Marami.
                </Text>
              </View>
            )}
            
            <View style={styles.statusOptionsContainer}>
              {/* Marami */}
              <TouchableOpacity
                style={[
                  styles.statusOptionBtn,
                  selectedProduct?.isRestockingLocked
                    ? styles.statusOptionBtnLocked
                    : { backgroundColor: '#E2F7E6', borderColor: '#2D8A4E' }
                ]}
                onPress={() => handleStatusChange('high')}
                activeOpacity={selectedProduct?.isRestockingLocked ? 1 : 0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[styles.statusDot, { backgroundColor: selectedProduct?.isRestockingLocked ? '#8C827A' : '#15803D', marginRight: 8 }]} />
                  <Text style={[styles.statusOptionText, { color: selectedProduct?.isRestockingLocked ? '#8C827A' : '#2D8A4E' }]}>
                    Marami (Plentiful)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Kaunti */}
              <TouchableOpacity
                style={[styles.statusOptionBtn, { backgroundColor: '#FDF0DC', borderColor: '#C87619' }]}
                onPress={() => handleStatusChange('low')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[styles.statusDot, { backgroundColor: '#F59E0B', marginRight: 8 }]} />
                  <Text style={[styles.statusOptionText, { color: '#C87619' }]}>Kaunti (Low Stock)</Text>
                </View>
              </TouchableOpacity>

              {/* Ubos */}
              <TouchableOpacity
                style={[styles.statusOptionBtn, { backgroundColor: '#FCE4E4', borderColor: '#D32F2F' }]}
                onPress={() => handleStatusChange('out')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[styles.statusDot, { backgroundColor: '#DC2626', marginRight: 8 }]} />
                  <Text style={[styles.statusOptionText, { color: '#D32F2F' }]}>Ubos (Out of Stock)</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Isara</Text>
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
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>I-manage ang Paninda</Text>
            <Text style={[styles.modalSubTitle, { textAlign: 'center' }]}>{selectedProduct?.name}</Text>
            
            <View style={styles.statusOptionsContainer}>
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
      {/* Idagdag sa Listahan? Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addToListPrompt.visible}
        onRequestClose={handleAddToListDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Idagdag sa Listahan?</Text>
            <Text style={styles.confirmModalMessage}>
              Gusto mo bang idagdag ang "{addToListPrompt.productName}" sa listahan ng mga bibilhin?
            </Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmBtnCancel}
                activeOpacity={0.8}
                onPress={handleAddToListDismiss}
              >
                <Text style={styles.confirmBtnCancelText}>Hindi Muna</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtnAdd}
                activeOpacity={0.8}
                onPress={handleAddToListConfirm}
              >
                <Text style={styles.confirmBtnAddText}>Idagdag</Text>
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
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDE4',
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
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
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
  productCardLocked: {
    borderColor: '#F0D5C9',
    backgroundColor: '#FFFCFA',
  },
  productIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  productIconBadgeLocked: {
    backgroundColor: '#FCEAE3',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lockedSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    flexShrink: 1,
  },
  productRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  statusPill: {
    borderRadius: ROUNDS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: 84,
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
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  lockedNoticeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEAE3',
    padding: SPACING.sm,
    borderRadius: ROUNDS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0D5C9',
  },
  lockedNoticeText: {
    fontSize: 11,
    color: COLORS.primary,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusOptionsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
  },
  statusOptionBtnLocked: {
    backgroundColor: '#EFECE9',
    borderColor: '#D1CAC2',
    opacity: 0.65,
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

  // ── Idagdag sa Listahan? Confirm Modal ──
  confirmModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  confirmBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: ROUNDS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnCancelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  confirmBtnAdd: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: ROUNDS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnAddText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

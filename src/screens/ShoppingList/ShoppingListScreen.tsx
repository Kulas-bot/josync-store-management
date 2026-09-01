import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
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
import { RootStackParamList } from '../../navigation/AppNavigator';
import BottomTabBar, { useBottomBarHeight } from '../../components/BottomTabBar';
import HeaderBar from '../../components/HeaderBar';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { shoppingListService } from '../../services/shoppingListService';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';

// ─── Types & Mock Data ───────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'ShoppingList'>;

interface ShoppingProduct {
  id: string; // ShoppingListItem ID
  productId: string;
  name: string;
  category: string;
  status: 'LOW' | 'OUT';
  purchased: boolean;
}

const CATEGORY_ICONS: Record<string, { icon: string; emoji: string }> = {
  'School Supplies': { icon: 'format-list-bulleted', emoji: '📚' },
  'Chips & Snacks': { icon: 'food', emoji: '🍟' },
  'Biscuits': { icon: 'cookie', emoji: '🍪' },
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ShoppingListScreen({ navigation }: Props) {
  const bottomBarHeight = useBottomBarHeight();
  const [products, setProducts] = useState<ShoppingProduct[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await shoppingListService.getOrCreateActiveShoppingList();
      setListId(list.id);

      const [items, allProducts, allCategories] = await Promise.all([
        shoppingListService.getShoppingListItems(list.id),
        productService.getAllProducts(),
        categoryService.getAllCategories()
      ]);

      // Map to UI state
      const merged = items.map((item) => {
        const prod = allProducts.find((p) => p.id === item.product_id);
        const cat = allCategories.find((c) => c.id === prod?.category_id);
        return {
          id: item.id,
          productId: item.product_id,
          name: prod?.name || 'Unknown',
          category: cat?.name || 'Uncategorized',
          status: item.status_at_creation.toUpperCase() as 'LOW' | 'OUT',
          purchased: item.purchased === 1,
        };
      });
      setProducts(merged);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const toggleProduct = async (id: string) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;

    try {
      const newStatus = !item.purchased;
      await shoppingListService.markItemAsPurchased(id, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, purchased: newStatus } : p))
      );
    } catch (err) {
      console.log(err);
    }
  };

  const executeCompletion = async (itemsToComplete: ShoppingProduct[]) => {
    if (!listId) return;

    try {
      setLoading(true);

      // 1. Update stock status of all specified products to 'high' (Marami)
      for (const item of itemsToComplete) {
        await productService.updateStockStatus(item.productId, 'high');
      }

      // 2. Mark any unchecked item as purchased in the database
      for (const item of itemsToComplete) {
        if (!item.purchased) {
          await shoppingListService.markItemAsPurchased(item.id, true);
        }
      }

      // 3. Complete the active shopping list
      await shoppingListService.completeShoppingList(listId);

      setModalVisible(false);
      navigation.navigate('Dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi matapos ang pagbili.');
    } finally {
      setLoading(false);
    }
  };

  const handleTapFinish = async () => {
    if (!listId || products.length === 0) return;

    const hasUnchecked = products.some((p) => !p.purchased);

    if (hasUnchecked) {
      // Case 2: Some products are unchecked -> Show confirmation dialog
      setModalVisible(true);
    } else {
      // Case 1: All products are checked -> Complete directly without confirmation dialog
      await executeCompletion(products);
    }
  };

  const handleConfirmAllPurchased = async () => {
    // User confirms all items were purchased -> Treat ALL active items as purchased
    await executeCompletion(products);
  };

  // Group products by category
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.status === 'LOW').length;
  const outOfStockCount = products.filter((p) => p.status === 'OUT').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* 1. Header Bar */}
      <HeaderBar onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Subheader Area */}
        <View style={styles.subheader}>
          <View style={styles.subheaderLeft}>
            <Text style={styles.planLabel}>BIBILHIN SA SABADO</Text>
            <Text style={styles.subheaderTitle}>Listahan ng Bibilhin</Text>
            <Text style={styles.subheaderSubtitle}>
              Awtomatikong nailagay ang mga ito base sa kulang sa iyong stock.
            </Text>
          </View>
          <View style={styles.basketIconCircle}>
            <FontAwesome5 name="shopping-basket" size={20} color={COLORS.primary} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 3. Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{totalProducts}</Text>
              </View>
              <View>
                <Text style={styles.summaryTitle}>Kabuuang Paninda</Text>
                <Text style={styles.summarySubtitle}>Handa nang bilhin</Text>
              </View>
            </View>

            {/* Split Stats row */}
            <View style={styles.statsRow}>
              {/* Card 1: Low Stock */}
              <View style={styles.statCard}>
                <Text style={styles.statNumberLow}>{lowStockCount}</Text>
                <Text style={styles.statLabel}>Kaunti ang Stock</Text>
              </View>

              {/* Card 2: Out of Stock */}
              <View style={styles.statCard}>
                <Text style={styles.statNumberOut}>{outOfStockCount}</Text>
                <Text style={styles.statLabel}>Ubos na Stock</Text>
              </View>
            </View>

            {/* 4. Grouped Checklist */}
            {categories.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 40, color: COLORS.textMuted }}>Walang laman ang listahan ngayon.</Text>
            ) : (
              categories.map((catName) => {
                const catProducts = products.filter((p) => p.category === catName);
                const iconConfig = CATEGORY_ICONS[catName] || { icon: 'format-list-bulleted', emoji: '📦' };

                return (
                  <View key={catName} style={styles.categorySection}>
                    {/* Category Header */}
                    <View style={styles.categoryHeader}>
                      <MaterialCommunityIcons
                        name={iconConfig.icon as any}
                        size={16}
                        color={COLORS.textMuted}
                        style={styles.categoryHeaderIcon}
                      />
                      <Text style={styles.categoryHeaderTitle}>
                        {catName.toUpperCase()}
                      </Text>
                    </View>

                    {/* Category Items */}
                    <View style={styles.categoryItemsList}>
                      {catProducts.map((product) => {
                        const isChecked = product.purchased;
                        const isOut = product.status === 'OUT';

                        return (
                          <TouchableOpacity
                            key={product.id}
                            style={[
                              styles.productCard,
                              isChecked ? styles.productCardChecked : styles.productCardUnchecked,
                            ]}
                            onPress={() => toggleProduct(product.id)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.productLeft}>
                              {/* Checkbox circle */}
                              <View
                                style={[
                                  styles.checkboxCircle,
                                  isChecked ? styles.checkboxCircleChecked : styles.checkboxCircleUnchecked,
                                ]}
                              >
                                {isChecked && (
                                  <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                                )}
                              </View>

                              {/* Product Name */}
                              <Text
                                style={[
                                  styles.productName,
                                  isChecked ? styles.productNameChecked : styles.productNameUnchecked,
                                ]}
                              >
                                {product.name}
                              </Text>
                            </View>

                            {/* Right Status Badge */}
                            <View
                              style={[
                                styles.statusBadge,
                                isChecked
                                  ? styles.statusBadgeChecked
                                  : isOut
                                  ? styles.statusBadgeOut
                                  : styles.statusBadgeLow,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  isChecked
                                    ? styles.statusBadgeTextChecked
                                    : isOut
                                    ? styles.statusBadgeTextOut
                                    : styles.statusBadgeTextLow,
                                ]}
                              >
                                {isChecked ? 'NABILI NA' : isOut ? 'UBOS' : 'KAUNTI'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Bottom spacer so sticky button doesn't overlap last row */}
        <View style={{ height: bottomBarHeight + 46 }} />
      </ScrollView>

      {/* 5. Sticky Bottom Action Button */}
      <View style={[styles.stickyButtonContainer, { bottom: bottomBarHeight + 16 }]}>
        <TouchableOpacity
          style={[
            styles.finishButton,
            (products.length === 0 || loading) && styles.finishButtonDisabled,
          ]}
          disabled={products.length === 0 || loading}
          activeOpacity={products.length === 0 || loading ? 1 : 0.85}
          onPress={handleTapFinish}
        >
          <MaterialCommunityIcons
            name="check-all"
            size={18}
            color={products.length === 0 || loading ? '#8C827A' : '#FFFFFF'}
            style={styles.finishIcon}
          />
          <Text
            style={[
              styles.finishButtonText,
              (products.length === 0 || loading) && styles.finishButtonTextDisabled,
            ]}
          >
            Tapusin ang Pagbili
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. Unchecked Items Confirmation Dialog Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>May hindi ka na-check.</Text>
            <Text style={styles.modalMessage}>
              Sigurado ka bang nabili mo lahat ng nasa listahan?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText} numberOfLines={2}>
                  Balikan ang Listahan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnFinish]}
                onPress={handleConfirmAllPurchased}
              >
                <Text style={styles.modalBtnFinishText} numberOfLines={2}>
                  Oo, Nabili Ko Lahat
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomTabBar activeTab="List" navigation={navigation} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },



  // ── Scroll Content ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  // ── Subheader ──
  subheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },

  subheaderLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subheaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  subheaderSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  basketIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FCEAE3', // soft peach/cream card background
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Summary Cards ──
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  summaryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCEAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Split Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  statNumberLow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statNumberOut: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // ── Category Group Section ──
  categorySection: {
    marginBottom: SPACING.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: 2,
  },
  categoryHeaderIcon: {
    marginRight: SPACING.xs,
  },
  categoryHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  categoryItemsList: {
    gap: SPACING.sm,
  },

  // ── Product Row Checklist Cards ──
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  productCardChecked: {
    opacity: 0.5, // faded card
  },
  productCardUnchecked: {
    opacity: 1,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  checkboxCircleChecked: {
    backgroundColor: '#10B981', // green filled
    borderColor: '#10B981',
  },
  checkboxCircleUnchecked: {
    backgroundColor: 'transparent',
    borderColor: '#D1CAC2',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  productNameChecked: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  productNameUnchecked: {
    color: COLORS.text,
  },
  statusBadge: {
    borderRadius: ROUNDS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  statusBadgeChecked: {
    backgroundColor: '#E2F7E6',
  },
  statusBadgeLow: {
    backgroundColor: '#FDF0DC',
  },
  statusBadgeOut: {
    backgroundColor: '#FCE4E4',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusBadgeTextChecked: {
    color: '#2D8A4E',
  },
  statusBadgeTextLow: {
    color: '#C87619',
  },
  statusBadgeTextOut: {
    color: '#D32F2F',
  },

  // ── Sticky Finish Button ──
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 84, // Sits just above tab bar
    left: SPACING.lg,
    right: SPACING.lg,
  },
  finishButton: {
    backgroundColor: '#10B981', // Green rounded button
    borderRadius: ROUNDS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonDisabled: {
    backgroundColor: '#D1CAC2', // Greyed out
    shadowOpacity: 0,
    elevation: 0,
  },
  finishIcon: {
    marginRight: SPACING.xs,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  finishButtonTextDisabled: {
    color: '#8C827A',
  },

  // ── Modal Dialog ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // dim overlay
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xs,
    borderRadius: ROUNDS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  modalBtnCancelText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBtnFinish: {
    backgroundColor: '#10B981',
  },
  modalBtnFinishText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

});

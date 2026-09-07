import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import BottomTabBar, { useBottomBarHeight } from '../../components/BottomTabBar';
import HeaderBar from '../../components/HeaderBar';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { shoppingListService, StoreShoppingItem } from '../../services/shoppingListService';
import { productService } from '../../services/productService';

type Props = NativeStackScreenProps<RootStackParamList, 'StoreShoppingList'>;

export default function StoreShoppingListScreen({ route, navigation }: Props) {
  const { storeId, storeName, listId } = route.params;
  const bottomBarHeight = useBottomBarHeight();

  const [items, setItems] = useState<StoreShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadStoreItems = async () => {
    try {
      setLoading(true);
      const groups = await shoppingListService.getStoreGroupedShoppingItems(listId);
      const matchedGroup = groups.find((g) => g.storeId === storeId);
      if (matchedGroup) {
        setItems(matchedGroup.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load store items:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStoreItems();
    }, [listId, storeId])
  );

  const toggleItem = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      const newStatus = !item.purchased;
      await shoppingListService.markItemAsPurchased(itemId, newStatus);
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, purchased: newStatus } : i))
      );
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const executeCompletion = async (itemsToComplete: StoreShoppingItem[]) => {
    try {
      setLoading(true);

      // 1. Update stock status of all products to 'high' (Marami)
      for (const item of itemsToComplete) {
        await productService.updateStockStatus(item.productId, 'high', true);
      }

      // 2. Mark any unchecked item as purchased in the database
      for (const item of itemsToComplete) {
        if (!item.purchased) {
          await shoppingListService.markItemAsPurchased(item.id, true);
        }
      }

      // 3. Complete the active shopping list if all items in the list are completed
      const allGroups = await shoppingListService.getStoreGroupedShoppingItems(listId);
      const totalRemainingUnchecked = allGroups
        .flatMap((g) => g.items)
        .filter((i) => !itemsToComplete.some((completed) => completed.id === i.id) && !i.purchased)
        .length;

      if (totalRemainingUnchecked === 0) {
        await shoppingListService.completeShoppingList(listId);
      }

      setModalVisible(false);
      navigation.navigate('Dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi matapos ang pagbili.');
    } finally {
      setLoading(false);
    }
  };

  const handleTapFinish = async () => {
    if (items.length === 0) return;

    const hasUnchecked = items.some((i) => !i.purchased);
    if (hasUnchecked) {
      setModalVisible(true);
    } else {
      await executeCompletion(items);
    }
  };

  const handleConfirmAllPurchased = async () => {
    await executeCompletion(items);
  };

  const totalProducts = items.length;
  const lowStockCount = items.filter((i) => i.statusAtCreation === 'low').length;
  const outOfStockCount = items.filter((i) => i.statusAtCreation === 'out').length;
  const purchasedCount = items.filter((i) => i.purchased).length;

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
            <Text style={styles.planLabel}>MGA BIBILHIN SA TINDAHAN</Text>
            <Text style={styles.subheaderTitle}>{storeName}</Text>
            <Text style={styles.subheaderSubtitle}>
              {purchasedCount} ng {totalProducts} paninda ang nabili na sa tindahang ito.
            </Text>
          </View>
          <View style={styles.storeIconCircle}>
            <FontAwesome5 name="store" size={20} color={COLORS.primary} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 3. Summary Cards */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{totalProducts}</Text>
              </View>
              <View>
                <Text style={styles.summaryTitle}>Mga Bibilhin Dito</Text>
                <Text style={styles.summarySubtitle}>
                  {purchasedCount === totalProducts && totalProducts > 0
                    ? 'Kumpleto na ang pagbili sa tindahang ito!'
                    : 'I-check ang mga panindang nabili na'}
                </Text>
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

            {/* 4. Product Checklist */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionHeaderTitle}>LISTAHAN NG MGA PANINDA</Text>

              {items.length === 0 ? (
                <Text style={styles.emptyText}>Walang paninda para sa tindahang ito.</Text>
              ) : (
                <View style={styles.itemsList}>
                  {items.map((item) => {
                    const isChecked = item.purchased;
                    const isOut = item.statusAtCreation === 'out';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.productCard,
                          isChecked ? styles.productCardChecked : styles.productCardUnchecked,
                        ]}
                        onPress={() => toggleItem(item.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.productLeft}>
                          {/* Checkbox circle */}
                          <View
                            style={[
                              styles.checkboxCircle,
                              isChecked
                                ? styles.checkboxCircleChecked
                                : styles.checkboxCircleUnchecked,
                            ]}
                          >
                            {isChecked && (
                              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                            )}
                          </View>

                          {/* Product Details */}
                          <View style={styles.productTextContainer}>
                            <Text
                              style={[
                                styles.productName,
                                isChecked
                                  ? styles.productNameChecked
                                  : styles.productNameUnchecked,
                              ]}
                            >
                              {item.productName}
                            </Text>
                            <Text style={styles.productCategory}>{item.categoryName}</Text>
                          </View>
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
              )}
            </View>
          </>
        )}

        {/* Bottom spacer so sticky button doesn't overlap */}
        <View style={{ height: bottomBarHeight + 70 }} />
      </ScrollView>

      {/* 5. Sticky Bottom Action Button */}
      <View style={[styles.stickyButtonContainer, { bottom: bottomBarHeight + 16 }]}>
        <TouchableOpacity
          style={[
            styles.finishButton,
            (items.length === 0 || loading) && styles.finishButtonDisabled,
          ]}
          disabled={items.length === 0 || loading}
          activeOpacity={items.length === 0 || loading ? 1 : 0.85}
          onPress={handleTapFinish}
        >
          <MaterialCommunityIcons
            name="check-all"
            size={18}
            color={items.length === 0 || loading ? '#8C827A' : '#FFFFFF'}
            style={styles.finishIcon}
          />
          <Text
            style={[
              styles.finishButtonText,
              (items.length === 0 || loading) && styles.finishButtonTextDisabled,
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
              Sigurado ka bang nabili mo lahat ng paninda sa tindahang ito?
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
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
  storeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FCEAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
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
  itemsSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    paddingHorizontal: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  itemsList: {
    gap: SPACING.sm,
  },
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
    opacity: 0.55,
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
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxCircleUnchecked: {
    backgroundColor: 'transparent',
    borderColor: '#D1CAC2',
  },
  productTextContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
  },
  productNameChecked: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  productNameUnchecked: {
    color: COLORS.text,
  },
  productCategory: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
  stickyButtonContainer: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
  },
  finishButton: {
    backgroundColor: '#10B981',
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
    backgroundColor: '#D1CAC2',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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

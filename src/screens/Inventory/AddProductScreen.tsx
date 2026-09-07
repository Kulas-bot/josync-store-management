import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
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
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Alert } from 'react-native';
import { productService, storeService } from '../../services';
import { shoppingListService } from '../../services/shoppingListService';
import { Store } from '../../types/db';

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'AddProduct'>;

type StockStatus = 'HIGH' | 'LOW' | 'OUT';

interface StatusOption {
  status: StockStatus;
  label: string;
  dotColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { status: 'HIGH', label: 'Marami', dotColor: '#15803D' },
  { status: 'LOW', label: 'Kaunti', dotColor: '#F59E0B' },
  { status: 'OUT', label: 'Ubos', dotColor: '#DC2626' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddProductScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom;
  const barHeight = 68 + bottomPadding;
  const { categoryId, categoryName, editProductId } = route.params;

  const [productName, setProductName] = useState('');
  const [storeNameInput, setStoreNameInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StockStatus>('HIGH');
  const [existingStores, setExistingStores] = useState<Store[]>([]);
  const [isRestockingLocked, setIsRestockingLocked] = useState(false);
  const [addToListPrompt, setAddToListPrompt] = useState<{ visible: boolean; productId: string; productName: string }>({ visible: false, productId: '', productName: '' });

  useEffect(() => {
    const loadStores = async () => {
      try {
        const stores = await storeService.getAllStores();
        setExistingStores(stores);
      } catch (err) {
        console.error('Failed to load stores:', err);
      }
    };
    loadStores();
  }, []);

  useEffect(() => {
    if (editProductId) {
      const loadProduct = async () => {
        try {
          const product = await productService.getProductById(editProductId);
          if (product) {
            setProductName(product.name);
            setSelectedStatus(product.stock_status.toUpperCase() as StockStatus);
            if (product.store_id) {
              const store = await storeService.getStoreById(product.store_id);
              if (store) {
                setStoreNameInput(store.name);
              }
            }

            const isOnList = await shoppingListService.isProductOnActiveShoppingList(editProductId);
            setIsRestockingLocked(isOnList && product.stock_status !== 'high');
          }
        } catch (error) {
          console.error('Failed to load product:', error);
        }
      };
      loadProduct();
    }
  }, [editProductId]);

  const handleSelectStatus = (status: StockStatus) => {
    if (isRestockingLocked && status === 'HIGH') {
      Alert.alert(
        'Naka-lock ang Paninda (Restocking)',
        'Kasalukuyang nasa Listahan ng Bibilhin ang panindang ito. Tapusin ang pagbili sa Listahan para maibalik sa Marami.'
      );
      return;
    }
    setSelectedStatus(status);
  };

  const handleSave = async () => {
    const trimmedName = productName.trim();
    if (!trimmedName) {
      Alert.alert('Kailangan ang Pangalan', 'Mangyaring ilagay ang pangalan ng paninda.');
      return;
    }

    if (isRestockingLocked && selectedStatus === 'HIGH') {
      Alert.alert(
        'Naka-lock ang Paninda',
        'Kasalukuyang nasa Listahan ng Bibilhin ang panindang ito para sa restocking. Hindi maaaring gawing Marami nang direkta.'
      );
      return;
    }

    try {
      let resolvedStoreId: string | null = null;
      const trimmedStoreName = storeNameInput.trim();
      if (trimmedStoreName) {
        const store = await storeService.getOrCreateStore(trimmedStoreName);
        resolvedStoreId = store.id;
      }

      let savedProductId = editProductId;

      if (editProductId) {
        const newStatus = selectedStatus.toLowerCase() as 'high' | 'low' | 'out';

        await productService.updateProduct(
          editProductId,
          trimmedName,
          categoryId,
          newStatus,
          resolvedStoreId
        );
      } else {
        const newProduct = await productService.createProduct(
          categoryId,
          trimmedName,
          selectedStatus.toLowerCase() as any,
          resolvedStoreId
        );
        savedProductId = newProduct.id;
      }

      // If status is LOW or OUT, show custom confirm modal
      if ((selectedStatus === 'LOW' || selectedStatus === 'OUT') && savedProductId) {
        setAddToListPrompt({ visible: true, productId: savedProductId, productName: trimmedName });
        return;
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi ma-save ang paninda.');
    }
  };

  const handleAddToListConfirm = async () => {
    const { productId } = addToListPrompt;
    setAddToListPrompt({ visible: false, productId: '', productName: '' });
    try {
      await shoppingListService.addProductToShoppingList(productId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Hindi naidagdag sa listahan.');
    } finally {
      navigation.goBack();
    }
  };

  const handleAddToListDismiss = () => {
    setAddToListPrompt({ visible: false, productId: '', productName: '' });
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* 1. Header Bar */}
      <HeaderBar onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Subheader Area */}
        <View style={styles.subheader}>
          <View style={styles.subheaderTitleContainer}>
            <Text style={styles.subheaderTitle}>{editProductId ? 'I-edit ang Paninda' : 'Magdagdag ng Paninda'}</Text>
            <Text style={styles.subheaderSubtitle}>
              {editProductId ? `Baguhin ang detalye ng paninda sa ${categoryName || 'Kategorya'}.` : `Magdagdag ng bagong paninda sa ${categoryName || 'Kategorya'}.`}
            </Text>
          </View>
        </View>

        {/* 3. Product Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.fieldLabel}>Pangalan ng Paninda</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ilagay ang pangalan ng paninda"
            placeholderTextColor={COLORS.textMuted}
            value={productName}
            onChangeText={setProductName}
            maxLength={40}
          />
        </View>

        {/* 4. Store Assignment Card (Physical Store / Tindahan kung saan binibili) */}
        <View style={styles.infoCard}>
          <View style={styles.storeHeaderRow}>
            <Text style={styles.fieldLabel}>Tindahan / Bilihan (Physical Store)</Text>
            <Text style={styles.optionalLabel}>Opsiyonal</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Hal. Ate Nena Candy Store, Divisoria..."
            placeholderTextColor={COLORS.textMuted}
            value={storeNameInput}
            onChangeText={setStoreNameInput}
            maxLength={50}
          />
          <Text style={styles.helperText}>
            Saan madalas binibili ang panindang ito? (Hal. Toy Store, School Supplies Store)
          </Text>

          {existingStores.length > 0 && (
            <View style={styles.chipsContainer}>
              <Text style={styles.chipsTitle}>Mga Naka-save na Tindahan:</Text>
              <View style={styles.chipsRow}>
                {existingStores.map((store) => {
                  const isSelected = storeNameInput.trim().toLowerCase() === store.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setStoreNameInput(store.name)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="storefront-outline"
                        size={12}
                        color={isSelected ? '#FFFFFF' : COLORS.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {store.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* 5. Stock Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.fieldLabel}>Katayuan ng Stock</Text>

          {isRestockingLocked && (
            <View style={styles.lockedNoticeBox}>
              <MaterialCommunityIcons name="lock-outline" size={16} color={COLORS.primary} />
              <Text style={styles.lockedNoticeText}>
                Naka-lock para sa restocking dahil nasa Listahan ng Bibilhin. Tapusin ang pagbili para maibalik sa Marami.
              </Text>
            </View>
          )}

          <View style={styles.statusOptionsList}>
            {STATUS_OPTIONS.map((option) => {
              const isSelected = option.status === selectedStatus;
              const isOptionLocked = isRestockingLocked && option.status === 'HIGH';

              return (
                <TouchableOpacity
                  key={option.status}
                  style={[
                    styles.statusOptionRow,
                    isSelected && !isOptionLocked ? styles.statusOptionRowSelected : styles.statusOptionRowUnselected,
                    isOptionLocked && styles.statusOptionRowLocked,
                  ]}
                  onPress={() => handleSelectStatus(option.status)}
                  activeOpacity={isOptionLocked ? 1 : 0.8}
                >
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusDot, { backgroundColor: isOptionLocked ? '#8C827A' : option.dotColor }]} />
                    <Text style={[styles.statusOptionText, isOptionLocked && { color: '#8C827A' }]}>
                      {option.label}
                    </Text>
                  </View>

                  {isOptionLocked ? (
                    <MaterialCommunityIcons
                      name="lock"
                      size={18}
                      color="#8C827A"
                      style={styles.checkIcon}
                    />
                  ) : isSelected ? (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={COLORS.primary}
                      style={styles.checkIcon}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Empty State / Info Section */}
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name="archive-outline"
            size={48}
            color="#D1CAC2"
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateText}>
            Nakatutulong ang pag-organisa ng paninda ayon sa kategorya at tindahan para mas madaling mamili
          </Text>
        </View>

        {/* 7. Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <MaterialCommunityIcons
              name="content-save"
              size={18}
              color="#FFFFFF"
              style={styles.saveIcon}
            />
            <Text style={styles.saveButtonText}>I-save ang Paninda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Kanselahin</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 8. Mock Bottom Navigation Bar */}
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

      {/* Idagdag sa Listahan? Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addToListPrompt.visible}
        onRequestClose={handleAddToListDismiss}
      >
        <View style={styles.confirmModalOverlay}>
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
    paddingBottom: SPACING.xl,
  },
  subheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  subheaderTitleContainer: {
    flex: 1,
  },
  subheaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subheaderSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  optionalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  chipsContainer: {
    marginTop: SPACING.sm,
  },
  chipsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCEAE3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ROUNDS.full,
    borderWidth: 1,
    borderColor: '#F0D5C9',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  lockedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FCEAE3',
    padding: SPACING.sm,
    borderRadius: ROUNDS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0D5C9',
  },
  lockedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primary,
    lineHeight: 15,
    fontWeight: '600',
  },
  statusOptionsList: {
    gap: SPACING.sm,
  },
  statusOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
  },
  statusOptionRowSelected: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusOptionRowUnselected: {
    backgroundColor: '#EFECE9',
    borderColor: 'transparent',
  },
  statusOptionRowLocked: {
    backgroundColor: '#EFECE9',
    borderColor: '#D1CAC2',
    opacity: 0.65,
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkIcon: {
    marginLeft: SPACING.sm,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },
  emptyStateIcon: {
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: SPACING.sm,
    marginBottom: 80,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  saveIcon: {
    marginRight: SPACING.xs,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: ROUNDS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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

  // ── Idagdag sa Listahan? Confirm Modal ──
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
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

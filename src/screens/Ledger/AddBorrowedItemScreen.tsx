import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import HeaderBar from '../../components/HeaderBar';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import BottomTabBar from '../../components/BottomTabBar';
import { borrowerService } from '../../services/borrowerService';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { Category, Product } from '../../types/db';

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'AddBorrowedItem'>;

type BorrowType = 'PRODUCT' | 'CASH';

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddBorrowedItemScreen({ route, navigation }: Props) {
  const { borrowerId, borrowerName } = route.params;

  const [borrowType, setBorrowType] = useState<BorrowType>('PRODUCT');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');

  // Dropdown dropdown states (simulation)
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAllCategories();
      setCategories(cats);
      if (cats.length > 0) {
        handleCategorySelect(cats[0]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [])
  );

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    setShowCatDropdown(false);

    try {
      const prods = await productService.getProductsByCategory(category.id);
      setProducts(prods);
      if (prods.length > 0) {
        setSelectedProduct(prods[0]);
        setUnitPrice('');
        setQuantity('1');
      } else {
        setSelectedProduct(null);
        setUnitPrice('');
        setQuantity('1');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleProductSelect = (prod: Product) => {
    setSelectedProduct(prod);
    setShowProductDropdown(false);
    setUnitPrice('');
    setQuantity('1');
  };

  const handleSave = async () => {
    let finalAmount = 0;
    let parsedQuantity = 1;

    if (borrowType === 'PRODUCT') {
      parsedQuantity = parseInt(quantity, 10);
      const parsedUnitPrice = parseFloat(unitPrice);

      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        Alert.alert('Error', 'Dami must be a positive whole number starting from 1.');
        return;
      }
      if (isNaN(parsedUnitPrice) || parsedUnitPrice <= 0) {
        Alert.alert('Error', 'Please enter a valid price greater than 0.');
        return;
      }

      finalAmount = parsedQuantity * parsedUnitPrice;
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount greater than 0.');
        return;
      }
      finalAmount = parsedAmount;
    }

    try {
      await borrowerService.createBorrowedItem(
        borrowerId,
        borrowType === 'PRODUCT' ? 'product' : 'cash',
        finalAmount,
        borrowType === 'PRODUCT' ? selectedProduct?.id : undefined,
        notes || undefined,
        undefined,
        parsedQuantity
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi ma-save ang utang.');
    }
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
        {/* Subheader */}
        <View style={styles.subheader}>
          <View style={styles.subheaderTextContainer}>
            <Text style={styles.subheaderTitle}>Magdagdag ng Hiniram</Text>
            <Text style={styles.subheaderSubtitle}>I-update ang talaan ng utang</Text>
          </View>
        </View>

        {/* 2. Borrower Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.summaryAvatarCircle}>
              <Ionicons name="person-outline" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.borrowerName}>{borrowerName}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>Bahagyang Bayad</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryRight}>
          </View>
        </View>

        {/* 3. Borrow Type Tab Switcher */}
        <View style={styles.typeSwitcher}>
          <TouchableOpacity
            style={[
              styles.typeTab,
              borrowType === 'PRODUCT' ? styles.typeTabActive : styles.typeTabInactive,
            ]}
            onPress={() => {
              setBorrowType('PRODUCT');
              setAmount('');
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={18}
              color={borrowType === 'PRODUCT' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.typeTabText,
                borrowType === 'PRODUCT' ? styles.typeTabTextActive : styles.typeTabTextInactive,
              ]}
            >
              Paninda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeTab,
              borrowType === 'CASH' ? styles.typeTabActive : styles.typeTabInactive,
            ]}
            onPress={() => {
              setBorrowType('CASH');
              setAmount('');
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="cash"
              size={18}
              color={borrowType === 'CASH' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.typeTabText,
                borrowType === 'CASH' ? styles.typeTabTextActive : styles.typeTabTextInactive,
              ]}
            >
              Cash
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Form Input Card */}
        <View style={styles.formCard}>
          {borrowType === 'PRODUCT' ? (
            <View>
              {/* Product Category Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Kategorya ng Paninda</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  activeOpacity={0.85}
                  onPress={() => {
                    setShowCatDropdown(!showCatDropdown);
                    setShowProductDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{selectedCategory ? selectedCategory.name : 'Pumili ng Kategorya'}</Text>
                  <Feather
                    name={showCatDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>

                {showCatDropdown && (
                  <View style={styles.dropdownMenu}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={styles.dropdownOption}
                        onPress={() => handleCategorySelect(cat)}
                      >
                        <Text style={styles.dropdownOptionText}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Product Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Paninda</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  activeOpacity={0.85}
                  onPress={() => {
                    setShowProductDropdown(!showProductDropdown);
                    setShowCatDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{selectedProduct ? selectedProduct.name : 'Pumili ng Paninda'}</Text>
                  <Feather
                    name={showProductDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>

                {showProductDropdown && (
                  <View style={styles.dropdownMenu}>
                    {products.map((prod) => (
                      <TouchableOpacity
                        key={prod.id}
                        style={styles.dropdownOption}
                        onPress={() => handleProductSelect(prod)}
                      >
                        <Text style={styles.dropdownOptionText}>
                          {prod.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {borrowType === 'PRODUCT' ? (
            <>
              {/* Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Dami</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setQuantity(cleaned);
                  }}
                />
              </View>

              {/* Unit Price */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Presyo bawat isa</Text>
                <View style={styles.currencyInputRow}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={styles.currencyInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#CCCCCC"
                    value={unitPrice}
                    onChangeText={(text) => {
                      const formatted = text.replace(/[^0-9.]/g, '');
                      setUnitPrice(formatted);
                    }}
                  />
                </View>
                <View style={styles.divider} />
              </View>

              {/* Calculated Total */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Kabuuan</Text>
                <Text style={styles.totalValueText}>
                  ₱{((parseInt(quantity, 10) || 0) * (parseFloat(unitPrice) || 0)).toFixed(2)}
                </Text>
              </View>
            </>
          ) : (
            /* Amount to Borrow Field */
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Halaga ng Utang</Text>
              <View style={styles.currencyInputRow}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={styles.currencyInput}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#CCCCCC"
                  value={amount}
                  onChangeText={(text) => {
                    const formatted = text.replace(/[^0-9.]/g, '');
                    setAmount(formatted);
                  }}
                />
              </View>
              <View style={styles.divider} />
            </View>
          )}

          {/* Notes (Optional) Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Mga Tala (Opsyonal)</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              maxLength={150}
              placeholder="Halimbawa: Hiniram noong hapon"
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* 5. Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <MaterialCommunityIcons
              name="check-decagram-outline"
              size={18}
              color="#FFFFFF"
              style={styles.saveIcon}
            />
            <Text style={styles.saveButtonText}>Idagdag sa Utang ng Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Kanselahin</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 6. Mock Bottom Navigation Bar */}
      <BottomTabBar activeTab="Ledger" navigation={navigation} />
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  subheaderTextContainer: {
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

  // ── Borrower Summary Card ──
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: ROUNDS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Borrow Type Switcher ──
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#EFECE9',
    borderRadius: ROUNDS.md,
    padding: 4,
    marginBottom: SPACING.lg,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: 10,
    borderRadius: ROUNDS.sm,
  },
  typeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  typeTabInactive: {
    backgroundColor: 'transparent',
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  typeTabTextActive: {
    color: COLORS.primary,
  },
  typeTabTextInactive: {
    color: COLORS.textMuted,
  },

  // ── Form Card & Inputs ──
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },

  // Simulated Select dropdown elements
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownMenu: {
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: ROUNDS.md,
    borderBottomRightRadius: ROUNDS.md,
    marginTop: -4,
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE9',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Currency Numeric Inputs
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  currencyInput: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    padding: 0,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.border,
    marginTop: SPACING.xs,
  },

  // Notes Field
  notesInput: {
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 13,
    color: COLORS.text,
    height: 70,
    textAlignVertical: 'top',
  },

  // ── Action Buttons ──
  actionsContainer: {
    gap: SPACING.sm,
    marginBottom: 80, // buffer for tab bar
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
  textInput: {
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 13,
    color: COLORS.text,
  },
  totalValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 4,
  },

});

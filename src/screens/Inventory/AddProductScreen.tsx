import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
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
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Alert } from 'react-native';
import { productService } from '../../services';

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
  const { categoryId, categoryName } = route.params;

  const [productName, setProductName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StockStatus>('HIGH');

  const handleSave = async () => {
    try {
      await productService.createProduct(
        categoryId,
        productName,
        selectedStatus.toLowerCase() as any
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi ma-save ang paninda.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Subheader Area */}
        <View style={styles.subheader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.subheaderTitleContainer}>
            <Text style={styles.subheaderTitle}>Magdagdag ng Paninda</Text>
            <Text style={styles.subheaderSubtitle}>
              Magdagdag ng bagong paninda sa {categoryName || 'Kategorya'}.
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
          <Text style={styles.helperText}>Halimbawa: Ballpen</Text>
        </View>

        {/* 4. Stock Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.fieldLabel}>Katayuan ng Stock</Text>

          <View style={styles.statusOptionsList}>
            {STATUS_OPTIONS.map((option) => {
              const isSelected = option.status === selectedStatus;
              return (
                <TouchableOpacity
                  key={option.status}
                  style={[
                    styles.statusOptionRow,
                    isSelected ? styles.statusOptionRowSelected : styles.statusOptionRowUnselected,
                  ]}
                  onPress={() => setSelectedStatus(option.status)}
                  activeOpacity={0.8}
                >
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusDot, { backgroundColor: option.dotColor }]} />
                    <Text style={styles.statusOptionText}>{option.label}</Text>
                  </View>

                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={COLORS.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Empty State / Sync Section */}
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name="archive-outline"
            size={48}
            color="#D1CAC2"
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateText}>
            Nakatutulong ang pagdagdag ng paninda para laging updated ang shop
          </Text>
        </View>

        {/* 6. Action Buttons */}
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

  // ── Scroll Content ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
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

  // ── Card Containers ──
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

  // ── Input Fields ──
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
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

  // ── Status Select Options ──
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

  // ── Empty State ──
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

  // ── Bottom Nav ──
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
});

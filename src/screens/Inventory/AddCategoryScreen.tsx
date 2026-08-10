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
import { categoryService } from '../../services';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCategory'>;

interface IconOption {
  id: string;
  name: string; // Display label (e.g. "Drinks", "Snacks")
  iconName: string; // MaterialCommunityIcons name
}

const ICON_OPTIONS: IconOption[] = [
  { id: '1', name: 'Drinks', iconName: 'cup-water' },
  { id: '2', name: 'Chips', iconName: 'food' },
  { id: '3', name: 'Biscuits', iconName: 'cookie' },
  { id: '4', name: 'Toys', iconName: 'robot-happy-outline' },
  { id: '5', name: 'School Supplies', iconName: 'format-list-bulleted' },
  { id: '6', name: 'Cupcakes', iconName: 'cake-variant-outline' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddCategoryScreen({ navigation }: Props) {
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconOption>(ICON_OPTIONS[0]);

  const handleSave = async () => {
    try {
      await categoryService.createCategory(categoryName);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi ma-save ang kategorya.');
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
        {/* 2. Category Name Input Section */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Pangalan ng Kategorya</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Hal. Malamig na Inumin, Chichirya..."
            placeholderTextColor={COLORS.textMuted}
            value={categoryName}
            onChangeText={setCategoryName}
            maxLength={30}
          />
        </View>

        {/* 3. Category Icon Selection Card */}
        <View style={styles.iconSelectionCard}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Icon ng Kategorya</Text>
            <Text style={styles.activeIconLabel}>{selectedIcon.name}</Text>
          </View>

          {/* Large Preview Display */}
          <View style={styles.previewIconWrapper}>
            <View style={styles.largeIconCircle}>
              <MaterialCommunityIcons
                name={selectedIcon.iconName as any}
                size={38}
                color={COLORS.primary}
                style={styles.iconCentering}
              />
            </View>
          </View>

          {/* Icon Selector Grid */}
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((option) => {
              const isSelected = option.id === selectedIcon.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.gridTile,
                    isSelected ? styles.gridTileSelected : styles.gridTileUnselected,
                  ]}
                  onPress={() => setSelectedIcon(option)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={option.iconName as any}
                    size={22}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                    style={styles.iconCentering}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Live Preview Section */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Live Preview</Text>
          <View style={styles.livePreviewCard}>
            <View style={styles.livePreviewLeft}>
              <View style={styles.livePreviewIconCircle}>
                <MaterialCommunityIcons
                  name={selectedIcon.iconName as any}
                  size={22}
                  color={COLORS.primary}
                  style={styles.iconCentering}
                />
              </View>
              <View style={styles.livePreviewTextContainer}>
                <Text style={styles.livePreviewName}>
                  {categoryName.trim() || (selectedIcon.name === 'Drinks' ? 'Cold Drinks' : selectedIcon.name)}
                </Text>
                <Text style={styles.livePreviewSubtitle}>0 paninda sa stock</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
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
              name="check"
              size={18}
              color="#FFFFFF"
              style={styles.saveIcon}
            />
            <Text style={styles.saveButtonText}>I-save ang Kategorya</Text>
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

      {/* 6. Mock Bottom Navigation Bar */}
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

  // ── Input Section ──
  section: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: COLORS.text,
  },

  // ── Icon Selection Card ──
  iconSelectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  activeIconLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  previewIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  largeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCEAE3', // soft peach circular badge background
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  gridTile: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: ROUNDS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTileSelected: {
    backgroundColor: '#FCEAE3', // soft peach background active
  },
  gridTileUnselected: {
    backgroundColor: '#F3EDE4', // soft gray-cream background inactive
  },

  // ── Live Preview Card ──
  livePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  livePreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  livePreviewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCEAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePreviewTextContainer: {
    justifyContent: 'center',
  },
  livePreviewName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  livePreviewSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // ── Action Buttons ──
  actionsContainer: {
    marginTop: SPACING.md,
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
  iconCentering: {
    textAlign: 'center',
    textAlignVertical: 'center',
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

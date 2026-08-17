import React, { useState, useEffect } from 'react';
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

export default function AddCategoryScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom;
  const barHeight = 68 + bottomPadding;
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconOption>(ICON_OPTIONS[0]);
  const editCategoryId = route.params?.editCategoryId;

  useEffect(() => {
    if (editCategoryId) {
      const loadCategory = async () => {
        try {
          const category = await categoryService.getCategoryById(editCategoryId);
          if (category) {
            setCategoryName(category.name);
          }
        } catch (error) {
          console.error('Failed to load category:', error);
        }
      };
      loadCategory();
    }
  }, [editCategoryId]);

  useEffect(() => {
    const normalized = categoryName.toLowerCase();
    let matchedIcon = ICON_OPTIONS[0];
    if (normalized.includes('school') || normalized.includes('papel') || normalized.includes('sulat')) {
      matchedIcon = ICON_OPTIONS.find(o => o.iconName === 'pencil') || ICON_OPTIONS[0];
    } else if (normalized.includes('chip') || normalized.includes('chichirya') || normalized.includes('snack')) {
      matchedIcon = ICON_OPTIONS.find(o => o.iconName === 'food') || ICON_OPTIONS[0];
    } else if (normalized.includes('biskwit') || normalized.includes('biscuits') || normalized.includes('tinapay')) {
      matchedIcon = ICON_OPTIONS.find(o => o.iconName === 'cookie') || ICON_OPTIONS[0];
    } else if (normalized.includes('laruan') || normalized.includes('toy')) {
      matchedIcon = ICON_OPTIONS.find(o => o.iconName === 'robot-happy-outline') || ICON_OPTIONS[0];
    } else if (normalized.includes('cupcake') || normalized.includes('cake')) {
      matchedIcon = ICON_OPTIONS.find(o => o.iconName === 'cake-variant-outline') || ICON_OPTIONS[0];
    }
    setSelectedIcon(matchedIcon);
  }, [categoryName]);

  const handleSave = async () => {
    try {
      if (editCategoryId) {
        await categoryService.updateCategory(editCategoryId, categoryName);
      } else {
        await categoryService.createCategory(categoryName);
      }
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
      <HeaderBar onBack={() => navigation.goBack()} />

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
              />
            </View>
          </View>

          {/* Icon Selector Grid */}
          {!editCategoryId && (
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
                    <View style={styles.iconWrapper}>
                      <MaterialCommunityIcons
                        name={option.iconName as any}
                        size={22}
                        color={isSelected ? COLORS.primary : COLORS.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  iconWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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

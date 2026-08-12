import React from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import BottomTabBar, { useBottomBarHeight } from '../../components/BottomTabBar';
import HeaderBar from '../../components/HeaderBar';
import { categoryService, productService } from '../../services';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Inventory'>;

interface Category {
  id: string;
  name: string;
  count: number;
  iconName: string;
  iconFamily: 'MaterialCommunityIcons' | 'FontAwesome5' | 'Ionicons';
  iconBgColor: string;
  lowCount?: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CategoryRowProps {
  item: Category;
  isEditing: boolean;
  onPress: (item: Category) => void;
  onDelete: (item: Category) => void;
}

function CategoryRow({ item, isEditing, onPress, onDelete }: CategoryRowProps) {
  return (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.75}
      onPress={() => isEditing ? onDelete(item) : onPress(item)}
    >
      {/* Icon circle */}
      <View style={[styles.categoryIconCircle, { backgroundColor: item.iconBgColor }]}>
        <MaterialCommunityIcons
          name={item.iconName as any}
          size={22}
          color={COLORS.primary}
        />
      </View>

      {/* Name + product count */}
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCount}>{item.count} paninda</Text>
      </View>

      {/* Low stock badge + action icon */}
      <View style={styles.categoryRight}>
        {item.lowCount !== undefined && !isEditing && (
          <View style={styles.lowBadge}>
            <Text style={styles.lowBadgeText}>{item.lowCount} Kaunti</Text>
          </View>
        )}
        {isEditing ? (
          <View style={styles.deleteIconCircle}>
            <Feather name="trash-2" size={18} color="#D32F2F" />
          </View>
        ) : (
          <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InventoryScreen({ navigation }: Props) {
  const bottomBarHeight = useBottomBarHeight();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [totalItems, setTotalItems] = React.useState<number>(0);
  const [lowStockCount, setLowStockCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [isEditing, setIsEditing] = React.useState<boolean>(false);

  const loadInventoryData = async () => {
    try {
      const cats = await categoryService.getAllCategories();
      const prods = await productService.getAllProducts();

      const total = prods.length;
      const lowTotal = prods.filter(p => p.stock_status === 'low' || p.stock_status === 'out').length;

      setTotalItems(total);
      setLowStockCount(lowTotal);

      const mappedCategories = cats.map(cat => {
        const catProds = prods.filter(p => p.category_id === cat.id);
        const lowProdsCount = catProds.filter(p => p.stock_status === 'low' || p.stock_status === 'out').length;

        let iconName = 'format-list-bulleted';
        let iconBgColor = '#F2EBE8';

        const normalized = cat.name.toLowerCase();
        if (normalized.includes('school') || normalized.includes('papel') || normalized.includes('sulat')) {
          iconName = 'pencil';
          iconBgColor = '#E8F0FE';
        } else if (normalized.includes('chip') || normalized.includes('chichirya') || normalized.includes('snack')) {
          iconName = 'food';
          iconBgColor = '#F5D44C';
        } else if (normalized.includes('biskwit') || normalized.includes('biscuits') || normalized.includes('tinapay')) {
          iconName = 'cookie';
          iconBgColor = '#FDE8E8';
        } else if (normalized.includes('laruan') || normalized.includes('toy')) {
          iconName = 'robot-happy-outline';
          iconBgColor = '#E6F4EA';
        } else if (normalized.includes('cupcake') || normalized.includes('tinapay') || normalized.includes('cake')) {
          iconName = 'cake-variant-outline';
          iconBgColor = '#FCE8E6';
        }

        return {
          id: cat.id,
          name: cat.name,
          count: catProds.length,
          iconName,
          iconFamily: 'MaterialCommunityIcons' as const,
          iconBgColor,
          lowCount: lowProdsCount > 0 ? lowProdsCount : undefined
        };
      });

      setCategories(mappedCategories);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      loadInventoryData().then(() => {
        if (!isMounted) return;
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleCategoryPress = (item: Category) => {
    navigation.navigate('CategoryProducts', { categoryId: item.id, categoryName: item.name });
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleAddCategory = () => {
    navigation.navigate('AddCategory');
  };

  const handleEditCategories = () => {
    setIsEditing(!isEditing);
  };

  const handleDeleteCategory = (item: Category) => {
    if (item.count > 0) {
      Alert.alert('Hindi Maaari', 'Hindi pwedeng burahin ang kategorya dahil may laman pa itong paninda.');
      return;
    }
    Alert.alert(
      'Kumpirmahin',
      `Sigurado ka bang gusto mong burahin ang kategoryang "${item.name}"?`,
      [
        { text: 'Kanselahin', style: 'cancel' },
        { 
          text: 'Burahin', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await categoryService.deleteCategory(item.id);
              await loadInventoryData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'May nangyaring mali.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      <HeaderBar onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Search Bar ── */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Maghanap ng kategorya..."
            placeholderTextColor={COLORS.textMuted}
            onChangeText={handleSearchChange}
            value={searchQuery}
            returnKeyType="search"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <View style={styles.statRow}>
              {/* Total Items */}
              <View style={styles.statCard}>
                <View style={styles.statIconRow}>
                  <MaterialCommunityIcons
                    name="archive-outline"
                    size={16}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.statLabel}>Kabuuang Paninda</Text>
                </View>
                <Text style={styles.statValue}>{totalItems}</Text>
              </View>

              {/* Low Stock */}
              <View style={[styles.statCard, styles.statCardLow]}>
                <View style={styles.statIconRow}>
                  <MaterialCommunityIcons name="alert-outline" size={14} color={COLORS.primary} />
                  <Text style={[styles.statLabel, styles.statLabelLow]}>Kaunti ang Stock</Text>
                </View>
                <Text style={[styles.statValue, styles.statValueLow]}>{lowStockCount}</Text>
              </View>
            </View>

            {/* ── Categories ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mga Kategorya</Text>
              <TouchableOpacity onPress={handleEditCategories}>
                <Text style={[styles.editButton, isEditing && { color: COLORS.primary }]}>
                  {isEditing ? 'Tapos na' : 'Ayusin'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category list */}
            <View style={styles.categoryList}>
              {filteredCategories.length === 0 ? (
                <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginVertical: 20 }}>
                  Walang nahanap na kategorya.
                </Text>
              ) : (
                filteredCategories.map((item) => (
                  <CategoryRow 
                    key={item.id} 
                    item={item} 
                    isEditing={isEditing} 
                    onPress={handleCategoryPress} 
                    onDelete={handleDeleteCategory}
                  />
                ))
              )}
            </View>

            {/* ── Promo / CTA Card ── */}
            <View style={styles.promoCard}>
              {/* Geometric shapes icon group */}
              <View style={styles.promoIconGroup}>
                {/* Triangle */}
                <View style={styles.triangleWrapper}>
                  <View style={styles.triangle} />
                </View>
                <View style={styles.promoShapeRow}>
                  {/* Square */}
                  <View style={styles.promoSquare} />
                  {/* Circle */}
                  <View style={styles.promoCircle} />
                </View>
              </View>

              <Text style={styles.promoTitle}>Kailangan ng bagong seksyon sa tindahan mo?</Text>
              <Text style={styles.promoSubtitle}>
                Makakatulong ang mga kategorya para makita{'\n'}kung anong paninda ang mabilis mabenta!
              </Text>
            </View>
          </>
        )}

        {/* Bottom padding so FAB doesn't overlap last content */}
        <View style={{ height: bottomBarHeight + 36 }} />
      </ScrollView>

      {/* ── Floating Action Button ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottomBarHeight + 16 }]}
        activeOpacity={0.85}
        onPress={handleAddCategory}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Magdagdag</Text>
      </TouchableOpacity>

      <BottomTabBar activeTab="Inventory" navigation={navigation} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },



  // ── Scroll ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },

  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0, // Remove default Android padding
  },

  // ── Stat Cards ──
  statRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.gridCard,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  statCardLow: {
    backgroundColor: '#FAE8E4', // Peach/blush background for low-stock card
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statLabelLow: {
    color: COLORS.primary,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statValueLow: {
    color: COLORS.primary,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ── Category Cards ──
  categoryList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lowBadge: {
    backgroundColor: '#FAE8E4',
    borderRadius: ROUNDS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  lowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Promo CTA Card ──
  promoCard: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: ROUNDS.md,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  promoIconGroup: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  triangleWrapper: {
    marginBottom: 4,
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.border,
  },
  promoShapeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  promoSquare: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 3,
  },
  promoCircle: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  promoSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: 84, // Sits just above the tab bar
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
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },

});

import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
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
import BottomTabBar from '../../components/BottomTabBar';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardService } from '../../services';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const [todaySales, setTodaySales] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const loadData = async () => {
        try {
          const sales = await dashboardService.getDashboardTodaySales();
          if (isMounted) {
            setTodaySales(sales);
            setLoading(false);
          }
        } catch (error) {
          console.error(error);
          if (isMounted) {
            setLoading(false);
          }
        }
      };
      loadData();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.logoContainer}>
          <FontAwesome5 name="shopping-basket" size={18} color={COLORS.primary} />
          <Text style={styles.logoText}>JoSync</Text>
        </View>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 2. Welcome Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Kumusta, Nanay Jo!</Text>
          <Text style={styles.greetingSubtitle}>
            Ito ang update sa tindahan mo ngayon.
          </Text>
        </View>

        {/* 3. Inventory Banner */}
        <TouchableOpacity
          style={styles.inventoryBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Inventory')}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIconCircle}>
              <MaterialCommunityIcons name="archive-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Paninda</Text>
              <Text style={styles.bannerSubtitle}>I-check ang mga stock</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 4. Action Buttons 2x2 Grid */}
        <View style={styles.gridContainer}>

          {/* Row 1 */}
          <View style={styles.gridRow}>
            {/* Daily Sales */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('DailySales')}
            >
              <View style={styles.gridIconCircle}>
                <MaterialCommunityIcons name="cash-register" size={26} color="#4A3E39" />
              </View>
              <Text style={styles.gridCardText}>Benta Ngayon</Text>
            </TouchableOpacity>

            {/* Ledger */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Ledger')}
            >
              <View style={styles.gridIconCircle}>
                <Feather name="book-open" size={24} color="#4A3E39" />
              </View>
              <Text style={styles.gridCardText}>Talaan</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            {/* Shopping */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ShoppingList')}
            >
              <View style={styles.gridIconCircle}>
                <FontAwesome5 name="shopping-basket" size={20} color="#4A3E39" />
              </View>
              <Text style={styles.gridCardText}>Listahan ng Bibilhin</Text>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate('Reports');
              }}
            >
              <View style={styles.gridIconCircle}>
                <Ionicons name="bar-chart-outline" size={24} color="#4A3E39" />
              </View>
              <Text style={styles.gridCardText}>Ulat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Store Overview Card */}
        <View style={styles.overviewCard}>
          {/* Subtle Watermark Shopping Bag Graphic absolute-positioned in the bottom right corner */}
          <View style={styles.watermarkContainer}>
            <FontAwesome5 name="shopping-bag" size={96} color="#4A3E39" style={styles.watermark} />
          </View>

          <View style={styles.overviewContent}>
            <Text style={styles.overviewSectionTitle}>ULAT NG TINDAHAN</Text>
            <Text style={styles.overviewLabel}>Benta Ngayon</Text>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.overviewValue}>₱ {todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            )}
          </View>

          <View style={styles.trendContainer}>
            <Feather name="trending-up" size={16} color={COLORS.success} />
            <Text style={styles.trendText}>Aktibo</Text>
          </View>
        </View>

      </ScrollView>

      <BottomTabBar activeTab="Home" navigation={navigation} />
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
    paddingBottom: 90, // ensure no overlap with floating mock tabbar
  },

  // Header styles
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  logoText: {
    fontSize: 18,
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

  // Greeting styles
  greetingSection: {
    marginVertical: SPACING.md,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  // Inventory Banner styles
  inventoryBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Grid styles
  gridContainer: {
    marginVertical: SPACING.sm,
    gap: SPACING.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridCard: {
    flex: 1,
    height: 120,
    backgroundColor: COLORS.gridCard,
    borderRadius: ROUNDS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  gridIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.gridIconCircle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  gridCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Overview Card styles
  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    opacity: 0.04, // Very faint bag watermark
  },
  watermark: {
    transform: [{ rotate: '-10deg' }],
  },
  overviewContent: {
    flex: 1,
  },
  overviewSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  overviewLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(21, 128, 61, 0.08)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: ROUNDS.full,
    marginBottom: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.success,
  },

});

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import HeaderBar from '../../components/HeaderBar';
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import BottomTabBar from '../../components/BottomTabBar';
import { useFocusEffect } from '@react-navigation/native';
import { reportService, InventoryReport, BorrowerReport, SalesReport } from '../../services/reportService';

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReportsScreen({ navigation }: any) {
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [borrowers, setBorrowers] = useState<BorrowerReport | null>(null);
  const [todaySales, setTodaySales] = useState<SalesReport | null>(null);
  const [weekSales, setWeekSales] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const today = new Date();
      // Adjust timezone offset issues by manually building YYYY-MM-DD
      const pad = (n: number) => n.toString().padStart(2, '0');
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

      const day = today.getDay();
      const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date().setDate(diffToMonday));
      const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
      
      const startWeek = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      const endWeek = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

      const [inv, borr, tSales, wSales] = await Promise.all([
        reportService.getInventoryReport(),
        reportService.getBorrowerReport(startWeek, endWeek),
        reportService.getSalesReport(todayStr, todayStr),
        reportService.getSalesReport(startWeek, endWeek),
      ]);

      setInventory(inv);
      setBorrowers(borr);
      setTodaySales(tSales);
      setWeekSales(wSales);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadReports();
    }, [])
  );

  const handleOpenShoppingList = () => {
    navigation.navigate('ShoppingList');
  };

  const handleViewLedger = () => {
    navigation.navigate('Ledger');
  };

  const handleViewHistory = () => {
    navigation.navigate('Ledger'); // Navigation to history ledger list
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
      >
        {/* Subheader Title */}
        <View style={styles.subheader}>
          <View style={styles.subheaderTextContainer}>
            <Text style={styles.subheaderTitle}>Ulat</Text>
            <Text style={styles.subheaderSubtitle}>Tingnan ang buod ng takbo ng iyong tindahan.</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 2. Store Summary Card (This Week) */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <View style={styles.summaryTitleRow}>
                  <Feather name="calendar" size={18} color={COLORS.primary} />
                  <Text style={styles.summaryCardTitle}>Ngayong Linggo</Text>
                </View>
                <Text style={styles.lastUpdatedText}>
                  Ngayong Araw • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>

              <View style={styles.bulletPointsContainer}>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletCheckCircle}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.bulletText}>
                    {(inventory?.lowStockCount || 0) + (inventory?.outOfStockCount || 0)} paninda ang kailangang i-stock
                  </Text>
                </View>

                <View style={styles.bulletRow}>
                  <View style={styles.bulletCheckCircle}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.bulletText}>{borrowers?.borrowersPaid || 0} nangutang ang bayad na</Text>
                </View>

                <View style={styles.bulletRow}>
                  <View style={styles.bulletCheckCircle}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.weeklySalesLabel}>KABUUANG BENTA NGAYONG LINGGO</Text>
                    <Text style={styles.weeklySalesValue}>₱{(weekSales?.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.helperBox}>
                 <Text style={styles.helperText}>
                  Ang buod ng iyong negosyo ay base sa huling naitalang benta, imbentaryo, at utang.
                 </Text>
              </View>
            </View>

            {/* 3. Today's Sales Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                   <Text style={styles.cardLabel}>BENTA NGAYON</Text>
                   <Text style={styles.cardSalesValue}>₱{(todaySales?.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                </View>
                <View style={[styles.cardIconCircle, { backgroundColor: '#FDF0DC' }]}>
                  <MaterialCommunityIcons name="cash" size={20} color="#C87619" />
                </View>
              </View>
            </View>

            {/* 4. Weekly Sales Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                   <Text style={styles.cardLabel}>BENTA NGAYONG LINGGO</Text>
                   <Text style={styles.cardSalesValue}>₱{(weekSales?.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                </View>
                <View style={[styles.cardIconCircle, { backgroundColor: '#E2F7E6' }]}>
                  <MaterialCommunityIcons name="chart-bar" size={20} color="#2D8A4E" />
                </View>
              </View>
            </View>

            {/* 5. Inventory Health Card */}
            <View style={styles.card}>
              <Text style={styles.healthCardTitle}>Kalusugan ng Imbentaryo</Text>
              
              <View style={styles.healthItemRow}>
                <View style={styles.healthLabelGroup}>
                  <View style={[styles.healthDot, { backgroundColor: '#2D8A4E' }]} />
                  <Text style={styles.healthLabel}>Marami</Text>
                </View>
                <Text style={styles.healthValue}>{inventory?.highStockCount || 0} Paninda</Text>
              </View>

              <View style={styles.healthItemRow}>
                <View style={styles.healthLabelGroup}>
                  <View style={[styles.healthDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.healthLabel}>Kaunti</Text>
                </View>
                <Text style={styles.healthValue}>{inventory?.lowStockCount || 0} Paninda</Text>
              </View>

              <View style={styles.healthItemRow}>
                <View style={styles.healthLabelGroup}>
                  <View style={[styles.healthDot, { backgroundColor: '#D32F2F' }]} />
                  <Text style={styles.healthLabel}>Ubos</Text>
                </View>
                <Text style={styles.healthValue}>{inventory?.outOfStockCount || 0} Paninda</Text>
              </View>
            </View>

            {/* 6. Products To Restock Card */}
            <View style={[styles.card, styles.accentLeftBorder]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                   <Text style={styles.cardLabel}>MGA PANINDANG KULANG</Text>
                  <Text style={styles.cardBigCount}>
                    {(inventory?.lowStockCount || 0) + (inventory?.outOfStockCount || 0)} <Text style={styles.cardBigSub}>mga paninda</Text>
                  </Text>
                </View>
                <View style={[styles.cardIconCircle, { backgroundColor: '#FCEAE3' }]}>
                  <FontAwesome5 name="shopping-basket" size={16} color={COLORS.primary} />
                </View>
              </View>

              <Text style={styles.cardSubtitle}>
                 Ang mga panindang ito ay kaunti na lang o ubos na.
              </Text>

              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.85}
                onPress={handleOpenShoppingList}
              >
                <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#FFFFFF" style={styles.btnIcon} />
                 <Text style={styles.primaryActionButtonText}>Buksan ang Listahan ng Bibilhin</Text>
              </TouchableOpacity>
            </View>

            {/* 7. Outstanding Borrowers Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                   <Text style={styles.cardLabel}>MGA MAY UTANG PA</Text>
                  <Text style={styles.cardBigCount}>
                    {borrowers?.borrowersWithBalance || 0} <Text style={styles.cardBigSub}>mga nangutang</Text>
                  </Text>
                </View>
                <View style={[styles.cardIconCircle, { backgroundColor: '#EFECE9' }]}>
                  <MaterialCommunityIcons name="account-multiple" size={20} color={COLORS.textMuted} />
                </View>
              </View>

              {/* Highlight Section */}
              <View style={styles.highlightRow}>
                 <Text style={styles.highlightLabel}>Kabuuang Utang:</Text>
                <Text style={styles.highlightValue}>₱{(borrowers?.totalOwedAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
              </View>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                activeOpacity={0.85}
                onPress={handleViewLedger}
              >
                 <Text style={styles.secondaryActionButtonText}>Tingnan ang Talaan</Text>
              </TouchableOpacity>
            </View>

            {/* 8. Paid Accounts Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                   <Text style={styles.cardLabel}>MGA BAYAD NA</Text>
                  <Text style={styles.cardBigCount}>
                    {borrowers?.borrowersPaid || 0} <Text style={styles.cardBigSub}>ngayong linggo</Text>
                  </Text>
                </View>
                <View style={[styles.cardIconCircle, { backgroundColor: '#FAF5EE' }]}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color={COLORS.primary} />
                </View>
              </View>

              <Text style={styles.cardSubtitle}>
                 Mga customer na bayad na at walang natitirang utang.
              </Text>
            </View>

            {/* 9. Weekly Performance Card */}
            <View style={styles.card}>
               <Text style={styles.healthCardTitle}>Takbo Ngayong Linggo</Text>
              
              <View style={styles.perfItemRow}>
                <Text style={styles.perfLabel}>Benta Ngayong Linggo</Text>
                <Text style={styles.perfValue}>₱{(weekSales?.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
              </View>

              <View style={styles.perfItemRow}>
                <Text style={styles.perfLabel}>Nasingil na Bayad</Text>
                <Text style={styles.perfValue}>₱{(borrowers?.totalPaymentsInRange || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
              </View>

              <View style={styles.perfItemRow}>
                <Text style={styles.perfLabel}>Mga Panindang Kulang</Text>
                <Text style={styles.perfValue}>{(inventory?.lowStockCount || 0) + (inventory?.outOfStockCount || 0)} Paninda</Text>
              </View>
            </View>
          </>
        )}

        {/* 10. Bottom Encouragement Message */}
        <View style={styles.encouragementContainer}>
          <Ionicons name="sparkles" size={28} color={COLORS.primary} style={styles.sparkleIcon} />
           <Text style={styles.encouragementText}>Ang galing! Maayos ang takbo ng iyong tindahan!</Text>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomTabBar activeTab="Reports" navigation={navigation} />
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

  // ── Weekly Summary accent card (This Week) ──
  summaryCard: {
    backgroundColor: '#FCEAE3', // warm secondary accent background
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#F9D5C8',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  summaryCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  bulletPointsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  bulletCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bulletText: {
    fontSize: 13,
    color: '#554A42',
    fontWeight: '600',
  },
  weeklySalesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  weeklySalesValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  helperBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: ROUNDS.sm,
    padding: SPACING.sm,
  },
  helperText: {
    fontSize: 11,
    color: '#70645B',
    lineHeight: 16,
  },

  // ── Standard Card Styles ──
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cardInfoCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardSalesValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FAF5EE',
    borderRadius: ROUNDS.sm,
    paddingVertical: 10,
    marginTop: SPACING.sm,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  // Inventory Health Card
  healthCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  healthItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  healthLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  healthValue: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Products to restock left border
  accentLeftBorder: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardBigCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardBigSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },

  // Primary action button
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: SPACING.xs,
  },
  btnIcon: {
    marginRight: 4,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Highlight Box inside outstanding borrowers card
  highlightRow: {
    backgroundColor: '#FAF5EE',
    borderRadius: ROUNDS.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  highlightLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Secondary action button
  secondaryActionButton: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: ROUNDS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryActionButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Weekly Performance card
  perfItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE9',
  },
  perfLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  perfValue: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  // Bottom encouragement message
  encouragementContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  sparkleIcon: {
    marginBottom: 4,
  },
  encouragementText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },

});

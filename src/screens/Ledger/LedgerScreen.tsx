import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import BottomTabBar from '../../components/BottomTabBar';
import { borrowerService, LedgerSummaryItem } from '../../services/borrowerService';
import { dashboardService, DashboardBorrowerSummary } from '../../services/dashboardService';

// ─── Types & Mock Data ───────────────────────────────────────────────────────

interface BorrowerUI extends LedgerSummaryItem {
  initials: string;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LedgerScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowers, setBorrowers] = useState<BorrowerUI[]>([]);
  const [summary, setSummary] = useState<DashboardBorrowerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledger, stats] = await Promise.all([
        borrowerService.getLedgerSummary(),
        dashboardService.getDashboardBorrowerSummary(),
      ]);

      const uiBorrowers: BorrowerUI[] = ledger.map((b) => {
        const initials =
          b.name
            .trim()
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase() || '?';
        return { ...b, initials };
      });

      setBorrowers(uiBorrowers);
      setSummary(stats);
    } catch (error) {
      console.error('Failed to load ledger data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredBorrowers = borrowers.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBorrower = () => {
    navigation.navigate('AddBorrower');
  };

  const handleBorrowerPress = (borrower: BorrowerUI) => {
    navigation.navigate('BorrowerDetails', { borrowerId: borrower.id, borrowerName: borrower.name });
  };

  const handleViewAllActivity = () => {
    navigation.navigate('AllBorrowers');
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
        {/* Subheader Title */}
        <View style={styles.subheader}>
          <View style={styles.subheaderLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.subheaderTitle}>Talaan</Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={handleViewAllActivity}>
            <MaterialCommunityIcons name="book-open-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Maghanap ng nangutang..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 3. Outstanding Balance Summary Card */}
        <View style={styles.summaryCard}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.summaryLabel}>KABUUANG UTANG</Text>
              <Text style={styles.summaryValue}>₱{(summary?.totalOwed || 0).toFixed(2)}</Text>

              {/* Stats Cards Row */}
              <View style={styles.statsRow}>
                {/* Active Card */}
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>May Utang</Text>
                  <Text style={styles.statValue}>{summary?.withBalanceCount || 0} Nangutang</Text>
                </View>

                {/* Paid Card */}
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Bayad na</Text>
                  <Text style={styles.statValue}>{summary?.paidCount || 0} Nangutang</Text>
                </View>
              </View>
            </>
          )}

          {/* Info descriptor pill */}
          <View style={styles.infoBadge}>
            <MaterialCommunityIcons name="information-outline" size={14} color="#FFFFFF" />
            <Text style={styles.infoBadgeText}>
              I-track ang mga utang at bayad ng mga customer.
            </Text>
          </View>
        </View>

        {/* 4. Borrowers Subheader */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mga Nangutang</Text>
          <TouchableOpacity onPress={handleViewAllActivity}>
            <Text style={styles.viewAllBtn}>Tingnan Lahat</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Borrower List */}
        <View style={styles.borrowerList}>
          {loading ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              {filteredBorrowers.map((borrower) => {
                let statusBg = '#FDF0DC';
                let statusText = '#C87619';
                let statusLabel = 'Hindi Pa Bayad';

                if (borrower.status === 'PAID') {
                  statusBg = '#E2F7E6';
                  statusText = '#2D8A4E';
                  statusLabel = 'Bayad na';
                }

                return (
                  <TouchableOpacity
                    key={borrower.id}
                    style={styles.borrowerCard}
                    activeOpacity={0.8}
                    onPress={() => handleBorrowerPress(borrower)}
                  >
                    <View style={styles.borrowerLeft}>
                      {/* Initials Avatar */}
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{borrower.initials}</Text>
                      </View>

                      <View style={styles.borrowerInfo}>
                        <Text style={styles.borrowerName}>{borrower.name}</Text>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor:
                                    borrower.status === 'PAID'
                                      ? '#2D8A4E'
                                      : '#C87619',
                                },
                              ]}
                            />
                            <Text style={[styles.statusBadgeText, { color: statusText }]}>
                              {statusLabel}
                            </Text>
                          </View>
                          {/* Removing hardcoded mock date for now since it's not in LedgerSummaryItem */}
                        </View>
                      </View>
                    </View>

                    {/* Right side balance & chevron */}
                    <View style={styles.borrowerRight}>
                      <Text
                        style={[
                          styles.balanceText,
                          borrower.status === 'HAS BALANCE' ? styles.balanceTextUnpaid : {},
                        ]}
                      >
                        ₱{borrower.currentBalance.toFixed(2)}
                      </Text>
                      <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}


              {filteredBorrowers.length === 0 && (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="notebook-outline" size={48} color="#D1CAC2" />
                  <Text style={styles.emptyText}>No borrowers found.</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Padding so FAB does not cover list */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 6. Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleAddBorrower}
      >
        <MaterialCommunityIcons name="account-plus-outline" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>ADD BORROWER</Text>
      </TouchableOpacity>

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
  },

  // ── Subheader ──
  subheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  subheaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  subheaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  historyBtn: {
    padding: SPACING.xs,
  },

  // ── Search Bar ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDE4',
    borderRadius: ROUNDS.md,
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
    padding: 0,
  },

  // ── Outstanding Balance Summary Card ──
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },

  // Stats Card Row inside summary card
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Info badge inside summary card
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: ROUNDS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  infoBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // ── Recent Activity Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // ── Borrower List ──
  borrowerList: {
    gap: SPACING.sm,
  },
  borrowerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  borrowerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCEAE3', // soft peach
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  borrowerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  borrowerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: ROUNDS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  transactionDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  borrowerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  balanceTextUnpaid: {
    color: '#D32F2F', // highlight unpaid balance in red
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: 84, // Sits just above tab bar
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

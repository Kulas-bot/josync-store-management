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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import BottomTabBar from '../../components/BottomTabBar';
import { borrowerService, LedgerSummaryItem } from '../../services/borrowerService';
import { dashboardService, DashboardBorrowerSummary } from '../../services/dashboardService';

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'AllBorrowers'>;

interface BorrowerUI extends LedgerSummaryItem {
  initials: string;
  uiStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  avatarBg: string;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AllBorrowersScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
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

      const colors = ['#D0E1FD', '#FDE4D0', '#E9D0FD', '#D0FDE4'];
      const uiBorrowers: BorrowerUI[] = ledger.map((b, index) => {
        const initials =
          b.name
            .trim()
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase() || '?';

        let uiStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'PAID';
        if (b.status === 'HAS BALANCE') {
          uiStatus = b.totalPayments > 0 ? 'PARTIAL' : 'UNPAID';
        }

        return {
          ...b,
          initials,
          uiStatus,
          avatarBg: colors[index % colors.length],
        };
      });

      setBorrowers(uiBorrowers);
      setSummary(stats);
    } catch (error) {
      console.error('Failed to load all borrowers data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredBorrowers = borrowers.filter((b) => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeFilter !== 'ALL' && b.uiStatus !== activeFilter) {
      return false;
    }
    return true;
  });

  const handleBorrowerClick = (borrower: BorrowerUI) => {
    navigation.navigate('BorrowerDetails', {
      borrowerId: borrower.id,
      borrowerName: borrower.name,
    });
  };

  const handleAddBorrower = () => {
    navigation.navigate('AddBorrower');
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
        {/* Subheader */}
        <View style={styles.subheader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.subheaderTextContainer}>
            <Text style={styles.subheaderTitle}>Lahat ng Nangutang</Text>
            <Text style={styles.subheaderSubtitle}>{(summary?.totalActive || 0)} na Account ng Customer</Text>
          </View>
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

        {/* 3. Summary Cards row */}
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: SPACING.md }} />
        ) : (
          <View style={styles.summaryRow}>
            {/* Card 1 */}
            <View style={[styles.summaryCard, { backgroundColor: '#FCEAE3' }]}>
              <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(141, 60, 36, 0.08)' }]}>
                <MaterialCommunityIcons name="account-multiple" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.summaryCardNumber}>{summary?.totalActive || 0}</Text>
              <Text style={styles.summaryCardTitle}>Nangutang</Text>
              <Text style={styles.summaryCardSub}>Lahat ng Customer</Text>
            </View>

            {/* Card 2 */}
            <View style={[styles.summaryCard, { backgroundColor: '#FFF5F2' }]}>
              <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(211, 47, 47, 0.08)' }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={16} color="#D32F2F" />
              </View>
              <Text style={[styles.summaryCardNumber, { color: '#D32F2F' }]}>{summary?.withBalanceCount || 0}</Text>
              <Text style={styles.summaryCardTitle}>May Utang</Text>
              <Text style={[styles.summaryCardSub, { color: '#D32F2F' }]}>Kailangang Magbayad</Text>
            </View>

            {/* Card 3 */}
            <View style={[styles.summaryCard, { backgroundColor: '#FAF5EE' }]}>
              <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(45, 138, 78, 0.08)' }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color="#2D8A4E" />
              </View>
              <Text style={[styles.summaryCardNumber, { color: '#2D8A4E' }]}>{summary?.paidCount || 0}</Text>
              <Text style={styles.summaryCardTitle}>Bayad na</Text>
              <Text style={styles.summaryCardSub}>Bayad na Lahat</Text>
            </View>
          </View>
        )}

        {/* 4. Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          <TouchableOpacity
            style={activeFilter === 'ALL' ? styles.chipActive : styles.chipInactive}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={activeFilter === 'ALL' ? styles.chipTextActive : styles.chipTextInactive}>Lahat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={activeFilter === 'UNPAID' ? styles.chipActive : styles.chipInactive}
            onPress={() => setActiveFilter('UNPAID')}
          >
            <Text style={activeFilter === 'UNPAID' ? styles.chipTextActive : styles.chipTextInactive}>Hindi Pa Bayad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={activeFilter === 'PARTIAL' ? styles.chipActive : styles.chipInactive}
            onPress={() => setActiveFilter('PARTIAL')}
          >
            <Text style={activeFilter === 'PARTIAL' ? styles.chipTextActive : styles.chipTextInactive}>Bahagyang Bayad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={activeFilter === 'PAID' ? styles.chipActive : styles.chipInactive}
            onPress={() => setActiveFilter('PAID')}
          >
            <Text style={activeFilter === 'PAID' ? styles.chipTextActive : styles.chipTextInactive}>Bayad na</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 5. Borrower List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Listahan ng Nangutang</Text>
          <View style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Ayusin ▼</Text>
          </View>
        </View>

        {/* 6. Borrower List Cards */}
        <View style={styles.borrowerList}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            filteredBorrowers.map((borrower) => {
              let statusBg = '#FDF0DC';
              let statusText = '#C87619';
              let statusLabel = 'Bahagyang Bayad';

              if (borrower.uiStatus === 'PAID') {
                statusBg = '#E2F7E6';
                statusText = '#2D8A4E';
                statusLabel = 'Bayad na';
              } else if (borrower.uiStatus === 'UNPAID') {
                statusBg = '#FCE4E4';
                statusText = '#D32F2F';
                statusLabel = 'Hindi Pa Bayad';
              }

              return (
                <TouchableOpacity
                  key={borrower.id}
                  style={styles.borrowerCard}
                  activeOpacity={0.8}
                  onPress={() => handleBorrowerClick(borrower)}
                >
                  <View style={styles.borrowerLeft}>
                    {/* Initials Avatar */}
                    <View style={[styles.avatarCircle, { backgroundColor: borrower.avatarBg }]}>
                      <Text style={styles.avatarText}>{borrower.initials}</Text>
                    </View>

                    <View style={styles.borrowerInfo}>
                      <Text style={styles.borrowerName}>{borrower.name}</Text>
                      {/* Status Badge */}
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusText }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right side balance & chevron */}
                  <View style={styles.borrowerRight}>
                    <Text
                      style={[
                        styles.balanceText,
                        borrower.uiStatus === 'UNPAID' || borrower.uiStatus === 'PARTIAL' ? styles.balanceTextUnpaid : {},
                      ]}
                    >
                      ₱{borrower.currentBalance.toFixed(2)}
                    </Text>
                    <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Spacer for bottom navigation and FAB */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* 7. Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleAddBorrower}
      >
        <MaterialCommunityIcons name="account-plus-outline" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Magdagdag ng Nangutang</Text>
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
    marginBottom: SPACING.md,
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

  // ── Search Bar ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDE4',
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: SPACING.lg,
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

  // ── Summary Cards row ──
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryCardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  summaryCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  summaryCardSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // ── Filter Chips ──
  chipsContainer: {
    marginBottom: SPACING.lg,
    flexGrow: 0,
  },
  chipsContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chipInactive: {
    backgroundColor: '#EFECE9',
    borderRadius: ROUNDS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipTextInactive: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Borrower List Header Row ──
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sortButton: {
    backgroundColor: '#EFECE9',
    borderRadius: ROUNDS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  borrowerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  statusBadge: {
    borderRadius: ROUNDS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
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

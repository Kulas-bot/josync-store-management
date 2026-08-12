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
  Modal,
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
import HeaderBar from '../../components/HeaderBar';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import BottomTabBar, { useBottomBarHeight } from '../../components/BottomTabBar';
import { borrowerService, LedgerSummaryItem } from '../../services/borrowerService';
import { dashboardService, DashboardBorrowerSummary } from '../../services/dashboardService';

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'AllBorrowers'>;

interface BorrowerUI extends LedgerSummaryItem {
  initials: string;
  uiStatus: 'NEW' | 'PAID' | 'PARTIAL' | 'UNPAID';
  avatarBg: string;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AllBorrowersScreen({ navigation }: Props) {
  const bottomBarHeight = useBottomBarHeight();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEW' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [currentSort, setCurrentSort] = useState<'NEWEST' | 'DEBT_DESC' | 'DEBT_ASC' | 'ALPHA_ASC' | 'ALPHA_DESC'>('NEWEST');
  const [sortModalVisible, setSortModalVisible] = useState(false);
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

        const uiStatus = b.status;

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

  // Apply sorting dynamically
  filteredBorrowers.sort((a, b) => {
    if (currentSort === 'NEWEST') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (currentSort === 'DEBT_DESC') {
      return b.currentBalance - a.currentBalance;
    }
    if (currentSort === 'DEBT_ASC') {
      return a.currentBalance - b.currentBalance;
    }
    if (currentSort === 'ALPHA_ASC') {
      return a.name.localeCompare(b.name);
    }
    if (currentSort === 'ALPHA_DESC') {
      return b.name.localeCompare(a.name);
    }
    return 0;
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
            style={activeFilter === 'NEW' ? styles.chipActive : styles.chipInactive}
            onPress={() => setActiveFilter('NEW')}
          >
            <Text style={activeFilter === 'NEW' ? styles.chipTextActive : styles.chipTextInactive}>Bagong Borrower</Text>
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
          <TouchableOpacity
            style={styles.sortButton}
            activeOpacity={0.8}
            onPress={() => setSortModalVisible(true)}
          >
            <Text style={styles.sortButtonText}>
              Ayusin {currentSort === 'NEWEST' ? '▼' : '✓'}
            </Text>
          </TouchableOpacity>
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

              if (borrower.uiStatus === 'NEW') {
                statusBg = '#EAEFFD';
                statusText = '#3F51B5';
                statusLabel = 'Bagong Borrower';
              } else if (borrower.uiStatus === 'PAID') {
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
        <View style={{ height: bottomBarHeight + 46 }} />
      </ScrollView>

      {/* 7. Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottomBarHeight + 16 }]}
        activeOpacity={0.85}
        onPress={handleAddBorrower}
      >
        <MaterialCommunityIcons name="account-plus-outline" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Magdagdag ng Nangutang</Text>
      </TouchableOpacity>

      <BottomTabBar activeTab="Ledger" navigation={navigation} />

      {/* Sorting Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ayusin ayon sa</Text>
            
            <TouchableOpacity
              style={styles.sortOptionRow}
              onPress={() => {
                setCurrentSort('NEWEST');
                setSortModalVisible(false);
              }}
            >
              <Text style={currentSort === 'NEWEST' ? styles.sortOptionTextActive : styles.sortOptionText}>
                Pinakabago
              </Text>
              {currentSort === 'NEWEST' && <Feather name="check" size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOptionRow}
              onPress={() => {
                setCurrentSort('DEBT_DESC');
                setSortModalVisible(false);
              }}
            >
              <Text style={currentSort === 'DEBT_DESC' ? styles.sortOptionTextActive : styles.sortOptionText}>
                Pinakamalaking Utang
              </Text>
              {currentSort === 'DEBT_DESC' && <Feather name="check" size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOptionRow}
              onPress={() => {
                setCurrentSort('DEBT_ASC');
                setSortModalVisible(false);
              }}
            >
              <Text style={currentSort === 'DEBT_ASC' ? styles.sortOptionTextActive : styles.sortOptionText}>
                Pinakamaliit na Utang
              </Text>
              {currentSort === 'DEBT_ASC' && <Feather name="check" size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOptionRow}
              onPress={() => {
                setCurrentSort('ALPHA_ASC');
                setSortModalVisible(false);
              }}
            >
              <Text style={currentSort === 'ALPHA_ASC' ? styles.sortOptionTextActive : styles.sortOptionText}>
                A–Z
              </Text>
              {currentSort === 'ALPHA_ASC' && <Feather name="check" size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOptionRow}
              onPress={() => {
                setCurrentSort('ALPHA_DESC');
                setSortModalVisible(false);
              }}
            >
              <Text style={currentSort === 'ALPHA_DESC' ? styles.sortOptionTextActive : styles.sortOptionText}>
                Z–A
              </Text>
              {currentSort === 'ALPHA_DESC' && <Feather name="check" size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSortModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Kanselahin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sortOptionTextActive: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: SPACING.sm,
  },
  modalCloseBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

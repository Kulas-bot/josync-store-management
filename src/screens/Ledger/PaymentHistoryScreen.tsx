import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
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
import HeaderBar from '../../components/HeaderBar';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { borrowerService, BorrowerSummary } from '../../services/borrowerService';
import { paymentService } from '../../services/paymentService';
import { Payment } from '../../types/db';

const FILIPINO_MONTHS = [
  { value: 0, label: 'Enero' },
  { value: 1, label: 'Pebrero' },
  { value: 2, label: 'Marso' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' },
  { value: 5, label: 'Hunyo' },
  { value: 6, label: 'Hulyo' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setyembre' },
  { value: 9, label: 'Oktubre' },
  { value: 10, label: 'Nobyembre' },
  { value: 11, label: 'Disyembre' },
];

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentHistory'>;

export default function PaymentHistoryScreen({ route, navigation }: Props) {
  const { borrowerId, borrowerName } = route.params;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<BorrowerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, pays] = await Promise.all([
        borrowerService.getBorrowerSummary(borrowerId),
        paymentService.getBorrowerPaymentHistory(borrowerId)
      ]);
      setSummary(sum);
      // Sort payments by date descending
      setPayments(pays.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [borrowerId])
  );

  const handleRecordAnotherPayment = () => {
    navigation.navigate('RecordPayment', { borrowerId, borrowerName });
  };

  const getAvailableYears = () => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    payments.forEach((p) => {
      const year = new Date(p.payment_date).getFullYear();
      if (!isNaN(year)) {
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  };

  const filteredPayments = payments.filter((p) => {
    const d = new Date(p.payment_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

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
        {/* Subheader */}
        <View style={styles.subheader}>
          <Text style={styles.subheaderTitle}>Kasaysayan ng Bayad</Text>
        </View>

        {/* 2. Account Summary Accent Card */}
        <View style={styles.summaryCard}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.cardTopLabel}>NANGUTANG</Text>
                  <Text style={styles.borrowerName}>{summary?.borrower.name || borrowerName}</Text>
                </View>

                {/* Status Badge */}
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.statusBadgeText}>
                    {summary?.currentBalance === 0 ? 'Bayad na' : 'May Utang'}
                  </Text>
                </View>
              </View>

              <View style={styles.remainingContainer}>
                <Text style={styles.cardTopLabel}>NATITIRANG BALANSE</Text>
                <Text style={styles.remainingBalanceValue}>₱{(summary?.currentBalance || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.statsDivider} />

              {/* Stats Columns Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Utang</Text>
                  <Text style={styles.statValue}>₱{(summary?.currentBalance || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Kabuuang Hiniram</Text>
                  <Text style={styles.statValue}>₱{(summary?.totalBorrowed || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Kabuuang Bayad</Text>
                  <Text style={styles.statValue}>₱{(summary?.totalPayments || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* Helper Message */}
              <View style={styles.helperMessage}>
                <Text style={styles.helperText}>
                  Suriin ang lahat ng naitalang bayad sa ibaba para sa beripikasyon.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Optional Filter Row */}
        <View style={styles.filterRow}>
          <Text style={styles.timelineTitle}>Talaan ng Bayad</Text>
          <View style={styles.filterPills}>
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setShowMonthModal(true)}
            >
              <Text style={styles.filterPillText}>
                {FILIPINO_MONTHS.find((m) => m.value === selectedMonth)?.label || 'Buwan'}
              </Text>
              <Feather name="chevron-down" size={12} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setShowYearModal(true)}
            >
              <Text style={styles.filterPillText}>{selectedYear}</Text>
              <Feather name="chevron-down" size={12} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Timeline & Payment Records */}
        <View style={styles.timelineContainer}>
          {/* Vertical line through timeline */}
          <View style={styles.timelineLine} />

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : filteredPayments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Walang naitalang bayad para sa buwang ito.</Text>
            </View>
          ) : (
            filteredPayments.map((record, index) => {
              const isFirst = index === 0;

              return (
                <View key={record.id} style={styles.timelineItemRow}>
                  {/* Timeline node marker */}
                  <View style={styles.timelineLeftColumn}>
                    <View
                      style={[
                        styles.timelineDotCircle,
                        isFirst ? styles.timelineDotCircleActive : styles.timelineDotCircleInactive,
                      ]}
                    >
                      {isFirst ? (
                        <Feather name="calendar" size={14} color="#FFFFFF" />
                      ) : (
                        <MaterialCommunityIcons name="history" size={16} color={COLORS.textMuted} />
                      )}
                    </View>
                  </View>

                  {/* Timeline content payment card */}
                  <View style={styles.timelineCardContainer}>
                    <View style={styles.paymentCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.dateGroup}>
                          <Text style={styles.paymentDate}>
                            {new Date(record.payment_date).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.paymentTypeLabel}>Bayad</Text>
                      </View>

                      <View style={styles.valuesGrid}>
                        <View style={styles.valueItem}>
                          <Text style={styles.gridLabel}>Halagang Binayad</Text>
                          <Text style={styles.gridValuePaid}>₱{record.amount.toFixed(2)}</Text>
                        </View>

                        <View style={styles.valueItem}>
                          <Text style={styles.gridLabel}>Natitirang Bayad</Text>
                          <Text style={styles.gridValueBalance}>---</Text>
                        </View>
                      </View>

                      <Text style={styles.paymentNoText}>
                        {record.notes ? `Tala: ${record.notes}` : `Payment ID: ${record.id.substring(0, 8)}`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* 4. Timeline End Start of Ledger */}
          <View style={styles.timelineEndRow}>
            <View style={styles.timelineLeftColumn}>
              <View style={styles.endCircleDashed}>
                <Ionicons name="checkbox-outline" size={14} color={COLORS.textMuted} />
              </View>
            </View>
            <View style={styles.endTextContainer}>
              <Text style={styles.endTitle}>Simula ng Talaan</Text>
              <Text style={styles.endSubtitle}>
                Ito ang pinakaunang transaksyon ng utang ng customer.
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* 5. Primary Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={styles.recordAnotherBtn}
          activeOpacity={0.85}
          onPress={handleRecordAnotherPayment}
        >
          <Feather name="plus-circle" size={18} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.recordAnotherBtnText}>Magtala ng Isa Pang Bayad</Text>
        </TouchableOpacity>
      </View>

      {/* Month Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showMonthModal}
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pumili ng Buwan</Text>
            <ScrollView style={styles.modalScroll}>
              {FILIPINO_MONTHS.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setSelectedMonth(month.value);
                    setShowMonthModal(false);
                  }}
                >
                  <Text style={selectedMonth === month.value ? styles.modalOptionTextActive : styles.modalOptionText}>
                    {month.label}
                  </Text>
                  {selectedMonth === month.value && <Feather name="check" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowMonthModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Kanselahin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showYearModal}
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pumili ng Taon</Text>
            <ScrollView style={styles.modalScroll}>
              {getAvailableYears().map((year) => (
                <TouchableOpacity
                  key={year}
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYearModal(false);
                  }}
                >
                  <Text style={selectedYear === year ? styles.modalOptionTextActive : styles.modalOptionText}>
                    {year}
                  </Text>
                  {selectedYear === year && <Feather name="check" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowYearModal(false)}
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
  subheaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  // ── Account Summary Accent Card ──
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardTopLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  borrowerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: ROUNDS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  remainingContainer: {
    marginBottom: SPACING.md,
  },
  remainingBalanceValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  helperMessage: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ROUNDS.sm,
    padding: SPACING.sm,
  },
  helperText: {
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 16,
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterPills: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFECE9',
    borderRadius: ROUNDS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterPillText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
  },

  // ── Timeline & Payments ──
  timelineContainer: {
    position: 'relative',
    paddingLeft: SPACING.xs,
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: '#EFECE9',
  },
  timelineItemRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 36,
    marginRight: SPACING.sm,
  },
  timelineDotCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timelineDotCircleActive: {
    backgroundColor: COLORS.primary,
  },
  timelineDotCircleInactive: {
    backgroundColor: '#EFECE9',
  },
  timelineCardContainer: {
    flex: 1,
  },

  // Timeline Card Styles
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentTypeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  valuesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  valueItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  gridValuePaid: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  gridValueBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentNoText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Timeline End Start of Ledger Row
  timelineEndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  endCircleDashed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  endTextContainer: {
    flex: 1,
    paddingLeft: SPACING.xs,
  },
  endTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  endSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },

  // Primary action button container
  actionButtonContainer: {
    position: 'absolute',
    bottom: 80,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  recordAnotherBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  btnIcon: {
    marginRight: SPACING.xs,
  },
  recordAnotherBtnText: {
    color: '#FFFFFF',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
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
    maxHeight: 450,
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
  modalScroll: {
    maxHeight: 300,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  modalOptionTextActive: {
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

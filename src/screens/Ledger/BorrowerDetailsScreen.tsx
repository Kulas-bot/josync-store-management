import React, { useState, useCallback } from 'react';
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
import { borrowerService } from '../../services/borrowerService';
import { Borrower, BorrowedItem, Payment } from '../../types/db';

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'BorrowerDetails'>;

interface BorrowerDetailsState {
  borrower: Borrower;
  borrowedItems: BorrowedItem[];
  payments: Payment[];
  currentBalance: number;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BorrowerDetailsScreen({ route, navigation }: Props) {
  const { borrowerId, borrowerName } = route.params;

  const [details, setDetails] = useState<BorrowerDetailsState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await borrowerService.getBorrowerDetails(borrowerId);
      setDetails(data);
    } catch (error) {
      console.error('Failed to load borrower details:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [borrowerId])
  );

  const handleAddNewItem = () => {
    navigation.navigate('AddBorrowedItem', { borrowerId, borrowerName });
  };

  const handleRecordPayment = () => {
    navigation.navigate('RecordPayment', { borrowerId, borrowerName });
  };

  const handleViewPaymentHistory = () => {
    navigation.navigate('PaymentHistory', { borrowerId, borrowerName });
  };

  const handleSendReminder = () => {
    // TODO: Trigger dynamic SMS/WhatsApp reminder popup
    console.log('Send reminder clicked');
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
          <Text style={styles.subheaderTitle}>Detalye ng Nangutang</Text>
        </View>

        {/* 2. Borrower Summary Card */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <Text style={styles.borrowerName}>{details?.borrower.name || borrowerName}</Text>
                {/* Status Badge */}
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusBadgeText}>
                    {details?.currentBalance === 0 ? 'Bayad na' : 'May Utang'}
                  </Text>
                </View>
              </View>

              {details?.borrowedItems && details.borrowedItems.length > 0 && (
                <Text style={styles.dateLabel}>
                  PETSA NG UTANG: {new Date(details.borrowedItems[0].borrowed_at).toLocaleDateString()}
                </Text>
              )}

              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Natitirang Bayad</Text>
                <Text style={styles.balanceValue}>₱{(details?.currentBalance || 0).toFixed(2)}</Text>
              </View>
            </View>

            {/* 3. Current Borrowed Items Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="notebook-outline" size={18} color={COLORS.text} />
                <Text style={styles.cardTitle}>Mga Hiniram</Text>
              </View>

              <View style={styles.itemsList}>
                {details?.borrowedItems.map((item: BorrowedItem) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    <Text style={styles.itemPrice}>₱{item.amount.toFixed(2)}</Text>
                  </View>
                ))}
                {details?.borrowedItems.length === 0 && (
                  <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginVertical: 10 }}>Walang hiniram.</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Kabuuang Hiniram</Text>
                <Text style={styles.totalValue}>
                  ₱{(details?.borrowedItems.reduce((sum: number, item: BorrowedItem) => sum + item.amount, 0) || 0).toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addNewItemBtn}
                activeOpacity={0.8}
                onPress={handleAddNewItem}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.addNewItemBtnText}>Magdagdag ng Hiniram</Text>
              </TouchableOpacity>
            </View>

            {/* 4. Payment Summary Card */}
            <View style={styles.card}>
              <View style={styles.paymentSummaryRow}>
                <View style={styles.paymentSummaryCol}>
                  <Text style={styles.paymentSummaryLabel}>Kabuuang Bayad</Text>
                  <Text style={styles.paymentSummaryValuePaid}>
                    ₱{(details?.payments.reduce((sum: number, pay: Payment) => sum + pay.amount, 0) || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.paymentSummaryCol, styles.alignRight]}>
                  <Text style={styles.paymentSummaryLabel}>Huling Bayad</Text>
                  <Text style={styles.paymentSummaryValueDate}>
                    {details?.payments && details.payments.length > 0
                      ? new Date(details.payments[0].payment_date).toLocaleDateString()
                      : 'Wala pa'}
                  </Text>
                </View>
              </View>

              {/* Large Remaining Balance Box */}
              <View style={styles.remainingBalanceBox}>
                <Text style={styles.remainingBalanceLabel}>NATITIRANG BAYAD</Text>
                <Text style={styles.remainingBalanceValue}>₱{(details?.currentBalance || 0).toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}

        {/* 5. Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.recordPaymentButton}
            activeOpacity={0.85}
            onPress={handleRecordPayment}
          >
            <MaterialCommunityIcons name="cash-register" size={18} color="#FFFFFF" />
            <Text style={styles.recordPaymentButtonText}>Itala ang Bayad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentHistoryButton}
            activeOpacity={0.85}
            onPress={handleViewPaymentHistory}
          >
            <MaterialCommunityIcons name="history" size={18} color={COLORS.primary} />
            <Text style={styles.paymentHistoryButtonText}>Kasaysayan ng Bayad</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Smart Reminder Card */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderLeft}>
            <View style={styles.reminderIconBadge}>
              <MaterialCommunityIcons name="bell-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.reminderText}>
              Madalas magbayad si Maria tuwing weekend. Magpadala ng reminder?
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reminderSendBtn}
            activeOpacity={0.7}
            onPress={handleSendReminder}
          >
            <MaterialCommunityIcons name="send" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>


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
  subheaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  // ── Borrower Summary Card ──
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  borrowerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    paddingRight: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: ROUNDS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B', // orange dot
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    marginBottom: SPACING.lg,
  },
  balanceContainer: {
    marginTop: SPACING.xs,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Card Styles ──
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
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },

  // Borrowed Items card rows
  itemsList: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addNewItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  addNewItemBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Payment Summary Card rows
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  paymentSummaryCol: {
    flex: 1,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  paymentSummaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentSummaryValuePaid: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D8A4E', // paid is green
  },
  paymentSummaryValueDate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Remaining Balance box
  remainingBalanceBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: ROUNDS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingBalanceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  remainingBalanceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // ── Action Buttons ──
  actionsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  recordPaymentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: SPACING.xs,
  },
  recordPaymentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentHistoryButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: ROUNDS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: SPACING.xs,
  },
  paymentHistoryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // ── Smart Reminder Card ──
  reminderCard: {
    backgroundColor: '#FCEAE3', // soft pinkish peach card
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: 80, // buffer for tab bar
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  reminderIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderText: {
    fontSize: 12,
    color: '#4A3E39',
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },
  reminderSendBtn: {
    padding: SPACING.xs,
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

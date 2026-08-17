import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Clipboard,
  Linking,
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
import { borrowerService } from '../../services/borrowerService';
import { generatePaymentReminder } from '../../utils/reminder';
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
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  
  const isArchived = !!details?.borrower.deleted_at;

  const activeBorrowerName = details?.borrower.name || borrowerName;

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
    navigation.navigate('AddBorrowedItem', { borrowerId, borrowerName: activeBorrowerName });
  };

  const handleRecordPayment = () => {
    navigation.navigate('RecordPayment', { borrowerId, borrowerName: activeBorrowerName });
  };

  const handleViewPaymentHistory = () => {
    navigation.navigate('PaymentHistory', { borrowerId, borrowerName: activeBorrowerName });
  };

  const handleSendReminder = () => {
    if (!details) return;
    const msg = generatePaymentReminder(activeBorrowerName, details.currentBalance);
    setGeneratedMessage(msg);
    setReminderModalVisible(true);
  };

  const handleCopyMessage = () => {
    Clipboard.setString(generatedMessage);
    Alert.alert('Nakopya', 'Nakopya na ang mensahe.');
  };

  const handleOpenMessenger = async () => {
    // Copy message first — ready to paste when Messenger opens
    Clipboard.setString(generatedMessage);

    // Android intent URI targeting Messenger's known package (com.facebook.orca)
    // This is more reliable than fb-messenger:// which silently resolves even when Messenger is absent
    const intentUrl = 'intent://user/#Intent;package=com.facebook.orca;scheme=fb-messenger;end';
    const webFallbackUrl = 'https://m.me';

    console.log('[Reminder] Attempting Messenger launch...');
    console.log('[Reminder] Messenger launch method: Android intent URI -', intentUrl);

    try {
      const canOpen = await Linking.canOpenURL(intentUrl);
      console.log('[Reminder] Launch request accepted (canOpenURL):', canOpen);

      if (canOpen) {
        await Linking.openURL(intentUrl);
        console.log('[Reminder] Fallback required: false — Messenger intent dispatched');
      } else {
        console.log('[Reminder] Fallback required: true — Messenger not found, trying web fallback');
        const canOpenWeb = await Linking.canOpenURL(webFallbackUrl);
        if (canOpenWeb) {
          await Linking.openURL(webFallbackUrl);
          console.log('[Reminder] Web Messenger fallback opened');
        } else {
          throw new Error('Neither Messenger nor web fallback could be opened');
        }
      }
    } catch (err) {
      console.error('[Reminder] All Messenger launch methods failed:', err);
      Alert.alert(
        'Hindi mabuksan ang Messenger.',
        'Na-copy na ang reminder. Maaari mo itong i-paste sa Messenger.',
        [
          {
            text: 'Kopyahin ang Mensahe',
            onPress: () => {
              Clipboard.setString(generatedMessage);
              Alert.alert('Nakopya', 'Nakopya na ang mensahe.');
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }
  };

  const handleDeletePress = () => {
    setActionsModalVisible(false);
    const balance = details?.currentBalance || 0;
    if (balance > 0) {
      Alert.alert(
        'Hindi maaaring tanggalin ang borrower.',
        `May natitirang balanse na ₱${balance.toFixed(2)}.`
      );
      return;
    }
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteModalVisible(false);
    try {
      await borrowerService.deleteBorrower(borrowerId);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Hindi ma-delete ang borrower.');
    }
  };

  const handleRestoreConfirm = async () => {
    setRestoreModalVisible(false);
    try {
      await borrowerService.restoreBorrower(borrowerId);
      Alert.alert(
        'Na-restore',
        `${details?.borrower.name || borrowerName} ay naibalik na sa aktibong listahan.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Hindi ma-restore ang borrower.');
    }
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
        {/* Subheader */}
        <View style={[styles.subheader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={styles.subheaderTitle}>Detalye ng Nangutang</Text>
          <TouchableOpacity
            onPress={() => setActionsModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="more-vertical" size={22} color={COLORS.text} />
          </TouchableOpacity>
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
                <Text style={styles.balanceLabel}>{isArchived ? 'Balanse' : 'Natitirang Balanse'}</Text>
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
                    <View style={styles.itemRowDetails}>
                      <Text style={styles.itemName}>
                        {item.item_name}{item.item_type === 'product' ? ` × ${item.quantity ?? 1}` : ''}
                      </Text>
                      {item.item_type === 'product' && (
                        <Text style={styles.itemSubtext}>
                          ₱{((item.amount) / (item.quantity ?? 1)).toFixed(2)} bawat isa
                        </Text>
                      )}
                    </View>
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

              {!isArchived && (
                <TouchableOpacity
                  style={styles.addNewItemBtn}
                  activeOpacity={0.8}
                  onPress={handleAddNewItem}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.addNewItemBtnText}>Magdagdag ng Hiniram</Text>
                </TouchableOpacity>
              )}
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
          {!isArchived && (
            <TouchableOpacity
              style={styles.recordPaymentButton}
              activeOpacity={0.85}
              onPress={handleRecordPayment}
            >
              <MaterialCommunityIcons name="cash-register" size={18} color="#FFFFFF" />
              <Text style={styles.recordPaymentButtonText}>Itala ang Bayad</Text>
            </TouchableOpacity>
          )}

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
        {!isArchived && details && details.currentBalance > 0 && (
          <View style={styles.reminderCard}>
            <View style={styles.reminderLeft}>
              <View style={styles.reminderIconBadge}>
                <MaterialCommunityIcons name="bell-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderText}>Magpadala ng reminder?</Text>
                <Text style={styles.reminderSubText}>Ipaalala ang kasalukuyang balanse.</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reminderSendBtn}
              activeOpacity={0.7}
              onPress={handleSendReminder}
            >
              <MaterialCommunityIcons name="send" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Spacer for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reminder Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reminderModalVisible}
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Magpadala ng reminder?</Text>
            <View style={styles.previewMessageContainer}>
              <Text style={styles.previewMessageText}>{generatedMessage}</Text>
            </View>

            <View style={styles.modalActionsVertical}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleCopyMessage}
              >
                <Text style={styles.modalBtnPrimaryText}>Kopyahin ang Mensahe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleOpenMessenger}
              >
                <Text style={styles.modalBtnPrimaryText}>Buksan ang Messenger</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setReminderModalVisible(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Kanselahin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Actions Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={actionsModalVisible}
        onRequestClose={() => setActionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>I-manage ang Borrower</Text>
            <Text style={[styles.modalMessage, { textAlign: 'center', marginBottom: SPACING.md }]}>
              {details?.borrower.name || borrowerName}
            </Text>
            
            <View style={styles.modalActionsVertical}>
              {isArchived ? (
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSecondary, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                  onPress={() => {
                    setActionsModalVisible(false);
                    setRestoreModalVisible(true);
                  }}
                >
                  <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                  <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Ibalik ang Borrower</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSecondary, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                    onPress={() => {
                      setActionsModalVisible(false);
                      navigation.navigate('AddBorrower' as any);
                    }}
                  >
                    <Feather name="edit-2" size={16} color={COLORS.primary} />
                    <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>I-edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSecondary, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                    onPress={() => {
                      setActionsModalVisible(false);
                      handleSendReminder();
                    }}
                  >
                    <Feather name="bell" size={16} color={COLORS.primary} />
                    <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Magpadala ng Reminder</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSecondary, { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FCE4E4', borderColor: '#D32F2F' }]}
                    onPress={handleDeletePress}
                  >
                    <Feather name="trash-2" size={16} color="#D32F2F" />
                    <Text style={{ fontWeight: 'bold', color: '#D32F2F' }}>Tanggalin</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnSecondary, { marginTop: SPACING.sm }]}
              onPress={() => setActionsModalVisible(false)}
            >
              <Text style={styles.modalBtnSecondaryText}>Kanselahin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={restoreModalVisible}
        onRequestClose={() => setRestoreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ibalik ang borrower?</Text>
            <Text style={[styles.modalMessage, { textAlign: 'center', fontWeight: 'bold', marginBottom: SPACING.xs }]}>
              {details?.borrower.name || borrowerName}
            </Text>
            <Text style={[styles.modalMessage, { fontSize: 12, lineHeight: 18, marginBottom: SPACING.lg }]}>
              Ang borrower na ito ay muling lilitaw sa aktibong listahan ng Ledger.
            </Text>
            
            <View style={styles.modalActionsVertical}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleRestoreConfirm}
              >
                <Text style={styles.modalBtnPrimaryText}>Ibalik</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setRestoreModalVisible(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Kanselahin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tanggalin ang borrower?</Text>
            <Text style={[styles.modalMessage, { textAlign: 'center', fontWeight: 'bold', marginBottom: SPACING.xs }]}>
              {details?.borrower.name || borrowerName}
            </Text>
            <Text style={[styles.modalMessage, { fontSize: 12, lineHeight: 18, marginBottom: SPACING.lg }]}>
              Hindi na makikita ang borrower na ito sa aktibong listahan. Ang kanyang dating utang at bayad ay mananatili bilang historical records.
            </Text>
            
            <View style={styles.modalActionsVertical}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: '#D32F2F' }]}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.modalBtnPrimaryText}>Tanggalin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Kanselahin</Text>
              </TouchableOpacity>
            </View>
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
  itemRowDetails: {
    flex: 1,
  },
  itemSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
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
  reminderSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
  previewMessageContainer: {
    backgroundColor: '#FAF5EE',
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#EFECE9',
    marginBottom: SPACING.lg,
  },
  previewMessageText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalActionsVertical: {
    gap: SPACING.sm,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: ROUNDS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modalBtnSecondaryText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});

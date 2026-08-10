import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
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
import { borrowerService } from '../../services/borrowerService';
import { paymentService } from '../../services/paymentService';

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'RecordPayment'>;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecordPaymentScreen({ route, navigation }: Props) {
  const { borrowerId, borrowerName } = route.params;

  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  });

  // UI state hooks
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const balance = await borrowerService.getCurrentBalance(borrowerId);
      setOutstandingBalance(balance);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadBalance();
    }, [borrowerId])
  );

  // Sanitized amount calculation
  const numericAmount = parseFloat(paymentAmount) || 0;
  const remainingBalance = outstandingBalance - numericAmount;

  // Validation rules
  const isEmptyOrZero = paymentAmount.trim() === '' || numericAmount <= 0;
  const isOverpaid = numericAmount > outstandingBalance;
  const isValid = !isEmptyOrZero && !isOverpaid;

  // Status after payment
  let statusAfterPayment = 'Bahagyang Bayad';
  let statusBadgeColor = '#F59E0B'; // Orange
  if (remainingBalance === 0) {
    statusAfterPayment = 'Bayad na';
    statusBadgeColor = '#2D8A4E'; // Green
  }

  const handleRecordPayment = () => {
    if (isValid) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);

    try {
      setSaving(true);
      await paymentService.recordPayment(borrowerId, numericAmount, new Date().toISOString(), notes);

      // Show success snackbar and redirect
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigation.goBack();
      }, 1200);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi mai-record ang bayad.');
    } finally {
      setSaving(false);
    }
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
            <Text style={styles.subheaderTitle}>Itala ang Bayad</Text>
            <Text style={styles.subheaderSubtitle}>Itala ang bayad ng customer.</Text>
          </View>
        </View>

        {/* 2. Borrower Information Card with Decorative Background Pattern */}
        <View style={styles.infoCard}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              {/* Decorative Pattern Circles */}
              <View style={styles.circlePattern1} />
              <View style={styles.circlePattern2} />

              <View style={styles.infoTopRow}>
                <View>
                  <Text style={styles.infoLabel}>Nangutang</Text>
                  <Text style={styles.borrowerName}>{borrowerName}</Text>
                </View>

                {/* Status Badge */}
                <View style={styles.statusBadgeUnpaid}>
                  <Text style={styles.statusBadgeTextUnpaid}>May Utang</Text>
                </View>
              </View>

              <View style={styles.infoBottom}>
                <Text style={styles.infoLabel}>Natitirang Bayad</Text>
                <Text style={styles.outstandingBalanceValue}>₱{outstandingBalance.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* 3. Payment Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="cash-register" size={18} color={COLORS.text} />
            <Text style={styles.cardTitle}>Detalye ng Bayad</Text>
          </View>

          {/* Payment Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Halaga ng Bayad</Text>
            <View style={styles.currencyInputRow}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.currencyInput}
                keyboardType="numeric"

                value={paymentAmount}
                onChangeText={(text) => {
                  const formatted = text.replace(/[^0-9.]/g, '');
                  setPaymentAmount(formatted);
                }}
              />
            </View>
            <View style={styles.divider} />
          </View>

          {/* Payment Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Petsa ng Bayad</Text>
            <View style={styles.dateSelector}>
              <Feather name="calendar" size={16} color={COLORS.textMuted} style={styles.dateIcon} />
              <TextInput
                style={styles.dateInput}
                value={paymentDate}
                onChangeText={setPaymentDate}
              />
            </View>
          </View>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Mga Tala (Opsyonal)</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={2}
              maxLength={150}
              placeholder="Halimbawa: Nagbayad pagkatapos ng klase."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* 4. Payment Summary Card */}
        {!isEmptyOrZero && !isOverpaid ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Buod ng Bayad</Text>

            <View style={styles.summaryBoxRow}>
              <Text style={styles.summaryBoxLabel}>Natitirang Bayad</Text>
              <Text style={styles.summaryBoxValue}>₱{outstandingBalance.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryBoxRow}>
              <Text style={styles.summaryBoxLabel}>- Halaga ng Bayad</Text>
              <Text style={styles.summaryBoxValuePaid}>-₱{numericAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryBoxDivider} />

            <View style={styles.summaryBoxRow}>
              <Text style={styles.summaryBoxLabelRemaining}>Natitirang Bayad</Text>
              <Text style={styles.summaryBoxValueRemaining}>₱{remainingBalance.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryStatusRow}>
              <Text style={styles.summaryBoxLabel}>Katayuan Pagkatapos Magbayad</Text>
              <View style={[styles.statusBadgeAfter, { backgroundColor: statusBadgeColor }]}>
                <Text style={styles.statusBadgeTextAfter}>{statusAfterPayment}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Validation Errors & Prompts */}
        {isEmptyOrZero ? (
          <View style={styles.alertBoxInfo}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.alertTextInfo}>Mangyaring ilagay ang halaga ng bayad.</Text>
          </View>
        ) : null}

        {isOverpaid ? (
          <View style={styles.alertBoxError}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#D32F2F" />
            <Text style={styles.alertTextError}>
              Ang halaga ng bayad ay lampas sa natitirang utang ng customer.
            </Text>
          </View>
        ) : null}

        {/* 5. Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, !isValid ? styles.saveButtonDisabled : {}]}
            activeOpacity={0.85}
            onPress={handleRecordPayment}
            disabled={!isValid}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Itala ang Bayad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Kanselahin</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 6. Centered Confirmation Dialog Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kumpirmahin ang Bayad</Text>
            <Text style={styles.modalMessage}>
              Mangyaring suriin ang mga detalye ng bayad bago itala ang transaksyong ito.
            </Text>

            <View style={styles.modalDetails}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Nangutang</Text>
                <Text style={styles.modalValueBold}>{borrowerName || 'Maria Santos'}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Natitirang Bayad</Text>
                <Text style={styles.modalValue}>₱{outstandingBalance.toFixed(2)}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Halaga ng Bayad</Text>
                <Text style={styles.modalValuePaid}>₱{numericAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabelRemaining}>Natitirang Bayad</Text>
                <Text style={styles.modalValueRemaining}>₱{remainingBalance.toFixed(2)}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Petsa ng Bayad</Text>
                <Text style={styles.modalValue}>{paymentDate}</Text>
              </View>

              {notes.trim() !== '' ? (
                <View style={styles.modalRowColumn}>
                  <Text style={styles.modalLabel}>Mga Tala</Text>
                  <Text style={styles.modalValueNotes}>"{notes}"</Text>
                </View>
              ) : null}
            </View>

            {/* Modal Controls */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Kanselahin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmPayment}
              >
                <Text style={styles.modalConfirmText}>Kumpirmahin ang Bayad</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. Success Toast Snackbar overlay */}
      {showToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>
              ✓ Matagumpay na naitala ang bayad na ₱{numericAmount.toFixed(2)}.
            </Text>
            <Text style={styles.toastSubtitle}>
              Natitirang Utang: ₱{remainingBalance.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* 8. Mock Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        {/* Home */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialCommunityIcons name="storefront-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Bahay</Text>
        </TouchableOpacity>

        {/* Inventory */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Inventory')}
        >
          <MaterialCommunityIcons name="archive-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Paninda</Text>
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

        {/* Ledger (active) */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Ledger')}
        >
          <View style={styles.activeTabOutline}>
            <Feather name="book-open" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.activeTabText}>Utang</Text>
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

  // ── Borrower Information Card with Circles Pattern ──
  infoCard: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  circlePattern1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -40,
    right: -20,
  },
  circlePattern2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: -60,
    right: -40,
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  infoLabel: {
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
  statusBadgeUnpaid: {
    backgroundColor: '#D32F2F', // Unpaid status badge
    borderRadius: ROUNDS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeTextUnpaid: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoBottom: {
    marginTop: SPACING.xs,
  },
  outstandingBalanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Card & Inputs ──
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
  inputGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },

  // Currency numerical inputs
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  currencyInput: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    padding: 0,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.border,
    marginTop: SPACING.xs,
  },

  // Date selector container
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  dateIcon: {
    marginRight: SPACING.sm,
  },
  dateInput: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    padding: 0,
  },

  // Notes Field
  notesInput: {
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 13,
    color: COLORS.text,
    height: 60,
    textAlignVertical: 'top',
  },

  // ── Payment Summary Card Box ──
  summaryBox: {
    backgroundColor: '#FCEAE3', // warm highlighted background
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F9D5C8',
  },
  summaryBoxTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  summaryBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  summaryBoxLabel: {
    fontSize: 13,
    color: '#554A42',
    fontWeight: '500',
  },
  summaryBoxValue: {
    fontSize: 13,
    color: '#554A42',
    fontWeight: '700',
  },
  summaryBoxValuePaid: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '700',
  },
  summaryBoxDivider: {
    height: 1,
    backgroundColor: '#F5BEAA',
    marginVertical: 8,
  },
  summaryBoxLabelRemaining: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryBoxValueRemaining: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadgeAfter: {
    borderRadius: ROUNDS.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  statusBadgeTextAfter: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Validation Warning Alerts ──
  alertBoxInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#FAF5EE',
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertTextInfo: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  alertBoxError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#FCE4E4',
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F9C0C0',
  },
  alertTextError: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
    flex: 1,
  },

  // ── Action Buttons ──
  actionsContainer: {
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
  saveButtonDisabled: {
    backgroundColor: '#D1CAC2',
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

  // ── Modal Confirmation Dialog ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalMessage: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  modalDetails: {
    backgroundColor: '#FAF5EE',
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowColumn: {
    marginTop: SPACING.xs,
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalValueBold: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  modalValuePaid: {
    fontSize: 12,
    color: '#2D8A4E',
    fontWeight: '700',
  },
  modalLabelRemaining: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalValueRemaining: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalValueNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.text,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: ROUNDS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: ROUNDS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Success Toast Snackbar ──
  toastContainer: {
    position: 'absolute',
    bottom: 80,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: '#2D8A4E', // Green background
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 99,
  },
  toastContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  toastSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
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

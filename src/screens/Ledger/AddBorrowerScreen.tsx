import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
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
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import BottomTabBar from '../../components/BottomTabBar';
import { borrowerService } from '../../services/borrowerService';

// ─── Types & Configuration ───────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'AddBorrower'>;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddBorrowerScreen({ navigation }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    try {
      await borrowerService.createBorrower(
        customerName,
        contactNumber || undefined,
        address || undefined,
        notes || undefined
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hindi ma-save ang borrower.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
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
        <Text style={styles.headerTitle}></Text>
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
            <Text style={styles.subheaderTitle}>Magdagdag ng Nangutang</Text>
            <Text style={styles.subheaderSubtitle}>Gumawa ng bagong account ng customer.</Text>
          </View>
        </View>

        {/* 2. Form Card */}
        <View style={styles.formCard}>
          {/* Customer Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Customer Name <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ilagay ang buong pangalan ng customer"
              placeholderTextColor={COLORS.textMuted}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Numero ng Telepono (Opsyonal)</Text>
            <View style={styles.inputRowContainer}>
              <Feather name="phone" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.iconTextInput}
                placeholder="09XXXXXXXXX"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={contactNumber}
                onChangeText={setContactNumber}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Tirahan (Opsyonal)</Text>
            <View style={styles.inputRowContainer}>
              <Feather name="map-pin" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.iconTextInput}
                placeholder="Barangay / Kalye / Landmark"
                placeholderTextColor={COLORS.textMuted}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Mga Tala (Opsyonal)</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              maxLength={200}
              placeholder="Halimbawa: Kapitbahay mula sa Purok 2. Madalas magbayad tuwing Sabado."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* 3. Customer Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewTop}>
            <View style={styles.previewAvatar}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{customerName || 'Bagong Customer'}</Text>
              <Text style={styles.previewBalance}>Natitirang Bayad: ₱0.00</Text>
            </View>
          </View>

          <View style={styles.previewStatusBadge}>
            <Text style={styles.previewStatusBadgeText}>Katayuan: Wala Pang Hiniram</Text>
          </View>

          <Text style={styles.previewHelperText}>
            Lalabas ang customer na ito sa iyong Talaan pagkatapos i-save. Maaari mo nang itala ang mga hiniram na produkto o cash.
          </Text>
        </View>

        {/* 4. Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={18} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>I-save ang Nangutang</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Kanselahin</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

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
  headerTitle: {
    fontSize: 13,
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

  // ── Form Card & Inputs ──
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
  asterisk: {
    color: '#D32F2F', // red required asterisk
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: COLORS.text,
  },

  // Input fields with leading icons
  inputRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  iconTextInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 0,
  },

  // Notes Multiline text field (approx 4 lines tall)
  notesInput: {
    backgroundColor: COLORS.background,
    borderColor: '#D1CAC2',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 13,
    color: COLORS.text,
    height: 90,
    textAlignVertical: 'top',
  },

  // ── Customer Preview Card ──
  previewCard: {
    backgroundColor: '#FAF5EE', // soft background matching JoSync theme
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCEAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  previewBalance: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  previewStatusBadge: {
    backgroundColor: '#EFECE9',
    borderRadius: ROUNDS.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  previewStatusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  previewHelperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
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

});

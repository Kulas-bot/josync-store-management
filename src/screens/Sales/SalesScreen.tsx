import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { dailySalesService } from '../../services/dailySalesService';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  navigation: any;
  route: any;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SalesScreen({ navigation }: Props) {
  const [salesAmount, setSalesAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dateDisplay, setDateDisplay] = useState({
    weekday: '',
    fullDate: '',
    isoDate: ''
  });

  const loadTodaySales = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const iso = today.toISOString().split('T')[0];
      const weekday = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const fullDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      setDateDisplay({ weekday, fullDate, isoDate: iso });

      const sale = await dailySalesService.getTodaySales();
      if (sale) {
        setSalesAmount(sale.total_amount.toString());
        setNotes(sale.notes || '');
      } else {
        setSalesAmount('');
        setNotes('');
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTodaySales();
    }, [])
  );

  const handleSave = async () => {
    const amount = parseFloat(salesAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid sales amount.');
      return;
    }

    try {
      await dailySalesService.recordDailySale(dateDisplay.isoDate, amount, notes);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error recording sales.');
    }
  };

  const handleViewHistory = () => {
    // TODO: Navigate to Sales History Screen
    console.log('Navigate to Sales History Screen');
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
        {/* 2. Subheader Area */}
        <View style={styles.subheader}>
          <View style={styles.subheaderLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.subheaderTitleContainer}>
              <Text style={styles.subheaderTitle}>Benta Ngayon</Text>
              <Text style={styles.subheaderSubtitle}>Itala ang kabuuang benta ngayong araw</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.historyBtn} onPress={handleViewHistory}>
            <MaterialCommunityIcons name="calendar-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* 3. Date Summary Card */}
        <View style={styles.dateSummaryCard}>
          <Text style={styles.weekdayText}>{dateDisplay.weekday || 'NGAYON'}</Text>
          <Text style={styles.dateText}>{dateDisplay.fullDate || 'Loading date...'}</Text>

          <View style={styles.infoBadge}>
            <MaterialCommunityIcons name="information-outline" size={14} color="#FFFFFF" />
            <Text style={styles.infoBadgeText}>Ilagay ang kabuuang benta ngayong araw.</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 4. Total Sales Card */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Kabuuang Benta</Text>
          <View style={styles.salesInputRow}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.salesInput}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#CCCCCC"
              value={salesAmount}
              onChangeText={(text) => {
                // Allow only numeric values & decimals
                const formatted = text.replace(/[^0-9.]/g, '');
                setSalesAmount(formatted);
              }}
            />
          </View>
          <View style={styles.divider} />
        </View>

        {/* 5. Notes Card */}
        <View style={styles.card}>
          <View style={styles.fieldLabelRow}>
            <MaterialCommunityIcons name="note-text-outline" size={16} color={COLORS.text} />
            <Text style={styles.fieldLabel}>Mga Tala (Opsyonal)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            maxLength={150}
            placeholder="Halimbawa: Maraming bumili dahil may activity sa school."
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Success State Toast Banner */}
        {showSuccess && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check" size={18} color="#2D8A4E" />
            <Text style={styles.successBannerText}>
              Matagumpay na naitala ang benta ngayong araw.
            </Text>
          </View>
        )}

        {/* 6. Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={18}
              color="#FFFFFF"
              style={styles.saveIcon}
            />
            <Text style={styles.saveButtonText}>I-save ang Benta Ngayon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyLink}
            activeOpacity={0.7}
            onPress={handleViewHistory}
          >
            <MaterialCommunityIcons
              name="history"
              size={18}
              color={COLORS.primary}
              style={styles.historyLinkIcon}
            />
            <Text style={styles.historyLinkText}>Tingnan ang Kasaysayan ng Benta</Text>
          </TouchableOpacity>
        </View>

          </>
        )}

        {/* Spacer for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 7. Mock Bottom Navigation Bar */}
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
          <View style={styles.activeTabOutline}>
            <MaterialCommunityIcons name="archive" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.activeTabText}>Paninda</Text>
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

        {/* Ledger */}
        <TouchableOpacity
          style={styles.tabButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Ledger')}
        >
          <Feather name="book-open" size={22} color={COLORS.textMuted} />
          <Text style={styles.inactiveTabText}>Utang</Text>
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
    paddingBottom: SPACING.xl,
  },

  // ── Subheader ──
  subheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  subheaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  subheaderTitleContainer: {
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
  historyBtn: {
    padding: SPACING.xs,
  },

  // ── Date Summary Card ──
  dateSummaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
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
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // ── Cards ──
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },

  // ── Inputs ──
  salesInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  salesInput: {
    fontSize: 34,
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
  notesInput: {
    backgroundColor: COLORS.background,
    borderColor: '#EFECE9',
    borderWidth: 1.5,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 13,
    color: COLORS.text,
    height: 70,
    textAlignVertical: 'top',
  },

  // ── Success State toast ──
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#E2F7E6',
    borderWidth: 1,
    borderColor: '#2D8A4E',
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D8A4E',
    flex: 1,
  },

  // ── Action Buttons ──
  actionsContainer: {
    gap: SPACING.md,
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
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  historyLinkIcon: {
    marginTop: 1,
  },
  historyLinkText: {
    color: COLORS.primary,
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
});

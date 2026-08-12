import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import HeaderBar from '../../components/HeaderBar';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { dailySalesService } from '../../services/dailySalesService';
import { DailySale } from '../../types/db';

type Props = {
  navigation: any;
};

export default function SalesHistoryScreen({ navigation }: Props) {
  const [salesHistory, setSalesHistory] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await dailySalesService.getAllDailySales();
      setSalesHistory(history);
    } catch (err) {
      console.error('Failed to load daily sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const formatDate = (isoDateString: string) => {
    // Expected format: YYYY-MM-DD
    const parts = isoDateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return isoDateString;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* Header */}
      <HeaderBar onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subheader */}
        <View style={styles.subheader}>
          <Text style={styles.subheaderTitle}>Kasaysayan ng Benta</Text>
          <Text style={styles.subheaderSubtitle}>Makita ang mga dating naitalang benta kada araw</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : salesHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Wala pang naitalang benta.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {salesHistory.map((item) => (
              <View key={item.id} style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <Text style={styles.dateText}>{formatDate(item.sales_date)}</Text>
                  <Text style={styles.amountText}>
                    ₱{item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                {item.notes ? (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Mga Tala:</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  subheader: {
    marginBottom: SPACING.lg,
  },
  subheaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subheaderSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  listContainer: {
    gap: SPACING.md,
  },
  saleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  notesContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
});

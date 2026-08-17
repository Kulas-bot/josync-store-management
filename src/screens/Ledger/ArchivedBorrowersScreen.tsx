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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import HeaderBar from '../../components/HeaderBar';
import { COLORS, SPACING, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { borrowerService } from '../../services/borrowerService';
import { Borrower } from '../../types/db';

type Props = NativeStackScreenProps<RootStackParamList, 'ArchivedBorrowers'>;

interface ArchivedBorrowerUI extends Borrower {
  initials: string;
}

export default function ArchivedBorrowersScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowers, setBorrowers] = useState<ArchivedBorrowerUI[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const archivedList = await borrowerService.getArchivedBorrowers();
      const uiList: ArchivedBorrowerUI[] = archivedList.map((b) => {
        const initials =
          b.name
            .trim()
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase() || '?';
        return {
          ...b,
          initials,
        };
      });
      setBorrowers(uiList);
    } catch (error) {
      console.error('Failed to load archived borrowers:', error);
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

  const handleBorrowerClick = (borrower: ArchivedBorrowerUI) => {
    navigation.navigate('BorrowerDetails', {
      borrowerId: borrower.id,
      borrowerName: borrower.name,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* 1. Header Bar */}
      <HeaderBar onBack={() => navigation.goBack()} showProfile={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Subheader */}
        <View style={styles.subheader}>
          <View style={styles.subheaderTextContainer}>
            <Text style={styles.subheaderTitle}>Mga Nakatagong Borrower</Text>
            <Text style={styles.subheaderSubtitle}>
              {borrowers.length} na account ang naka-archive
            </Text>
          </View>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Maghanap sa mga nakatago..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 3. Archived List */}
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : filteredBorrowers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="archive-off-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Wala pang nakatagong borrower.</Text>
            </View>
          ) : (
            filteredBorrowers.map((borrower) => {
              const archiveDate = borrower.deleted_at
                ? new Date(borrower.deleted_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A';

              return (
                <TouchableOpacity
                  key={borrower.id}
                  style={styles.borrowerCard}
                  activeOpacity={0.8}
                  onPress={() => handleBorrowerClick(borrower)}
                >
                  <View style={styles.borrowerLeft}>
                    {/* Initials Avatar */}
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{borrower.initials}</Text>
                    </View>

                    <View style={styles.borrowerInfo}>
                      <Text style={styles.borrowerName}>{borrower.name}</Text>
                      <Text style={styles.archiveDateText}>
                        Nakatago noong {archiveDate}
                      </Text>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl * 2,
  },
  subheader: {
    marginBottom: SPACING.md,
  },
  subheaderTextContainer: {
    flex: 1,
  },
  subheaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subheaderSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: ROUNDS.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: COLORS.text,
  },
  listContainer: {
    gap: SPACING.md,
  },
  borrowerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: ROUNDS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  borrowerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  borrowerInfo: {
    justifyContent: 'center',
  },
  borrowerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  archiveDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

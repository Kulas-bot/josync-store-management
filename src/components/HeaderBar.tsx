import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, ROUNDS } from '../theme';

interface HeaderBarProps {
  onBack?: () => void;
  showBack?: boolean;
  showProfile?: boolean;
}

export default function HeaderBar({ onBack, showBack = true, showProfile = true }: HeaderBarProps) {
  return (
    <View style={styles.headerBar}>
      <View style={styles.headerLeft}>
        {showBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <FontAwesome5 name="shopping-basket" size={16} color={COLORS.primary} />
        <Text style={styles.logoText}>JoSync</Text>
      </View>
      {showProfile && (
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={17} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  backButton: {
    marginRight: 2,
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
});

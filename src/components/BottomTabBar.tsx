import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, ROUNDS } from '../theme';

interface BottomTabBarProps {
  activeTab: 'Home' | 'Inventory' | 'List' | 'Ledger' | 'Reports';
  navigation: any;
}

export default function BottomTabBar({ activeTab, navigation }: BottomTabBarProps) {
  const tabs = [
    {
      key: 'Home',
      label: 'Home',
      route: 'Dashboard',
      iconActive: 'storefront',
      iconInactive: 'storefront-outline',
      library: 'MaterialCommunityIcons',
    },
    {
      key: 'Inventory',
      label: 'Paninda',
      route: 'Inventory',
      iconActive: 'archive',
      iconInactive: 'archive-outline',
      library: 'MaterialCommunityIcons',
    },
    {
      key: 'List',
      label: 'Bibilhin',
      route: 'ShoppingList',
      iconActive: 'format-list-bulleted',
      iconInactive: 'format-list-bulleted',
      library: 'MaterialCommunityIcons',
    },
    {
      key: 'Ledger',
      label: 'Talaan',
      route: 'Ledger',
      iconActive: 'book-open',
      iconInactive: 'book-open',
      library: 'Feather',
    },
    {
      key: 'Reports',
      label: 'Ulat',
      route: 'Reports',
      iconActive: 'bar-chart',
      iconInactive: 'bar-chart-outline',
      library: 'Ionicons',
    },
  ];

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const IconComponent =
          tab.library === 'Feather'
            ? Feather
            : tab.library === 'Ionicons'
            ? Ionicons
            : MaterialCommunityIcons;

        const iconName = isActive ? tab.iconActive : tab.iconInactive;
        const iconColor = isActive ? COLORS.primary : COLORS.textMuted;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            activeOpacity={0.8}
            onPress={() => {
              if (!isActive) {
                navigation.navigate(tab.route);
              }
            }}
          >
            {isActive ? (
              <View style={styles.activeTabOutline}>
                <IconComponent name={iconName as any} size={22} color={iconColor} />
              </View>
            ) : (
              <IconComponent name={iconName as any} size={22} color={iconColor} />
            )}
            <Text style={isActive ? styles.activeTabText : styles.inactiveTabText}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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

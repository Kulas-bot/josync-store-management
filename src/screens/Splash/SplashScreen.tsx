import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, ROUNDS } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SplashScreen({ navigation }: Props) {
  // Animation hooks
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Redirect to Dashboard after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('Dashboard');
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* 1. Background Watermark Storefront Icon */}
      <View style={styles.watermarkContainer}>
        <MaterialCommunityIcons
          name="storefront"
          size={280}
          color={COLORS.primary}
          style={styles.watermarkIcon}
        />
      </View>

      {/* 2. Animated Center Branding Group */}
      <Animated.View style={[styles.brandingGroup, { opacity: fadeAnim }]}>
        {/* Logo Card */}
        <View style={styles.logoCard}>
          <FontAwesome5 name="shopping-basket" size={42} color={COLORS.primary} />
          <Text style={styles.logoCardText}>JoSync</Text>
        </View>

        {/* Brand App Name */}
        <Text style={styles.appName}>JoSync</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Tindahan mo, naka-JoSync.
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // warm cream background matching JoSync theme
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Watermark Background
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkIcon: {
    opacity: 0.05, // very subtle, non-distracting opacity
  },

  // Center Branding Layout
  brandingGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoCard: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
    gap: 8,
  },
  logoCardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  appName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

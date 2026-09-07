import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../theme';
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



      {/* Animated Center Branding Group */}
      <Animated.View style={[styles.brandingGroup, { opacity: fadeAnim }]}>
        <FontAwesome5 name="shopping-basket" size={56} color={COLORS.primary} />
        <Text style={styles.tagline}>
          {'Tindahan mo, naka-'}
          <Text style={styles.wordmark}>JoSync</Text>
          {'.'}
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

  // Center Branding Layout
  brandingGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  wordmark: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
  },
});

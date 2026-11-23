import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Upper brand block */}
      <View style={styles.brand}>
        <View style={styles.logoMark}>
          {/* Compass-inspired: N arrow */}
          <Text style={styles.logoArrow}>↑</Text>
          <Text style={styles.logoN}>N</Text>
        </View>
        <Text style={styles.wordmark}>GoNorth</Text>
        <Text style={styles.tagline}>Canada's ride & delivery platform</Text>
      </View>

      {/* Feature strips */}
      <View style={styles.features}>
        <FeatureRow icon="🚗" label="Carpool across provinces" />
        <FeatureRow icon="📦" label="Send packages with trusted drivers" />
        <FeatureRow icon="🍁" label="Built for Canadian roads" />
      </View>

      {/* CTA */}
      <View style={styles.actions}>
        <Button
          title="Get started"
          size="lg"
          onPress={() => navigation.navigate('Register')}
          style={styles.primaryBtn}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.signInBtn}
        >
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoArrow: { fontSize: 18, color: Colors.white, lineHeight: 20, marginBottom: -4 },
  logoN: { fontSize: 34, fontWeight: '900', color: Colors.white, lineHeight: 36 },

  wordmark: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  features: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  featureLabel: { fontSize: FontSize.md, color: Colors.white, fontWeight: '500' },

  actions: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  primaryBtn: { width: '100%' },
  signInBtn: {
    width: '100%', height: 58, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  signInText: { fontSize: 17, fontWeight: '600', color: Colors.white },
  legal: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

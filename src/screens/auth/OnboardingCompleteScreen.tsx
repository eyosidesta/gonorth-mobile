import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { extractError } from '../../lib/error';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingCompleteScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleEnter = async () => {
    setLoading(true);
    try {
      await usersApi.updateProfile({ onboardingCompleted: true });
      const { data: user } = await usersApi.me();
      setUser(user);
      // Root navigator will switch to Main automatically
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.secondary} />
        </View>

        <Text style={styles.title}>Profile completed!</Text>
        <Text style={styles.subtitle}>
          Welcome to GoNorth. You can now book rides, offer trips, and send packages
          across Canada.
        </Text>

        <View style={styles.features}>
          <Feature icon="🚗" text="Find carpools going your way" />
          <Feature icon="📦" text="Send packages with trusted drivers" />
          <Feature icon="🍁" text="Connect with Canadian travellers" />
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Enter GoNorth"
          size="lg"
          onPress={handleEnter}
          loading={loading}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: Colors.secondaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28, fontWeight: '800', color: Colors.textPrimary,
    textAlign: 'center', marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: Spacing.xl,
  },
  features: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  feature: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  featureText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500', flex: 1 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  btn: {},
});

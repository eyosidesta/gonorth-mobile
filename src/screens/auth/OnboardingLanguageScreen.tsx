import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { usersApi } from '../../api/users.api';
import { extractError } from '../../lib/error';

type Lang = 'en' | 'fr';

const LANGS: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇨🇦' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇨🇦' },
];

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingLanguageScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<Lang>('en');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await usersApi.updateProfile({ preferredLanguage: selected });
      navigation.navigate('OnboardingPhoto');
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to save. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={6}
      totalSteps={9}
      title="Preferred language"
      subtitle="GoNorth supports both of Canada's official languages."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.options}>
        {LANGS.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langCard, isSelected && styles.langCardSelected]}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={styles.langText}>
                <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                  {lang.label}
                </Text>
                <Text style={styles.langNative}>{lang.native}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title="Continue"
        size="lg"
        onPress={handleContinue}
        loading={loading}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  options: { gap: Spacing.md, marginBottom: Spacing.xl },
  langCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md,
  },
  langCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  langFlag: { fontSize: 28 },
  langText: { flex: 1 },
  langLabel: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  langLabelSelected: { color: Colors.primary },
  langNative: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  btn: {},
});

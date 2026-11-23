import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { usersApi } from '../../api/users.api';
import { extractError } from '../../lib/error';

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

const OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Man', icon: '👨' },
  { value: 'female', label: 'Woman', icon: '👩' },
  { value: 'other', label: 'Non-binary / Other', icon: '🏳️‍🌈' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🙈' },
];

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingGenderScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<Gender | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await usersApi.updateProfile({ gender: selected });
      navigation.navigate('OnboardingLanguage');
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to save. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={9}
      title="How do you identify?"
      subtitle="This helps other members know who they're riding with."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => setSelected(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{opt.icon}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {opt.label}
              </Text>
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
        disabled={!selected}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm, marginBottom: Spacing.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: 16, paddingHorizontal: Spacing.md,
  },
  rowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  label: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  labelSelected: { color: Colors.primary, fontWeight: '600' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  btn: { marginTop: Spacing.xs },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { usersApi } from '../../api/users.api';
import { extractError } from '../../lib/error';

const PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingProvinceScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await usersApi.updateProfile({ province: selected as any });
      navigation.navigate('OnboardingPhone');
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to save. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={9}
      title="Your province"
      subtitle="This helps us show you relevant trips and comply with regional rules."
      onBack={() => navigation.goBack()}
      scrollable
    >
      <View style={styles.list}>
        {PROVINCES.map((p) => {
          const isSelected = selected === p.code;
          return (
            <TouchableOpacity
              key={p.code}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => setSelected(p.code)}
              activeOpacity={0.7}
            >
              <View style={styles.codeChip}>
                <Text style={styles.codeText}>{p.code}</Text>
              </View>
              <Text style={[styles.provinceName, isSelected && styles.provinceNameSelected]}>
                {p.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title="Continue"
        size="lg"
        onPress={handleContinue}
        disabled={!selected}
        loading={loading}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.xs, marginBottom: Spacing.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: 13, paddingHorizontal: Spacing.md,
  },
  rowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  codeChip: {
    width: 36, height: 24, borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  codeText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.textSecondary },
  provinceName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  provinceNameSelected: { color: Colors.primary, fontWeight: '600' },
  btn: { marginTop: Spacing.xs, marginBottom: Spacing.xl },
});

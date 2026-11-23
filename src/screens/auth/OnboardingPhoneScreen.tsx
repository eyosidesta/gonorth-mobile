import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { authApi } from '../../api/auth.api';
import { extractError } from '../../lib/error';

const schema = z.object({
  phone: z.string().regex(/^\+1[2-9]\d{9}$/, 'Enter a Canadian number: +14165551234'),
});

type FormData = z.infer<typeof schema>;
type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingPhoneScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '+1' },
  });

  const onSubmit = async ({ phone }: FormData) => {
    setLoading(true);
    try {
      await authApi.sendPhoneOtp(phone);
      navigation.navigate('OnboardingPhoneVerify', { phone });
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to send verification code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={9}
      title="Phone number"
      subtitle="We'll send a 6-digit code to verify it's you. Standard rates may apply."
      onBack={() => navigation.goBack()}
    >
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Phone number"
            value={value}
            onChangeText={onChange}
            placeholder="+14165551234"
            keyboardType="phone-pad"
            autoFocus
            error={errors.phone?.message}
          />
        )}
      />

      <Text style={styles.hint}>
        <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textMuted} />
        {' '}Canadian numbers only (+1…)
      </Text>

      <Button
        title="Send code"
        size="lg"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: -Spacing.xs, marginBottom: Spacing.lg },
  btn: {},
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { authApi } from '../../api/auth.api';
import { extractError } from '../../lib/error';

const schema = z.object({
  phone: z
    .string()
    .regex(/^\+1[2-9]\d{9}$/, 'Enter a Canadian number: +14165551234'),
});

type FormData = z.infer<typeof schema>;
type Props = { navigation: NativeStackNavigationProp<any> };

export default function PhoneScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '+1' },
  });

  const onSubmit = async ({ phone }: FormData) => {
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to send verification code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Your phone number</Text>
          <Text style={styles.subtitle}>
            We'll send a 6-digit code to verify it's you. Standard rates may apply.
          </Text>

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
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  backBtn: {
    marginTop: Spacing.md,
    marginLeft: Spacing.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  btn: { marginTop: Spacing.xs },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
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
  firstName: z.string().trim().min(2, 'At least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'At least 2 characters').max(50),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;
type Props = { navigation: NativeStackNavigationProp<any> };

export default function RegisterScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase(),
        password: data.password,
      });
      navigation.navigate('EmailVerify', { email: data.email.toLowerCase() });
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Registration failed. Please try again.'));
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

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join thousands of Canadians sharing rides across the country.
          </Text>

          <View style={styles.row}>
            <View style={styles.half}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="First name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Josiah"
                    autoCapitalize="words"
                    autoFocus
                    error={errors.firstName?.message}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Last name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Desta"
                    autoCapitalize="words"
                    error={errors.lastName?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email address"
                value={value}
                onChangeText={onChange}
                placeholder="josiah@gonorth.ca"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                placeholder="Min. 8 characters"
                secureTextEntry={!showPass}
                error={errors.password?.message}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm password"
                value={value}
                onChangeText={onChange}
                placeholder="Repeat password"
                secureTextEntry={!showConfirm}
                error={errors.confirmPassword?.message}
                rightElement={
                  <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />
            )}
          />

          <Button
            title="Continue"
            size="lg"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.btn}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },
  btn: { marginTop: Spacing.sm },
  link: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { fontSize: 14, color: Colors.textSecondary },
  linkBold: { color: Colors.primary, fontWeight: '600' },
});

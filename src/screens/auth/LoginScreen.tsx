import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { authApi } from '../../api/auth.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { extractError } from '../../lib/error';
import { getResumeScreen } from '../../lib/onboarding';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;
type Props = { navigation: NativeStackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: tokens } = await authApi.login(data.email.toLowerCase(), data.password);
      await SecureStore.setItemAsync('access_token', tokens.accessToken);
      await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
      const { data: user } = await usersApi.me();
      setUser(user);
      if (!user.onboardingCompleted) {
        const resumeScreen = getResumeScreen(user);
        if (resumeScreen === 'EmailVerify') {
          navigation.navigate('EmailVerify', { email: data.email.toLowerCase() });
        } else {
          navigation.navigate(resumeScreen);
        }
      }
      // if onboardingCompleted, root navigator auto-switches to Main
    } catch (e: any) {
      Alert.alert('Sign in failed', extractError(e, 'Invalid email or password'));
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your GoNorth account</Text>

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
                autoFocus
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
                placeholder="Your password"
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

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign in"
            size="lg"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.btn}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
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
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl },
  forgotLink: { alignSelf: 'flex-end', marginTop: -Spacing.xs, marginBottom: Spacing.lg },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  btn: { marginTop: Spacing.xs },
  link: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { fontSize: 14, color: Colors.textSecondary },
  linkBold: { color: Colors.primary, fontWeight: '600' },
});

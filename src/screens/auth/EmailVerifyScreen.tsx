import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Alert, Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { authApi } from '../../api/auth.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { extractError } from '../../lib/error';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ EmailVerify: { email: string } }, 'EmailVerify'>;
};

const CODE_LENGTH = 6;

export default function EmailVerifyScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const focus = setTimeout(() => inputRef.current?.focus(), 300);
    const tick = setInterval(() => setResendTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => { clearTimeout(focus); clearInterval(tick); };
  }, []);

  const handleVerify = async (finalCode: string) => {
    if (finalCode.length !== CODE_LENGTH) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const { data } = await authApi.verifyEmail(email, finalCode);
      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      // Navigate to onboarding — don't set user yet (profile incomplete)
      navigation.navigate('OnboardingProvince');
    } catch (e: any) {
      setCode('');
      Alert.alert('Error', extractError(e, 'Invalid or expired code'));
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.verifyEmail(email, '000000');
      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      navigation.navigate('OnboardingProvince');
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Could not skip verification'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) handleVerify(digits);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authApi.resendEmailOtp(email);
      setResendTimer(60);
      setCode('');
      Alert.alert('Code sent', 'A new verification code was sent to your email.');
    } catch {
      Alert.alert('Error', 'Failed to resend code.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="mail-outline" size={32} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <TouchableOpacity
          style={styles.codeContainer}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.cell,
                code.length === i && styles.cellActive,
                code[i] && styles.cellFilled,
              ]}
            >
              <Text style={styles.cellText}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          style={styles.hiddenInput}
        />

        <Button
          title="Verify email"
          size="lg"
          onPress={() => handleVerify(code)}
          loading={loading}
          disabled={code.length !== CODE_LENGTH}
          style={styles.btn}
        />

        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} style={styles.resend}>
          <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, alignItems: 'center' },
  iconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  email: { fontWeight: '700', color: Colors.textPrimary },
  codeContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: Spacing.xl },
  cell: {
    width: 46, height: 56, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  cellActive: { borderColor: Colors.primary, borderWidth: 2 },
  cellFilled: { borderColor: Colors.borderStrong },
  cellText: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0 },
  btn: { width: '100%', marginBottom: Spacing.lg },
  resend: { paddingVertical: Spacing.sm },
  resendText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  resendDisabled: { color: Colors.textMuted },
  skip: { marginTop: Spacing.md },
  skipText: { fontSize: 14, color: Colors.textMuted },
});

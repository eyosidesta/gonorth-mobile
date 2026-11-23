import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Colors, Spacing } from '../../constants/theme';
import { authApi } from '../../api/auth.api';
import { extractError } from '../../lib/error';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type FormData = z.infer<typeof schema>;
type Props = { navigation: NativeStackNavigationProp<any> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email.toLowerCase());
      Alert.alert(
        'Check your email',
        'If an account exists for that email, a reset code was sent.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Something went wrong. Please try again.'));
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
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a reset code.
          </Text>

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

          <Button
            title="Send reset code"
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
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  btn: { marginTop: Spacing.sm },
});

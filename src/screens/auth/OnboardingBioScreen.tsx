import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { usersApi } from '../../api/users.api';
import { extractError } from '../../lib/error';

const MAX_BIO = 500;
type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingBioScreen({ navigation }: Props) {
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = bio.trim();
    if (trimmed.length < 10) {
      Alert.alert('Too short', 'Please write at least 10 characters about yourself.');
      return;
    }
    setLoading(true);
    try {
      await usersApi.updateProfile({ bio: trimmed });
      navigation.navigate('OnboardingNotifications');
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to save. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={8}
      totalSteps={9}
      title="About you"
      subtitle="Tell other members a bit about yourself — what you do, where you're from, what you enjoy."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, MAX_BIO))}
          placeholder="I'm a software developer from Montreal who loves road trips and finding new coffee spots along the way…"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
        />
        <Text style={[styles.charCount, bio.length >= MAX_BIO && styles.charCountLimit]}>
          {bio.length}/{MAX_BIO}
        </Text>
      </View>

      <Button
        title="Continue"
        size="lg"
        onPress={handleContinue}
        loading={loading}
        disabled={bio.trim().length < 10}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  input: {
    fontSize: FontSize.md, color: Colors.textPrimary,
    lineHeight: 22, minHeight: 140,
  },
  charCount: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    textAlign: 'right', marginTop: Spacing.xs,
  },
  charCountLimit: { color: Colors.danger },
  btn: {},
});

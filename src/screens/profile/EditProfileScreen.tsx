import React, { useState } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/auth.store';
import { usersApi } from '../../api/users.api';
import { extractError } from '../../lib/error';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'First name and last name are required.');
      return;
    }
    setLoading(true);
    try {
      await usersApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });
      const { data: updated } = await usersApi.me();
      setUser(updated);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to update profile.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCorrect={false}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCorrect={false}
            />
            <Input
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button title="Save Changes" onPress={handleSave} loading={loading} style={styles.btn} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  btn: { marginTop: Spacing.sm },
});

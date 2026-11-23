import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { usersApi } from '../../api/users.api';
import { extractError } from '../../lib/error';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingNotificationsScreen({ navigation }: Props) {
  const [push, setPush] = useState(true);
  const [sms, setSms] = useState(false);
  const [email, setEmail] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await usersApi.updateProfile({
        notifPush: push,
        notifSms: sms,
        notifEmail: email,
        notifMarketing: marketing,
      });
      navigation.navigate('OnboardingComplete');
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to save. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={9}
      totalSteps={9}
      title="Notifications"
      subtitle="Stay in the loop. You can change these anytime in settings."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.list}>
        <ToggleRow
          title="Push notifications"
          description="Booking updates, messages, and alerts"
          value={push}
          onChange={setPush}
        />
        <ToggleRow
          title="SMS notifications"
          description="Critical trip updates via text message"
          value={sms}
          onChange={setSms}
        />
        <ToggleRow
          title="Email notifications"
          description="Receipts, confirmations, and account updates"
          value={email}
          onChange={setEmail}
        />
        <ToggleRow
          title="GoNorth updates"
          description="New features, promotions, and travel tips"
          value={marketing}
          onChange={setMarketing}
        />
      </View>

      <Button
        title="Finish setup"
        size="lg"
        onPress={handleContinue}
        loading={loading}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

function ToggleRow({
  title, description, value, onChange,
}: {
  title: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm, marginBottom: Spacing.xl },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.md,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  rowDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  btn: {},
});

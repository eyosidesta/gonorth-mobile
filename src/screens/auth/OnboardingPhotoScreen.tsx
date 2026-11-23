import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingPhotoScreen({ navigation }: Props) {
  return (
    <OnboardingLayout
      step={7}
      totalSteps={9}
      title="Profile photo"
      subtitle="A photo helps other members recognize you and builds trust."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={64} color={Colors.textMuted} />
          </View>
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={16} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.hint}>
          Photo uploads are coming soon. You can add one later from your profile.
        </Text>
      </View>

      <Button
        title="Skip for now"
        size="lg"
        onPress={() => navigation.navigate('OnboardingBio')}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: Spacing.xl },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.xl },
  avatar: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute', bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  hint: {
    fontSize: FontSize.sm, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  btn: { marginBottom: Spacing.xl },
});

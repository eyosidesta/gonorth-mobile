import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
  scrollable = false,
}: Props) {
  const content = (
    <SafeAreaView style={styles.safe}>
      {/* progress + back */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.progressTrack}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < step ? styles.progressDotDone : undefined,
                i === step - 1 ? styles.progressDotActive : undefined,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>{step}/{totalSteps}</Text>
      </View>

      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {scrollable ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </SafeAreaView>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.flex}>{content}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotDone: { backgroundColor: Colors.secondary },
  progressDotActive: { backgroundColor: Colors.primary },
  stepLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, minWidth: 28, textAlign: 'right' },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  body: { flex: 1, paddingHorizontal: Spacing.xl },
  bodyContent: { paddingBottom: Spacing.xxl },
});

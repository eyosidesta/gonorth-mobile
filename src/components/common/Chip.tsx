import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radius } from '../../constants/theme';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

interface Props {
  label: string;
  variant?: Variant;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const palette: Record<Variant, { bg: string; text: string; border?: string }> = {
  default:  { bg: Colors.surfaceVariant, text: Colors.textSecondary },
  primary:  { bg: Colors.primaryLight,   text: Colors.primary },
  success:  { bg: Colors.secondaryLight, text: Colors.secondary },
  warning:  { bg: Colors.warningLight,   text: Colors.warning },
  danger:   { bg: Colors.dangerLight,    text: Colors.danger },
  outline:  { bg: 'transparent',         text: Colors.primary, border: Colors.primary },
};

export default function Chip({ label, variant = 'default', selected, onPress, style }: Props) {
  const v = palette[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.base,
        { backgroundColor: selected ? Colors.primary : v.bg },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : undefined,
        style,
      ]}
    >
      <Text style={[styles.label, { color: selected ? Colors.white : v.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  label: { fontSize: FontSize.xs, fontWeight: '600' },
});

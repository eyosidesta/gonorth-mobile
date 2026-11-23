import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, FontSize, Spacing } from '../../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor = variant === 'primary' || variant === 'secondary' || variant === 'danger'
    ? Colors.white
    : Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[`size_${size}`], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  // variants
  primary:   { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.secondary },
  outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: Colors.danger },
  // sizes
  size_sm: { height: 40, paddingHorizontal: Spacing.md },
  size_md: { height: 52 },
  size_lg: { height: 58 },
  // disabled
  disabled: { opacity: 0.48 },
  // text base
  text: { fontWeight: '600', color: Colors.white },
  // text variants
  text_primary:   { color: Colors.white },
  text_secondary: { color: Colors.white },
  text_outline:   { color: Colors.primary },
  text_ghost:     { color: Colors.primary },
  text_danger:    { color: Colors.white },
  // text sizes
  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.md },
  textSize_lg: { fontSize: FontSize.lg },
});

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export default function Input({ label, error, style, rightElement, ...props }: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          style={[styles.input, !!rightElement && styles.inputWithRight, style]}
          placeholderTextColor={Colors.textMuted}
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  inputRowError: { borderColor: Colors.danger },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    height: '100%',
  },
  inputWithRight: { paddingRight: 0 },
  rightElement: { paddingHorizontal: Spacing.md, justifyContent: 'center' },
  error: { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
});

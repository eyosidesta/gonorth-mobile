import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/auth/OnboardingLayout';
import Button from '../../components/common/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { usersApi } from '../../api/users.api';
import { extractError } from '../../lib/error';

const MIN_AGE = 18;

function defaultDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d;
}

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingDobScreen({ navigation }: Props) {
  const [date, setDate] = useState<Date>(defaultDate);
  const [selected, setSelected] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - MIN_AGE);
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      setDate(selectedDate);
      setSelected(true);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const iso = date.toISOString().slice(0, 10);
      await usersApi.updateProfile({ dateOfBirth: iso });
      navigation.navigate('OnboardingGender');
    } catch (e: any) {
      Alert.alert('Error', extractError(e, 'Failed to save. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = selected
    ? date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Select your date of birth';

  return (
    <OnboardingLayout
      step={4}
      totalSteps={9}
      title="Date of birth"
      subtitle="We use this to verify you meet the age requirement (18+)."
      onBack={() => navigation.goBack()}
    >
      <TouchableOpacity
        style={[styles.trigger, show && styles.triggerActive]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={20} color={selected ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.triggerText, !selected && styles.triggerPlaceholder]}>
          {formattedDate}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* iOS: modal sheet; Android: dialog shown directly */}
      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Date of Birth</Text>
                <TouchableOpacity onPress={() => { setSelected(true); setShow(false); }}>
                  <Text style={styles.sheetDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onChange}
                maximumDate={maxDate}
                minimumDate={minDate}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChange}
            maximumDate={maxDate}
            minimumDate={minDate}
          />
        )
      )}

      <Button
        title="Continue"
        size="lg"
        onPress={handleContinue}
        loading={loading}
        disabled={!selected}
        style={styles.btn}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: 16, paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  triggerActive: { borderColor: Colors.primary },
  triggerText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  triggerPlaceholder: { color: Colors.textMuted, fontWeight: '400' },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  sheetDone: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  iosPicker: { height: 220 },
  btn: {},
});

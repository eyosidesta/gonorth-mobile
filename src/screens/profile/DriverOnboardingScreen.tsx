import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { driversApi, CreateVehicleDto } from '../../api/drivers.api';
import { extractError } from '../../lib/error';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVINCES = [
  { label: 'Ontario', value: 'ON' },
  { label: 'Quebec', value: 'QC' },
  { label: 'British Columbia', value: 'BC' },
  { label: 'Alberta', value: 'AB' },
  { label: 'Manitoba', value: 'MB' },
  { label: 'Saskatchewan', value: 'SK' },
  { label: 'Nova Scotia', value: 'NS' },
  { label: 'New Brunswick', value: 'NB' },
  { label: 'Prince Edward Island', value: 'PE' },
  { label: 'Newfoundland & Labrador', value: 'NL' },
  { label: 'Yukon', value: 'YT' },
  { label: 'Northwest Territories', value: 'NT' },
  { label: 'Nunavut', value: 'NU' },
];

type StepId = 'license' | 'vehicle' | 'success';

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: StepId }) {
  const steps: StepId[] = ['license', 'vehicle', 'success'];
  const current = steps.indexOf(step);
  return (
    <View style={S.progressRow}>
      {steps.slice(0, -1).map((s, i) => (
        <View key={s} style={[S.progressSegment, i < current && S.progressDone, i === current && S.progressActive]} />
      ))}
    </View>
  );
}

// ─── Photo picker tile ────────────────────────────────────────────────────────

function PhotoTile({
  label, uri, required, onPick,
}: { label: string; uri: string | null; required?: boolean; onPick: () => void }) {
  return (
    <TouchableOpacity style={[S.photoTile, uri && S.photoTileFilled]} onPress={onPick} activeOpacity={0.8}>
      {uri ? (
        <View style={S.photoPreview}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.primary} />
          <Text style={S.photoPreviewLabel} numberOfLines={1}>{label}</Text>
          <Text style={S.photoChange}>Tap to change</Text>
        </View>
      ) : (
        <View style={S.photoEmpty}>
          <View style={S.photoIconWrap}>
            <Ionicons name="camera-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={S.photoLabel}>{label}</Text>
          {required && <Text style={S.photoRequired}>Required</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Step 1: License ──────────────────────────────────────────────────────────

function StepLicense({
  onNext, onBack,
}: { onNext: (frontUri: string, backUri: string | null) => void; onBack: () => void }) {
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const pickImage = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (side === 'front') setFrontUri(uri);
      else setBackUri(uri);
    }
  };

  const handleNext = async () => {
    if (!frontUri) {
      Alert.alert('Required', 'Please upload the front of your licence.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('licenseFront', {
        uri: frontUri,
        name: 'license_front.jpg',
        type: 'image/jpeg',
      } as any);
      if (backUri) {
        formData.append('licenseBack', {
          uri: backUri,
          name: 'license_back.jpg',
          type: 'image/jpeg',
        } as any);
      }
      await driversApi.createProfile(formData);
      onNext(frontUri, backUri);
    } catch (e: any) {
      // 409 = profile already exists, just move on
      if (e?.response?.status === 409) {
        onNext(frontUri, backUri);
      } else {
        Alert.alert('Upload failed', extractError(e, 'Could not upload licence. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={S.stepWrap}>
      <Text style={S.stepTitle}>Driver's Licence</Text>
      <Text style={S.stepSub}>
        Upload a clear photo of your Canadian driver's licence. Front is required, back is optional.
      </Text>

      <View style={S.photoRow}>
        <PhotoTile label="Front" uri={frontUri} required onPick={() => pickImage('front')} />
        <PhotoTile label="Back" uri={backUri} onPick={() => pickImage('back')} />
      </View>

      <View style={S.tipBox}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.secondary} />
        <Text style={S.tipText}>
          Photos are stored securely and only used for identity verification. Max 10MB per image.
        </Text>
      </View>

      <View style={S.footer}>
        <TouchableOpacity style={S.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={S.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.nextBtn, loading && S.nextBtnDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={S.nextBtnTxt}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 2: Vehicle ──────────────────────────────────────────────────────────

function StepVehicle({
  onNext, onBack,
}: { onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useState<CreateVehicleDto>({
    make: '', model: '', year: new Date().getFullYear(),
    color: '', plateNumber: '', province: 'ON',
    passengerSeatCount: 4, hasAc: true,
  });
  const [showProvinces, setShowProvinces] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof CreateVehicleDto, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const selectedProvince = PROVINCES.find(p => p.value === form.province);

  const validate = (): string | null => {
    if (!form.make.trim())        return 'Make is required (e.g. Toyota)';
    if (!form.model.trim())       return 'Model is required (e.g. Camry)';
    if (!form.color.trim())       return 'Colour is required';
    if (!form.plateNumber.trim()) return 'Licence plate is required';
    if (form.year < 1990 || form.year > new Date().getFullYear() + 1)
      return `Year must be between 1990 and ${new Date().getFullYear() + 1}`;
    return null;
  };

  const handleNext = async () => {
    const err = validate();
    if (err) { Alert.alert('Required', err); return; }

    setLoading(true);
    try {
      await driversApi.addVehicle(form);
      onNext();
    } catch (e: any) {
      Alert.alert('Could not add vehicle', extractError(e, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (showProvinces) {
    return (
      <View style={S.stepWrap}>
        <Text style={S.stepTitle}>Select Province</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {PROVINCES.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[S.provinceRow, p.value === form.province && S.provinceRowActive]}
              onPress={() => { set('province', p.value); setShowProvinces(false); }}
            >
              <Text style={[S.provinceTxt, p.value === form.province && S.provinceTxtActive]}>
                {p.label}
              </Text>
              {p.value === form.province && (
                <Ionicons name="checkmark" size={18} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={S.stepWrap} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={S.stepTitle}>Your Vehicle</Text>
        <Text style={S.stepSub}>This vehicle will be listed on your trips.</Text>

        <View style={S.formGroup}>
          <Text style={S.label}>Make</Text>
          <TextInput
            style={S.input}
            value={form.make}
            onChangeText={v => set('make', v)}
            placeholder="e.g. Toyota"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={S.formGroup}>
          <Text style={S.label}>Model</Text>
          <TextInput
            style={S.input}
            value={form.model}
            onChangeText={v => set('model', v)}
            placeholder="e.g. Camry"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={S.formRow}>
          <View style={[S.formGroup, { flex: 1 }]}>
            <Text style={S.label}>Year</Text>
            <TextInput
              style={S.input}
              value={String(form.year)}
              onChangeText={v => set('year', parseInt(v) || form.year)}
              keyboardType="number-pad"
              maxLength={4}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={[S.formGroup, { flex: 1 }]}>
            <Text style={S.label}>Colour</Text>
            <TextInput
              style={S.input}
              value={form.color}
              onChangeText={v => set('color', v)}
              placeholder="e.g. Silver"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <View style={S.formGroup}>
          <Text style={S.label}>Licence Plate</Text>
          <TextInput
            style={S.input}
            value={form.plateNumber}
            onChangeText={v => set('plateNumber', v.toUpperCase())}
            placeholder="e.g. ABCD 123"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
          />
        </View>

        <View style={S.formGroup}>
          <Text style={S.label}>Province of Registration</Text>
          <TouchableOpacity style={S.selectBtn} onPress={() => setShowProvinces(true)}>
            <Text style={S.selectBtnTxt}>{selectedProvince?.label ?? 'Select province'}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={S.formGroup}>
          <Text style={S.label}>Passenger Seats</Text>
          <View style={S.stepper}>
            <TouchableOpacity
              style={S.stepperBtn}
              onPress={() => set('passengerSeatCount', Math.max(1, form.passengerSeatCount - 1))}
            >
              <Ionicons name="remove" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={S.stepperVal}>{form.passengerSeatCount}</Text>
            <TouchableOpacity
              style={S.stepperBtn}
              onPress={() => set('passengerSeatCount', Math.min(8, form.passengerSeatCount + 1))}
            >
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={S.stepperHint}>Seats available for passengers (excluding driver)</Text>
        </View>

        <View style={S.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={S.label}>Air Conditioning</Text>
            <Text style={S.switchSub}>Does your vehicle have A/C?</Text>
          </View>
          <Switch
            value={form.hasAc}
            onValueChange={v => set('hasAc', v)}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={form.hasAc ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={[S.footer, { marginTop: Spacing.lg }]}>
          <TouchableOpacity style={S.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            <Text style={S.backBtnTxt}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.nextBtn, loading && S.nextBtnDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={S.nextBtnTxt}>Submit</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────

function StepSuccess({ onDone }: { onDone: () => void }) {
  return (
    <View style={S.successWrap}>
      <View style={S.successIcon}>
        <Ionicons name="shield-checkmark" size={72} color={Colors.primary} />
      </View>
      <Text style={S.successTitle}>Application submitted!</Text>
      <Text style={S.successSub}>
        Your driver application is under review. We'll notify you once your licence is verified — usually within 24 hours.
      </Text>
      <View style={S.successCards}>
        <View style={S.successCard}>
          <Ionicons name="document-text-outline" size={22} color={Colors.primary} />
          <Text style={S.successCardTxt}>Licence uploaded</Text>
        </View>
        <View style={S.successCard}>
          <Ionicons name="car-outline" size={22} color={Colors.primary} />
          <Text style={S.successCardTxt}>Vehicle added</Text>
        </View>
        <View style={S.successCard}>
          <Ionicons name="time-outline" size={22} color={Colors.secondary} />
          <Text style={[S.successCardTxt, { color: Colors.secondary }]}>Pending review</Text>
        </View>
      </View>
      <TouchableOpacity style={S.nextBtn} onPress={onDone}>
        <Text style={S.nextBtnTxt}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Props = { navigation: NativeStackNavigationProp<any> };

export default function DriverOnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState<StepId>('license');

  return (
    <SafeAreaView style={S.safe}>
      {/* Header */}
      <View style={S.header}>
        {step !== 'success' && (
          <TouchableOpacity
            style={S.headerBack}
            onPress={() => step === 'license' ? navigation.goBack() : setStep('license')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={S.headerTitle}>Become a Driver</Text>
        <View style={{ width: 40 }} />
      </View>

      {step !== 'success' && <ProgressBar step={step} />}

      <View style={S.body}>
        {step === 'license' && (
          <StepLicense
            onNext={() => setStep('vehicle')}
            onBack={() => navigation.goBack()}
          />
        )}
        {step === 'vehicle' && (
          <StepVehicle
            onNext={() => setStep('success')}
            onBack={() => setStep('license')}
          />
        )}
        {step === 'success' && (
          <StepSuccess onDone={() => navigation.goBack()} />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  body:   { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.sm, paddingVertical: 10, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  progressRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 6, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primaryLight },
  progressDone: { backgroundColor: Colors.primary },

  stepWrap: { flex: 1, padding: Spacing.md },
  stepTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  stepSub:   { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 22 },

  // Photo tiles
  photoRow:  { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  photoTile: { flex: 1, height: 140, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  photoTileFilled: { borderStyle: 'solid', borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  photoEmpty: { alignItems: 'center', gap: 8 },
  photoIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  photoLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  photoRequired: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  photoPreview: { alignItems: 'center', gap: 6 },
  photoPreviewLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  photoChange: { fontSize: 11, color: Colors.textMuted },

  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.secondaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  tipText: { flex: 1, fontSize: 13, color: Colors.secondary, lineHeight: 20 },

  // Vehicle form
  formGroup: { marginBottom: Spacing.md },
  formRow:   { flexDirection: 'row', gap: 12 },
  label:     { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:     { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.md, color: Colors.textPrimary },
  selectBtn: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectBtnTxt: { fontSize: FontSize.md, color: Colors.textPrimary },

  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, alignSelf: 'flex-start' },
  stepperBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepperVal: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: Spacing.lg },
  stepperHint: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.xs, marginBottom: Spacing.md },
  switchSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  // Province picker
  provinceRow: { paddingHorizontal: Spacing.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  provinceRowActive: { backgroundColor: Colors.primaryLight },
  provinceTxt: { fontSize: FontSize.md, color: Colors.textPrimary },
  provinceTxtActive: { color: Colors.primary, fontWeight: '600' },

  // Footer nav
  footer:  { flexDirection: 'row', gap: 12, marginTop: 'auto', paddingTop: Spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  backBtnTxt: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  nextBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  nextBtnDisabled: { opacity: 0.6 },

  // Success
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon:  { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  successSub:   { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
  successCards: { width: '100%', gap: 10, marginBottom: Spacing.xl },
  successCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  successCardTxt: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  Alert, TextInput, Switch, ActivityIndicator, Platform, PanResponder,
  FlatList, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { tripsApi } from '../../api/trips.api';
import { driversApi, Vehicle } from '../../api/drivers.api';
import { extractError } from '../../lib/error';
import Button from '../../components/common/Button';

// ─── Google Places helpers ────────────────────────────────────────────────────

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

interface SelectedPlace {
  name: string;
  address: string;
  province: string;
  lat: number;
  lng: number;
  placeId: string;
}

async function fetchSuggestions(input: string): Promise<{ predictions: PlacePrediction[]; error?: string }> {
  if (!PLACES_KEY) return { predictions: [], error: 'API key missing' };
  if (input.length < 3) return { predictions: [] };
  try {
    const qs = `input=${encodeURIComponent(input)}&key=${PLACES_KEY}&language=en&components=country:ca`;
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${qs}`);
    const j = await r.json();
    if (j.status !== 'OK' && j.status !== 'ZERO_RESULTS') {
      return { predictions: [], error: j.error_message ?? j.status };
    }
    return { predictions: j.predictions ?? [] };
  } catch (e: any) {
    return { predictions: [], error: e?.message ?? 'Network error' };
  }
}

async function fetchPlaceDetails(placeId: string): Promise<SelectedPlace | null> {
  try {
    const p = new URLSearchParams({
      place_id: placeId, key: PLACES_KEY,
      fields: 'geometry,formatted_address,address_components,name',
    });
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${p}`);
    const j = await r.json();
    const res = j.result;
    const province = (res.address_components ?? []).find(
      (c: any) => c.types.includes('administrative_area_level_1'),
    )?.short_name ?? 'ON';
    return {
      name: res.name ?? res.formatted_address.split(',')[0].trim(),
      address: res.formatted_address,
      province,
      lat: res.geometry.location.lat,
      lng: res.geometry.location.lng,
      placeId,
    };
  } catch { return null; }
}

// ─── Vehicle DB ───────────────────────────────────────────────────────────────

const VEHICLE_DB: { make: string; model: string; type: string }[] = [
  { make: 'Toyota', model: 'Camry', type: 'Sedan' },
  { make: 'Toyota', model: 'Camry Hybrid', type: 'Sedan' },
  { make: 'Toyota', model: 'Corolla', type: 'Sedan' },
  { make: 'Toyota', model: 'Corolla Cross', type: 'SUV' },
  { make: 'Toyota', model: 'Corolla Hatchback', type: 'Hatchback' },
  { make: 'Toyota', model: 'RAV4', type: 'SUV' },
  { make: 'Toyota', model: 'RAV4 Hybrid', type: 'SUV' },
  { make: 'Toyota', model: 'Highlander', type: 'SUV' },
  { make: 'Toyota', model: 'Highlander Hybrid', type: 'SUV' },
  { make: 'Toyota', model: 'Prius', type: 'Hatchback' },
  { make: 'Toyota', model: 'Sienna', type: 'Minivan' },
  { make: 'Toyota', model: 'Tundra', type: 'Truck' },
  { make: 'Toyota', model: 'Tacoma', type: 'Truck' },
  { make: 'Toyota', model: 'Venza', type: 'SUV' },
  { make: 'Toyota', model: '4Runner', type: 'SUV' },
  { make: 'Toyota', model: 'Avalon', type: 'Sedan' },
  { make: 'Honda', model: 'Civic', type: 'Sedan' },
  { make: 'Honda', model: 'Civic Hatchback', type: 'Hatchback' },
  { make: 'Honda', model: 'Accord', type: 'Sedan' },
  { make: 'Honda', model: 'CR-V', type: 'SUV' },
  { make: 'Honda', model: 'CR-V Hybrid', type: 'SUV' },
  { make: 'Honda', model: 'HR-V', type: 'SUV' },
  { make: 'Honda', model: 'Pilot', type: 'SUV' },
  { make: 'Honda', model: 'Odyssey', type: 'Minivan' },
  { make: 'Honda', model: 'Ridgeline', type: 'Truck' },
  { make: 'Ford', model: 'F-150', type: 'Truck' },
  { make: 'Ford', model: 'Escape', type: 'SUV' },
  { make: 'Ford', model: 'Escape Hybrid', type: 'SUV' },
  { make: 'Ford', model: 'Explorer', type: 'SUV' },
  { make: 'Ford', model: 'Mustang', type: 'Coupe' },
  { make: 'Ford', model: 'Edge', type: 'SUV' },
  { make: 'Ford', model: 'Expedition', type: 'SUV' },
  { make: 'Ford', model: 'Ranger', type: 'Truck' },
  { make: 'Ford', model: 'Bronco', type: 'SUV' },
  { make: 'Chevrolet', model: 'Silverado 1500', type: 'Truck' },
  { make: 'Chevrolet', model: 'Equinox', type: 'SUV' },
  { make: 'Chevrolet', model: 'Tahoe', type: 'SUV' },
  { make: 'Chevrolet', model: 'Traverse', type: 'SUV' },
  { make: 'Chevrolet', model: 'Malibu', type: 'Sedan' },
  { make: 'Chevrolet', model: 'Colorado', type: 'Truck' },
  { make: 'Hyundai', model: 'Elantra', type: 'Sedan' },
  { make: 'Hyundai', model: 'Sonata', type: 'Sedan' },
  { make: 'Hyundai', model: 'Tucson', type: 'SUV' },
  { make: 'Hyundai', model: 'Tucson Hybrid', type: 'SUV' },
  { make: 'Hyundai', model: 'Santa Fe', type: 'SUV' },
  { make: 'Hyundai', model: 'Kona', type: 'SUV' },
  { make: 'Hyundai', model: 'Palisade', type: 'SUV' },
  { make: 'Hyundai', model: 'Ioniq 5', type: 'Hatchback' },
  { make: 'Hyundai', model: 'Ioniq 6', type: 'Sedan' },
  { make: 'Kia', model: 'Forte', type: 'Sedan' },
  { make: 'Kia', model: 'Soul', type: 'Hatchback' },
  { make: 'Kia', model: 'Sportage', type: 'SUV' },
  { make: 'Kia', model: 'Sorento', type: 'SUV' },
  { make: 'Kia', model: 'Telluride', type: 'SUV' },
  { make: 'Kia', model: 'EV6', type: 'Hatchback' },
  { make: 'Nissan', model: 'Sentra', type: 'Sedan' },
  { make: 'Nissan', model: 'Altima', type: 'Sedan' },
  { make: 'Nissan', model: 'Rogue', type: 'SUV' },
  { make: 'Nissan', model: 'Murano', type: 'SUV' },
  { make: 'Nissan', model: 'Pathfinder', type: 'SUV' },
  { make: 'Nissan', model: 'Kicks', type: 'SUV' },
  { make: 'Mazda', model: 'Mazda3', type: 'Sedan' },
  { make: 'Mazda', model: 'Mazda3 Sport', type: 'Hatchback' },
  { make: 'Mazda', model: 'CX-5', type: 'SUV' },
  { make: 'Mazda', model: 'CX-50', type: 'SUV' },
  { make: 'Subaru', model: 'Outback', type: 'Wagon' },
  { make: 'Subaru', model: 'Forester', type: 'SUV' },
  { make: 'Subaru', model: 'Ascent', type: 'SUV' },
  { make: 'Subaru', model: 'Crosstrek', type: 'SUV' },
  { make: 'Volkswagen', model: 'Jetta', type: 'Sedan' },
  { make: 'Volkswagen', model: 'Tiguan', type: 'SUV' },
  { make: 'Volkswagen', model: 'Atlas', type: 'SUV' },
  { make: 'BMW', model: '3 Series', type: 'Sedan' },
  { make: 'BMW', model: '5 Series', type: 'Sedan' },
  { make: 'BMW', model: 'X3', type: 'SUV' },
  { make: 'BMW', model: 'X5', type: 'SUV' },
  { make: 'Mercedes-Benz', model: 'C-Class', type: 'Sedan' },
  { make: 'Mercedes-Benz', model: 'E-Class', type: 'Sedan' },
  { make: 'Mercedes-Benz', model: 'GLC', type: 'SUV' },
  { make: 'Audi', model: 'A4', type: 'Sedan' },
  { make: 'Audi', model: 'Q5', type: 'SUV' },
  { make: 'Dodge', model: 'Challenger', type: 'Coupe' },
  { make: 'Dodge', model: 'Charger', type: 'Sedan' },
  { make: 'Ram', model: '1500', type: 'Truck' },
  { make: 'Jeep', model: 'Grand Cherokee', type: 'SUV' },
  { make: 'Jeep', model: 'Wrangler', type: 'SUV' },
  { make: 'Chrysler', model: 'Pacifica', type: 'Minivan' },
  { make: 'Tesla', model: 'Model 3', type: 'Sedan' },
  { make: 'Tesla', model: 'Model Y', type: 'SUV' },
  { make: 'Tesla', model: 'Model S', type: 'Sedan' },
  { make: 'Tesla', model: 'Model X', type: 'SUV' },
  { make: 'Lexus', model: 'ES', type: 'Sedan' },
  { make: 'Lexus', model: 'RX', type: 'SUV' },
  { make: 'Lexus', model: 'NX', type: 'SUV' },
  { make: 'GMC', model: 'Sierra 1500', type: 'Truck' },
  { make: 'GMC', model: 'Terrain', type: 'SUV' },
  { make: 'GMC', model: 'Yukon', type: 'SUV' },
  { make: 'Mitsubishi', model: 'Outlander', type: 'SUV' },
  { make: 'Acura', model: 'MDX', type: 'SUV' },
  { make: 'Acura', model: 'RDX', type: 'SUV' },
];

const MAKES = [...new Set(VEHICLE_DB.map((v) => v.make))].sort();
const CAR_COLORS = [
  'White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Navy',
  'Green', 'Brown', 'Orange', 'Gold', 'Beige', 'Maroon', 'Light blue',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => String(currentYear - i));

// ─── Types ────────────────────────────────────────────────────────────────────

type TripMode = 'passengers_only' | 'passengers_and_packages' | 'packages_only';
type LuggageSize = 'small' | 'medium' | 'large';
type PackageSize = 'envelope' | 'small' | 'medium' | 'large';
type StepId =
  | 'trip_mode' | 'origin' | 'destination' | 'stops' | 'datetime'
  | 'vehicle' | 'options' | 'seats' | 'packages' | 'price'
  | 'booking_mode' | 'notes' | 'review' | 'success';

interface WizardState {
  tripMode: TripMode;
  origin: SelectedPlace | null;
  destination: SelectedPlace | null;
  stops: SelectedPlace[];
  departureDate: Date | null;
  departureTime: Date | null;
  returnDate: Date | null;
  returnTime: Date | null;
  vehicleId: string | null;
  vehicleMake: string;
  vehicleModel: string;
  vehicleType: string;
  vehicleColor: string;
  vehicleYear: string;
  vehiclePlate: string;
  seats: number;
  maxBackRow: boolean;
  luggageSizes: LuggageSize[];
  acceptPackages: boolean;
  petsAllowed: boolean;
  hasWinterTires: boolean;
  skiEquipment: boolean;
  bikesAllowed: boolean;
  pkgMaxSize: PackageSize;
  pkgPriceEnvelope: number;
  pkgPriceSmall: number;
  pkgPriceMedium: number;
  pkgPriceLarge: number;
  bookingMode: 'instant' | 'request';
  segPrices: number[];
  notes: string;
}

const INITIAL_STATE: WizardState = {
  tripMode: 'passengers_only',
  origin: null, destination: null, stops: [],
  departureDate: null, departureTime: null,
  returnDate: null, returnTime: null,
  vehicleId: null,
  vehicleMake: '', vehicleModel: '', vehicleType: '', vehicleColor: '',
  vehicleYear: String(currentYear), vehiclePlate: '',
  seats: 3, maxBackRow: true,
  luggageSizes: ['small', 'medium'] as LuggageSize[],
  acceptPackages: false,
  petsAllowed: false, hasWinterTires: false, skiEquipment: false, bikesAllowed: false,
  pkgMaxSize: 'medium',
  pkgPriceEnvelope: 5, pkgPriceSmall: 10, pkgPriceMedium: 20, pkgPriceLarge: 35,
  bookingMode: 'request',
  segPrices: [0],
  notes: '',
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function priceMax(km: number) { return Math.max(15, Math.min(500, Math.round(km * 0.20))); }
function priceSuggested(km: number) { return Math.max(5, Math.round(km * 0.10)); }

function formatDate(d: Date) {
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });
}

interface Segment { from: SelectedPlace; to: SelectedPlace; distanceKm: number }

function computeSegments(state: WizardState): Segment[] {
  if (!state.origin || !state.destination) return [];
  const pts = [state.origin, ...state.stops, state.destination];
  const fullKm = haversineKm(state.origin.lat, state.origin.lng, state.destination.lat, state.destination.lng);
  const segs: Segment[] = [{ from: state.origin, to: state.destination, distanceKm: fullKm }];
  if (state.stops.length > 0) {
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push({ from: pts[i], to: pts[i + 1], distanceKm: haversineKm(pts[i].lat, pts[i].lng, pts[i + 1].lat, pts[i + 1].lng) });
    }
  }
  return segs;
}

function initSegPrices(segs: Segment[]): number[] {
  return segs.map((s) => priceSuggested(s.distanceKm));
}

function makeActiveSteps(state: WizardState): StepId[] {
  const steps: StepId[] = ['trip_mode', 'origin', 'destination', 'stops', 'datetime', 'vehicle', 'options'];
  if (state.tripMode !== 'packages_only') steps.push('seats');
  if (state.tripMode !== 'passengers_only') steps.push('packages');
  if (state.tripMode !== 'packages_only') steps.push('price');
  steps.push('booking_mode', 'notes', 'review');
  return steps;
}

function buildPayload(state: WizardState) {
  const pts = [state.origin!, ...state.stops, state.destination!];
  const seqs = [0, ...state.stops.map((_, i) => i + 1), 99];
  const waypoints = pts.map((p, i) => ({
    type: i === 0 ? 'origin' : i === pts.length - 1 ? 'destination' : 'stop',
    sequence: seqs[i], name: p.name, latitude: p.lat, longitude: p.lng, googlePlaceId: p.placeId,
  }));
  const segs = computeSegments(state);
  const segmentPrices = segs.map((seg, i) => {
    if (i === 0) return { fromSequence: 0, toSequence: 99, price: state.segPrices[0] ?? 0, distanceKm: seg.distanceKm };
    const legIdx = i - 1;
    return { fromSequence: seqs[legIdx], toSequence: seqs[legIdx + 1], price: state.segPrices[i] ?? state.segPrices[0] ?? 0, distanceKm: seg.distanceKm };
  });
  if (segmentPrices.length === 0) {
    const km = haversineKm(state.origin!.lat, state.origin!.lng, state.destination!.lat, state.destination!.lng);
    segmentPrices.push({ fromSequence: 0, toSequence: 99, price: state.segPrices[0] ?? 0, distanceKm: km });
  }
  const dep = state.departureDate!;
  const tim = state.departureTime ?? new Date(dep.getFullYear(), dep.getMonth(), dep.getDate(), 8, 0);
  const departureAt = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate(), tim.getHours(), tim.getMinutes()).toISOString();
  return {
    ...(state.vehicleId ? { vehicleId: state.vehicleId } : {}),
    bookingMode: state.bookingMode,
    departureAt,
    totalPassengerSeats: state.tripMode === 'packages_only' ? 0 : state.seats,
    province: state.origin!.province,
    tripMode: state.tripMode,
    ...(state.tripMode !== 'passengers_only' ? {
      maxPackageSize: state.pkgMaxSize,
      pkgPriceEnvelope: state.pkgPriceEnvelope,
      pkgPriceSmall: state.pkgPriceSmall,
      pkgPriceMedium: state.pkgPriceMedium,
      pkgPriceLarge: state.pkgPriceLarge,
    } : {}),
    preferences: {
      luggageSizes: state.luggageSizes, pets: state.petsAllowed,
      winterTires: state.hasWinterTires, ski: state.skiEquipment,
      bikes: state.bikesAllowed, maxBackRow: state.maxBackRow,
    },
    notes: state.notes || undefined,
    waypoints,
    segmentPrices,
  };
}

// ─── PriceSlider ──────────────────────────────────────────────────────────────

function PriceSlider({ value, min, max, onValueChange }: { value: number; min: number; max: number; onValueChange: (v: number) => void }) {
  const [trackW, setTrackW] = useState(0);
  const trackWRef = useRef(0);
  const startXRef = useRef(0);
  const valRef = useRef(value);
  useEffect(() => { valRef.current = value; }, [value]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const w = trackWRef.current - 28;
      startXRef.current = w > 0 ? ((valRef.current - min) / Math.max(1, max - min)) * w : 0;
    },
    onPanResponderMove: (_, gs) => {
      const w = trackWRef.current - 28;
      if (!w) return;
      const x = Math.max(0, Math.min(w, startXRef.current + gs.dx));
      const newVal = Math.max(min, Math.min(max, Math.round(min + (x / w) * (max - min))));
      if (newVal !== valRef.current) { valRef.current = newVal; onValueChange(newVal); }
    },
  })).current;

  const pct = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const thumbLeft = pct * Math.max(0, trackW - 28);

  return (
    <View
      style={S.sliderContainer}
      onLayout={(e) => { const w = e.nativeEvent.layout.width; trackWRef.current = w; setTrackW(w); }}
    >
      <View style={S.sliderTrack}>
        <View style={[S.sliderFilled, { width: trackW * pct }]} />
      </View>
      {trackW > 0 && (
        <View style={[S.sliderThumb, { left: thumbLeft }]} {...pan.panHandlers} />
      )}
    </View>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function WizHeader({ onBack, title = 'Post a trip' }: { onBack: () => void; title?: string }) {
  return (
    <View style={S.wizHdr}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={S.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={S.wizTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function WizardFrame({
  onBack, title, subtitle, onNext, canNext = true, loading = false,
  nextLabel = 'Next', skipLabel, onSkip, stepIndex, totalSteps, children,
}: {
  onBack: () => void; title: string; subtitle?: string;
  onNext: () => void; canNext?: boolean; loading?: boolean; nextLabel?: string;
  skipLabel?: string; onSkip?: () => void;
  stepIndex: number; totalSteps: number; children: React.ReactNode;
}) {
  const pct = ((stepIndex + 1) / totalSteps) * 100;
  return (
    <SafeAreaView style={S.safe}>
      <WizHeader onBack={onBack} />
      <View style={S.progressTrack}><View style={[S.progressFill, { width: `${pct}%` as any }]} /></View>
      <ScrollView style={S.body} contentContainerStyle={S.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={S.stepTitle}>{title}</Text>
        {subtitle ? <Text style={S.stepSub}>{subtitle}</Text> : null}
        <View style={S.stepBody}>{children}</View>
        <Button title={loading ? '' : nextLabel} size="lg" onPress={onNext} disabled={!canNext} loading={loading} style={S.ctaBtn} />
        {skipLabel && onSkip && (
          <TouchableOpacity onPress={onSkip} style={S.skipLink}>
            <Text style={S.skipLinkTxt}>{skipLabel}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Inline place search (used for origin, destination, and stops)
function PlaceSearchField({
  placeholder, onSelect, autoFocus = true,
}: {
  placeholder: string; onSelect: (p: SelectedPlace) => void; autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = (text: string) => {
    setQuery(text);
    setApiError(null);
    clearTimeout(debRef.current);
    if (text.length < 3) { setSuggestions([]); setSearching(false); return; }
    setSearching(true);
    debRef.current = setTimeout(async () => {
      const result = await fetchSuggestions(text);
      setSearching(false);
      if (result.error) setApiError(result.error);
      else setSuggestions(result.predictions);
    }, 350);
  };

  const handleSelect = async (pred: PlacePrediction) => {
    setSuggestions([]);
    setQuery(pred.description);
    setLoadingPlace(true);
    const place = await fetchPlaceDetails(pred.place_id);
    setLoadingPlace(false);
    if (place) onSelect(place);
  };

  const busy = searching || loadingPlace;

  return (
    <View style={S.placeSearchWrap}>
      <View style={[S.placeInputRow, (suggestions.length > 0 || searching) && S.placeInputFocused]}>
        <Ionicons name="location-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
        <TextInput
          style={S.placeInput}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          autoFocus={autoFocus}
          autoCorrect={false}
          returnKeyType="search"
        />
        {busy
          ? <ActivityIndicator size="small" color={Colors.primary} />
          : query.length > 0
            ? <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); setApiError(null); }}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            : null}
      </View>
      {apiError && (
        <View style={S.placeErrorRow}>
          <Ionicons name="warning-outline" size={16} color={Colors.danger} style={{ marginRight: 6 }} />
          <Text style={S.placeErrorTxt}>{apiError}</Text>
        </View>
      )}
      {!apiError && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={S.placeRow} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} style={{ marginRight: 10, flexShrink: 0 }} />
              <Text style={S.placeRowTxt} numberOfLines={2}>{item.description}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={S.placeRowSep} />}
        />
      )}
      {!apiError && suggestions.length === 0 && !searching && query.length < 3 && (
        <Text style={S.placeHint}>Enter at least three characters to get started</Text>
      )}
    </View>
  );
}

// ─── Step: Trip Mode ──────────────────────────────────────────────────────────

const TRIP_MODES: { value: TripMode; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { value: 'passengers_only', label: 'Passengers only', icon: 'person-outline', desc: 'Offer seats to riders going your way' },
  { value: 'passengers_and_packages', label: 'Passengers & packages', icon: 'cube-outline', desc: 'Fill your car and earn from trunk space' },
  { value: 'packages_only', label: 'Packages only', icon: 'archive-outline', desc: 'Deliver packages — no passengers' },
];

function StepTripMode({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
      title="How will you use GoNorth?" onNext={onNext} canNext>
      {TRIP_MODES.map((m) => {
        const sel = state.tripMode === m.value;
        return (
          <TouchableOpacity key={m.value} style={[S.modeCard, sel && S.modeCardSel]} onPress={() => update({ tripMode: m.value })} activeOpacity={0.75}>
            <View style={[S.modeIconWrap, sel && S.modeIconWrapSel]}>
              <Ionicons name={m.icon} size={22} color={sel ? Colors.primary : Colors.textSecondary} />
            </View>
            <View style={S.modeTxt}>
              <Text style={[S.modeLabel, sel && S.modeLabelSel]}>{m.label}</Text>
              <Text style={S.modeDesc}>{m.desc}</Text>
            </View>
            <View style={[S.radio, sel && S.radioSel]}>{sel && <View style={S.radioDot} />}</View>
          </TouchableOpacity>
        );
      })}
    </WizardFrame>
  );
}

// ─── Step: Origin ─────────────────────────────────────────────────────────────

function StepOrigin({ state, update, onNext, onBack }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <SafeAreaView style={S.safe}>
      <WizHeader onBack={onBack} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={S.placeTitle}>Where are you leaving from?</Text>
        <PlaceSearchField
          placeholder="Enter place of origin"
          onSelect={(p) => { update({ origin: p }); onNext(); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step: Destination ────────────────────────────────────────────────────────

function StepDestination({ state, update, onNext, onBack }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <SafeAreaView style={S.safe}>
      <WizHeader onBack={onBack} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={S.placeTitle}>Where are you going to?</Text>
        <PlaceSearchField
          placeholder="Enter destination"
          onSelect={(p) => { update({ destination: p }); onNext(); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step: Stops ──────────────────────────────────────────────────────────────

function StepStops({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<SelectedPlace | null>(null);

  const confirmStop = () => {
    if (!pending) return;
    update({ stops: [...state.stops, pending] });
    setPending(null);
    setAdding(false);
  };
  const removeStop = (i: number) => {
    const next = [...state.stops]; next.splice(i, 1); update({ stops: next });
  };

  if (adding) {
    return (
      <WizardFrame
        onBack={() => { setAdding(false); setPending(null); }}
        stepIndex={stepIndex} totalSteps={totalSteps}
        title="Add a stop"
        onNext={confirmStop} canNext={!!pending} nextLabel="Confirm Stop"
      >
        <PlaceSearchField placeholder="Search for a stop" onSelect={(p) => setPending(p)} />
        {pending && (
          <View style={{ marginTop: Spacing.md }}>
            <Text style={S.fieldLabel}>Selected stop</Text>
            <View style={S.pendingStopRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: FontSize.md, color: Colors.textPrimary }} numberOfLines={2}>{pending.address}</Text>
              <TouchableOpacity onPress={() => setPending(null)}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </WizardFrame>
    );
  }

  return (
    <WizardFrame
      onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
      title="Can you pick-up people along the way?"
      subtitle="Adding stops helps you get more bookings along your route."
      onNext={onNext} canNext nextLabel="Continue"
    >
      {state.stops.length < 2 && (
        <TouchableOpacity style={S.addStopRow} onPress={() => setAdding(true)}>
          <Text style={S.addStopTxt}>Add Stop</Text>
          <Ionicons name="add" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}
      {state.stops.length > 0 && (
        <View style={{ marginTop: Spacing.sm }}>
          <Text style={S.fieldLabel}>Selected stop{state.stops.length > 1 ? 's' : ''}</Text>
          {state.stops.map((s, i) => (
            <View key={i} style={S.pendingStopRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: FontSize.md, color: Colors.textPrimary }} numberOfLines={2}>{s.address}</Text>
              <TouchableOpacity onPress={() => removeStop(i)}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </WizardFrame>
  );
}

// ─── Step: Date/Time ──────────────────────────────────────────────────────────

function StepDateTime({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  const [tripType, setTripType] = useState<'single' | 'recurring'>('single');
  const [picker, setPicker] = useState<'depDate' | 'depTime' | 'retDate' | 'retTime' | null>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
  const canNext = !!state.departureDate && !!state.departureTime;

  const handleDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (!date) return;
    if (picker === 'depDate') update({ departureDate: date });
    else if (picker === 'depTime') update({ departureTime: date });
    else if (picker === 'retDate') update({ returnDate: date });
    else if (picker === 'retTime') update({ returnTime: date });
    if (Platform.OS === 'android') setPicker(null);
  };

  const DateRow = ({ label, value, field, optional }: { label: string; value: Date | null; field: typeof picker; optional?: boolean }) => (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={S.fieldLabel}>{label}{optional ? <Text style={{ color: Colors.textMuted, fontWeight: '400' }}> (optional)</Text> : null}</Text>
      <TouchableOpacity style={S.dateRow} onPress={() => setPicker(field)} activeOpacity={0.7}>
        <Ionicons name={field?.includes('Date') ? 'calendar-outline' : 'time-outline'} size={20} color={Colors.textSecondary} style={{ marginRight: 10 }} />
        <Text style={[S.dateRowTxt, !value && S.dateRowPlaceholder]}>
          {value ? (field?.includes('Date') ? formatDate(value) : formatTime(value)) : `Select ${label.toLowerCase()}`}
        </Text>
        {value && (
          <TouchableOpacity onPress={() => {
            if (field === 'depDate') update({ departureDate: null });
            else if (field === 'retDate') update({ returnDate: null, returnTime: null });
          }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps} title="When are you leaving?" onNext={onNext} canNext={canNext}>
      {/* Tabs */}
      <View style={S.tabRow}>
        {(['single', 'recurring'] as const).map((t) => (
          <TouchableOpacity key={t} style={[S.tab, tripType === t && S.tabActive]} onPress={() => setTripType(t)}>
            <Text style={[S.tabTxt, tripType === t && S.tabTxtActive]}>{t === 'single' ? 'Single trip' : 'Recurring trip'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tripType === 'recurring' ? (
        <View style={S.comingSoon}>
          <Ionicons name="time-outline" size={52} color={Colors.border} />
          <Text style={S.comingSoonTxt}>Recurring trips coming soon</Text>
        </View>
      ) : (
        <>
          <DateRow label="Leaving date" value={state.departureDate} field="depDate" />
          <DateRow label="Leaving time" value={state.departureTime} field="depTime" />
          <DateRow label="Return date" value={state.returnDate} field="retDate" optional />
          {state.returnDate && <DateRow label="Return time" value={state.returnTime} field="retTime" />}
        </>
      )}

      {/* Pickers */}
      {picker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" onRequestClose={() => setPicker(null)}>
            <TouchableOpacity style={S.pickerBackdrop} activeOpacity={1} onPress={() => setPicker(null)}>
              <TouchableOpacity activeOpacity={1}>
                {picker.includes('Date') ? (
                  <View style={S.calendarCard}>
                    <DateTimePicker
                      value={picker === 'depDate' ? (state.departureDate ?? today) : (state.returnDate ?? today)}
                      mode="date" display="inline"
                      minimumDate={today} maximumDate={maxDate}
                      onChange={(_, d) => { if (d) { if (picker === 'depDate') update({ departureDate: d }); else update({ returnDate: d }); } }}
                      style={{ backgroundColor: '#fff' }}
                    />
                    <Button title="Done" onPress={() => setPicker(null)} style={{ margin: 12 }} />
                  </View>
                ) : (
                  <View style={S.timeSheet}>
                    <Text style={S.timeSheetTitle}>{picker === 'depTime' ? 'Leaving time' : 'Return time'}</Text>
                    <DateTimePicker
                      value={picker === 'depTime' ? (state.departureTime ?? new Date()) : (state.returnTime ?? new Date())}
                      mode="time" display="spinner" minuteInterval={15}
                      onChange={(_, d) => { if (d) { if (picker === 'depTime') update({ departureTime: d }); else update({ returnTime: d }); } }}
                      style={{ height: 200 }}
                    />
                    <TouchableOpacity style={S.timeConfirmBtn} onPress={() => setPicker(null)}>
                      <Text style={S.timeConfirmTxt}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={S.timeCancelBtn} onPress={() => setPicker(null)}>
                      <Text style={S.timeCancelTxt}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={picker === 'depDate' ? (state.departureDate ?? today) :
              picker === 'depTime' ? (state.departureTime ?? new Date()) :
              picker === 'retDate' ? (state.returnDate ?? today) :
              (state.returnTime ?? new Date())}
            mode={picker.includes('Date') ? 'date' : 'time'}
            display="default"
            minimumDate={picker.includes('Date') ? today : undefined}
            maximumDate={picker.includes('Date') ? maxDate : undefined}
            minuteInterval={picker.includes('Time') ? 15 : undefined}
            onChange={handleDateChange}
          />
        )
      )}
    </WizardFrame>
  );
}

// ─── Step: Vehicle ────────────────────────────────────────────────────────────

function StepVehicle({
  state, update, onNext, onBack, stepIndex, totalSteps, existingVehicles, vehicleId, setVehicleId,
}: {
  state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void;
  stepIndex: number; totalSteps: number;
  existingVehicles: Vehicle[]; vehicleId: string | null; setVehicleId: (id: string | null) => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [modelQuery, setModelQuery] = useState(state.vehicleModel || '');
  const modelDebRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [modelSuggestions, setModelSuggestions] = useState<typeof VEHICLE_DB>([]);

  const handleModelChange = (text: string) => {
    setModelQuery(text);
    update({ vehicleModel: text });
    clearTimeout(modelDebRef.current);
    if (text.length < 2) { setModelSuggestions([]); return; }
    modelDebRef.current = setTimeout(() => {
      const q = text.toLowerCase();
      const results = VEHICLE_DB.filter((v) => v.model.toLowerCase().includes(q)).slice(0, 6);
      setModelSuggestions(results);
    }, 200);
  };

  const handleModelSelect = (entry: typeof VEHICLE_DB[0]) => {
    setModelQuery(entry.model);
    update({ vehicleMake: entry.make, vehicleModel: entry.model, vehicleType: entry.type });
    setModelSuggestions([]);
  };

  const canNext = existingVehicles.length > 0
    ? !!vehicleId
    : (state.vehicleModel.length > 0 && state.vehiclePlate.length > 0);

  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
      title="What vehicle will you be driving?"
      subtitle="Adding a vehicle helps build trust and makes it easier for passengers to identify you at pick-up."
      onNext={onNext} canNext={canNext}
      skipLabel={existingVehicles.length === 0 ? 'Skip for now' : undefined}
      onSkip={existingVehicles.length === 0 ? onNext : undefined}>
      {existingVehicles.length > 0 ? (
        <>
          {existingVehicles.map((v) => {
            const sel = vehicleId === v.id;
            return (
              <TouchableOpacity key={v.id} style={[S.vehicleCard, sel && S.vehicleCardSel]} onPress={() => setVehicleId(v.id)} activeOpacity={0.8}>
                <View style={S.vehicleCardInner}>
                  <View style={S.vehicleThumb}>
                    <Ionicons name="car-outline" size={28} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.vehicleCardName}>{v.make} {v.model} {v.year}</Text>
                    <Text style={S.vehicleCardPlate}>{v.licensePlate}</Text>
                  </View>
                  <Ionicons name="pencil-outline" size={18} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={S.addStopRow} onPress={() => setShowAddModal(true)}>
            <Text style={S.addStopTxt}>Add another vehicle</Text>
            <Ionicons name="add" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </>
      ) : (
        /* No existing vehicles: show inline form */
        <>
          <Text style={S.fieldLabel}>Model</Text>
          <View style={S.inputWrap}>
            <TextInput style={S.textInput} value={modelQuery} onChangeText={handleModelChange} placeholder="e.g. Toyota Camry" placeholderTextColor={Colors.textMuted} />
            {modelQuery.length > 0 && <TouchableOpacity onPress={() => { setModelQuery(''); update({ vehicleModel: '', vehicleMake: '', vehicleType: '' }); setModelSuggestions([]); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
            </TouchableOpacity>}
          </View>
          {modelSuggestions.length > 0 && (
            <View style={S.suggestList}>
              {modelSuggestions.map((m, i) => (
                <TouchableOpacity key={i} style={S.suggestRow} onPress={() => handleModelSelect(m)}>
                  <Text style={S.suggestTxt}>{m.make} {m.model}</Text>
                  <Text style={S.suggestSub}>{m.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={S.halfRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.fieldLabel}>Type</Text>
              <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehicleType} onChangeText={(t) => update({ vehicleType: t })} placeholder="Sedan" placeholderTextColor={Colors.textMuted} /></View>
            </View>
            <View style={{ width: Spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={S.fieldLabel}>Colour</Text>
              <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehicleColor} onChangeText={(t) => update({ vehicleColor: t })} placeholder="White" placeholderTextColor={Colors.textMuted} /></View>
            </View>
          </View>
          <View style={S.halfRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.fieldLabel}>Year</Text>
              <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehicleYear} onChangeText={(t) => update({ vehicleYear: t })} placeholder={String(currentYear)} keyboardType="numeric" placeholderTextColor={Colors.textMuted} /></View>
            </View>
            <View style={{ width: Spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={S.fieldLabel}>Licence Plate</Text>
              <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehiclePlate} onChangeText={(t) => update({ vehiclePlate: t })} placeholder="ABCD 123" autoCapitalize="characters" placeholderTextColor={Colors.textMuted} /></View>
            </View>
          </View>
        </>
      )}

      {/* Add Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <SafeAreaView style={S.safe}>
          <View style={S.modalHdr}>
            <Text style={S.modalTitle}>Add Vehicle</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
            <Text style={S.fieldLabel}>Model</Text>
            <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehicleModel} onChangeText={(t) => update({ vehicleModel: t })} placeholder="e.g. Toyota Camry" placeholderTextColor={Colors.textMuted} /></View>
            <View style={S.halfRow}>
              <View style={{ flex: 1 }}>
                <Text style={S.fieldLabel}>Type</Text>
                <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehicleType} onChangeText={(t) => update({ vehicleType: t })} placeholder="Sedan" placeholderTextColor={Colors.textMuted} /></View>
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={S.fieldLabel}>Colour</Text>
                <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehicleColor} onChangeText={(t) => update({ vehicleColor: t })} placeholder="White" placeholderTextColor={Colors.textMuted} /></View>
              </View>
            </View>
            <View style={S.halfRow}>
              <View style={{ flex: 1 }}>
                <Text style={S.fieldLabel}>Year</Text>
                <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehicleYear} onChangeText={(t) => update({ vehicleYear: t })} placeholder={String(currentYear)} keyboardType="numeric" placeholderTextColor={Colors.textMuted} /></View>
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={S.fieldLabel}>Licence Plate</Text>
                <View style={S.inputWrap}><TextInput style={S.textInput} value={state.vehiclePlate} onChangeText={(t) => update({ vehiclePlate: t })} placeholder="ABCD 123" autoCapitalize="characters" placeholderTextColor={Colors.textMuted} /></View>
              </View>
            </View>
            <Button title="Done" size="lg" style={{ marginTop: Spacing.lg }} onPress={() => setShowAddModal(false)} disabled={!state.vehicleModel || !state.vehiclePlate} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </WizardFrame>
  );
}

// ─── Step: Options (Luggage + More) ──────────────────────────────────────────

const LUGGAGE_OPTIONS: { value: LuggageSize; emoji: string; label: string; sub: string }[] = [
  { value: 'small',  emoji: '🎒', label: 'Carry-on',      sub: 'Backpack or small bag' },
  { value: 'medium', emoji: '💼', label: 'Medium bag',    sub: 'Duffel or cabin bag' },
  { value: 'large',  emoji: '🧳', label: 'Full suitcase', sub: 'Check-in sized' },
];

const MORE_OPTIONS: { key: keyof WizardState; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'hasWinterTires', icon: 'snow-outline',    label: 'Winter tires' },
  { key: 'petsAllowed',    icon: 'paw-outline',     label: 'Pets' },
  { key: 'skiEquipment',   icon: 'fitness-outline', label: 'Ski equipment' },
  { key: 'bikesAllowed',   icon: 'bicycle-outline', label: 'Bikes' },
];

function StepOptions({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  const toggleLuggage = (val: LuggageSize) => {
    const cur = state.luggageSizes;
    const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
    update({ luggageSizes: next });
  };

  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
      title="Luggage you can take"
      subtitle="Select all sizes you're comfortable carrying. Passengers will see this before booking."
      onNext={onNext} nextLabel="Continue →" canNext={state.luggageSizes.length > 0}>
      <View style={S.luggageRow}>
        {LUGGAGE_OPTIONS.map((o) => {
          const sel = state.luggageSizes.includes(o.value);
          return (
            <TouchableOpacity key={o.value} style={[S.luggageCard, sel && S.luggageCardSel]} onPress={() => toggleLuggage(o.value)} activeOpacity={0.75}>
              <Text style={S.luggageEmoji}>{o.emoji}</Text>
              <Text style={[S.luggageLabel, sel && S.luggageLabelSel]}>{o.label}</Text>
              <Text style={S.luggageSub}>{o.sub}</Text>
              <View style={[S.luggageCheck, sel && S.luggageCheckSel]}>
                {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={S.luggageInfoBox}>
        <Text style={S.luggageInfoTxt}>Passengers will be shown exactly what luggage is allowed when they search for this trip.</Text>
      </View>
      <Text style={[S.sectionLabel, { marginTop: Spacing.lg }]}>More options</Text>
      <View style={S.moreGrid}>
        {MORE_OPTIONS.map((o) => {
          const val = !!state[o.key];
          return (
            <TouchableOpacity key={o.key} style={[S.moreCard, val && S.moreCardSel]} onPress={() => update({ [o.key]: !val } as any)} activeOpacity={0.75}>
              <Ionicons name={o.icon} size={22} color={val ? Colors.secondary : Colors.textSecondary} />
              <Text style={[S.moreLbl, val && S.moreLblSel]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </WizardFrame>
  );
}

// ─── Step: Seats ──────────────────────────────────────────────────────────────

function StepSeats({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  const MAX_SEATS = 5;
  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps} title="How many seats do you have available?" onNext={onNext} canNext={state.seats > 0}>
      <View style={S.newDriverBanner}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
        <Text style={S.newDriverTxt}>New drivers can offer up to {MAX_SEATS} seats. Drive a few passengers to unlock the ability to offer more seats.</Text>
      </View>
      <View style={S.stepperRow}>
        <TouchableOpacity style={[S.stepperBtn, state.seats <= 1 && S.stepperBtnDis]} onPress={() => state.seats > 1 && update({ seats: state.seats - 1 })} activeOpacity={0.7}>
          <Ionicons name="remove-outline" size={22} color={state.seats <= 1 ? Colors.textMuted : Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={S.stepperNum}>{state.seats}</Text>
        <TouchableOpacity style={[S.stepperBtn, state.seats >= MAX_SEATS && S.stepperBtnDis]} onPress={() => state.seats < MAX_SEATS && update({ seats: state.seats + 1 })} activeOpacity={0.7}>
          <Ionicons name="add-outline" size={22} color={state.seats >= MAX_SEATS ? Colors.textMuted : Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <Text style={S.stepperLabel}>Seats</Text>
      <View style={S.separator} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.md }}>
        <Text style={[S.fieldLabel, { flex: 1 }]}>Recommended</Text>
      </View>
      <View style={S.maxRowToggle}>
        <View style={S.maxRowLeft}>
          <Ionicons name="people-outline" size={22} color={Colors.textSecondary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={S.toggleLabel}>Max 2 people in back row</Text>
            <Text style={S.toggleSub}>Put a maximum of 2 people in the back for more comfort and better reviews</Text>
          </View>
        </View>
        <Switch value={state.maxBackRow} onValueChange={(v) => update({ maxBackRow: v })} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
      </View>
    </WizardFrame>
  );
}

// ─── Step: Packages ───────────────────────────────────────────────────────────

const PKG_SIZES: { value: PackageSize; emoji: string; label: string; desc: string }[] = [
  { value: 'envelope', emoji: '📄', label: 'Envelope', desc: 'Letters, documents' },
  { value: 'small',    emoji: '📦', label: 'Small',    desc: 'Shoebox-sized, up to 5 kg' },
  { value: 'medium',   emoji: '🧳', label: 'Medium',   desc: 'Carry-on bag, up to 15 kg' },
  { value: 'large',    emoji: '📫', label: 'Large',    desc: 'Full moving box, up to 30 kg' },
];

const PKG_ORDER: PackageSize[] = ['envelope', 'small', 'medium', 'large'];

function StepPackages({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  const maxIdx = PKG_ORDER.indexOf(state.pkgMaxSize);

  const acceptToggleCard = (
    <TouchableOpacity
      style={[S.pkgToggleCard, state.acceptPackages && S.pkgToggleCardOn]}
      onPress={() => update({ acceptPackages: !state.acceptPackages })}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={[S.pkgToggleTitle, state.acceptPackages && S.pkgToggleTitleOn]}>Accept packages on this trip</Text>
        <Text style={S.pkgToggleSub}>Senders will see your trip in package search results</Text>
      </View>
      <Switch
        value={state.acceptPackages}
        onValueChange={(v) => update({ acceptPackages: v })}
        trackColor={{ true: Colors.secondary, false: Colors.border }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );

  if (!state.acceptPackages) {
    return (
      <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
        title="Accept packages?"
        subtitle="Earn extra on every trip by carrying parcels for other GoNorth users. Handled separately from passenger seats."
        onNext={onNext} nextLabel="Continue →" canNext
        skipLabel="Skip" onSkip={onNext}>
        {acceptToggleCard}
      </WizardFrame>
    );
  }

  const selectedLabel = PKG_SIZES.find((s) => s.value === state.pkgMaxSize)?.label ?? '';

  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
      title="Accept packages?"
      subtitle="Earn extra on every trip by carrying parcels for other GoNorth users. Handled separately from passenger seats."
      onNext={onNext} nextLabel="Continue →" canNext>
      {acceptToggleCard}
      <Text style={[S.sectionLabel, { marginTop: Spacing.lg }]}>Maximum package size</Text>
      <View style={S.pkgGrid}>
        {PKG_SIZES.map((s, i) => {
          const sel = state.pkgMaxSize === s.value;
          const greyed = i > maxIdx;
          return (
            <TouchableOpacity
              key={s.value}
              style={[S.pkgCard, sel && S.pkgCardSel, greyed && S.pkgCardGreyed]}
              onPress={() => update({ pkgMaxSize: s.value })}
              activeOpacity={0.75}
            >
              <Text style={[S.pkgEmoji, greyed && { opacity: 0.35 }]}>{s.emoji}</Text>
              <Text style={[S.pkgLabel, sel && S.pkgLabelSel, greyed && S.pkgLabelGreyed]}>{s.label}</Text>
              <Text style={[S.pkgDesc, greyed && S.pkgDescGreyed]}>{s.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={S.pkgCumulativeTxt}>
        Selecting <Text style={{ fontWeight: '700' }}>{selectedLabel}</Text> means you'll also accept{' '}
        {PKG_SIZES.slice(0, maxIdx).map((s) => s.label).join(' and ')}{maxIdx > 0 ? ' packages' : ' packages'}. All sizes up to your maximum are available to senders.
      </Text>
      <Text style={[S.sectionLabel, { marginTop: Spacing.md }]}>Your price per package</Text>
      {PKG_SIZES.slice(0, maxIdx + 1).map((s) => (
        <View key={s.value} style={S.pkgPriceRow}>
          <Text style={S.pkgEmoji}>{s.emoji}</Text>
          <Text style={[S.pkgPriceLabel, { flex: 1, marginLeft: 8 }]}>{s.label}</Text>
          <View style={S.pkgPriceInput}>
            <Text style={S.pkgDollar}>$</Text>
            <TextInput
              style={S.pkgPriceField}
              value={String(state[`pkgPrice${s.value.charAt(0).toUpperCase() + s.value.slice(1)}` as keyof WizardState] ?? '')}
              onChangeText={(t) => update({ [`pkgPrice${s.value.charAt(0).toUpperCase() + s.value.slice(1)}`]: parseFloat(t) || 0 } as any)}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={S.pkgPerPkg}>/pkg</Text>
          </View>
        </View>
      ))}
    </WizardFrame>
  );
}

// ─── Step: Price ──────────────────────────────────────────────────────────────

function StepPrice({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  const segs = computeSegments(state);

  const updateSegPrice = (i: number, val: number) => {
    const next = [...state.segPrices];
    next[i] = val;
    update({ segPrices: next });
  };

  const SegCard = ({ seg, idx, section }: { seg: Segment; idx: number; section?: string }) => {
    const min = 5;
    const max = priceMax(seg.distanceKm);
    const suggested = priceSuggested(seg.distanceKm);
    const val = state.segPrices[idx] ?? suggested;
    const pct = max > 0 ? val / max : 0;
    const isHigh = pct > 0.75;
    const isGood = pct <= 0.6;

    return (
      <View style={S.priceCard}>
        {section && <Text style={S.priceSectionLabel}>{section}</Text>}
        <Text style={S.priceRouteTxt}>{seg.from.name} → {seg.to.name}</Text>
        <Text style={S.priceDistTxt}>{Math.round(seg.distanceKm)} km</Text>
        <View style={S.priceBig}><Text style={S.priceDollar}>$ </Text><Text style={S.priceNum}>{val}</Text></View>
        <PriceSlider value={val} min={min} max={max} onValueChange={(v) => updateSegPrice(idx, v)} />
        <View style={S.priceRange}><Text style={S.priceMuted}>${min}</Text><Text style={S.priceMuted}>${max}</Text></View>
        <Text style={[S.priceStatus, isHigh ? S.priceStatusHigh : S.priceStatusGood]}>
          {isHigh ? 'Price is high. Fewer passengers will book.' : isGood ? 'Perfect price. Passengers will book quickly.' : 'Good price range.'}
        </Text>
        <View style={[S.recPill, isHigh ? S.recPillRed : S.recPillGreen]}>
          <Text style={[S.recPillTxt, isHigh ? S.recPillTxtRed : S.recPillTxtGreen]}>Recommended price: ${suggested} or less</Text>
        </View>
      </View>
    );
  };

  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
      title="What's your price per seat?"
      subtitle="Enter a fair price per seat to cover your gas and other expenses."
      onNext={onNext} canNext={(state.segPrices[0] ?? 0) > 0}>
      {segs.length > 0 && <SegCard seg={segs[0]} idx={0} section="Full journey" />}
      {segs.length > 1 && (
        <>
          <Text style={[S.sectionLabel, { marginTop: Spacing.md }]}>Stops</Text>
          {segs.slice(1).map((seg, i) => <SegCard key={i} seg={seg} idx={i + 1} />)}
        </>
      )}
    </WizardFrame>
  );
}

// ─── Step: Booking Mode ───────────────────────────────────────────────────────

function StepBookingMode({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps} title="How would you like passengers to book?" onNext={onNext} canNext>
      <TouchableOpacity style={[S.bookingCard, state.bookingMode === 'request' && S.bookingCardSel]} onPress={() => update({ bookingMode: 'request' })} activeOpacity={0.8}>
        <Ionicons name="person-circle-outline" size={30} color={state.bookingMode === 'request' ? Colors.primary : Colors.textSecondary} style={{ marginBottom: 6 }} />
        <Text style={[S.bookingTitle, state.bookingMode === 'request' && S.bookingTitleSel]}>Review each passenger</Text>
        <Text style={S.bookingDesc}>Approve or decline each passenger's booking request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[S.bookingCard, S.bookingCardDis]} activeOpacity={1}>
        <Ionicons name="flash-outline" size={30} color={Colors.textMuted} style={{ marginBottom: 6 }} />
        <Text style={S.bookingTitleDis}>Instant book</Text>
        <Text style={S.bookingDesc}>Available once you drive 5 passengers</Text>
        <View style={S.bookingPill}><Text style={S.bookingPillTxt}>Up to 2× more bookings</Text></View>
      </TouchableOpacity>
    </WizardFrame>
  );
}

// ─── Step: Notes ──────────────────────────────────────────────────────────────

function StepNotes({ state, update, onNext, onBack, stepIndex, totalSteps }: { state: WizardState; update: (p: Partial<WizardState>) => void; onNext: () => void; onBack: () => void; stepIndex: number; totalSteps: number }) {
  return (
    <WizardFrame onBack={onBack} stepIndex={stepIndex} totalSteps={totalSteps}
      title="Please provide details about your trip"
      onNext={onNext} canNext={state.notes.trim().length > 0}>
      <TextInput
        style={S.notesInput}
        value={state.notes}
        onChangeText={(t) => update({ notes: t })}
        placeholder="We recommend writing the exact pick-up and drop-off locations here."
        placeholderTextColor={Colors.textMuted}
        multiline
        textAlignVertical="top"
      />
      <Text style={S.notesHint}>Passengers see your trip description before they book.</Text>
    </WizardFrame>
  );
}

// ─── Step: Review ─────────────────────────────────────────────────────────────

function ReviewSection({ title, onEdit, children }: { title: string; onEdit?: () => void; children: React.ReactNode }) {
  return (
    <View style={S.reviewSection}>
      <View style={S.reviewSectionHdr}>
        <Text style={S.reviewSectionTitle}>{title}</Text>
        {onEdit && <TouchableOpacity onPress={onEdit}><Text style={S.reviewEdit}>Edit</Text></TouchableOpacity>}
      </View>
      {children}
    </View>
  );
}

function TimelineRow({ label, value, dot = 'circle' }: { label: string; value: string; dot?: string }) {
  return (
    <View style={S.timelineRow}>
      <View style={S.timelineDotWrap}>
        <View style={S.timelineDot} />
        <View style={S.timelineLine} />
      </View>
      <View style={S.timelineContent}>
        <Text style={S.timelineLabel}>{label}</Text>
        <Text style={S.timelineValue}>{value}</Text>
      </View>
    </View>
  );
}

function StepReview({ state, onPost, posting, goToStep, existingVehicles, vehicleId }: {
  state: WizardState; onPost: () => void; posting: boolean;
  goToStep: (s: StepId) => void; existingVehicles: Vehicle[]; vehicleId: string | null;
}) {
  const segs = computeSegments(state);
  const dep = state.departureDate!;
  const tim = state.departureTime!;
  const depStr = `${formatDate(dep)} at ${formatTime(tim)}`;
  const selVehicle = existingVehicles.find((v) => v.id === vehicleId);
  const vName = selVehicle
    ? `${selVehicle.make} ${selVehicle.model} ${selVehicle.year}`
    : state.vehicleModel ? `${state.vehicleMake} ${state.vehicleModel} ${state.vehicleYear}` : null;

  const pts = [state.origin!, ...state.stops, state.destination!];
  const timelineLabels = pts.map((_, i) => i === 0 ? 'Departing' : i === pts.length - 1 ? 'Arriving' : 'Stopping');

  return (
    <SafeAreaView style={S.safe}>
      <WizHeader onBack={() => goToStep('notes')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: Spacing.md }}>
          <Text style={S.placeTitle}>Please review your trip before posting it</Text>
        </View>

        <ReviewSection title="Itinerary" onEdit={() => goToStep('origin')}>
          {pts.map((pt, i) => (
            <View key={i} style={S.timelineRow}>
              <View style={S.timelineDotWrap}>
                <View style={S.timelineDot} />
                {i < pts.length - 1 && <View style={S.timelineLine} />}
              </View>
              <View style={S.timelineContent}>
                <Text style={S.timelineLabel}>{timelineLabels[i]}</Text>
                <Text style={S.timelineValue}>{pt.address}</Text>
              </View>
            </View>
          ))}
        </ReviewSection>

        <ReviewSection title="Schedule" onEdit={() => goToStep('datetime')}>
          <Text style={S.reviewLabel}>Leaving</Text>
          <Text style={S.reviewValue}>{depStr}</Text>
          {state.returnDate && state.returnTime && (
            <>
              <Text style={[S.reviewLabel, { marginTop: Spacing.sm }]}>Returning</Text>
              <Text style={S.reviewValue}>{formatDate(state.returnDate)} at {formatTime(state.returnTime)}</Text>
            </>
          )}
        </ReviewSection>

        {state.tripMode !== 'packages_only' && (
          <ReviewSection title="Vehicle & seats" onEdit={() => goToStep('vehicle')}>
            {vName && <Text style={S.reviewBold}>{vName}</Text>}
            {(selVehicle?.licensePlate || state.vehiclePlate) && (
              <Text style={S.reviewValue}>{selVehicle?.licensePlate ?? state.vehiclePlate}</Text>
            )}
            <Text style={[S.reviewBold, { marginTop: Spacing.sm }]}>{state.seats} seats available</Text>
            {state.maxBackRow && <Text style={S.reviewValue}>Max 2 passengers per row</Text>}
          </ReviewSection>
        )}

        <ReviewSection title="Trip preferences" onEdit={() => goToStep('options')}>
          <PrefItem icon="briefcase-outline" label={state.luggageSizes.map((s) => LUGGAGE_OPTIONS.find((o) => o.value === s)?.label ?? s).join(', ')} active={state.luggageSizes.length > 0} />
          <PrefItem icon="snow-outline" label="Winter tires" active={state.hasWinterTires} />
          <PrefItem icon="paw-outline" label="Pets" active={state.petsAllowed} />
          <PrefItem icon="bicycle-outline" label="Bikes" active={state.bikesAllowed} />
          <PrefItem icon="fitness-outline" label="Ski equipment" active={state.skiEquipment} />
        </ReviewSection>

        {state.tripMode !== 'packages_only' && segs.length > 0 && (
          <ReviewSection title="Pricing" onEdit={() => goToStep('price')}>
            <Text style={S.reviewMuted}>Full journey</Text>
            <Text style={S.reviewBold}>{state.origin!.name} → {state.destination!.name}</Text>
            <Text style={S.reviewPrice}>${state.segPrices[0] ?? 0}</Text>
            {segs.slice(1).map((seg, i) => (
              <View key={i} style={{ marginTop: Spacing.sm }}>
                <Text style={S.reviewMuted}>Stop {i + 1}</Text>
                <Text style={S.reviewBold}>{seg.from.name} → {seg.to.name}</Text>
                <Text style={S.reviewPrice}>${state.segPrices[i + 1] ?? state.segPrices[0] ?? 0}</Text>
              </View>
            ))}
          </ReviewSection>
        )}

        <ReviewSection title="Booking type" onEdit={() => goToStep('booking_mode')}>
          <Text style={S.reviewBold}>{state.bookingMode === 'request' ? 'Review each passenger' : 'Instant booking'}</Text>
          <Text style={S.reviewValue}>{state.bookingMode === 'request' ? "Approve or decline each passenger's booking request" : 'Passengers book instantly without approval'}</Text>
        </ReviewSection>

        {state.notes ? (
          <ReviewSection title="Trip description" onEdit={() => goToStep('notes')}>
            <Text style={S.reviewValue}>{state.notes}</Text>
          </ReviewSection>
        ) : null}

        <View style={{ padding: Spacing.md, paddingBottom: Spacing.xl }}>
          <Button title="Post Trip" size="lg" onPress={onPost} loading={posting} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrefItem({ icon, label, active }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean }) {
  return (
    <View style={S.prefItem}>
      <Ionicons name={active ? icon : (`${icon.replace('-outline', '')}-outline` as any)} size={18} color={active ? Colors.textPrimary : Colors.textMuted} style={{ marginRight: 10 }} />
      <Text style={[S.prefLabel, !active && S.prefLabelDis]}>{active ? label : `No ${label.toLowerCase()}`}</Text>
    </View>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function ScreenSuccess({ origin, dest, depTime, onViewTrip, onVerify, onDismiss }: {
  origin: string; dest: string; depTime: string;
  onViewTrip: () => void; onVerify: () => void; onDismiss: () => void;
}) {
  return (
    <SafeAreaView style={[S.safe, { backgroundColor: Colors.surface }]}>
      <View style={S.successBanner}>
        <Text style={S.successBannerTxt} numberOfLines={2}>Your trip from {origin} to {dest} departing on {depTime} was successfully posted.</Text>
        <View style={S.successBannerBtns}>
          <TouchableOpacity onPress={onViewTrip}><Text style={S.successBannerBtn}>View</Text></TouchableOpacity>
          <TouchableOpacity onPress={onDismiss}><Text style={S.successBannerBtn}>Dismiss</Text></TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: Spacing.xl }}>
        <Text style={S.kycTitle}>Almost done!</Text>
        <View style={S.kycIcon}><Ionicons name="card-outline" size={80} color={Colors.primary} /></View>
        <Text style={S.kycDesc}>Verify your driver's license for your trip to go live. It only takes 3 minutes.</Text>
        <Button title="Verify your license now" size="lg" onPress={onVerify} style={{ width: '100%', marginBottom: Spacing.md }} />
        <Button title="View Trip" variant="outline" size="lg" onPress={onViewTrip} style={{ width: '100%' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateTripScreen({ navigation }: { navigation: any }) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [step, setStep] = useState<StepId>('trip_mode');
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [existingVehicles, setExistingVehicles] = useState<Vehicle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [postedTripId, setPostedTripId] = useState<string | null>(null);

  const update = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    driversApi.listVehicles().then(({ data }) => {
      if (data.length > 0) {
        setExistingVehicles(data);
        const primary = data.find((v) => v.isPrimary) ?? data[0];
        setVehicleId(primary.id);
        update({ vehicleMake: primary.make, vehicleModel: primary.model, vehicleColor: primary.color, vehicleYear: String(primary.year), vehiclePlate: primary.licensePlate });
      }
    }).catch(() => {});
  }, []);

  // Reinit segPrices when route changes
  const prevSegLenRef = useRef(0);
  useEffect(() => {
    const segs = computeSegments(state);
    if (segs.length !== prevSegLenRef.current) {
      prevSegLenRef.current = segs.length;
      update({ segPrices: initSegPrices(segs) });
    }
  }, [state.origin, state.destination, state.stops]);

  const activeSteps = useMemo(() => makeActiveSteps(state), [state.tripMode]);

  const stepIndex = activeSteps.indexOf(step);
  const totalSteps = activeSteps.length;

  const goNext = () => {
    const idx = activeSteps.indexOf(step);
    if (idx < activeSteps.length - 1) setStep(activeSteps[idx + 1]);
  };
  const goBack = () => {
    if (step === 'trip_mode') { navigation.goBack(); return; }
    const idx = activeSteps.indexOf(step);
    if (idx > 0) setStep(activeSteps[idx - 1]);
    else navigation.goBack();
  };
  const goToStep = (s: StepId) => setStep(s);

  const handlePost = async () => {
    if (!state.origin || !state.destination || !state.departureDate || !state.departureTime) return;
    setSubmitting(true);
    try {
      const payload = buildPayload({ ...state, vehicleId });
      const { data } = await tripsApi.create(payload as any);
      setPostedTripId(data?.id ?? null);
      setStep('success');
    } catch (err) {
      Alert.alert('Could not post trip', extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    const depTime = state.departureTime ? formatTime(state.departureTime) : '';
    return (
      <ScreenSuccess
        origin={state.origin?.name ?? ''}
        dest={state.destination?.name ?? ''}
        depTime={depTime}
        onVerify={() => navigation.goBack()}
        onViewTrip={() => { navigation.goBack(); }}
        onDismiss={() => navigation.goBack()}
      />
    );
  }

  const commonProps = { state, update, onNext: goNext, onBack: goBack, stepIndex, totalSteps };

  switch (step) {
    case 'trip_mode':     return <StepTripMode {...commonProps} />;
    case 'origin':        return <StepOrigin state={state} update={update} onNext={goNext} onBack={goBack} />;
    case 'destination':   return <StepDestination state={state} update={update} onNext={goNext} onBack={goBack} />;
    case 'stops':         return <StepStops state={state} update={update} onNext={goNext} onBack={goBack} stepIndex={stepIndex} totalSteps={totalSteps} />;
    case 'datetime':      return <StepDateTime {...commonProps} />;
    case 'vehicle':       return <StepVehicle {...commonProps} existingVehicles={existingVehicles} vehicleId={vehicleId} setVehicleId={setVehicleId} />;
    case 'options':       return <StepOptions {...commonProps} />;
    case 'seats':         return <StepSeats {...commonProps} />;
    case 'packages':      return <StepPackages {...commonProps} />;
    case 'price':         return <StepPrice {...commonProps} />;
    case 'booking_mode':  return <StepBookingMode {...commonProps} />;
    case 'notes':         return <StepNotes {...commonProps} />;
    case 'review':        return <StepReview state={state} onPost={handlePost} posting={submitting} goToStep={goToStep} existingVehicles={existingVehicles} vehicleId={vehicleId} />;
    default:              return null;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  stepBody: { marginTop: Spacing.md },

  // Wizard header
  wizHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  wizTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },

  // Progress
  progressTrack: { height: 3, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },

  // Step title/sub
  stepTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, lineHeight: 32, marginBottom: 6 },
  stepSub: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

  // CTA / skip
  ctaBtn: { marginTop: Spacing.xl },
  skipLink: { alignItems: 'center', marginTop: Spacing.md, paddingVertical: 8 },
  skipLinkTxt: { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'underline' },

  // Place search
  placeTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, lineHeight: 34, marginBottom: Spacing.md },
  placeSearchWrap: { flex: 1 },
  placeInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, minHeight: 52 },
  placeInputFocused: { borderColor: Colors.primary },
  placeInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, paddingVertical: 12 },
  placeHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm, paddingHorizontal: 4 },
  placeErrorRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, paddingHorizontal: 4 },
  placeErrorTxt: { flex: 1, fontSize: FontSize.sm, color: Colors.danger },
  placeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.md },
  placeRowTxt: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  placeRowSep: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md + 16 + 10 },

  // Add Stop
  addStopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  addStopTxt: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  separator: { height: 1, backgroundColor: Colors.border },
  pendingStopRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, marginTop: Spacing.sm },

  // Sticky footer
  stickyFooter: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },

  // Trip mode
  modeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  modeCardSel: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  modeIconWrap: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  modeIconWrapSel: { backgroundColor: Colors.primaryLight },
  modeTxt: { flex: 1 },
  modeLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  modeLabelSel: { color: Colors.primary },
  modeDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  // Fields
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 50, backgroundColor: Colors.surface },
  textInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  halfRow: { flexDirection: 'row', marginTop: Spacing.sm },
  suggestList: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, marginTop: 4, backgroundColor: Colors.surface },
  suggestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestTxt: { fontSize: FontSize.md, color: Colors.textPrimary },
  suggestSub: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Date/time
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.md },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#C0392B' },
  tabTxt: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: '500' },
  tabTxtActive: { color: Colors.textPrimary, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 52, backgroundColor: Colors.primaryLight },
  dateRowTxt: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  dateRowPlaceholder: { color: Colors.textMuted },
  comingSoon: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  comingSoonTxt: { fontSize: FontSize.md, color: Colors.textMuted },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  calendarCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', width: '92%' },
  timeSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing.xl, width: '100%', position: 'absolute', bottom: 0 },
  timeSheetTitle: { textAlign: 'center', fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, paddingTop: Spacing.md },
  timeConfirmBtn: { alignItems: 'center', paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm },
  timeConfirmTxt: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: '600' },
  timeCancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  timeCancelTxt: { fontSize: FontSize.lg, color: Colors.textMuted },
  optional: { fontWeight: '400', color: Colors.textMuted },

  // Vehicle
  vehicleCard: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, marginBottom: Spacing.sm, overflow: 'hidden' },
  vehicleCardSel: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  vehicleCardInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  vehicleThumb: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  vehicleCardName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  vehicleCardPlate: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  modalHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  // Options
  optionCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  optionCardSel: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  optionLabelSel: { color: Colors.primary },
  optionDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  moreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moreCard: { width: '47%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 6 },
  moreCardSel: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight },
  moreLbl: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  moreLblSel: { color: Colors.secondary },

  // Seats
  newDriverBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  newDriverTxt: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, lineHeight: 20 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, marginVertical: Spacing.xl },
  stepperBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDis: { borderColor: Colors.border, opacity: 0.4 },
  stepperNum: { fontSize: 48, fontWeight: '800', color: Colors.textPrimary, minWidth: 70, textAlign: 'center' },
  stepperLabel: { textAlign: 'center', fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  maxRowToggle: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: Spacing.md },
  maxRowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: Spacing.md },
  toggleLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  toggleSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },

  // Luggage cards
  luggageRow: { flexDirection: 'row', gap: Spacing.sm },
  luggageCard: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 4, backgroundColor: Colors.surface },
  luggageCardSel: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight },
  luggageEmoji: { fontSize: 32, marginBottom: 2 },
  luggageLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  luggageLabelSel: { color: Colors.textPrimary },
  luggageSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
  luggageCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  luggageCheckSel: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  luggageInfoBox: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md },
  luggageInfoTxt: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Packages
  pkgToggleCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md },
  pkgToggleCardOn: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight },
  pkgToggleTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  pkgToggleTitleOn: { color: Colors.textPrimary },
  pkgToggleSub: { fontSize: FontSize.sm, color: Colors.textMuted },
  pkgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pkgCard: { width: '47%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'flex-start', gap: 4, backgroundColor: Colors.surface },
  pkgCardSel: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight },
  pkgCardGreyed: { backgroundColor: Colors.background },
  pkgEmoji: { fontSize: 26 },
  pkgLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  pkgLabelSel: { color: Colors.textPrimary },
  pkgLabelGreyed: { color: Colors.textMuted },
  pkgDesc: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  pkgDescGreyed: { color: Colors.border },
  pkgCumulativeTxt: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: Spacing.sm },
  pkgPriceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pkgPriceLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  pkgPriceInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 10, height: 44, width: 100 },
  pkgDollar: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '700' },
  pkgPriceField: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  pkgPerPkg: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 4 },

  // Price
  priceCard: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  priceSectionLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  priceRouteTxt: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  priceDistTxt: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  priceBig: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  priceDollar: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  priceNum: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary },
  priceRange: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceMuted: { fontSize: FontSize.sm, color: Colors.textMuted },
  priceStatus: { fontSize: FontSize.sm, marginTop: 6 },
  priceStatusGood: { color: Colors.secondary },
  priceStatusHigh: { color: Colors.danger },
  recPill: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  recPillGreen: { backgroundColor: Colors.secondaryLight },
  recPillRed: { backgroundColor: Colors.dangerLight },
  recPillTxt: { fontSize: FontSize.sm, fontWeight: '600' },
  recPillTxtGreen: { color: Colors.secondary },
  recPillTxtRed: { color: Colors.danger },

  // Slider
  sliderContainer: { height: 40, justifyContent: 'center' },
  sliderTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, flexDirection: 'row' },
  sliderFilled: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  sliderThumb: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, top: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },

  // Booking
  bookingCard: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.sm, alignItems: 'center' },
  bookingCardSel: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  bookingCardDis: { backgroundColor: Colors.background, opacity: 0.7 },
  bookingTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  bookingTitleSel: { color: Colors.primary },
  bookingTitleDis: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textMuted, marginBottom: 4 },
  bookingDesc: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  bookingPill: { marginTop: 8, backgroundColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  bookingPillTxt: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  // Notes
  notesInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, minHeight: 140, backgroundColor: Colors.primaryLight },
  notesHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },

  // Review
  reviewSection: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md },
  reviewSectionHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  reviewSectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  reviewEdit: { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'underline' },
  reviewLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  reviewValue: { fontSize: FontSize.md, color: Colors.textPrimary, marginTop: 2 },
  reviewBold: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  reviewMuted: { fontSize: FontSize.sm, color: Colors.textMuted },
  reviewPrice: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },

  // Timeline
  timelineRow: { flexDirection: 'row', marginBottom: 2 },
  timelineDotWrap: { alignItems: 'center', width: 20, marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.primary, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 2, marginBottom: 2 },
  timelineContent: { flex: 1, paddingBottom: Spacing.md },
  timelineLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  timelineValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },

  // Pref item
  prefItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  prefLabel: { fontSize: FontSize.md, color: Colors.textPrimary },
  prefLabelDis: { color: Colors.textMuted, textDecorationLine: 'line-through' },

  // Success
  successBanner: { backgroundColor: Colors.surface, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  successBannerTxt: { fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 8 },
  successBannerBtns: { flexDirection: 'row', gap: Spacing.xl },
  successBannerBtn: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
  kycTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  kycIcon: { width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  kycDesc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
});

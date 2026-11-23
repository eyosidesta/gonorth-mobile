import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ScrollView, Modal, TextInput, ActivityIndicator,
  StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { tripsApi, Trip } from '../../api/trips.api';

// ─── Google Places ────────────────────────────────────────────────────────────

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface SelectedPlace { name: string; address: string; lat: number; lng: number; placeId: string }
interface PlacePrediction { place_id: string; description: string }

async function fetchSuggestions(input: string): Promise<PlacePrediction[]> {
  if (!PLACES_KEY || input.length < 3) return [];
  try {
    const qs = `input=${encodeURIComponent(input)}&key=${PLACES_KEY}&language=en&components=country:ca`;
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${qs}`);
    const j = await r.json();
    return j.predictions ?? [];
  } catch { return []; }
}

async function fetchPlaceDetails(placeId: string): Promise<SelectedPlace | null> {
  try {
    const qs = `place_id=${placeId}&key=${PLACES_KEY}&fields=geometry,formatted_address,name`;
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${qs}`);
    const j = await r.json();
    const res = j.result;
    return { name: res.name ?? res.formatted_address.split(',')[0].trim(), address: res.formatted_address, lat: res.geometry.location.lat, lng: res.geometry.location.lng, placeId };
  } catch { return null; }
}

// ─── Place picker modal ───────────────────────────────────────────────────────

function PlacePickerModal({ visible, title, onSelect, onClose }: {
  visible: boolean; title: string;
  onSelect: (p: SelectedPlace) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = (text: string) => {
    setQuery(text);
    clearTimeout(debRef.current);
    if (text.length < 3) { setSuggestions([]); setSearching(false); return; }
    setSearching(true);
    debRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(text);
      setSearching(false);
      setSuggestions(results);
    }, 350);
  };

  const handleSelect = async (pred: PlacePrediction) => {
    setSuggestions([]);
    setLoadingPlace(true);
    const place = await fetchPlaceDetails(pred.place_id);
    setLoadingPlace(false);
    if (place) { onSelect(place); setQuery(''); }
  };

  const handleClose = () => { setQuery(''); setSuggestions([]); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={S.modalSafe}>
        <View style={S.modalHeader}>
          <TouchableOpacity onPress={handleClose} style={S.modalBack}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={S.modalTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={S.modalSearch}>
          <Ionicons name="location-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={S.modalInput}
            value={query}
            onChangeText={handleChange}
            placeholder="City or address"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {(searching || loadingPlace)
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : query.length > 0
              ? <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              : null}
        </View>
        <FlatList
          data={suggestions}
          keyExtractor={item => item.place_id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={S.suggRow} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} style={{ marginRight: 12 }} />
              <Text style={S.suggTxt} numberOfLines={2}>{item.description}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: 44 }} />}
          ListEmptyComponent={
            !searching && query.length < 3
              ? <Text style={S.suggHint}>Type at least 3 characters to search</Text>
              : !searching && query.length >= 3
                ? <Text style={S.suggEmpty}>No results for "{query}"</Text>
                : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── Dummy trip data ──────────────────────────────────────────────────────────

const DUMMY_TRIPS: Trip[] = [
  {
    id: 'd1', driverId: 'u1', vehicleId: 'v1', status: 'active',
    bookingMode: 'instant', tripMode: 'passengers_and_packages',
    departureAt: new Date().toISOString().replace(/T\d{2}/, 'T08'),
    totalPassengerSeats: 3, availableSeats: 3, price: 55, distanceKm: 544,
    maxPackageSize: 'small', pkgPriceEnvelope: 8, pkgPriceSmall: 18, pkgPriceMedium: null, pkgPriceLarge: null,
    preferences: { petsAllowed: true, hasWinterTires: true, skiEquipment: false, bikesAllowed: false },
    notes: 'Clean car, good music. I make one stop for gas.',
    province: 'ON',
    originWaypointId: 'w1', originName: 'Toronto, ON', originLat: 43.65, originLng: -79.38,
    destinationWaypointId: 'w2', destinationName: 'Montréal, QC', destinationLat: 45.50, destinationLng: -73.56,
    firstName: 'Marcus', lastName: 'T.', avatarUrl: null, driverAvgRating: 4.9, driverReviewCount: 47,
  },
  {
    id: 'd2', driverId: 'u2', vehicleId: 'v2', status: 'active',
    bookingMode: 'request', tripMode: 'passengers_only',
    departureAt: new Date().toISOString().replace(/T\d{2}/, 'T11'),
    totalPassengerSeats: 2, availableSeats: 1, price: 45, distanceKm: 544,
    maxPackageSize: null, pkgPriceEnvelope: null, pkgPriceSmall: null, pkgPriceMedium: null, pkgPriceLarge: null,
    preferences: { petsAllowed: false, hasWinterTires: true, skiEquipment: true, bikesAllowed: false },
    notes: null,
    province: 'ON',
    originWaypointId: 'w3', originName: 'Toronto, ON', originLat: 43.65, originLng: -79.38,
    destinationWaypointId: 'w4', destinationName: 'Montréal, QC', destinationLat: 45.50, destinationLng: -73.56,
    firstName: 'Priya', lastName: 'N.', avatarUrl: null, driverAvgRating: 5.0, driverReviewCount: 12,
  },
  {
    id: 'd3', driverId: 'u3', vehicleId: 'v3', status: 'active',
    bookingMode: 'instant', tripMode: 'passengers_and_packages',
    departureAt: new Date().toISOString().replace(/T\d{2}/, 'T14'),
    totalPassengerSeats: 4, availableSeats: 2, price: 50, distanceKm: 544,
    maxPackageSize: 'medium', pkgPriceEnvelope: 10, pkgPriceSmall: 20, pkgPriceMedium: 35, pkgPriceLarge: null,
    preferences: { petsAllowed: true, hasWinterTires: false, skiEquipment: false, bikesAllowed: true },
    notes: null,
    province: 'ON',
    originWaypointId: 'w5', originName: 'Toronto, ON', originLat: 43.65, originLng: -79.38,
    destinationWaypointId: 'w6', destinationName: 'Montréal, QC', destinationLat: 45.50, destinationLng: -73.56,
    firstName: 'David', lastName: 'K.', avatarUrl: null, driverAvgRating: 4.7, driverReviewCount: 29,
  },
  {
    id: 'd4', driverId: 'u4', vehicleId: 'v4', status: 'active',
    bookingMode: 'request', tripMode: 'passengers_only',
    departureAt: new Date().toISOString().replace(/T\d{2}/, 'T17'),
    totalPassengerSeats: 3, availableSeats: 3, price: 48, distanceKm: 544,
    maxPackageSize: null, pkgPriceEnvelope: null, pkgPriceSmall: null, pkgPriceMedium: null, pkgPriceLarge: null,
    preferences: { petsAllowed: false, hasWinterTires: true, skiEquipment: true, bikesAllowed: false },
    notes: 'I travel this route every two weeks.',
    province: 'ON',
    originWaypointId: 'w7', originName: 'Toronto, ON', originLat: 43.65, originLng: -79.38,
    destinationWaypointId: 'w8', destinationName: 'Montréal, QC', destinationLat: 45.50, destinationLng: -73.56,
    firstName: 'Layla', lastName: 'A.', avatarUrl: null, driverAvgRating: 4.8, driverReviewCount: 21,
  },
];

const AVATAR_COLORS = ['#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
function getAvatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length]; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function makeDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const DAYS = makeDays(10);

const POPULAR_ROUTES = [
  { from: 'Ottawa', to: 'Toronto' },
  { from: 'Montréal', to: 'Ottawa' },
  { from: 'Toronto', to: 'Kingston' },
  { from: 'Québec', to: 'Montréal' },
  { from: 'Toronto', to: 'Windsor' },
  { from: 'Hamilton', to: 'Ottawa' },
];

type Props = { navigation: NativeStackNavigationProp<any> };

// ─── Trip card ────────────────────────────────────────────────────────────────

function TripCard({ item, onPress }: { item: Trip; onPress: () => void }) {
  const prefs = item.preferences ?? {};
  const chips: { emoji: string; label: string; ok: boolean }[] = [
    { emoji: '🐾', label: 'Pets',         ok: !!prefs.petsAllowed },
    { emoji: '❄️', label: 'Winter tires', ok: !!prefs.hasWinterTires },
    { emoji: '🎿', label: 'Ski gear',     ok: !!prefs.skiEquipment },
    { emoji: '🚲', label: 'Bikes',        ok: !!prefs.bikesAllowed },
  ].filter(c => c.ok);

  const rating = item.driverAvgRating ? Number(item.driverAvgRating).toFixed(1) : null;
  const initials = `${item.firstName?.[0] ?? ''}${item.lastName?.[0] ?? ''}`.toUpperCase();
  const color = getAvatarColor(item.driverId);

  return (
    <TouchableOpacity style={S.tcard} onPress={onPress} activeOpacity={0.85}>
      {/* Top row: time + price */}
      <View style={S.tcTop}>
        <View style={S.tcTimeRow}>
          {item.bookingMode === 'instant' && <Text style={S.tcBolt}>⚡</Text>}
          <Text style={S.tcTime}>{formatTime(item.departureAt)}</Text>
          <View style={[S.bkBadge, item.bookingMode === 'instant' ? S.bkInstant : S.bkRequest]}>
            <Text style={[S.bkText, item.bookingMode === 'instant' ? S.bkInstantTxt : S.bkRequestTxt]}>
              {item.bookingMode === 'instant' ? 'Instant' : 'Request'}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={S.tcPrice}>${Number(item.price).toFixed(0)}</Text>
          <Text style={S.tcSeats}>{item.availableSeats} seat{item.availableSeats !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={S.tcRoute}>
        <View style={S.routeCol}>
          <View style={[S.routeDot, { backgroundColor: Colors.primary }]} />
          <View style={S.routeLine} />
          <View style={[S.routeDot, { backgroundColor: '#DC2626' }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.routeCity} numberOfLines={1}>{item.originName}</Text>
          <View style={{ height: 12 }} />
          <Text style={S.routeCity} numberOfLines={1}>{item.destinationName}</Text>
        </View>
      </View>

      {/* Preference chips */}
      {chips.length > 0 && (
        <View style={S.tcChips}>
          {chips.map(c => (
            <View key={c.label} style={S.chipOk}>
              <Text style={S.chipOkText}>{c.emoji} {c.label}</Text>
            </View>
          ))}
          {item.tripMode !== 'passengers_only' && (
            <View style={S.chipOk}>
              <Text style={S.chipOkText}>📦 Packages</Text>
            </View>
          )}
        </View>
      )}

      {/* Driver row */}
      <View style={S.driverRow}>
        <View style={[S.driverAv, { backgroundColor: color }]}>
          <Text style={S.driverAvTxt}>{initials}</Text>
          <View style={S.verifiedBadge}>
            <Ionicons name="checkmark" size={8} color="#fff" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.driverName}>{item.firstName} {item.lastName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={S.driverRating}>{rating ?? 'New'} · {item.driverReviewCount} reviews</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TripSearchScreen({ navigation }: Props) {
  const [fromPlace, setFromPlace] = useState<SelectedPlace | null>(null);
  const [toPlace, setToPlace] = useState<SelectedPlace | null>(null);
  const [selectedDate, setSelectedDate] = useState(DAYS[0]);
  const [seats, setSeats] = useState(1);
  const [results, setResults] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const swap = () => { const tmp = fromPlace; setFromPlace(toPlace); setToPlace(tmp); };

  const handleSearch = async () => {
    const label = fromPlace && toPlace
      ? `${fromPlace.name} → ${toPlace.name}`
      : 'Available Rides';
    setRouteLabel(label);

    if (!fromPlace || !toPlace) {
      setResults(DUMMY_TRIPS);
      return;
    }
    setLoading(true);
    try {
      const { data } = await tripsApi.search({
        fromLat: fromPlace.lat, fromLng: fromPlace.lng,
        toLat: toPlace.lat, toLng: toPlace.lng,
        date: toDateStr(selectedDate), seats,
      });
      setResults(Array.isArray(data) && data.length > 0 ? data : DUMMY_TRIPS);
    } catch {
      setResults(DUMMY_TRIPS);
    } finally {
      setLoading(false);
    }
  };

  // ── Home state ─────────────────────────────────────────────────────────────

  if (results === null) {
    return (
      <SafeAreaView style={S.container}>
        <StatusBar barStyle="dark-content" />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* App header */}
          <View style={S.appHdr}>
            <View style={S.logoRow}>
              <View style={S.logoIcon}>
                <Ionicons name="compass" size={20} color={Colors.primary} />
              </View>
              <Text style={S.logoText}>
                <Text style={{ color: Colors.primary }}>Go</Text>
                <Text style={{ color: Colors.secondary }}>North</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TouchableOpacity style={S.headerIconBtn} onPress={() => navigation.navigate('MyBookings')}>
                <Ionicons name="ticket-outline" size={20} color={Colors.secondary} />
              </TouchableOpacity>
              <View style={S.userAv}>
                <Text style={S.userAvTxt}>E</Text>
              </View>
            </View>
          </View>

          <Text style={S.homeGreeting}>Where to today?</Text>

          {/* Search card */}
          <View style={S.searchCard}>
            <TouchableOpacity style={S.sf} onPress={() => setPicking('from')} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={20} color={fromPlace ? Colors.primary : Colors.textMuted} />
              <Text style={[S.sfText, fromPlace && S.sfVal]} numberOfLines={1}>
                {fromPlace ? fromPlace.name : 'From'}
              </Text>
              {!fromPlace && <TouchableOpacity style={S.swapBtn} onPress={swap}>
                <Text style={S.swapBtnTxt}>⇅</Text>
              </TouchableOpacity>}
            </TouchableOpacity>

            <TouchableOpacity style={[S.sf, { borderBottomColor: Colors.border }]} onPress={() => setPicking('to')} activeOpacity={0.7}>
              <Ionicons name="location" size={20} color={toPlace ? '#DC2626' : Colors.textMuted} />
              <Text style={[S.sfText, toPlace && S.sfVal]} numberOfLines={1}>
                {toPlace ? toPlace.name : 'To'}
              </Text>
              {fromPlace && <TouchableOpacity style={S.swapBtn} onPress={swap}>
                <Text style={S.swapBtnTxt}>⇅</Text>
              </TouchableOpacity>}
            </TouchableOpacity>

            <View style={S.sfRow}>
              <TouchableOpacity style={S.sfHalf} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <Text style={[S.sfText, S.sfVal]}>
                  {DAY_SHORT[selectedDate.getDay()]} {selectedDate.getDate()} {MONTH_SHORT[selectedDate.getMonth()]}
                </Text>
              </TouchableOpacity>
              <View style={S.sfDivider} />
              <View style={S.sfHalf}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                <Text style={S.sfText}>{seats} passenger{seats !== 1 ? 's' : ''}</Text>
                <View style={S.seatsMini}>
                  <TouchableOpacity onPress={() => setSeats(s => Math.max(1, s - 1))} style={S.seatMiniBtn}>
                    <Text style={S.seatMiniBtnTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={S.seatMiniCount}>{seats}</Text>
                  <TouchableOpacity onPress={() => setSeats(s => Math.min(8, s + 1))} style={S.seatMiniBtn}>
                    <Text style={S.seatMiniBtnTxt}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={S.searchBtn} onPress={handleSearch}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={S.searchBtnTxt}>Search rides →</Text>}
            </TouchableOpacity>
          </View>

          {/* Quick access */}
          <View style={S.quickRow}>
            <TouchableOpacity style={S.quickCard} onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.8}>
              <View style={[S.quickIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="ticket-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={S.quickLabel}>My Bookings</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={S.quickCard} onPress={() => navigation.navigate('MyTrips')} activeOpacity={0.8}>
              <View style={[S.quickIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Ionicons name="car-outline" size={20} color={Colors.secondary} />
              </View>
              <Text style={S.quickLabel}>My Trips</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Recent searches */}
          <Text style={S.slabel}>Recent searches</Text>
          {['Toronto → Ottawa', 'Ottawa → Québec City', 'Toronto → Montréal'].map((r, i) => (
            <TouchableOpacity key={i} style={S.recentRow} onPress={() => {}} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={{ marginRight: Spacing.sm }} />
              <Text style={S.recentRoute}>{r}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          {/* Popular routes */}
          <Text style={[S.slabel, { marginTop: Spacing.lg }]}>Popular routes</Text>
          <View style={S.pillRow}>
            {POPULAR_ROUTES.map((r, i) => (
              <TouchableOpacity key={i} style={S.pill} onPress={() => {}} activeOpacity={0.7}>
                <Text style={S.pillTxt}>{r.from} → {r.to}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>

        <PlacePickerModal visible={picking === 'from'} title="Where are you leaving from?" onSelect={p => { setFromPlace(p); setPicking(null); }} onClose={() => setPicking(null)} />
        <PlacePickerModal visible={picking === 'to'} title="Where are you going?" onSelect={p => { setToPlace(p); setPicking(null); }} onClose={() => setPicking(null)} />

        {/* Date picker — iOS: bottom sheet modal; Android: native dialog */}
        {showDatePicker && Platform.OS === 'ios' && (
          <Modal visible transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
            <TouchableOpacity style={S.dateOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
            <View style={S.dateSheet}>
              <View style={S.dateSheetHdr}>
                <Text style={S.dateSheetTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={S.dateSheetDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                minimumDate={new Date()}
                accentColor={Colors.primary}
                onValueChange={(_, date) => { if (date) setSelectedDate(date); }}
              />
            </View>
          </Modal>
        )}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onValueChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
            onDismiss={() => setShowDatePicker(false)}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Results state ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="dark-content" />

      {/* Results header */}
      <View style={S.resultsHdr}>
        <View style={S.resultsNav}>
          <TouchableOpacity onPress={() => setResults(null)} style={S.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <Text style={S.resultsRoute} numberOfLines={1}>{routeLabel}</Text>
          <TouchableOpacity style={S.filterBtn}>
            <Ionicons name="options-outline" size={22} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
        {/* Date strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: Spacing.md }}>
          {DAYS.map((d, i) => {
            const sel = toDateStr(d) === toDateStr(selectedDate);
            return (
              <TouchableOpacity key={i} style={[S.dsItem, sel && S.dsItemOn]} onPress={() => setSelectedDate(d)}>
                <Text style={[S.dsTxt, sel && S.dsTxtOn]}>
                  {DAY_SHORT[d.getDay()]} {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TripCard item={item} onPress={() => navigation.navigate('TripDetail', { trip: item })} />
        )}
        ListHeaderComponent={
          <Text style={S.dateHdr}>
            {DAY_SHORT[selectedDate.getDay()]}, {MONTH_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <Ionicons name="car-outline" size={56} color={Colors.textMuted} />
            <Text style={S.emptyTitle}>No rides available</Text>
            <Text style={S.emptyBody}>Try a different date or nearby city.</Text>
          </View>
        }
      />

      <PlacePickerModal visible={picking === 'from'} title="From" onSelect={p => { setFromPlace(p); setPicking(null); }} onClose={() => setPicking(null)} />
      <PlacePickerModal visible={picking === 'to'} title="To" onSelect={p => { setToPlace(p); setPicking(null); }} onClose={() => setPicking(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  modalSearch: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 52, backgroundColor: Colors.primaryLight },
  modalInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  suggRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.md },
  suggTxt: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  suggHint: { textAlign: 'center', marginTop: Spacing.lg, fontSize: FontSize.sm, color: Colors.textMuted },
  suggEmpty: { textAlign: 'center', marginTop: Spacing.lg, fontSize: FontSize.md, color: Colors.textMuted },

  // Home header
  appHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  userAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  userAvTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  homeGreeting: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, letterSpacing: -0.4 },

  // Search card
  searchCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: 18, paddingVertical: 6, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 6 },
  sf: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sfText: { flex: 1, fontSize: FontSize.md, color: Colors.textMuted },
  sfVal: { color: Colors.textPrimary, fontWeight: '500' },
  sfRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  sfHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: 14 },
  sfDivider: { width: 1, backgroundColor: Colors.border },
  swapBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceVariant, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  swapBtnTxt: { fontSize: 14, color: Colors.secondary, fontWeight: '700' },
  seatsMini: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 6 },
  seatMiniBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  seatMiniBtnTxt: { fontSize: 14, color: Colors.textPrimary, fontWeight: '700', lineHeight: 17 },
  seatMiniCount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, minWidth: 14, textAlign: 'center' },
  searchBtn: { margin: 10, marginHorizontal: 14, height: 52, backgroundColor: Colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  searchBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.2 },

  // Date picker
  dateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dateSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  dateSheetHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateSheetTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  dateSheetDone: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },

  // Home sections
  slabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.textMuted, paddingHorizontal: Spacing.md, marginBottom: 6 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 13, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentRoute: { flex: 1, fontSize: FontSize.sm, fontWeight: '500', color: Colors.textPrimary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.md },
  pill: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  pillTxt: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.secondary },

  // Results header
  resultsHdr: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: 4, paddingBottom: 12 },
  resultsNav: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.sm, marginBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  resultsRoute: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dsItem: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surfaceVariant },
  dsItemOn: { backgroundColor: Colors.secondary },
  dsTxt: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  dsTxtOn: { color: '#fff' },

  // Trip card
  dateHdr: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: Colors.textMuted, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 8 },
  tcard: { backgroundColor: Colors.surface, marginHorizontal: 12, marginBottom: 10, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tcTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tcTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tcBolt: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  tcTime: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  bkBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  bkInstant: { backgroundColor: Colors.secondaryLight },
  bkRequest: { backgroundColor: '#FFF3E0' },
  bkText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  bkInstantTxt: { color: Colors.secondary },
  bkRequestTxt: { color: '#E65100' },
  tcPrice: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.secondary },
  tcSeats: { fontSize: 11, color: Colors.textMuted, fontWeight: '500', textAlign: 'right' },

  tcRoute: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  routeCol: { width: 12, alignItems: 'center', paddingTop: 3 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { flex: 1, width: 1, backgroundColor: Colors.border, marginVertical: 2, minHeight: 12 },
  routeCity: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textPrimary },

  tcChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chipOk: { backgroundColor: '#E6F7EF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipOkText: { fontSize: 11, fontWeight: '500', color: '#065F46' },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  driverAv: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  driverAvTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.secondary, borderWidth: 2, borderColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  driverRating: { fontSize: 11, color: Colors.textMuted },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyBody: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },

  // Header icon button
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },

  // Quick access cards
  quickRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 10, marginBottom: Spacing.lg },
  quickCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
});

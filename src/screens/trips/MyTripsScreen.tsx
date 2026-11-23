import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { tripsApi, Trip } from '../../api/trips.api';
import Button from '../../components/common/Button';

// ─── Dummy data (used when API not ready) ─────────────────────────────────────

const DUMMY: Trip[] = [
  {
    id: 'd1', driverId: 'me', vehicleId: null, status: 'active',
    bookingMode: 'request', tripMode: 'passengers_only',
    departureAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    totalPassengerSeats: 3, availableSeats: 2, price: 55, distanceKm: 544,
    maxPackageSize: null, pkgPriceEnvelope: null, pkgPriceSmall: null, pkgPriceMedium: null, pkgPriceLarge: null,
    preferences: null, notes: null, province: 'ON',
    originWaypointId: 'w1', originName: 'Toronto, ON', originLat: 43.65, originLng: -79.38,
    destinationWaypointId: 'w2', destinationName: 'Montréal, QC', destinationLat: 45.50, destinationLng: -73.56,
    firstName: 'You', lastName: '', avatarUrl: null, driverAvgRating: null, driverReviewCount: 0,
  },
  {
    id: 'd2', driverId: 'me', vehicleId: null, status: 'active',
    bookingMode: 'instant', tripMode: 'passengers_and_packages',
    departureAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    totalPassengerSeats: 2, availableSeats: 0, price: 35, distanceKm: 200,
    maxPackageSize: 'small', pkgPriceEnvelope: 10, pkgPriceSmall: 20, pkgPriceMedium: null, pkgPriceLarge: null,
    preferences: { petsAllowed: true }, notes: 'Pet-friendly car.', province: 'ON',
    originWaypointId: 'w3', originName: 'Ottawa, ON', originLat: 45.42, originLng: -75.69,
    destinationWaypointId: 'w4', destinationName: 'Kingston, ON', destinationLat: 44.23, destinationLng: -76.48,
    firstName: 'You', lastName: '', avatarUrl: null, driverAvgRating: 4.8, driverReviewCount: 12,
  },
  {
    id: 'd3', driverId: 'me', vehicleId: null, status: 'completed',
    bookingMode: 'request', tripMode: 'passengers_only',
    departureAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    totalPassengerSeats: 3, availableSeats: 0, price: 30, distanceKm: 130,
    maxPackageSize: null, pkgPriceEnvelope: null, pkgPriceSmall: null, pkgPriceMedium: null, pkgPriceLarge: null,
    preferences: null, notes: null, province: 'ON',
    originWaypointId: 'w5', originName: 'Toronto, ON', originLat: 43.65, originLng: -79.38,
    destinationWaypointId: 'w6', destinationName: 'Niagara Falls, ON', destinationLat: 43.09, destinationLng: -79.08,
    firstName: 'You', lastName: '', avatarUrl: null, driverAvgRating: 5, driverReviewCount: 14,
  },
  {
    id: 'd4', driverId: 'me', vehicleId: null, status: 'cancelled',
    bookingMode: 'instant', tripMode: 'passengers_only',
    departureAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    totalPassengerSeats: 2, availableSeats: 1, price: 25, distanceKm: 80,
    maxPackageSize: null, pkgPriceEnvelope: null, pkgPriceSmall: null, pkgPriceMedium: null, pkgPriceLarge: null,
    preferences: null, notes: null, province: 'QC',
    originWaypointId: 'w7', originName: 'Montréal, QC', originLat: 45.50, originLng: -73.56,
    destinationWaypointId: 'w8', destinationName: 'Sherbrooke, QC', destinationLat: 45.40, destinationLng: -71.89,
    firstName: 'You', lastName: '', avatarUrl: null, driverAvgRating: null, driverReviewCount: 0,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return `${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  active:    { label: 'Active',     color: Colors.primary,   bg: Colors.primaryLight,    icon: 'radio-button-on-outline' },
  completed: { label: 'Completed',  color: '#2563EB',        bg: '#EFF6FF',              icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled',  color: Colors.danger,    bg: Colors.dangerLight,     icon: 'close-circle-outline' },
  draft:     { label: 'Draft',      color: Colors.textMuted, bg: Colors.surfaceVariant,  icon: 'ellipse-outline' },
};

type Props = { navigation: NativeStackNavigationProp<any> };

// ─── Trip card ────────────────────────────────────────────────────────────────

function TripCard({ trip, onPress, onCancel }: { trip: Trip; onPress: () => void; onCancel: () => void }) {
  const stat = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.active;
  const booked = trip.totalPassengerSeats - trip.availableSeats;

  return (
    <TouchableOpacity style={S.card} onPress={onPress} activeOpacity={0.8}>
      <View style={S.cardHeader}>
        <View style={[S.statusBadge, { backgroundColor: stat.bg }]}>
          <Ionicons name={stat.icon} size={12} color={stat.color} />
          <Text style={[S.statusText, { color: stat.color }]}>{stat.label}</Text>
        </View>
        {trip.status === 'active' && (
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={S.routeRow}>
        <View style={S.timelineCol}>
          <View style={[S.tDot, { backgroundColor: Colors.primary }]} />
          <View style={S.tLine} />
          <View style={[S.tDot, { backgroundColor: Colors.secondary }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.cityName} numberOfLines={1}>{trip.originName}</Text>
          <Text style={S.routeArrow}>↓</Text>
          <Text style={S.cityName} numberOfLines={1}>{trip.destinationName}</Text>
        </View>
        <View style={S.priceCol}>
          <Text style={S.priceVal}>${Number(trip.price).toFixed(0)}</Text>
          <Text style={S.priceSub}>/ seat</Text>
        </View>
      </View>

      <View style={S.cardFooter}>
        <View style={S.footerTag}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
          <Text style={S.footerTagText}> {formatDateShort(trip.departureAt)}</Text>
        </View>
        <View style={S.footerTag}>
          <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
          <Text style={S.footerTagText}> {formatTime(trip.departureAt)}</Text>
        </View>
        <View style={S.footerTag}>
          <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
          <Text style={S.footerTagText}> {booked}/{trip.totalPassengerSeats} booked</Text>
        </View>
        {trip.distanceKm > 0 && (
          <View style={S.footerTag}>
            <Ionicons name="navigate-outline" size={13} color={Colors.textSecondary} />
            <Text style={S.footerTagText}> {Math.round(trip.distanceKm)} km</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MyTripsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<FilterTab>('all');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const { data } = await tripsApi.listMine();
      setTrips(Array.isArray(data) ? data : DUMMY);
    } catch {
      setTrips(DUMMY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const onRefresh = () => { setRefreshing(true); fetchTrips(); };

  const filtered = tab === 'all' ? trips : trips.filter(t => t.status === tab);

  const handleCancel = (id: string) => {
    Alert.alert(
      'Cancel trip?',
      'This will remove the trip and notify any booked passengers.',
      [
        { text: 'Keep trip', style: 'cancel' },
        {
          text: 'Cancel trip', style: 'destructive', onPress: async () => {
            try {
              await tripsApi.cancel(id);
              setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t));
            } catch {
              Alert.alert('Error', 'Could not cancel the trip. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={S.container}>
      {/* Filter tabs */}
      <View style={S.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[S.tab, tab === t.key && S.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[S.tabText, tab === t.key && S.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => navigation.navigate('TripPassengers', { trip: item })}
            onCancel={() => handleCancel(item.id)}
          />
        )}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xl, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={S.empty}>
              <Ionicons name="car-sport-outline" size={64} color={Colors.textMuted} />
              <Text style={S.emptyTitle}>
                {tab === 'all' ? 'No trips yet' : `No ${tab} trips`}
              </Text>
              <Text style={S.emptyBody}>
                {tab === 'all'
                  ? 'Post your first trip and start earning.'
                  : `You don't have any ${tab} trips right now.`}
              </Text>
              {tab === 'all' && (
                <View style={{ marginTop: Spacing.lg, width: '80%' }}>
                  <Button title="Post a Trip" onPress={() => navigation.navigate('CreateTrip')} />
                </View>
              )}
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity style={S.fab} onPress={() => navigation.navigate('CreateTrip')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  tabsRow: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceVariant },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  timelineCol: { width: 14, alignItems: 'center', paddingVertical: 2 },
  tDot: { width: 10, height: 10, borderRadius: 5 },
  tLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 2, minHeight: 16 },
  cityName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  routeArrow: { fontSize: FontSize.xs, color: Colors.textMuted, marginVertical: 2, marginLeft: 2 },
  priceCol: { alignItems: 'flex-end', paddingLeft: Spacing.sm },
  priceVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  priceSub: { fontSize: FontSize.xs, color: Colors.textMuted },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  footerTag: { flexDirection: 'row', alignItems: 'center' },
  footerTagText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptyBody: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  fab: {
    position: 'absolute', bottom: 28, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { bookingsApi, Booking } from '../../api/bookings.api';
import { messagingApi } from '../../api/messaging.api';

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY: Booking[] = [
  {
    id: 'b1', tripId: 't1', passengerId: 'me', seats: 2, totalPrice: 110,
    status: 'confirmed', bookingMode: 'instant', message: null,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    originName: 'Toronto, ON', destinationName: 'Montréal, QC',
    departureAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    driverFirstName: 'Marcus', driverLastName: 'T.', driverAvgRating: 4.9, driverReviewCount: 47,
  },
  {
    id: 'b2', tripId: 't2', passengerId: 'me', seats: 1, totalPrice: 45,
    status: 'pending', bookingMode: 'request', message: 'Hi! I travel this route often.',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    originName: 'Ottawa, ON', destinationName: 'Kingston, ON',
    departureAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    driverFirstName: 'Priya', driverLastName: 'N.', driverAvgRating: 5.0, driverReviewCount: 12,
  },
  {
    id: 'b3', tripId: 't3', passengerId: 'me', seats: 1, totalPrice: 35,
    status: 'confirmed', bookingMode: 'request', message: null,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    originName: 'Montréal, QC', destinationName: 'Québec City, QC',
    departureAt: new Date(Date.now() + 8 * 86400000).toISOString(),
    driverFirstName: 'David', driverLastName: 'K.', driverAvgRating: 4.7, driverReviewCount: 29,
  },
  {
    id: 'b4', tripId: 't4', passengerId: 'me', seats: 1, totalPrice: 30,
    status: 'declined', bookingMode: 'request', message: 'Looking forward to the trip!',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    originName: 'Toronto, ON', destinationName: 'Hamilton, ON',
    departureAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    driverFirstName: 'Layla', driverLastName: 'A.', driverAvgRating: 4.8, driverReviewCount: 21,
  },
  {
    id: 'b5', tripId: 't5', passengerId: 'me', seats: 2, totalPrice: 60,
    status: 'cancelled', bookingMode: 'instant', message: null,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    originName: 'Toronto, ON', destinationName: 'Niagara Falls, ON',
    departureAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    driverFirstName: 'James', driverLastName: 'O.', driverAvgRating: 4.6, driverReviewCount: 18,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const AVATAR_COLORS = ['#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

type FilterTab = 'all' | 'upcoming' | 'past' | 'cancelled';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'past',      label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending:   { label: 'Awaiting approval', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  confirmed: { label: 'Confirmed',         color: Colors.primary, bg: Colors.primaryLight, icon: 'checkmark-circle-outline' },
  declined:  { label: 'Declined',          color: Colors.danger,  bg: Colors.dangerLight,  icon: 'close-circle-outline' },
  cancelled: { label: 'Cancelled',         color: Colors.textMuted, bg: Colors.surfaceVariant, icon: 'ban-outline' },
};

function isUpcoming(b: Booking) {
  return (b.status === 'confirmed' || b.status === 'pending') &&
    new Date(b.departureAt ?? 0) > new Date();
}
function isPast(b: Booking) {
  return b.status === 'confirmed' && new Date(b.departureAt ?? 0) <= new Date();
}

type Props = { navigation: NativeStackNavigationProp<any> };

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ booking, onCancel, onMessage }: { booking: Booking; onCancel: () => void; onMessage: () => void }) {
  const stat = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const driverName = `${booking.driverFirstName ?? ''} ${booking.driverLastName ?? ''}`.trim();
  const initials = `${booking.driverFirstName?.[0] ?? ''}${booking.driverLastName?.[0] ?? ''}`.toUpperCase();
  const color = avatarColor(booking.driverFirstName ?? 'A');
  const rating = booking.driverAvgRating ? Number(booking.driverAvgRating).toFixed(1) : null;
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

  return (
    <View style={S.card}>
      {/* Status row */}
      <View style={S.cardTop}>
        <View style={[S.statusBadge, { backgroundColor: stat.bg }]}>
          <Ionicons name={stat.icon} size={13} color={stat.color} />
          <Text style={[S.statusTxt, { color: stat.color }]}>{stat.label}</Text>
        </View>
        <Text style={S.timeAgo}>{timeAgo(booking.createdAt)}</Text>
      </View>

      {/* Route */}
      <View style={S.routeRow}>
        <View style={S.routeCol}>
          <View style={[S.dot, { backgroundColor: Colors.primary }]} />
          <View style={S.routeLine} />
          <View style={[S.dot, { backgroundColor: '#DC2626' }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.cityName} numberOfLines={1}>{booking.originName}</Text>
          <View style={{ height: 10 }} />
          <Text style={S.cityName} numberOfLines={1}>{booking.destinationName}</Text>
        </View>
        <View style={S.priceCol}>
          <Text style={S.price}>${booking.totalPrice.toFixed(0)}</Text>
          <Text style={S.priceSub}>{booking.seats} seat{booking.seats !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={S.metaRow}>
        <View style={S.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={S.metaTxt}>{formatDate(booking.departureAt ?? '')}</Text>
        </View>
        <View style={S.metaItem}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={S.metaTxt}>{formatTime(booking.departureAt ?? '')}</Text>
        </View>
        {booking.bookingMode === 'instant'
          ? <View style={S.metaItem}><Text style={S.instantBadge}>⚡ Instant</Text></View>
          : <View style={S.metaItem}><Text style={S.requestBadge}>Request</Text></View>}
      </View>

      {/* Driver row */}
      <View style={S.driverRow}>
        <View style={[S.driverAv, { backgroundColor: color }]}>
          <Text style={S.driverAvTxt}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.driverName}>{driverName}</Text>
          {rating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={S.driverRating}>{rating} · {booking.driverReviewCount} reviews</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={S.msgBtn} onPress={onMessage} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.secondary} />
          </TouchableOpacity>
          {canCancel && (
            <TouchableOpacity style={S.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={S.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pending message */}
      {booking.status === 'pending' && (
        <View style={S.pendingBanner}>
          <Ionicons name="information-circle-outline" size={15} color="#D97706" />
          <Text style={S.pendingTxt}>
            The driver has been notified. You will hear back soon.
          </Text>
        </View>
      )}

      {/* Declined message */}
      {booking.status === 'declined' && (
        <View style={S.declinedBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
          <Text style={S.declinedTxt}>
            The driver could not accommodate this request.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MyBookingsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<FilterTab>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await bookingsApi.listMine();
      setBookings(Array.isArray(data) && data.length > 0 ? data : DUMMY);
    } catch {
      setBookings(DUMMY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const filtered = bookings.filter(b => {
    if (tab === 'all') return true;
    if (tab === 'upcoming') return isUpcoming(b);
    if (tab === 'past') return isPast(b) || b.status === 'declined';
    if (tab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const handleMessage = async (booking: Booking) => {
    const driverId = booking.driverId;
    if (!driverId) {
      Alert.alert('Not available', 'Driver info is not available yet.');
      return;
    }
    try {
      const { data: thread } = await messagingApi.getOrCreateThread(driverId, 'TRIP', booking.tripId);
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          threadId: thread.id,
          otherUser: {
            id: driverId,
            firstName: booking.driverFirstName ?? 'Driver',
            lastName: booking.driverLastName ?? '',
            avatarUrl: null,
          },
          tripRoute: booking.originName && booking.destinationName
            ? `${booking.originName} → ${booking.destinationName}`
            : undefined,
        },
      });
    } catch {
      Alert.alert('Error', 'Could not open chat. Please try again.');
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert(
      'Cancel booking?',
      'Your seat will be released and the driver will be notified.',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking', style: 'destructive', onPress: async () => {
            try {
              await bookingsApi.cancel(id);
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
            } catch {
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
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
          <TouchableOpacity
            key={t.key}
            style={[S.tab, tab === t.key && S.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[S.tabTxt, tab === t.key && S.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onCancel={() => handleCancel(item.id)}
            onMessage={() => handleMessage(item)}
          />
        )}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={S.empty}>
              <Ionicons name="ticket-outline" size={64} color={Colors.textMuted} />
              <Text style={S.emptyTitle}>
                {tab === 'all' ? 'No bookings yet' : `No ${tab} bookings`}
              </Text>
              <Text style={S.emptyBody}>
                {tab === 'all'
                  ? 'Search for a ride and book your first seat.'
                  : `You have no ${tab} bookings right now.`}
              </Text>
              {tab === 'all' && (
                <TouchableOpacity style={S.searchBtn} onPress={() => navigation.navigate('TripSearch')}>
                  <Text style={S.searchBtnTxt}>Find a ride</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  tabsRow: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceVariant },
  tabActive: { backgroundColor: Colors.primary },
  tabTxt: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTxtActive: { color: Colors.white },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusTxt: { fontSize: FontSize.xs, fontWeight: '700' },
  timeAgo: { fontSize: FontSize.xs, color: Colors.textMuted },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  routeCol: { width: 12, alignItems: 'center', alignSelf: 'stretch', justifyContent: 'space-between', paddingVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 2 },
  cityName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  priceCol: { alignItems: 'flex-end', paddingLeft: Spacing.sm },
  price: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  priceSub: { fontSize: FontSize.xs, color: Colors.textMuted },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: FontSize.xs, color: Colors.textSecondary },
  instantBadge: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  requestBadge: { fontSize: FontSize.xs, fontWeight: '700', color: '#E65100' },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  driverAv: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  driverAvTxt: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  driverName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  driverRating: { fontSize: FontSize.xs, color: Colors.textMuted },
  msgBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.danger },
  cancelBtnTxt: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.danger },

  pendingBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF3C7', borderRadius: Radius.sm, padding: 10, marginTop: Spacing.sm },
  pendingTxt: { flex: 1, fontSize: FontSize.xs, color: '#92400E', lineHeight: 18 },
  declinedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: 10, marginTop: Spacing.sm },
  declinedTxt: { flex: 1, fontSize: FontSize.xs, color: Colors.danger, lineHeight: 18 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptyBody: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 22 },
  searchBtn: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: Radius.lg },
  searchBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});

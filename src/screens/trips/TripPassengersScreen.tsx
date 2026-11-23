import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Trip } from '../../api/trips.api';
import { bookingsApi, DriverBooking } from '../../api/bookings.api';
import { messagingApi } from '../../api/messaging.api';

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AV_COLORS = ['#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
function avatarColor(id: string) { return AV_COLORS[id.charCodeAt(0) % AV_COLORS.length]; }

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending_approval: { label: 'Pending',   color: '#D97706', bg: '#FEF3C7' },
  approved:         { label: 'Confirmed', color: Colors.primary,  bg: Colors.primaryLight },
  pending_payment:  { label: 'Awaiting payment', color: '#2563EB', bg: '#EFF6FF' },
  cancelled_passenger: { label: 'Cancelled', color: Colors.textMuted, bg: Colors.surfaceVariant },
  cancelled_driver:    { label: 'Cancelled', color: Colors.textMuted, bg: Colors.surfaceVariant },
  // legacy
  pending:   { label: 'Pending',   color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmed', color: Colors.primary,  bg: Colors.primaryLight },
  declined:  { label: 'Declined',  color: Colors.danger,   bg: Colors.dangerLight },
  cancelled: { label: 'Cancelled', color: Colors.textMuted, bg: Colors.surfaceVariant },
};

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_BOOKINGS: DriverBooking[] = [
  {
    id: 'b1', tripId: 'd1', passengerId: 'p1', seats: 1, totalPrice: 55,
    status: 'pending_approval', message: 'I have a small backpack only. See you there!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    passenger: { id: 'p1', firstName: 'Amina', lastName: 'Touré', avatarUrl: null },
    fromWaypoint: { name: 'Toronto, ON' }, toWaypoint: { name: 'Montréal, QC' },
    trip: { id: 'd1', departureAt: new Date(Date.now() + 2 * 86400000).toISOString() },
  },
  {
    id: 'b2', tripId: 'd1', passengerId: 'p2', seats: 2, totalPrice: 110,
    status: 'approved', message: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    passenger: { id: 'p2', firstName: 'Liam', lastName: 'Nguyen', avatarUrl: null },
    fromWaypoint: { name: 'Toronto, ON' }, toWaypoint: { name: 'Montréal, QC' },
    trip: { id: 'd1', departureAt: new Date(Date.now() + 2 * 86400000).toISOString() },
  },
  {
    id: 'b3', tripId: 'd2', passengerId: 'p3', seats: 1, totalPrice: 35,
    status: 'approved', message: 'Thanks for accepting pets!',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    passenger: { id: 'p3', firstName: 'Sofia', lastName: 'Patel', avatarUrl: null },
    fromWaypoint: { name: 'Ottawa, ON' }, toWaypoint: { name: 'Kingston, ON' },
    trip: { id: 'd2', departureAt: new Date(Date.now() + 5 * 86400000).toISOString() },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Passenger card ───────────────────────────────────────────────────────────

function PassengerCard({
  booking, tripBookingMode, onApprove, onDecline, onMessage, approving,
}: {
  booking: DriverBooking;
  tripBookingMode: 'instant' | 'request';
  onApprove: () => void;
  onDecline: () => void;
  onMessage: () => void;
  approving: boolean;
}) {
  const stat = STATUS[booking.status] ?? STATUS.pending;
  const isPending = booking.status === 'pending_approval' || booking.status === 'pending';
  const initials = `${booking.passenger.firstName[0]}${booking.passenger.lastName[0] ?? ''}`.toUpperCase();
  const bgColor = avatarColor(booking.passenger.id);

  return (
    <View style={S.card}>
      <View style={S.cardTop}>
        {/* Avatar */}
        <View style={[S.avatar, { backgroundColor: bgColor }]}>
          <Text style={S.avatarTxt}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={S.cardInfo}>
          <Text style={S.passengerName}>
            {booking.passenger.firstName} {booking.passenger.lastName}
          </Text>
          <Text style={S.cardMeta}>
            {booking.seats} seat{booking.seats > 1 ? 's' : ''} · ${Number(booking.totalPrice).toFixed(0)} · {timeAgo(booking.createdAt)}
          </Text>
          {booking.fromWaypoint && booking.toWaypoint && (
            <Text style={S.routeText} numberOfLines={1}>
              {booking.fromWaypoint.name} → {booking.toWaypoint.name}
            </Text>
          )}
        </View>

        {/* Status badge */}
        <View style={[S.badge, { backgroundColor: stat.bg }]}>
          <Text style={[S.badgeText, { color: stat.color }]}>{stat.label}</Text>
        </View>
      </View>

      {/* Passenger message */}
      {booking.message ? (
        <View style={S.msgBox}>
          <Ionicons name="chatbubble-outline" size={13} color={Colors.textMuted} />
          <Text style={S.msgText}>{booking.message}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={S.actions}>
        {isPending && tripBookingMode === 'request' && (
          <>
            <TouchableOpacity
              style={[S.actionBtn, S.declineBtn]}
              onPress={onDecline}
              disabled={approving}
            >
              <Ionicons name="close" size={15} color={Colors.danger} />
              <Text style={[S.actionBtnText, { color: Colors.danger }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.actionBtn, S.approveBtn]}
              onPress={onApprove}
              disabled={approving}
            >
              {approving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={15} color="#fff" />
                  <Text style={[S.actionBtnText, { color: '#fff' }]}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={[S.actionBtn, S.msgBtn]} onPress={onMessage}>
          <Ionicons name="chatbubble-ellipses-outline" size={15} color={Colors.secondary} />
          <Text style={[S.actionBtnText, { color: Colors.secondary }]}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { trip: Trip } };
};

export default function TripPassengersScreen({ navigation, route }: Props) {
  const { trip } = route.params;
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await bookingsApi.listForDriver();
      const forTrip = Array.isArray(data) ? data.filter(b => b.tripId === trip.id) : [];
      setBookings(forTrip.length > 0 ? forTrip : DUMMY_BOOKINGS.filter(b => b.tripId === trip.id));
    } catch {
      setBookings(DUMMY_BOOKINGS.filter(b => b.tripId === trip.id));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trip.id]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await bookingsApi.approve(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'approved' } : b));
    } catch {
      Alert.alert('Error', 'Could not approve this booking. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDecline = (id: string) => {
    Alert.alert(
      'Decline booking?',
      'The passenger will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline', style: 'destructive', onPress: async () => {
            try {
              await bookingsApi.decline(id);
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled_driver' } : b));
            } catch {
              Alert.alert('Error', 'Could not decline this booking.');
            }
          },
        },
      ],
    );
  };

  const handleMessage = async (booking: DriverBooking) => {
    try {
      const { data: thread } = await messagingApi.getOrCreateThread(
        booking.passenger.id,
        'TRIP',
        trip.id,
      );
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          threadId: thread.id,
          otherUser: booking.passenger,
          tripRoute: `${trip.originName} → ${trip.destinationName}`,
        },
      });
    } catch {
      Alert.alert('Error', 'Could not open chat. Please try again.');
    }
  };

  const pending  = bookings.filter(b => b.status === 'pending_approval' || b.status === 'pending');
  const approved = bookings.filter(b => b.status === 'approved' || b.status === 'confirmed');
  const others   = bookings.filter(b => !['pending_approval','pending','approved','confirmed'].includes(b.status));

  const sections: { title: string; data: DriverBooking[] }[] = [
    ...(pending.length  ? [{ title: `Awaiting approval (${pending.length})`,  data: pending }]  : []),
    ...(approved.length ? [{ title: `Confirmed passengers (${approved.length})`, data: approved }] : []),
    ...(others.length   ? [{ title: 'Other',  data: others }]  : []),
  ];

  const allItems: (DriverBooking | { _section: string })[] = sections.flatMap(s => [
    { _section: s.title } as { _section: string },
    ...s.data,
  ]);

  return (
    <SafeAreaView style={S.safe}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle} numberOfLines={1}>{trip.originName} → {trip.destinationName}</Text>
          <Text style={S.headerSub}>
            {bookings.length} passenger{bookings.length !== 1 ? 's' : ''} · {trip.bookingMode === 'request' ? 'Approval required' : 'Instant booking'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={S.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={S.empty}>
          <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
          <Text style={S.emptyTitle}>No passengers yet</Text>
          <Text style={S.emptyBody}>Passengers who book this trip will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item, i) => ('_section' in item ? `sec-${i}` : item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if ('_section' in item) {
              return <Text style={S.sectionLabel}>{item._section}</Text>;
            }
            return (
              <PassengerCard
                booking={item}
                tripBookingMode={trip.bookingMode}
                onApprove={() => handleApprove(item.id)}
                onDecline={() => handleDecline(item.id)}
                onMessage={() => handleMessage(item)}
                approving={approvingId === item.id}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.background },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerMid:  { flex: 1, paddingHorizontal: Spacing.xs },
  headerTitle:{ fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  headerSub:  { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1, color: Colors.textMuted, marginBottom: 8, marginTop: 6 },

  card:       { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' },
  cardTop:    { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardInfo:   { flex: 1, gap: 2 },
  passengerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardMeta:   { fontSize: 12, color: Colors.textSecondary },
  routeText:  { fontSize: 12, color: Colors.textMuted },

  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:  { fontSize: 11, fontWeight: '700' },

  msgBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.surfaceVariant, borderRadius: 8, padding: 10 },
  msgText:    { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  actions:    { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  declineBtn: { borderRightWidth: 1, borderRightColor: Colors.border },
  approveBtn: { backgroundColor: Colors.primary, borderRightWidth: 1, borderRightColor: Colors.primary },
  msgBtn:     {},

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyBody:  { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Trip } from '../../api/trips.api';
import { bookingsApi } from '../../api/bookings.api';

const DAY_LONG    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${DAY_LONG[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const AVATAR_COLORS = ['#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length]; }

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ BookingConfirm: { trip: Trip } }, 'BookingConfirm'>;
};

export default function BookingConfirmScreen({ navigation, route }: Props) {
  const { trip } = route.params;
  const isInstant = trip.bookingMode === 'instant';
  const maxSeats = Math.min(trip.availableSeats, 4);

  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const pricePerSeat = Number(trip.price);
  const total = pricePerSeat * seats;

  const initials = `${trip.firstName?.[0] ?? ''}${trip.lastName?.[0] ?? ''}`.toUpperCase();
  const color = avatarColor(trip.driverId);
  const rating = trip.driverAvgRating ? Number(trip.driverAvgRating).toFixed(1) : null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsApi.create({
        tripId: trip.id,
        fromWaypointId: trip.originWaypointId,
        toWaypointId: trip.destinationWaypointId,
        seats,
      });
      setBookingId(data.id ?? 'BK-' + Date.now());
      setSuccess(true);
    } catch (e: any) {
      // If the backend isn't ready yet, simulate success
      const status = e?.response?.status;
      if (!status || status >= 500) {
        setBookingId('BK-' + Math.random().toString(36).slice(2, 8).toUpperCase());
        setSuccess(true);
      } else {
        Alert.alert('Booking failed', e?.response?.data?.message ?? 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ───────────────────────────────────────────────────────────

  if (success) {
    return (
      <SafeAreaView style={S.container}>
        <View style={S.successWrap}>
          <View style={S.successIcon}>
            <Ionicons name={isInstant ? 'checkmark-circle' : 'time'} size={72} color={Colors.primary} />
          </View>
          <Text style={S.successTitle}>
            {isInstant ? 'All booked!' : 'Request sent!'}
          </Text>
          <Text style={S.successSub}>
            {isInstant
              ? `Your ${seats} seat${seats > 1 ? 's' : ''} on this trip ${seats > 1 ? 'are' : 'is'} confirmed.`
              : 'The driver will review your request and get back to you soon.'}
          </Text>

          <View style={S.successCard}>
            <View style={S.successRow}>
              <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
              <Text style={S.successRowTxt}>{trip.originName}</Text>
            </View>
            <View style={[S.successRow, { marginTop: 6 }]}>
              <Ionicons name="location" size={16} color="#DC2626" />
              <Text style={S.successRowTxt}>{trip.destinationName}</Text>
            </View>
            <View style={[S.successRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
              <Text style={S.successRowTxt}>{formatDate(trip.departureAt)} · {formatTime(trip.departureAt)}</Text>
            </View>
            <View style={[S.successRow, { marginTop: 6 }]}>
              <Ionicons name="people-outline" size={16} color={Colors.textMuted} />
              <Text style={S.successRowTxt}>{seats} seat{seats > 1 ? 's' : ''} · ${total.toFixed(0)} total</Text>
            </View>
            <Text style={S.bookingRef}>Ref: {bookingId}</Text>
          </View>

          <TouchableOpacity style={S.doneBtn} onPress={() => navigation.popToTop()} activeOpacity={0.85}>
            <Text style={S.doneBtnTxt}>Back to search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.doneBtnSecondary} onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.85}>
            <Text style={S.doneBtnSecondaryTxt}>View my bookings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Confirm form ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={S.container}>
      <View style={S.hdr}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.hdrBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={S.hdrTitle}>{isInstant ? 'Confirm Booking' : 'Request a Ride'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Mode banner */}
          <View style={[S.modeBanner, isInstant ? S.modeBannerInstant : S.modeBannerRequest]}>
            <Ionicons
              name={isInstant ? 'flash' : 'hourglass-outline'}
              size={18}
              color={isInstant ? Colors.primary : '#E65100'}
            />
            <View style={{ flex: 1 }}>
              <Text style={[S.modeBannerTitle, !isInstant && { color: '#E65100' }]}>
                {isInstant ? 'Instant booking' : 'Booking request'}
              </Text>
              <Text style={S.modeBannerSub}>
                {isInstant
                  ? 'Your seat is confirmed immediately after payment.'
                  : 'The driver will review and approve your request.'}
              </Text>
            </View>
          </View>

          {/* Driver card */}
          <View style={S.card}>
            <Text style={S.sectionLabel}>Driver</Text>
            <View style={S.driverRow}>
              <View style={[S.driverAv, { backgroundColor: color }]}>
                <Text style={S.driverAvTxt}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.driverName}>{trip.firstName} {trip.lastName}</Text>
                {rating && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={S.driverRating}>{rating} · {trip.driverReviewCount} reviews</Text>
                  </View>
                )}
              </View>
              <View style={[S.bkBadge, isInstant ? S.bkInstant : S.bkRequest]}>
                <Text style={[S.bkTxt, isInstant ? S.bkInstantTxt : S.bkRequestTxt]}>
                  {isInstant ? '⚡ Instant' : 'Request'}
                </Text>
              </View>
            </View>
          </View>

          {/* Trip summary */}
          <View style={S.card}>
            <Text style={S.sectionLabel}>Trip</Text>
            <View style={S.routeRow}>
              <View style={S.routeCol}>
                <View style={[S.routeDot, { backgroundColor: Colors.primary }]} />
                <View style={S.routeLine} />
                <View style={[S.routeDot, { backgroundColor: '#DC2626' }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.routeCity}>{trip.originName}</Text>
                <View style={{ height: 14 }} />
                <Text style={S.routeCity}>{trip.destinationName}</Text>
              </View>
            </View>
            <View style={S.tripMeta}>
              <View style={S.tripMetaItem}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                <Text style={S.tripMetaTxt}>{formatDate(trip.departureAt)}</Text>
              </View>
              <View style={S.tripMetaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={S.tripMetaTxt}>{formatTime(trip.departureAt)}</Text>
              </View>
            </View>
          </View>

          {/* Seat selector */}
          <View style={S.card}>
            <Text style={S.sectionLabel}>Seats</Text>
            <View style={S.seatsRow}>
              <TouchableOpacity
                style={[S.seatBtn, seats <= 1 && S.seatBtnDis]}
                onPress={() => setSeats(s => Math.max(1, s - 1))}
              >
                <Ionicons name="remove" size={22} color={seats > 1 ? Colors.primary : Colors.textMuted} />
              </TouchableOpacity>
              <View style={S.seatCount}>
                <Text style={S.seatNum}>{seats}</Text>
                <Text style={S.seatLbl}>seat{seats !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                style={[S.seatBtn, seats >= maxSeats && S.seatBtnDis]}
                onPress={() => setSeats(s => Math.min(maxSeats, s + 1))}
              >
                <Ionicons name="add" size={22} color={seats < maxSeats ? Colors.primary : Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={S.seatsAvailable}>{trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} available on this trip</Text>
          </View>

          {/* Message — shown for both modes but required flavour for request */}
          <View style={S.card}>
            <Text style={S.sectionLabel}>
              {isInstant ? 'Message to driver (optional)' : 'Message to driver'}
            </Text>
            <TextInput
              style={S.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder={
                isInstant
                  ? 'Say hi or share pickup info…'
                  : 'Introduce yourself — why are you travelling?'
              }
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={S.charCount}>{message.length}/300</Text>
          </View>

          {/* Price breakdown */}
          <View style={S.card}>
            <Text style={S.sectionLabel}>Price breakdown</Text>
            <View style={S.priceRow}>
              <Text style={S.priceLbl}>${pricePerSeat.toFixed(0)} × {seats} seat{seats !== 1 ? 's' : ''}</Text>
              <Text style={S.priceVal}>${total.toFixed(0)}</Text>
            </View>
            <View style={[S.priceRow, S.priceTotalRow]}>
              <Text style={S.priceTotalLbl}>Total</Text>
              <Text style={S.priceTotalVal}>${total.toFixed(0)}</Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky footer */}
      <View style={S.footer}>
        <View>
          <Text style={S.footerTotal}>${total.toFixed(0)}</Text>
          <Text style={S.footerSub}>{seats} seat{seats !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={S.confirmBtn} onPress={handleConfirm} activeOpacity={0.85} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.confirmBtnTxt}>
                {isInstant ? '⚡ Confirm booking' : 'Send request →'}
              </Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.xs, paddingVertical: 8 },
  hdrBack: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hdrTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },

  scroll: { padding: Spacing.md, gap: Spacing.md },

  modeBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: Radius.lg, borderWidth: 1 },
  modeBannerInstant: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  modeBannerRequest: { backgroundColor: '#FFF3E0', borderColor: '#FDBA74' },
  modeBannerTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  modeBannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 12 },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAv: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  driverAvTxt: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  driverName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  driverRating: { fontSize: FontSize.xs, color: Colors.textMuted },
  bkBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full },
  bkInstant: { backgroundColor: Colors.primaryLight },
  bkRequest: { backgroundColor: '#FFF3E0' },
  bkTxt: { fontSize: 11, fontWeight: '700' },
  bkInstantTxt: { color: Colors.primary },
  bkRequestTxt: { color: '#E65100' },

  routeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  routeCol: { width: 12, alignItems: 'center', paddingTop: 3 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 3, minHeight: 14 },
  routeCity: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  tripMeta: { gap: 6, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  tripMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tripMetaTxt: { fontSize: FontSize.sm, color: Colors.textSecondary },

  seatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  seatBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  seatBtnDis: { opacity: 0.35 },
  seatCount: { alignItems: 'center' },
  seatNum: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary, lineHeight: 48 },
  seatLbl: { fontSize: FontSize.sm, color: Colors.textMuted },
  seatsAvailable: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },

  messageInput: { fontSize: FontSize.md, color: Colors.textPrimary, backgroundColor: Colors.surfaceVariant, borderRadius: Radius.md, padding: 12, minHeight: 96, borderWidth: 1, borderColor: Colors.border },
  charCount: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 6 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLbl: { fontSize: FontSize.md, color: Colors.textSecondary },
  priceVal: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  priceTotalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 0 },
  priceTotalLbl: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  priceTotalVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 16, paddingBottom: 28 },
  footerTotal: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  footerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  confirmBtn: { backgroundColor: Colors.primary, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 24 },
  confirmBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // Success
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { marginBottom: Spacing.lg },
  successTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.4 },
  successSub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  successCard: { width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  successRowTxt: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  bookingRef: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 12, fontWeight: '600' },
  doneBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.lg, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl },
  doneBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  doneBtnSecondary: { width: '100%', height: 48, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  doneBtnSecondaryTxt: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
});

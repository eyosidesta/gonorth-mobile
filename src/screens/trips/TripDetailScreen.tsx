import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Trip } from '../../api/trips.api';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateLong(iso: string) {
  const d = new Date(iso);
  return `${DAY_LONG[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const AVATAR_COLORS = ['#7C3AED', '#0284C7', '#059669', '#D97706', '#DC2626'];
function getAvatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length]; }

const LUGGAGE_LABELS: Record<string, { emoji: string; label: string }> = {
  small:  { emoji: '🎒', label: 'Carry-on' },
  medium: { emoji: '💼', label: 'Medium bag' },
  large:  { emoji: '🧳', label: 'Full suitcase' },
};
const PKG_LABELS: Record<string, { emoji: string; label: string }> = {
  envelope: { emoji: '📄', label: 'Envelope' },
  small:    { emoji: '📦', label: 'Small box' },
  medium:   { emoji: '🧳', label: 'Medium' },
  large:    { emoji: '📫', label: 'Large box' },
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ TripDetail: { trip: Trip } }, 'TripDetail'>;
};

export default function TripDetailScreen({ navigation, route }: Props) {
  const { trip } = route.params;
  const prefs = trip.preferences ?? {};
  const luggageSizes: string[] = Array.isArray(prefs.luggageSizes) ? prefs.luggageSizes : [];
  const rating = trip.driverAvgRating ? Number(trip.driverAvgRating).toFixed(1) : null;
  const initials = `${trip.firstName?.[0] ?? ''}${trip.lastName?.[0] ?? ''}`.toUpperCase();
  const avColor = getAvatarColor(trip.driverId);
  const price = Number(trip.price);

  const boolPrefs: { icon: keyof typeof Ionicons.glyphMap; label: string; ok: boolean }[] = [
    { icon: 'paw-outline',          label: 'Pets allowed',    ok: !!prefs.petsAllowed },
    { icon: 'snow-outline',         label: 'Winter tires',    ok: !!prefs.hasWinterTires },
    { icon: 'partly-sunny-outline', label: 'Ski equipment',   ok: !!prefs.skiEquipment },
    { icon: 'bicycle-outline',      label: 'Bikes allowed',   ok: !!prefs.bikesAllowed },
    { icon: 'person-outline',       label: 'Back row open',   ok: !!prefs.maxBackRow },
  ];

  const handleBook = () => {
    navigation.navigate('BookingConfirm', { trip });
  };

  return (
    <SafeAreaView style={S.container}>
      {/* Custom back header */}
      <View style={S.hdr}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.hdrBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={S.hdrTitle}>Trip Details</Text>
        <TouchableOpacity style={S.hdrBack}>
          <Ionicons name="share-outline" size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ── Driver hero ── */}
        <View style={S.driverHero}>
          <View style={{ position: 'relative' }}>
            <View style={[S.heroAv, { backgroundColor: avColor }]}>
              <Text style={S.heroAvTxt}>{initials || '?'}</Text>
            </View>
            <View style={S.heroBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.heroName}>{trip.firstName} {trip.lastName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={S.heroStat}>
                {rating ?? 'New driver'} · {trip.driverReviewCount} {trip.driverReviewCount === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
            <View style={S.heroTags}>
              <View style={S.vtag}>
                <Ionicons name="shield-checkmark-outline" size={12} color={Colors.secondary} />
                <Text style={S.vtagTxt}>Verified</Text>
              </View>
              {trip.driverAvgRating && Number(trip.driverAvgRating) >= 4.8 && (
                <View style={S.vtag}>
                  <Ionicons name="ribbon-outline" size={12} color={Colors.secondary} />
                  <Text style={S.vtagTxt}>Top-rated</Text>
                </View>
              )}
              <View style={S.vtag}>
                <Ionicons name="time-outline" size={12} color={Colors.secondary} />
                <Text style={S.vtagTxt}>{trip.driverReviewCount > 0 ? `${trip.driverReviewCount} trips` : 'New'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Departure info ── */}
        <View style={S.secCard}>
          <Text style={S.secTitle}>Departure</Text>
          <Text style={S.departureDate}>{formatDateLong(trip.departureAt)}</Text>
        </View>

        {/* ── Route card ── */}
        <View style={S.secCard}>
          <Text style={S.secTitle}>Route</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={S.wptCol}>
              <View style={[S.wptCircle, { backgroundColor: Colors.primary }]} />
              <View style={S.wptConnector} />
              <View style={[S.wptCircle, { backgroundColor: '#DC2626' }]} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ paddingBottom: 20 }}>
                <Text style={S.wptAddr}>{trip.originName}</Text>
                <Text style={S.wptTime}>{formatTime(trip.departureAt)}</Text>
              </View>
              <View>
                <Text style={S.wptAddr}>{trip.destinationName}</Text>
                <Text style={[S.wptTime, { color: Colors.textMuted }]}>Arrival time varies</Text>
              </View>
            </View>
          </View>
          {trip.distanceKm > 0 && (
            <View style={S.distBadge}>
              <Ionicons name="navigate-outline" size={12} color={Colors.textSecondary} />
              <Text style={S.distTxt}> {Math.round(trip.distanceKm)} km</Text>
            </View>
          )}
        </View>

        {/* ── Seats ── */}
        <View style={S.secCard}>
          <Text style={S.secTitle}>Available seats</Text>
          <View style={S.seatsRow}>
            {Array.from({ length: trip.totalPassengerSeats }).map((_, i) => {
              const taken = i >= trip.availableSeats;
              return (
                <View key={i} style={[S.seatIcon, taken && S.seatTaken]}>
                  <Ionicons
                    name={taken ? 'person' : 'person-outline'}
                    size={18}
                    color={taken ? Colors.textMuted : Colors.primary}
                  />
                </View>
              );
            })}
            <Text style={S.seatsText}>
              {trip.availableSeats} of {trip.totalPassengerSeats} available
            </Text>
          </View>
        </View>

        {/* ── Luggage ── */}
        {luggageSizes.length > 0 && (
          <View style={S.secCard}>
            <Text style={S.secTitle}>Luggage allowed</Text>
            <View style={S.luggageRow}>
              {luggageSizes.map(sz => {
                const info = LUGGAGE_LABELS[sz];
                if (!info) return null;
                return (
                  <View key={sz} style={S.luggageChip}>
                    <Text style={S.luggageEmoji}>{info.emoji}</Text>
                    <Text style={S.luggageLabel}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Preferences ── */}
        <View style={S.secCard}>
          <Text style={S.secTitle}>Preferences</Text>
          <View style={S.prefList}>
            {boolPrefs.map(p => (
              <View key={p.label} style={S.prefRow}>
                <View style={[S.prefIcon, p.ok ? S.prefIconOk : S.prefIconNo]}>
                  <Ionicons name={p.icon} size={16} color={p.ok ? Colors.primary : '#DC2626'} />
                </View>
                <Text style={[S.prefTxt, !p.ok && S.prefTxtNo]}>{p.label}</Text>
                <Ionicons
                  name={p.ok ? 'checkmark-circle' : 'close-circle-outline'}
                  size={18}
                  color={p.ok ? Colors.primary : Colors.textMuted}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Package delivery ── */}
        {trip.tripMode !== 'passengers_only' && (
          <View style={S.secCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={[S.prefIcon, S.prefIconOk]}>
                <Ionicons name="cube-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={S.prefTxt}>Package delivery available</Text>
            </View>
            {trip.maxPackageSize && (
              <Text style={S.pkgSub}>
                Accepts up to {PKG_LABELS[trip.maxPackageSize]?.emoji} {PKG_LABELS[trip.maxPackageSize]?.label ?? trip.maxPackageSize}
              </Text>
            )}
            <View style={{ gap: 6, marginTop: 8 }}>
              {[
                { key: 'envelope', p: trip.pkgPriceEnvelope },
                { key: 'small',    p: trip.pkgPriceSmall },
                { key: 'medium',   p: trip.pkgPriceMedium },
                { key: 'large',    p: trip.pkgPriceLarge },
              ].filter(x => x.p != null).map(x => (
                <View key={x.key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={S.pkgRowLabel}>{PKG_LABELS[x.key]?.emoji} {PKG_LABELS[x.key]?.label}</Text>
                  <Text style={S.pkgRowPrice}>${x.p?.toFixed(0)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Notes ── */}
        {!!trip.notes && (
          <View style={S.secCard}>
            <Text style={S.secTitle}>Driver's note</Text>
            <Text style={S.notes}>{trip.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky price bar / book button ── */}
      <View style={S.priceBar}>
        <View>
          <Text style={S.priceAmt}>${Number.isFinite(price) ? price.toFixed(0) : '—'}</Text>
          <Text style={S.priceSub}>per seat</Text>
        </View>
        <TouchableOpacity style={S.bookBtn} onPress={handleBook} activeOpacity={0.85}>
          <Text style={S.bookBtnTxt}>
            {trip.bookingMode === 'instant' ? '⚡ Book seat' : 'Request ride'} →
          </Text>
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

  driverHero: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: Colors.surface, padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heroAv: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  heroAvTxt: { fontSize: 26, fontWeight: '800', color: '#fff' },
  heroBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.secondary, borderWidth: 2.5, borderColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  heroStat: { fontSize: FontSize.sm, color: Colors.textSecondary },
  heroTags: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  vtag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.secondaryLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  vtagTxt: { fontSize: 11, fontWeight: '600', color: Colors.secondary },

  secCard: { backgroundColor: Colors.surface, marginHorizontal: 12, marginTop: 10, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  secTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 12 },
  departureDate: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },

  wptCol: { width: 14, alignItems: 'center', paddingTop: 3 },
  wptCircle: { width: 12, height: 12, borderRadius: 6 },
  wptConnector: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 2, minHeight: 28 },
  wptAddr: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  wptTime: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  distBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-start', backgroundColor: Colors.surfaceVariant, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  distTxt: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  seatsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  seatIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  seatTaken: { backgroundColor: Colors.surfaceVariant },
  seatsText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginLeft: 4 },

  luggageRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  luggageChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary },
  luggageEmoji: { fontSize: 18 },
  luggageLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },

  prefList: { gap: 10 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prefIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  prefIconOk: { backgroundColor: '#E6F7EF' },
  prefIconNo: { backgroundColor: '#FEF2F2' },
  prefTxt: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  prefTxtNo: { color: Colors.textMuted },

  pkgSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  pkgRowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  pkgRowPrice: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },

  notes: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

  // Price bar footer
  priceBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 16, paddingBottom: 28 },
  priceAmt: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  priceSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  bookBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.2 },
});

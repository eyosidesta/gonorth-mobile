import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CANADIAN_CITIES, CanadianCity } from '../../data/canadianCities';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

export interface SelectedCity {
  name: string;
  province: string;
  lat: number;
  lng: number;
}

interface Props {
  value: SelectedCity | null;
  placeholder: string;
  role?: 'origin' | 'destination';
  onSelect: (city: SelectedCity) => void;
  onClear?: () => void;
}

function normalise(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function CityPickerModal({
  value,
  placeholder,
  role = 'origin',
  onSelect,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    if (!query.trim()) return CANADIAN_CITIES;
    const q = normalise(query);
    return CANADIAN_CITIES.filter(
      (c) => normalise(c.name).includes(q) || normalise(c.province).includes(q),
    );
  }, [query]);

  const handleSelect = useCallback(
    (city: CanadianCity) => {
      onSelect(city);
      setOpen(false);
      setQuery('');
    },
    [onSelect],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const dotColor = role === 'origin' ? Colors.secondary : Colors.danger;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CanadianCity>) => {
      const selected = value?.name === item.name && value?.province === item.province;
      return (
        <TouchableOpacity
          style={[styles.row, selected && styles.rowSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.rowDot, { backgroundColor: selected ? Colors.primary : Colors.border }]} />
          <View style={styles.rowText}>
            <Text style={[styles.cityName, selected && styles.cityNameSelected]}>
              {item.name}
            </Text>
            <Text style={styles.provinceBadge}>{item.province}</Text>
          </View>
          {selected && (
            <Ionicons name="checkmark" size={18} color={Colors.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [value, handleSelect],
  );

  const keyExtractor = useCallback(
    (item: CanadianCity) => `${item.province}-${item.name}`,
    [],
  );

  return (
    <>
      {/* ── Trigger row ── */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <View style={[styles.triggerDot, { backgroundColor: dotColor }]} />
        <Text
          style={[styles.triggerText, !value && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {value ? `${value.name}, ${value.province}` : placeholder}
        </Text>
        {value && onClear ? (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
        )}
      </TouchableOpacity>

      {/* ── Modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}>
          {/* handle */}
          <View style={styles.handle} />

          {/* header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {role === 'origin' ? 'Departure city' : 'Destination city'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* search */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or province…"
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          {/* results count */}
          {query.length > 0 && (
            <Text style={styles.resultCount}>
              {filtered.length} {filtered.length === 1 ? 'city' : 'cities'}
            </Text>
          )}

          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No cities match "{query}"</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  triggerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  triggerPlaceholder: {
    color: Colors.textMuted,
    fontWeight: '400',
  },

  // modal
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,27,42,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '88%',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    height: 48,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    height: 48,
  },

  // results
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  listContent: { paddingBottom: Spacing.xl },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    gap: 12,
  },
  rowSelected: { backgroundColor: Colors.primaryLight },
  rowDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  rowText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityName: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  cityNameSelected: { color: Colors.primary, fontWeight: '600' },
  provinceBadge: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    backgroundColor: Colors.background,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },

  // empty
  empty: { alignItems: 'center', paddingTop: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});

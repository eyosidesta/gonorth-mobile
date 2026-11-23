import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { GOOGLE_MAPS_API_KEY } from '../../lib/config';

export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  googlePlaceId: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  /** 'cities' for Search screen, 'address' for wizard stops */
  searchType?: '(cities)' | 'address';
  onSelect: (place: PlaceResult) => void;
  error?: string;
}

export default function PlaceInput({
  label,
  placeholder = 'Search location',
  searchType = '(cities)',
  onSelect,
  error,
}: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        fetchDetails
        onPress={(data, details) => {
          if (!details) return;
          onSelect({
            name: data.structured_formatting.main_text,
            address: data.description,
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            googlePlaceId: data.place_id,
          });
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
          components: 'country:ca',
          types: searchType,
        }}
        styles={{
          container: { flex: 0 },
          textInputContainer: { backgroundColor: 'transparent' },
          textInput: {
            height: 52,
            borderWidth: 1.5,
            borderColor: error ? Colors.danger : Colors.border,
            borderRadius: Radius.md,
            paddingHorizontal: Spacing.md,
            fontSize: FontSize.md,
            color: Colors.textPrimary,
            backgroundColor: Colors.surface,
            marginBottom: 0,
          },
          listView: {
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: Radius.md,
            marginTop: 4,
            backgroundColor: Colors.surface,
            elevation: 4,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
          },
          row: {
            paddingVertical: 12,
            paddingHorizontal: Spacing.md,
          },
          description: {
            fontSize: FontSize.sm,
            color: Colors.textPrimary,
          },
          predefinedPlacesDescription: {
            color: Colors.primary,
          },
          separator: {
            height: 1,
            backgroundColor: Colors.border,
          },
        }}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        minLength={2}
        debounce={300}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
  },
});

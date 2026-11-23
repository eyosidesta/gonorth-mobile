import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  showOnlineBadge?: boolean;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ uri, name, size = 40, showOnlineBadge = false }: Props) {
  const radius = size / 2;
  const fontSize = Math.round(size * 0.36);
  const circleStyle = { width: size, height: size, borderRadius: radius };

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={[styles.img, circleStyle]} />
      ) : (
        <View style={[styles.fallback, circleStyle]}>
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      {showOnlineBadge && (
        <View
          style={[
            styles.badge,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: (size * 0.28) / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { resizeMode: 'cover' },
  fallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontWeight: '700', color: Colors.primary },
  badge: {
    position: 'absolute',
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});

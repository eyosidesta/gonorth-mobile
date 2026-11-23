import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';

type Props = { navigation: NativeStackNavigationProp<any> };

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your Name';

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive', onPress: async () => {
          setLoggingOut(true);
          try {
            const refresh = await SecureStore.getItemAsync('refresh_token');
            if (refresh) await authApi.logout(refresh);
          } catch { /* token may already be gone */ }
          await logout();
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'car-outline',
      label: user?.isDriver ? 'My Trips as Driver' : 'Become a Driver',
      onPress: () => user?.isDriver
        ? navigation.getParent()?.navigate('Trips', { screen: 'MyTrips' })
        : navigation.navigate('DriverOnboarding'),
    },
    {
      icon: 'log-out-outline',
      label: 'Log out',
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.phone}>{user?.phone ?? ''}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          {user?.isDriver && (
            <View style={styles.driverBadge}>
              <Ionicons name="car" size={13} color={Colors.primary} />
              <Text style={styles.driverBadgeText}> Verified Driver</Text>
            </View>
          )}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.danger ? Colors.danger : Colors.textPrimary}
              />
              <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                {item.label}
              </Text>
              {!item.danger && (
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md },

  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  phone: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  email: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  driverBadge: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
  },
  driverBadgeText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },

  menu: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLabel: { fontSize: FontSize.md, color: Colors.textPrimary, flex: 1 },
  menuLabelDanger: { color: Colors.danger },
});

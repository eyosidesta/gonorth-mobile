import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import TripsNavigator from './TripsNavigator';
import DeliveriesNavigator from './DeliveriesNavigator';
import MessagingNavigator from './MessagingNavigator';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator();

function PostTripButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      style={styles.postBtn}
      onPress={() => navigation.navigate('Trips', { screen: 'CreateTrip' })}
      activeOpacity={0.85}
    >
      <View style={styles.postBtnInner}>
        <Ionicons name="add" size={26} color="#fff" />
      </View>
      <Text style={styles.postBtnLabel}>Post</Text>
    </TouchableOpacity>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { borderTopColor: Colors.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Trips: 'car-outline',
            Deliveries: 'cube-outline',
            Messages: 'chatbubble-outline',
            Notifications: 'notifications-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Trips" component={TripsNavigator} />
      <Tab.Screen name="Deliveries" component={DeliveriesNavigator} />
      <Tab.Screen
        name="_Post"
        component={TripsNavigator}
        options={{
          tabBarLabel: 'Post',
          tabBarIcon: () => null,
          tabBarButton: () => <PostTripButton />,
        }}
      />
      <Tab.Screen name="Messages" component={MessagingNavigator} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  postBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  postBtnInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
    elevation: 5,
  },
  postBtnLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});

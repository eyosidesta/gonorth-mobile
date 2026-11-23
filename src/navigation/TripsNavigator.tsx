import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TripSearchScreen from '../screens/trips/TripSearchScreen';
import TripDetailScreen from '../screens/trips/TripDetailScreen';
import CreateTripScreen from '../screens/trips/CreateTripScreen';
import MyTripsScreen from '../screens/trips/MyTripsScreen';
import TripPassengersScreen from '../screens/trips/TripPassengersScreen';
import BookingConfirmScreen from '../screens/bookings/BookingConfirmScreen';
import MyBookingsScreen from '../screens/bookings/MyBookingsScreen';

const Stack = createNativeStackNavigator();

export default function TripsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TripSearch" component={TripSearchScreen} options={{ title: 'Find a Ride' }} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen as any} options={{ headerShown: false }} />
      <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen as any} options={{ headerShown: false }} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyTrips" component={MyTripsScreen} options={{ title: 'My Trips' }} />
      <Stack.Screen name="TripPassengers" component={TripPassengersScreen as any} options={{ headerShown: false }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeliveryListScreen from '../screens/deliveries/DeliveryListScreen';
import DeliveryDetailScreen from '../screens/deliveries/DeliveryDetailScreen';
import CreateDeliveryScreen from '../screens/deliveries/CreateDeliveryScreen';

const Stack = createNativeStackNavigator();

export default function DeliveriesNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliveryList" component={DeliveryListScreen} options={{ title: 'Deliveries' }} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} options={{ title: 'Delivery Details' }} />
      <Stack.Screen name="CreateDelivery" component={CreateDeliveryScreen} options={{ title: 'Send a Package' }} />
    </Stack.Navigator>
  );
}

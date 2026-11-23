import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ThreadListScreen from '../screens/messaging/ThreadListScreen';
import ChatScreen from '../screens/messaging/ChatScreen';

const Stack = createNativeStackNavigator();

export default function MessagingNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ThreadList" component={ThreadListScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen as any} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

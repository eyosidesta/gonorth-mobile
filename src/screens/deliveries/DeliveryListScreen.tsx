import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DeliveryListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>DeliveryListScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  text: { fontSize: 18, color: '#1C1C1E' },
});

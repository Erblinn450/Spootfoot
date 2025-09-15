import React from 'react';
import { View, Text, Button, Alert } from 'react-native';

export default function SlotDetail() {
  const slotId = '';
  const reserve = async () => {
    const r = await fetch('http://localhost:3000/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    });
    const data = await r.json();
    if (data?.inviteUrl) Alert.alert('Lien', data.inviteUrl);
  };
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Détail du créneau</Text>
      <Button title="Réserver ce créneau" onPress={reserve} />
    </View>
  );
}

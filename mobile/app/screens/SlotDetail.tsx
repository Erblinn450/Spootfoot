import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { BASE_URL } from '../config';

export default function SlotDetail() {
  // Id du créneau à réserver: à injecter via navigation/paramètres selon votre flux
  const slotId = '';
  const reserve = async () => {
    const r = await fetch(`${BASE_URL}/reservations`, {
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

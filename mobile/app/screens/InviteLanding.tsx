import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { BASE_URL } from '../config';

type InviteInfo = { slot: { startAt: string; capacity: number; status: string }, restants: number };

export default function InviteLanding() {
  // Token de l'invitation: à injecter via navigation/paramètres selon votre flux
  const token = '';
  const [info, setInfo] = React.useState<InviteInfo | null>(null);

  // Chargement des informations d'invitation (slot + places restantes)
  React.useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/invitations/${token}`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [token]);

  // Acceptation de l'invitation
  const accept = async () => {
    const r = await fetch(`${BASE_URL}/invitations/${token}/accept`, { method: 'POST' });
    if (r.status === 200) {
      const data = await r.json();
      Alert.alert('Merci', `acceptedCount=${data.acceptedCount}`);
    } else {
      Alert.alert('Complet', 'Malheureusement, le créneau est plein');
    }
  };
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Invitation</Text>
      {info && (
        <>
          <Text>Date: {new Date(info.slot.startAt).toLocaleString()}</Text>
          <Text>Restants: {info.restants}</Text>
        </>
      )}
      <View style={{ height: 12 }} />
      <Button title="Je viens" onPress={accept} />
      <View style={{ height: 8 }} />
      <Button title="Je ne peux pas" onPress={() => {}} />
    </View>
  );
}

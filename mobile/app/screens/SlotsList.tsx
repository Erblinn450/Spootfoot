import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { BASE_URL } from '../config';

type Slot = { _id: string; startAt: string; status: 'OPEN' | 'RESERVED' | 'FULL' };

export default function SlotsList() {
  const [slots, setSlots] = React.useState<Slot[]>([]);
  // Chargement de la liste des créneaux
  React.useEffect(() => {
    fetch(`${BASE_URL}/slots`).then((r) => r.json()).then(setSlots).catch(() => setSlots([]));
  }, []);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Créneaux</Text>
      <FlatList
        data={slots}
        keyExtractor={(s) => s._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
            <Text>{new Date(item.startAt).toLocaleString()}</Text>
            <Text>{item.status === 'OPEN' ? 'Libre' : 'Réservé'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

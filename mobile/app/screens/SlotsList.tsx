import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, RefreshControl, ActivityIndicator } from 'react-native';
import { BASE_URL } from '../config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';

type Slot = { _id: string; startAt: string; status: 'OPEN' | 'RESERVED' | 'FULL' };

// Carte d'un créneau (avec animation d'apparition)
function SlotCard({ item, index, onPress }: { item: Slot; index: number; onPress: () => void }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 250, delay: index * 50, useNativeDriver: true }).start();
  }, [index, opacity]);

  const isOpen = item.status === 'OPEN';
  const isFull = item.status === 'FULL';
  const badgeColor = isOpen ? colors.primary : isFull ? colors.danger : colors.textMuted;
  const badgeText = isOpen ? 'Libre' : isFull ? 'Complet' : 'Réservé';

  // Formatage FR
  const dateStr = new Date(item.startAt).toLocaleDateString('fr-FR', {
    weekday: 'short', day: '2-digit', month: 'short'
  });
  const timeStr = new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          padding: spacing.md,
          backgroundColor: colors.card,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.md,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {timeStr}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {dateStr}
            </Text>
          </View>
          <View style={{ backgroundColor: badgeColor, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill }}>
            <Text style={{ color: 'white', fontSize: 12 }}>{badgeText}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SlotsList() {
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Chargement de la liste des créneaux
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE_URL}/slots`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: Slot[] = await r.json();
      console.log('Slots reçus:', data?.length);
      setSlots(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Erreur chargement /slots:', e);
      setError(e?.message ?? 'Erreur réseau');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Recharger la liste quand l'écran reprend le focus (ex: retour depuis Détail/Invitation)
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      {/* En-tête avec actions */}
      <View style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text }}>Créneaux</Text>
        <View style={{ flexDirection: 'row' }}>
          <PrimaryButton
            title={loading ? 'Chargement...' : 'Rafraîchir'}
            onPress={load}
            disabled={loading}
            style={{ marginRight: spacing.sm }}
          />
          <PrimaryButton title="Invitation" onPress={() => navigation.navigate('InviteLanding')} />
        </View>
      </View>

      {error && (
        <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>Erreur: {error}</Text>
      )}
      {!loading && !error && slots.length === 0 && (
        <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>Aucun créneau disponible.</Text>
      )}
      {loading && (
        <View style={{ marginBottom: spacing.md }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      <FlatList
        data={slots}
        keyExtractor={(s) => s._id}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        renderItem={({ item, index }) => (
          <SlotCard
            item={item}
            index={index}
            onPress={() => navigation.navigate('SlotDetail', { slotId: item._id })}
          />
        )}
      />
    </View>
  );
}

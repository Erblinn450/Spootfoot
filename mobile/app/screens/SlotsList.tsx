import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, RefreshControl, ActivityIndicator } from 'react-native';
import { BASE_URL } from '../config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, shadows } from '../theme';
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
          padding: spacing.lg,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          marginBottom: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: badgeColor,
          ...shadows.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            🕐 {timeStr}
          </Text>
          <View style={{ backgroundColor: badgeColor, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, ...shadows.sm }}>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>{badgeText}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '600' }}>
          📅 {dateStr}
        </Text>
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header moderne */}
      <View style={{ 
        backgroundColor: colors.primary, 
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        ...shadows.lg,
      }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: 'white', marginBottom: spacing.xs }}>
          ⚽ SpotFoot
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: spacing.sm }}>
          Terrains disponibles
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'white',
              padding: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              ...shadows.md,
              opacity: loading ? 0.5 : 1,
            }}
            onPress={load}
            disabled={loading}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
              {loading ? '⏳ Chargement...' : '🔄 Rafraîchir'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              padding: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              minWidth: 100,
              ...shadows.md,
            }}
            onPress={() => navigation.navigate('InviteLanding')}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>👥 Inviter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, padding: spacing.lg }}>

        {error && (
          <View style={{ 
            backgroundColor: '#FEE2E2', 
            padding: spacing.md, 
            borderRadius: radius.lg, 
            marginBottom: spacing.md,
            borderLeftWidth: 4,
            borderLeftColor: colors.danger,
            ...shadows.sm,
          }}>
            <Text style={{ color: colors.danger, fontWeight: '600' }}>❌ Erreur: {error}</Text>
          </View>
        )}
        {!loading && !error && slots.length === 0 && (
          <View style={{
            padding: spacing.xxl,
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            alignItems: 'center',
            ...shadows.sm,
          }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💭</Text>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16, marginBottom: spacing.xs }}>
              Aucun créneau
            </Text>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
              Aucun terrain disponible pour le moment
            </Text>
          </View>
        )}
        {loading && (
          <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textMuted, marginTop: spacing.md }}>Chargement des créneaux...</Text>
          </View>
        )}
        {!loading && slots.length > 0 && (
          <View style={{ 
            marginBottom: spacing.md,
            paddingBottom: spacing.sm,
            borderBottomWidth: 2,
            borderBottomColor: colors.primary,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              🏟️ {slots.length} créneau{slots.length > 1 ? 'x' : ''} disponible{slots.length > 1 ? 's' : ''}
            </Text>
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
    </View>
  );
}

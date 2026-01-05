import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, RefreshControl, ActivityIndicator } from 'react-native';
import { BASE_URL } from '../config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, font, shadow } from '../theme';
import { Header, Card, Badge, Stat, EmptyState, Button, AnimatedEntry } from '../components/UI';

type Slot = { _id: string; startAt: string; status: 'OPEN' | 'RESERVED' | 'FULL'; terrainId?: string };

// ═══════════════════════════════════════════════════════════════════════════
// SLOT CARD
// ═══════════════════════════════════════════════════════════════════════════

function SlotCard({ item, index, onPress }: { item: Slot; index: number; onPress: () => void }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateX = React.useRef(new Animated.Value(-30)).current;
  const scale = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, delay: index * 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateX]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, friction: 8, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  const isOpen = item.status === 'OPEN';
  const isFull = item.status === 'FULL';
  const dateObj = new Date(item.startAt);
  
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase();
  const dayNum = dateObj.getDate();
  const month = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const statusConfig = {
    OPEN: { variant: 'lime' as const, label: 'DISPONIBLE', icon: '✓' },
    RESERVED: { variant: 'warning' as const, label: 'RÉSERVÉ', icon: '⏳' },
    FULL: { variant: 'error' as const, label: 'COMPLET', icon: '✕' },
  }[item.status];

  return (
    <Animated.View style={{ 
      opacity, 
      transform: [{ translateX }, { scale }],
      marginBottom: spacing['4'],
    }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={{
          backgroundColor: colors.bgCard,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: isOpen ? colors.brand : colors.border,
          overflow: 'hidden',
        }}>
          <View style={{ flexDirection: 'row' }}>
            {/* Date Column */}
            <View style={{
              width: 80,
              backgroundColor: isOpen ? colors.brandMuted : colors.bgElevated,
              padding: spacing['4'],
              alignItems: 'center',
              justifyContent: 'center',
              borderRightWidth: 1,
              borderRightColor: colors.border,
            }}>
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: font.xs, 
                fontWeight: font.bold,
                letterSpacing: 1,
              }}>
                {dayName}
              </Text>
              <Text style={{ 
                color: isOpen ? colors.brand : colors.textPrimary, 
                fontSize: font['3xl'], 
                fontWeight: font.black,
                marginVertical: spacing['1'],
              }}>
                {dayNum}
              </Text>
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: font.xs, 
                fontWeight: font.semibold,
              }}>
                {month}
              </Text>
            </View>

            {/* Content */}
            <View style={{ flex: 1, padding: spacing['4'] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing['3'] }}>
                <View>
                  <Text style={{ 
                    color: colors.textPrimary, 
                    fontSize: font['2xl'], 
                    fontWeight: font.black,
                    letterSpacing: -0.5,
                  }}>
                    {timeStr}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: font.sm, marginTop: spacing['1'] }}>
                    1h • 10 places
                  </Text>
                </View>
                <Badge variant={statusConfig.variant} icon={statusConfig.icon}>
                  {statusConfig.label}
                </Badge>
              </View>

              {/* Action Row */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingTop: spacing['3'],
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}>
                <Text style={{ 
                  color: isOpen ? colors.lime : colors.textMuted, 
                  fontSize: font.sm, 
                  fontWeight: font.semibold,
                  flex: 1,
                }}>
                  {isOpen ? 'Réserver maintenant' : 'Voir les détails'}
                </Text>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: radius.full,
                  backgroundColor: isOpen ? colors.lime : colors.gray700,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: isOpen ? colors.gray950 : colors.textMuted, fontSize: font.sm }}>
                    →
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export default function SlotsList() {
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE_URL}/slots`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: Slot[] = await r.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur réseau');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const stats = React.useMemo(() => ({
    open: slots.filter(s => s.status === 'OPEN').length,
    reserved: slots.filter(s => s.status === 'RESERVED').length,
    full: slots.filter(s => s.status === 'FULL').length,
  }), [slots]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Gradient blobs */}
      <View style={{
        position: 'absolute',
        top: -50,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.brandGlow,
        opacity: 0.15,
      }} />
      
      <Header 
        title="SpotFoot" 
        subtitle="Réservez vos créneaux"
        icon="⚽"
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate('InviteLanding')}
            style={{
              backgroundColor: colors.bgCard,
              paddingHorizontal: spacing['4'],
              paddingVertical: spacing['3'],
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: font.sm, fontWeight: font.semibold }}>
              🎫 Invitation
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1, paddingHorizontal: spacing['5'] }}>
        {/* Stats */}
        {!loading && slots.length > 0 && (
          <AnimatedEntry delay={0}>
            <View style={{ flexDirection: 'row', gap: spacing['3'], marginBottom: spacing['6'] }}>
              <Stat value={stats.open} label="Disponibles" icon="✓" color={colors.lime} />
              <Stat value={stats.reserved} label="Réservés" icon="⏳" color={colors.warning} />
              <Stat value={stats.full} label="Complets" icon="✕" color={colors.error} />
            </View>
          </AnimatedEntry>
        )}

        {/* Error */}
        {error && (
          <View style={{
            backgroundColor: colors.errorMuted,
            padding: spacing['4'],
            borderRadius: radius.lg,
            marginBottom: spacing['4'],
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing['3'],
          }}>
            <Text style={{ fontSize: font.xl }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.error, fontWeight: font.bold, marginBottom: spacing['1'] }}>
                Erreur de connexion
              </Text>
              <Text style={{ color: colors.error, fontSize: font.sm }}>{error}</Text>
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: spacing['12'] }}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={{ color: colors.textMuted, marginTop: spacing['4'], fontWeight: font.medium }}>
              Chargement...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && slots.length === 0 && (
          <EmptyState
            icon="🏟️"
            title="Aucun créneau"
            description="Les créneaux disponibles apparaîtront ici. Revenez bientôt !"
            action={{ label: 'Rafraîchir', onPress: load }}
          />
        )}

        {/* List */}
        {!loading && slots.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['4'] }}>
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: font.xs, 
                fontWeight: font.bold,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
                {slots.length} créneaux
              </Text>
              <TouchableOpacity onPress={load} disabled={loading}>
                <Text style={{ color: colors.brand, fontSize: font.sm, fontWeight: font.semibold }}>
                  ↻ Actualiser
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={slots}
              keyExtractor={(s) => s._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing['8'] }}
              refreshControl={
                <RefreshControl 
                  refreshing={loading} 
                  onRefresh={load} 
                  tintColor={colors.brand}
                  colors={[colors.brand]}
                />
              }
              renderItem={({ item, index }) => (
                <SlotCard
                  item={item}
                  index={index}
                  onPress={() => navigation.navigate('SlotDetail', { slotId: item._id })}
                />
              )}
            />
          </>
        )}
      </View>
    </View>
  );
}

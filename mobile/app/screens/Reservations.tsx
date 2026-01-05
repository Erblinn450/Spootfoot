import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Animated, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';
import { Header, Card, Badge, Button, EmptyState, AnimatedEntry } from '../components/UI';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from '../services/database';

type SavedReservation = { slotId: string; inviteUrl: string; token?: string; createdAt: number };

// ═══════════════════════════════════════════════════════════════════════════
// RESERVATION CARD
// ═══════════════════════════════════════════════════════════════════════════

function ReservationCard({ 
  reservation, 
  index, 
  onOpen, 
  onCopy 
}: { 
  reservation: SavedReservation; 
  index: number; 
  onOpen: () => void; 
  onCopy: () => void;
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  const isLatest = index === 0;
  const date = new Date(reservation.createdAt);
  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: spacing['4'] }}>
      <Card noPadding>
        {/* Header */}
        <View style={{
          backgroundColor: isLatest ? colors.brandMuted : colors.bgElevated,
          paddingVertical: spacing['3'],
          paddingHorizontal: spacing['4'],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing['2'] }}>
            <Text style={{ fontSize: 16 }}>{isLatest ? '✨' : '📅'}</Text>
            <Text style={{ color: isLatest ? colors.brand : colors.textSecondary, fontWeight: font.bold, fontSize: font.sm }}>
              {isLatest ? 'Dernière réservation' : `Réservation #${index + 1}`}
            </Text>
          </View>
          <Badge variant="default">
            {dateStr} • {timeStr}
          </Badge>
        </View>

        {/* Content */}
        <View style={{ padding: spacing['4'] }}>
          {/* Slot ID */}
          <View style={{ marginBottom: spacing['4'] }}>
            <Text style={{ 
              color: colors.textMuted, fontSize: font.xs, fontWeight: font.bold,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing['2'],
            }}>
              Créneau
            </Text>
            <View style={{
              backgroundColor: colors.bgInput, padding: spacing['3'], borderRadius: radius.md,
              borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ color: colors.textSecondary, fontSize: font.xs, fontFamily: 'monospace' }}>
                {reservation.slotId}
              </Text>
            </View>
          </View>

          {/* Invite URL */}
          {reservation.inviteUrl ? (
            <>
              <Text style={{ 
                color: colors.textMuted, fontSize: font.xs, fontWeight: font.bold,
                letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing['2'],
              }}>
                Lien d'invitation
              </Text>
              <View style={{
                backgroundColor: colors.brandMuted, padding: spacing['3'], borderRadius: radius.md,
                marginBottom: spacing['4'],
              }}>
                <Text style={{ color: colors.brand, fontSize: font.xs }} numberOfLines={2}>
                  {reservation.inviteUrl}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing['3'] }}>
                <View style={{ flex: 1 }}>
                  <Button onPress={onOpen} icon="🔗" size="md">
                    Ouvrir
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button onPress={onCopy} variant="secondary" icon="📋" size="md">
                    Copier
                  </Button>
                </View>
              </View>
            </>
          ) : (
            <View style={{
              backgroundColor: colors.warningMuted, padding: spacing['4'], borderRadius: radius.lg,
              flexDirection: 'row', alignItems: 'center', gap: spacing['3'],
            }}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={{ color: colors.warning, fontWeight: font.semibold, fontSize: font.sm }}>
                Aucun lien d'invitation
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export default function Reservations() {
  const navigation = useNavigation<any>();
  const [reservations, setReservations] = React.useState<SavedReservation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const cacheRef = React.useRef<Map<string, { exists: boolean; timestamp: number }>>(new Map());

  const checkSlotExists = async (slotId: string): Promise<boolean> => {
    const cached = cacheRef.current.get(slotId);
    if (cached && Date.now() - cached.timestamp < 5000) return cached.exists;
    try {
      const response = await fetch(`${BASE_URL}/slots/${slotId}`, { signal: abortControllerRef.current?.signal });
      const exists = response.ok;
      cacheRef.current.set(slotId, { exists, timestamp: Date.now() });
      return exists;
    } catch (error: any) {
      if (error.name === 'AbortError') return true;
      return false;
    }
  };

  const load = React.useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      await databaseService.init();
      const sqliteReservations = await databaseService.getReservations();
      const allReservations: SavedReservation[] = sqliteReservations.map(r => ({
        slotId: r.slotId, inviteUrl: r.inviteUrl, token: r.token, createdAt: r.createdAt,
      }));
      
      if (allReservations.length === 0) {
        setReservations([]);
        setLoading(false);
        return;
      }

      const results = await Promise.all(allReservations.map(async (reservation) => ({
        reservation,
        exists: await checkSlotExists(reservation.slotId),
      })));

      const validReservations = results.filter(r => r.exists).map(r => r.reservation);
      const orphaned = results.filter(r => !r.exists);
      if (orphaned.length > 0) {
        await AsyncStorage.setItem('reservations', JSON.stringify(validReservations));
      }
      
      setReservations(validReservations);
    } catch (error) {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  useFocusEffect(React.useCallback(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [load]));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Gradient blobs */}
      <View style={{
        position: 'absolute', top: 50, right: -100, width: 300, height: 300,
        borderRadius: 150, backgroundColor: colors.limeGlow, opacity: 0.15,
      }} />

      <Header 
        title="Mes Réservations" 
        subtitle="Gérez vos créneaux"
        icon="🎫"
        rightElement={reservations.length > 0 ? (
          <View style={{
            backgroundColor: colors.brandMuted, paddingHorizontal: spacing['3'],
            paddingVertical: spacing['2'], borderRadius: radius.full,
          }}>
            <Text style={{ color: colors.brand, fontWeight: font.black, fontSize: font.lg }}>
              {reservations.length}
            </Text>
          </View>
        ) : undefined}
      />

      <View style={{ paddingHorizontal: spacing['5'] }}>
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
        {!loading && reservations.length === 0 && (
          <EmptyState
            icon="🎫"
            title="Aucune réservation"
            description="Vous n'avez pas encore de réservation. Réservez votre premier créneau !"
            action={{ label: 'Voir les créneaux', onPress: () => navigation.navigate('Créneaux') }}
          />
        )}

        {/* List */}
        {!loading && reservations.length > 0 && (
          <>
            <Text style={{ 
              color: colors.textMuted, fontSize: font.xs, fontWeight: font.bold,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing['4'],
            }}>
              {reservations.length} réservation{reservations.length > 1 ? 's' : ''} active{reservations.length > 1 ? 's' : ''}
            </Text>
            
            {reservations.map((reservation, index) => (
              <ReservationCard
                key={reservation.slotId + reservation.createdAt}
                reservation={reservation}
                index={index}
                onOpen={() => navigation.navigate('InviteLanding', { token: reservation.token, inviteUrl: reservation.inviteUrl })}
                onCopy={() => { Clipboard.setStringAsync(reservation.inviteUrl); window.alert('📋 Lien copié !'); }}
              />
            ))}
          </>
        )}

        <View style={{ height: spacing['8'] }} />
      </View>
    </ScrollView>
  );
}

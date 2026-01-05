import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { BASE_URL } from '../config';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, font, shadow } from '../theme';
import { Button, Input, Card, Badge, AnimatedEntry } from '../components/UI';
import { useUser } from '../state/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { databaseService } from '../services/database';

type SlotData = {
  _id: string;
  terrainId: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  status: string;
};

export default function SlotDetail() {
  const route = useRoute<RouteProp<RootStackParamList, 'SlotDetail'>>();
  const slotId = route.params?.slotId;
  const { user } = useUser();
  const navigation = useNavigation<any>();
  
  const [email, setEmail] = React.useState(user.email ?? '');
  const [slot, setSlot] = React.useState<SlotData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reserving, setReserving] = React.useState(false);
  const [offlineMode, setOfflineMode] = React.useState(false);

  React.useEffect(() => {
    const loadSlot = async () => {
      if (!slotId) return;
      try {
        const r = await fetch(`${BASE_URL}/slots/${slotId}`);
        if (r.ok) setSlot(await r.json());
      } catch (e) {
        console.error('Error loading slot:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSlot();
  }, [slotId]);

  React.useEffect(() => {
    if (user.email) setEmail(user.email);
  }, [user.email]);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && offlineMode) syncPendingReservations();
    });
    return () => unsubscribe();
  }, [offlineMode]);

  const syncPendingReservations = async () => {
    try {
      const pendingRaw = await AsyncStorage.getItem('pending_reservations');
      if (!pendingRaw) return;
      const pending = JSON.parse(pendingRaw);
      if (pending.length === 0) return;

      for (const reservation of pending) {
        const response = await fetch(`${BASE_URL}/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotId: reservation.slotId, organizerEmail: reservation.email }),
        });
        if (response.ok) {
          const data = await response.json();
          const m = String(data.inviteUrl).match(/\/i\/(.+)$/) || String(data.inviteUrl).match(/invitations\/(.+)$/);
          const existingRaw = await AsyncStorage.getItem('reservations');
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          existing.unshift({ slotId: reservation.slotId, inviteUrl: data.inviteUrl, token: m?.[1], createdAt: Date.now() });
          await AsyncStorage.setItem('reservations', JSON.stringify(existing));
        }
      }
      await AsyncStorage.removeItem('pending_reservations');
      setOfflineMode(false);
      window.alert('✅ Synchronisation terminée !');
      navigation.getParent()?.navigate('Réservations');
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const reserve = async () => {
    if (!slotId) return window.alert('❌ Erreur: slotId manquant');
    if (!email.trim()) return window.alert('Veuillez saisir votre email');
    
    setReserving(true);
    try {
      const r = await fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, organizerEmail: email }),
      });
      
      if (r.ok) {
        const data = await r.json();
        try {
          await databaseService.init();
          const m = String(data.inviteUrl).match(/\/i\/(.+)$/) || String(data.inviteUrl).match(/invitations\/(.+)$/);
          await databaseService.addReservation({
            slotId, inviteUrl: data.inviteUrl, token: m?.[1], createdAt: Date.now(), syncStatus: 'synced',
          });
        } catch (e) {
          console.error('Save error:', e);
        }
        window.alert('✅ Réservation confirmée !');
        setTimeout(() => {
          try { navigation.getParent()?.navigate('Réservations'); } 
          catch { navigation.navigate('Réservations'); }
        }, 500);
      } else {
        throw new Error(await r.text() || 'Réservation impossible');
      }
    } catch (e: any) {
      const isOffline = e?.message?.includes('Failed to fetch') || e?.message?.includes('Network request failed');
      if (isOffline) {
        const pendingRaw = await AsyncStorage.getItem('pending_reservations');
        const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
        pending.push({ slotId, email, createdAt: Date.now(), status: 'pending' });
        await AsyncStorage.setItem('pending_reservations', JSON.stringify(pending));
        setOfflineMode(true);
        window.alert('📴 Mode hors ligne\n\nVotre réservation sera envoyée dès reconnexion.');
      } else {
        window.alert('❌ ' + (e?.message || 'Erreur'));
      }
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={{ color: colors.textMuted, marginTop: spacing['4'], fontWeight: font.medium }}>
          Chargement...
        </Text>
      </View>
    );
  }

  if (!slot) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing['6'] }}>
        <View style={{
          width: 80, height: 80, borderRadius: radius['2xl'], backgroundColor: colors.errorMuted,
          alignItems: 'center', justifyContent: 'center', marginBottom: spacing['5'],
        }}>
          <Text style={{ fontSize: 36 }}>❌</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: font.xl, fontWeight: font.bold, marginBottom: spacing['2'] }}>
          Créneau introuvable
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
          Ce créneau n'existe plus ou a été supprimé
        </Text>
      </View>
    );
  }

  const dateObj = new Date(slot.startAt);
  const isOpen = slot.status === 'OPEN';
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dayNum = dateObj.getDate();
  const month = dateObj.toLocaleDateString('fr-FR', { month: 'long' });
  const year = dateObj.getFullYear();
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Gradient blob */}
      <View style={{
        position: 'absolute', top: -100, left: -50, width: 300, height: 300,
        borderRadius: 150, backgroundColor: isOpen ? colors.brandGlow : colors.errorMuted, opacity: 0.2,
      }} />

      {/* Hero Section */}
      <AnimatedEntry delay={0}>
        <View style={{ paddingTop: spacing['16'], paddingHorizontal: spacing['6'], paddingBottom: spacing['8'] }}>
          <Badge variant={isOpen ? 'lime' : 'error'} icon={isOpen ? '✓' : '✕'}>
            {isOpen ? 'DISPONIBLE' : slot.status === 'FULL' ? 'COMPLET' : 'RÉSERVÉ'}
          </Badge>
          
          <Text style={{ 
            color: colors.textPrimary, fontSize: font['5xl'], fontWeight: font.black,
            letterSpacing: -2, marginTop: spacing['4'],
          }}>
            {timeStr}
          </Text>
          
          <Text style={{ color: colors.textSecondary, fontSize: font.lg, marginTop: spacing['2'] }}>
            {dayName} {dayNum} {month} {year}
          </Text>
        </View>
      </AnimatedEntry>

      {/* Info Cards */}
      <View style={{ paddingHorizontal: spacing['5'] }}>
        <AnimatedEntry delay={100}>
          <View style={{ flexDirection: 'row', gap: spacing['3'], marginBottom: spacing['5'] }}>
            {[
              { icon: '⏱️', label: 'Durée', value: `${slot.durationMin}min` },
              { icon: '👥', label: 'Places', value: `${slot.capacity}` },
              { icon: '🏟️', label: 'Type', value: 'Foot 5v5' },
            ].map((item, i) => (
              <Card key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginBottom: spacing['2'] }}>{item.icon}</Text>
                <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.black }}>
                  {item.value}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: font.xs, fontWeight: font.medium, marginTop: spacing['1'] }}>
                  {item.label}
                </Text>
              </Card>
            ))}
          </View>
        </AnimatedEntry>

        {/* Reservation Form */}
        {isOpen && (
          <AnimatedEntry delay={200}>
            <Card style={{ marginBottom: spacing['5'] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing['5'] }}>
                <View style={{
                  width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandMuted,
                  alignItems: 'center', justifyContent: 'center', marginRight: spacing['4'],
                }}>
                  <Text style={{ fontSize: 20 }}>📧</Text>
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold }}>
                    Votre email
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: font.sm }}>
                    Pour recevoir le lien d'invitation
                  </Text>
                </View>
              </View>
              
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                icon="✉️"
                keyboardType="email-address"
              />
              
              <Button 
                onPress={reserve} 
                loading={reserving}
                variant={offlineMode ? 'secondary' : 'lime'}
                icon={offlineMode ? '🔄' : '✨'}
                size="lg"
              >
                {offlineMode ? 'Réessayer' : 'Confirmer la réservation'}
              </Button>
            </Card>
          </AnimatedEntry>
        )}

        {/* Not Available Message */}
        {!isOpen && (
          <AnimatedEntry delay={200}>
            <Card style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: spacing['4'] }}>
                {slot.status === 'FULL' ? '🔒' : '📋'}
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold, marginBottom: spacing['2'] }}>
                {slot.status === 'FULL' ? 'Créneau complet' : 'Déjà réservé'}
              </Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
                {slot.status === 'FULL' 
                  ? 'Toutes les places sont prises. Essayez un autre créneau !'
                  : 'Ce créneau a déjà été réservé.'}
              </Text>
            </Card>
          </AnimatedEntry>
        )}

        <View style={{ height: spacing['8'] }} />
      </View>
    </ScrollView>
  );
}

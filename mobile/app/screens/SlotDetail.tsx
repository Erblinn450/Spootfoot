import React from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { BASE_URL } from '../config';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../state/UserContext';

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

  // Charger les données du créneau
  React.useEffect(() => {
    const loadSlot = async () => {
      if (!slotId) return;
      try {
        const r = await fetch(`${BASE_URL}/slots/${slotId}`);
        if (r.ok) {
          const data = await r.json();
          setSlot(data);
        }
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

  const reserve = async () => {
    if (!slotId) return window.alert('❌ Erreur: slotId manquant');
    if (!email.trim()) return window.alert('❌ Veuillez entrer votre email');
    
    setReserving(true);
    try {
      const r = await fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, organizerEmail: email }),
      });
      
      if (r.ok) {
        const data = await r.json();
        
        // Sauvegarder la réservation dans la liste
        try {
          const m = String(data.inviteUrl).match(/invitations\/(.+)$/) || String(data.inviteUrl).match(/invite\/(.+)$/);
          const token = m?.[1];
          const newReservation = { slotId, inviteUrl: data.inviteUrl, token, createdAt: Date.now() };
          
          // Récupérer les réservations existantes
          const existingRaw = await AsyncStorage.getItem('reservations');
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          
          // Ajouter la nouvelle réservation
          const updated = [newReservation, ...existing];
          
          // Sauvegarder
          await AsyncStorage.setItem('reservations', JSON.stringify(updated));
          
          // Garder aussi last_reservation pour compatibilité
          await AsyncStorage.setItem('last_reservation', JSON.stringify(newReservation));
        } catch {}
        
        window.alert('✅ Réservation confirmée ! Vous allez être redirigé vers vos réservations.');
        
        // Rediriger vers l'onglet Réservations
        setTimeout(() => {
          try { 
            navigation.getParent()?.navigate('Réservations'); 
          } catch {
            navigation.navigate('Réservations');
          }
        }, 500);
      } else {
        const msg = await r.text();
        window.alert('❌ Erreur: ' + (msg || 'Réservation impossible'));
      }
    } catch (e: any) {
      window.alert('❌ Erreur réseau: ' + (e?.message ?? 'Impossible de contacter le serveur'));
    } finally {
      setReserving(false);
    }
  };
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: spacing.md }}>Chargement...</Text>
      </View>
    );
  }

  if (!slot) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>❌</Text>
        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Créneau introuvable</Text>
      </View>
    );
  }

  const dateObj = new Date(slot.startAt);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: colors.primary, 
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        ...shadows.lg,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', marginBottom: spacing.xs }}>
          ⚽ Réserver un créneau
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>
          Confirmez votre réservation
        </Text>
      </View>

      <View style={{ padding: spacing.xl }}>
        {/* Carte du créneau */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: colors.success,
            ...shadows.md,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg }}>
            📅 Détails du créneau
          </Text>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}>
              Date
            </Text>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
              {dateStr}
            </Text>
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}>
              Heure
            </Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 20 }}>
              🕐 {timeStr}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                Durée
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                {slot.durationMin} min
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                Capacité
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                {slot.capacity} places
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                Statut
              </Text>
              <Text style={{ color: colors.success, fontWeight: '700', fontSize: 15 }}>
                {slot.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Formulaire email */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
            ...shadows.md,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>
            📧 Votre email
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: spacing.md, lineHeight: 20 }}>
            Entrez votre adresse email pour recevoir le lien d'invitation
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="votre@email.com"
            style={{
              borderWidth: 2,
              borderRadius: radius.lg,
              padding: spacing.md,
              borderColor: colors.border,
              backgroundColor: colors.background,
              fontSize: 15,
              fontWeight: '600',
            }}
          />
        </View>

        {/* Bouton de confirmation */}
        <TouchableOpacity
          style={{
            backgroundColor: reserving ? colors.textMuted : colors.primary,
            padding: spacing.lg,
            borderRadius: radius.xl,
            alignItems: 'center',
            ...shadows.md,
          }}
          onPress={reserve}
          disabled={reserving}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
            {reserving ? '⏳ Réservation en cours...' : '✅ Confirmer la réservation'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

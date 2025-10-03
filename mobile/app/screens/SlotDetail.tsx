import React from 'react';
import { View, Text, Alert, TextInput } from 'react-native';
import { BASE_URL } from '../config';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../state/UserContext';

export default function SlotDetail() {
  // Récupération des paramètres de route
  const route = useRoute<RouteProp<RootStackParamList, 'SlotDetail'>>();
  const slotId = route.params?.slotId;
  const { user } = useUser();
  const [email, setEmail] = React.useState(user.email ?? 'organizer@example.com');

  // Si l'email utilisateur arrive après (chargement AsyncStorage), synchroniser le champ
  React.useEffect(() => {
    if (user.email) setEmail(user.email);
  }, [user.email]);
  const navigation = useNavigation<any>();

  // Réservation du créneau avec email organisateur
  const reserve = async () => {
    if (!slotId) return Alert.alert('Erreur', 'slotId manquant');
    try {
      const r = await fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, organizerEmail: email }),
      });
      if (r.ok) {
        const data = await r.json();
        if (data?.inviteUrl) {
          // Extraire le token à partir de l'URL renvoyée par l'API
          const m = String(data.inviteUrl).match(/invitations\/(.+)$/) || String(data.inviteUrl).match(/invite\/(.+)$/);
          const token = m?.[1];
          // Sauvegarder la réservation localement pour l'onglet Réservations (MVP), même si le token est introuvable
          try {
            await AsyncStorage.setItem(
              'last_reservation',
              JSON.stringify({ slotId, inviteUrl: data.inviteUrl, token, createdAt: Date.now() })
            );
          } catch {}
          // Navigation préférée: vers Invitation avec autoAccept si token
          if (token) {
            navigation.navigate('InviteLanding', { token, inviteUrl: data.inviteUrl, autoAccept: true });
          } else {
            // Sinon, fallback direct vers l'onglet Réservations
            Alert.alert('Réservation créée', 'Le lien d\'invitation a été généré.');
            try { navigation.getParent()?.navigate('Réservations'); } catch {}
          }
        } else {
          // Si l'API n'a pas renvoyé d'URL, on enregistre un minimum pour l'écran Réservations
          try {
            await AsyncStorage.setItem(
              'last_reservation',
              JSON.stringify({ slotId, inviteUrl: null, token: null, createdAt: Date.now() })
            );
          } catch {}
          Alert.alert('Réservation créée', "Lien d'invitation non renvoyé par l'API");
          try { navigation.getParent()?.navigate('Réservations'); } catch {}
        }
      } else {
        const msg = await r.text();
        Alert.alert('Erreur', msg || 'Réservation impossible');
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? '');
    }
  };
  const dt = slotId ? new Date() : null; // Ici on n'a pas les métadonnées du slot, on garde un placeholder simple
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
        Confirmer la réservation
      </Text>

      {/* Carte récap du créneau (placeholder avec slotId) */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text style={{ fontWeight: '700', color: colors.text, marginBottom: spacing.xs }}>Créneau</Text>
        <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>ID: {slotId}</Text>
        {dt && (
          <Text style={{ color: colors.textMuted }}>
            {dt.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}{' '}
            {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      <Text style={{ marginBottom: spacing.xs, color: colors.text }}>Email de l'organisateur</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="organizer@example.com"
        style={{
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      />

      <PrimaryButton title="Confirmer la réservation" onPress={reserve} />
    </View>
  );
}

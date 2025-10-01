import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

type SavedReservation = { slotId: string; inviteUrl: string; token?: string; createdAt: number };

export default function Reservations() {
  const navigation = useNavigation<any>();
  const [last, setLast] = React.useState<SavedReservation | null>(null);

  const load = React.useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('last_reservation');
      setLast(raw ? JSON.parse(raw) : null);
    } catch {
      setLast(null);
    }
  }, []);

  // Charger au montage
  React.useEffect(() => {
    load();
  }, [load]);

  // Et recharger à chaque focus de l'onglet
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
        Réservations
      </Text>

      {!last ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primarySoft,
              marginBottom: spacing.md,
            }}
          />
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: spacing.xs }}>Aucune réservation</Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg }}>
            Vous n'avez pas encore de réservation à venir.
          </Text>
          <PrimaryButton title="Voir les créneaux" onPress={() => navigation.navigate('Terrains')} />
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: spacing.xs }}>Dernière réservation</Text>
          <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>Slot ID: {last.slotId}</Text>
          <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>
            Créée: {new Date(last.createdAt).toLocaleString('fr-FR')}
          </Text>
          {last.inviteUrl ? (
            <>
              <Text style={{ color: colors.textMuted, marginBottom: spacing.xs }}>Lien d'invitation</Text>
              <Text style={{ color: colors.text, marginBottom: spacing.sm }}>{last.inviteUrl}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <PrimaryButton
                  title="Ouvrir"
                  onPress={() =>
                    navigation.navigate('InviteLanding', {
                      token: last.token,
                      inviteUrl: last.inviteUrl,
                    })
                  }
                  style={{ marginRight: spacing.sm }}
                />
                <PrimaryButton title="Copier le lien" onPress={() => Clipboard.setStringAsync(last.inviteUrl)} />
              </View>
            </>
          ) : (
            <Text style={{ color: colors.textMuted }}>Pas de lien d'invitation disponible.</Text>
          )}
        </View>
      )}
    </View>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

type SavedReservation = { slotId: string; inviteUrl: string; token?: string; createdAt: number };

export default function Reservations() {
  const navigation = useNavigation<any>();
  const [reservations, setReservations] = React.useState<SavedReservation[]>([]);

  const load = React.useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('reservations');
      setReservations(raw ? JSON.parse(raw) : []);
    } catch {
      setReservations([]);
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header moderne */}
      <View style={{ 
        backgroundColor: colors.primary, 
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        ...shadows.lg,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', marginBottom: spacing.xs }}>
              🏟️ Mes Réservations
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>
              Gérez vos créneaux réservés
            </Text>
          </View>
          {reservations.length > 0 && (
            <View style={{ 
              backgroundColor: 'white', 
              paddingHorizontal: spacing.md, 
              paddingVertical: spacing.xs, 
              borderRadius: radius.pill 
            }}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                {reservations.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ padding: spacing.xl }}>

        {reservations.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.xl,
              padding: spacing.xxl,
              alignItems: 'center',
              ...shadows.md,
            }}
          >
            <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>💭</Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 18, marginBottom: spacing.xs }}>Aucune réservation</Text>
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 20 }}>
              Vous n'avez pas encore de réservation à venir.
              Réservez votre premier créneau dès maintenant !
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: radius.lg,
                ...shadows.md,
              }}
              onPress={() => navigation.navigate('Terrains')}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>⚽ Voir les créneaux</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reservations.map((reservation, index) => (
            <View
              key={reservation.slotId + reservation.createdAt}
              style={{
                backgroundColor: colors.card,
                borderRadius: radius.xl,
                padding: spacing.xl,
                marginBottom: spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: index === 0 ? colors.success : colors.secondary,
                ...shadows.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}>
                  <Text style={{ fontSize: 24 }}>{index === 0 ? '✅' : '📅'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 18, marginBottom: spacing.xs }}>
                    {index === 0 ? 'Dernière réservation' : `Réservation #${index + 1}`}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    🕒 {new Date(reservation.createdAt).toLocaleString('fr-FR')}
                  </Text>
                </View>
              </View>

              <View style={{ 
                backgroundColor: colors.backgroundDark, 
                padding: spacing.md, 
                borderRadius: radius.md,
                marginBottom: spacing.lg,
              }}>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}>ID du créneau</Text>
                <Text style={{ color: colors.text, fontWeight: '600', fontFamily: 'monospace' }}>{reservation.slotId}</Text>
              </View>

              {reservation.inviteUrl ? (
                <>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: spacing.md }}>
                    👥 Lien d'invitation
                  </Text>
                  <View style={{ 
                    backgroundColor: colors.primarySoft, 
                    padding: spacing.md, 
                    borderRadius: radius.md,
                    marginBottom: spacing.lg,
                  }}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }} numberOfLines={2}>
                      {reservation.inviteUrl}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: colors.primary,
                        padding: spacing.md,
                        borderRadius: radius.lg,
                        alignItems: 'center',
                        ...shadows.sm,
                      }}
                      onPress={() =>
                        navigation.navigate('InviteLanding', {
                          token: reservation.token,
                          inviteUrl: reservation.inviteUrl,
                        })
                      }
                    >
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>🔗 Ouvrir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: colors.secondary,
                        padding: spacing.md,
                        borderRadius: radius.lg,
                        alignItems: 'center',
                        ...shadows.sm,
                      }}
                      onPress={() => Clipboard.setStringAsync(reservation.inviteUrl)}
                    >
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>📋 Copier</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ 
                  backgroundColor: '#FEF3C7', 
                  padding: spacing.md, 
                  borderRadius: radius.md,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.warning,
                }}>
                  <Text style={{ color: colors.warning, fontWeight: '600' }}>⚠️ Pas de lien d'invitation disponible</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { BASE_URL } from '../config';
import { colors, spacing, radius, font } from '../theme';
import { Card, Button, Input, AnimatedEntry } from '../components/UI';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useUser } from '../state/UserContext';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

type InviteInfo = { 
  slot: { startAt: string; durationMin: number; capacity: number; status: string }, 
  restants: number 
};

export default function InviteLanding() {
  const route = useRoute<RouteProp<RootStackParamList, 'InviteLanding'>>();
  const navigation = useNavigation<any>();
  const initialToken = route.params?.token ?? '';
  const paramInviteUrl = route.params?.inviteUrl;
  
  const sanitizeToken = React.useCallback((raw: string) => {
    if (!raw) return '';
    const m = raw.match(/\/(?:invitations|invite|i)\/([^/?#]+)/);
    return m?.[1] ?? raw.trim();
  }, []);

  const [token, setToken] = React.useState(sanitizeToken(initialToken));
  const [info, setInfo] = React.useState<InviteInfo | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [responding, setResponding] = React.useState(false);
  const [response, setResponse] = React.useState<'accepted' | 'declined' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useUser();

  // Charger les infos automatiquement
  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE_URL}/invitations/${token}`);
      if (!r.ok) throw new Error('Invitation introuvable');
      setInfo(await r.json());
      
      // Vérifier si déjà répondu
      const saved = await AsyncStorage.getItem(`response_${token}`);
      if (saved) setResponse(saved as 'accepted' | 'declined');
    } catch (e: any) {
      setInfo(null);
      setError(e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    const t = sanitizeToken(initialToken || paramInviteUrl || '');
    if (t && t !== token) setToken(t);
    if (t) load();
  }, [initialToken, paramInviteUrl]);

  // Répondre à l'invitation
  const respond = async (accept: boolean) => {
    if (!token || responding || response) return;
    setResponding(true);
    try {
      const endpoint = accept ? 'accept' : 'decline';
      const r = await fetch(`${BASE_URL}/invitations/${token}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: user.email ? JSON.stringify({ email: user.email }) : undefined,
      });
      
      if (r.ok || r.status === 200) {
        const newResponse = accept ? 'accepted' : 'declined';
        setResponse(newResponse);
        await AsyncStorage.setItem(`response_${token}`, newResponse);
        await load(); // Refresh pour voir le nouveau nombre
      } else {
        window.alert(accept ? '❌ Plus de place disponible' : '❌ Erreur');
      }
    } catch {
      window.alert('❌ Erreur réseau');
    } finally {
      setResponding(false);
    }
  };

  // Annuler sa réponse
  const cancelResponse = async () => {
    await AsyncStorage.removeItem(`response_${token}`);
    setResponse(null);
  };

  const dateObj = info ? new Date(info.slot.startAt) : null;
  const dayName = dateObj?.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dayNum = dateObj?.getDate();
  const month = dateObj?.toLocaleDateString('fr-FR', { month: 'long' });
  const timeStr = dateObj?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const acceptedCount = info ? (info.slot.capacity - info.restants) : 0;
  const hasSpots = (info?.restants ?? 0) > 0;

  // ════════════════════════════════════════════════════════════════════════
  // ÉCRAN DE SAISIE DU LIEN (si pas de token)
  // ════════════════════════════════════════════════════════════════════════
  if (!token && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing['5'] }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <AnimatedEntry>
            <View style={{ alignItems: 'center', marginBottom: spacing['8'] }}>
              <Text style={{ fontSize: 64, marginBottom: spacing['4'] }}>🎫</Text>
              <Text style={{ color: colors.textPrimary, fontSize: font['2xl'], fontWeight: font.black, textAlign: 'center' }}>
                Invitation
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: font.base, textAlign: 'center', marginTop: spacing['2'] }}>
                Collez le lien reçu par message
              </Text>
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <Input
              value={token}
              onChangeText={(t) => setToken(sanitizeToken(t))}
              placeholder="Coller le lien ici..."
              icon="🔗"
            />
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <Button onPress={load} disabled={!token} icon="→" size="lg">
              Voir l'invitation
            </Button>
          </AnimatedEntry>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // ÉCRAN DE CHARGEMENT
  // ════════════════════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════════════════════
  // ÉCRAN D'ERREUR
  // ════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing['6'] }}>
        <Text style={{ fontSize: 64, marginBottom: spacing['4'] }}>😕</Text>
        <Text style={{ color: colors.textPrimary, fontSize: font.xl, fontWeight: font.bold, textAlign: 'center', marginBottom: spacing['2'] }}>
          Invitation introuvable
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: spacing['6'] }}>
          Le lien est peut-être expiré ou incorrect
        </Text>
        <Button onPress={() => { setToken(''); setError(null); }} variant="secondary" icon="←">
          Réessayer
        </Button>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // ÉCRAN PRINCIPAL - INVITATION
  // ════════════════════════════════════════════════════════════════════════
  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {/* Header avec date/heure */}
      <View style={{
        backgroundColor: response === 'accepted' ? colors.success : response === 'declined' ? colors.error : hasSpots ? colors.brand : colors.gray700,
        paddingTop: spacing['16'],
        paddingBottom: spacing['10'],
        paddingHorizontal: spacing['5'],
        alignItems: 'center',
      }}>
        {/* Badge de statut */}
        {response ? (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: spacing['4'],
            paddingVertical: spacing['2'],
            borderRadius: radius.full,
            marginBottom: spacing['3'],
          }}>
            <Text style={{ color: 'white', fontWeight: font.bold, fontSize: font.sm }}>
              {response === 'accepted' ? '✓ VOUS PARTICIPEZ' : '✕ VOUS NE VENEZ PAS'}
            </Text>
          </View>
        ) : (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: spacing['4'],
            paddingVertical: spacing['2'],
            borderRadius: radius.full,
            marginBottom: spacing['3'],
          }}>
            <Text style={{ color: 'white', fontWeight: font.bold, fontSize: font.sm }}>
              ⚽ MATCH DE FOOT
            </Text>
          </View>
        )}

        {/* Grande heure */}
        <Text style={{ 
          color: 'white', 
          fontSize: 72, 
          fontWeight: font.black,
          letterSpacing: -3,
        }}>
          {timeStr}
        </Text>
        
        {/* Date */}
        <Text style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: font.xl,
          fontWeight: font.medium,
          marginTop: spacing['1'],
          textTransform: 'capitalize',
        }}>
          {dayName} {dayNum} {month}
        </Text>

        {/* Participants */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          paddingHorizontal: spacing['5'],
          paddingVertical: spacing['3'],
          borderRadius: radius.xl,
          marginTop: spacing['5'],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing['3'],
        }}>
          <Text style={{ fontSize: 20 }}>👥</Text>
          <Text style={{ color: 'white', fontSize: font.lg, fontWeight: font.bold }}>
            {acceptedCount} / {info?.slot.capacity} participants
          </Text>
        </View>
      </View>

      {/* Contenu principal */}
      <View style={{ flex: 1, padding: spacing['5'] }}>
        
        {/* DÉJÀ RÉPONDU */}
        {response && (
          <AnimatedEntry>
            <Card style={{ alignItems: 'center', marginBottom: spacing['4'] }}>
              <Text style={{ fontSize: 48, marginBottom: spacing['3'] }}>
                {response === 'accepted' ? '🎉' : '👋'}
              </Text>
              <Text style={{ 
                color: colors.textPrimary, 
                fontSize: font.xl, 
                fontWeight: font.bold,
                textAlign: 'center',
                marginBottom: spacing['2'],
              }}>
                {response === 'accepted' ? 'À bientôt sur le terrain !' : 'Pas de souci !'}
              </Text>
              <Text style={{ 
                color: colors.textMuted, 
                textAlign: 'center',
                marginBottom: spacing['5'],
              }}>
                {response === 'accepted' 
                  ? 'Votre participation est confirmée' 
                  : 'On vous attend la prochaine fois'}
              </Text>
              
              <TouchableOpacity onPress={cancelResponse}>
                <Text style={{ color: colors.textMuted, fontSize: font.sm, textDecorationLine: 'underline' }}>
                  Changer ma réponse
                </Text>
              </TouchableOpacity>
            </Card>
          </AnimatedEntry>
        )}

        {/* PAS ENCORE RÉPONDU */}
        {!response && (
          <>
            <AnimatedEntry>
              <Text style={{ 
                color: colors.textPrimary, 
                fontSize: font.xl, 
                fontWeight: font.bold,
                textAlign: 'center',
                marginBottom: spacing['2'],
              }}>
                Vous venez ?
              </Text>
              <Text style={{ 
                color: colors.textMuted, 
                textAlign: 'center',
                marginBottom: spacing['6'],
              }}>
                {hasSpots 
                  ? `Il reste ${info?.restants} place${(info?.restants ?? 0) > 1 ? 's' : ''}`
                  : 'Plus de place disponible'}
              </Text>
            </AnimatedEntry>

            {/* DEUX GROS BOUTONS */}
            <AnimatedEntry delay={100}>
              <View style={{ gap: spacing['3'] }}>
                {/* Bouton JE VIENS */}
                <TouchableOpacity
                  onPress={() => respond(true)}
                  disabled={responding || !hasSpots}
                  style={{
                    backgroundColor: hasSpots ? colors.success : colors.gray700,
                    paddingVertical: spacing['6'],
                    borderRadius: radius.xl,
                    alignItems: 'center',
                    opacity: responding ? 0.7 : 1,
                  }}
                >
                  <Text style={{ fontSize: 32, marginBottom: spacing['2'] }}>✅</Text>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: font['2xl'], 
                    fontWeight: font.black,
                  }}>
                    {responding ? 'Envoi...' : hasSpots ? 'JE VIENS !' : 'COMPLET'}
                  </Text>
                </TouchableOpacity>

                {/* Bouton JE NE PEUX PAS */}
                <TouchableOpacity
                  onPress={() => respond(false)}
                  disabled={responding}
                  style={{
                    backgroundColor: colors.bgCard,
                    paddingVertical: spacing['5'],
                    borderRadius: radius.xl,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: responding ? 0.7 : 1,
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: spacing['1'] }}>❌</Text>
                  <Text style={{ 
                    color: colors.textSecondary, 
                    fontSize: font.lg, 
                    fontWeight: font.bold,
                  }}>
                    Je ne peux pas
                  </Text>
                </TouchableOpacity>
              </View>
            </AnimatedEntry>
          </>
        )}

        {/* Section Partager (réduite) */}
        {(paramInviteUrl || token) && (
          <AnimatedEntry delay={200}>
            <TouchableOpacity
              onPress={() => { 
                Clipboard.setStringAsync(paramInviteUrl || `${BASE_URL}/invitations/${token}`); 
                window.alert('📋 Lien copié !'); 
              }}
              style={{
                backgroundColor: colors.bgCard,
                padding: spacing['4'],
                borderRadius: radius.lg,
                marginTop: spacing['6'],
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing['3'],
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18 }}>📤</Text>
              <Text style={{ color: colors.textSecondary, fontWeight: font.semibold }}>
                Partager l'invitation
              </Text>
            </TouchableOpacity>
          </AnimatedEntry>
        )}
      </View>
    </ScrollView>
  );
}

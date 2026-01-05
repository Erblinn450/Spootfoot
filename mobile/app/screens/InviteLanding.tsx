import React from 'react';
import { View, Text, Alert, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { BASE_URL } from '../config';
import { colors, spacing, radius, font, shadow } from '../theme';
import { Header, Card, Badge, Button, Input, AnimatedEntry, Stat } from '../components/UI';
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
  const autoAccept = route.params?.autoAccept ?? false;
  
  const sanitizeToken = React.useCallback((raw: string) => {
    if (!raw) return '';
    const m = raw.match(/\/(?:invitations|invite|i)\/([^/?#]+)/);
    return m?.[1] ?? raw.trim();
  }, []);

  const [token, setToken] = React.useState(sanitizeToken(initialToken));
  const [info, setInfo] = React.useState<InviteInfo | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [accepting, setAccepting] = React.useState(false);
  const [hasAccepted, setHasAccepted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const { user } = useUser();
  const didAutoAccept = React.useRef(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE_URL}/invitations/${token}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setInfo(await r.json());
    } catch (e: any) {
      setInfo(null);
      setError(e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const checkIfAlreadyAccepted = React.useCallback(async (inviteToken: string) => {
    try {
      const value = await AsyncStorage.getItem(`accepted_${inviteToken}`);
      setHasAccepted(value === 'true');
    } catch (e) {
      setHasAccepted(false);
    }
  }, []);

  React.useEffect(() => {
    const t = sanitizeToken(initialToken || paramInviteUrl || '');
    if (t && t !== token) setToken(t);
    if (t) { load(); checkIfAlreadyAccepted(t); }
  }, [initialToken, paramInviteUrl]);

  React.useEffect(() => {
    if (token) checkIfAlreadyAccepted(token);
  }, [token, checkIfAlreadyAccepted]);

  const accept = async () => {
    if (!token || accepting || hasAccepted) return;
    setAccepting(true);
    try {
      const r = await fetch(`${BASE_URL}/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: user.email ? JSON.stringify({ email: user.email }) : undefined,
      });
      if (r.ok) {
        setHasAccepted(true);
        await AsyncStorage.setItem(`accepted_${token}`, 'true');
        let acceptedCount: number | undefined;
        try {
          const text = await r.text();
          if (text) acceptedCount = JSON.parse(text)?.acceptedCount;
        } catch {}
        const msg = acceptedCount !== undefined ? `Vous êtes inscrit ! (${acceptedCount} participants)` : 'Vous êtes inscrit !';
        setMessage(msg);
        Alert.alert('✅ Succès', msg);
        await load();
        try { navigation.getParent()?.navigate('Réservations'); } catch {}
      } else {
        let errText = '';
        try { errText = await r.text(); } catch {}
        setMessage(errText || 'Le créneau est complet');
        Alert.alert('❌ Erreur', errText || 'Le créneau est complet');
      }
    } finally {
      setAccepting(false);
    }
  };

  React.useEffect(() => {
    if (autoAccept && info && !loading && !didAutoAccept.current) {
      didAutoAccept.current = true;
      accept();
    }
  }, [autoAccept, info, loading]);

  const dateObj = info ? new Date(info.slot.startAt) : null;
  const dayName = dateObj?.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dayNum = dateObj?.getDate();
  const month = dateObj?.toLocaleDateString('fr-FR', { month: 'long' });
  const year = dateObj?.getFullYear();
  const timeStr = dateObj?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const acceptedCount = info ? (info.slot.capacity - info.restants) : 0;
  const hasSpots = (info?.restants ?? 0) > 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Gradient blob */}
      <View style={{
        position: 'absolute', top: -50, left: -100, width: 350, height: 350,
        borderRadius: 175, backgroundColor: '#3B82F680', opacity: 0.2,
      }} />

      <Header 
        title="Invitation" 
        subtitle="Rejoignez le match !"
        icon="🎫"
      />

      <View style={{ paddingHorizontal: spacing['5'] }}>
        {/* Token Input (if no info) */}
        {!info && !loading && (
          <AnimatedEntry delay={0}>
            <Card style={{ marginBottom: spacing['5'] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing['4'] }}>
                <View style={{
                  width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandMuted,
                  alignItems: 'center', justifyContent: 'center', marginRight: spacing['4'],
                }}>
                  <Text style={{ fontSize: 20 }}>🔗</Text>
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold }}>
                    Lien d'invitation
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: font.sm }}>
                    Collez le lien reçu
                  </Text>
                </View>
              </View>
              
              <Input
                value={token}
                onChangeText={(t) => setToken(sanitizeToken(t))}
                placeholder="http://localhost:3001/invitations/..."
                icon="🔗"
              />
              
              <Button onPress={load} disabled={!token || loading} icon="🔍" size="lg">
                Consulter l'invitation
              </Button>
            </Card>
          </AnimatedEntry>
        )}

        {/* Loading */}
        {loading && (
          <Card style={{ alignItems: 'center', paddingVertical: spacing['10'] }}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={{ color: colors.textMuted, marginTop: spacing['4'], fontWeight: font.medium }}>
              Chargement...
            </Text>
          </Card>
        )}

        {/* Error */}
        {error && (
          <AnimatedEntry delay={0}>
            <View style={{
              backgroundColor: colors.errorMuted, padding: spacing['4'], borderRadius: radius.lg,
              marginBottom: spacing['4'], flexDirection: 'row', alignItems: 'center', gap: spacing['3'],
            }}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <Text style={{ color: colors.error, fontWeight: font.semibold, flex: 1 }}>{error}</Text>
            </View>
          </AnimatedEntry>
        )}

        {/* Success Message */}
        {message && !error && (
          <AnimatedEntry delay={0}>
            <View style={{
              backgroundColor: colors.successMuted, padding: spacing['4'], borderRadius: radius.lg,
              marginBottom: spacing['4'], flexDirection: 'row', alignItems: 'center', gap: spacing['3'],
            }}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <Text style={{ color: colors.success, fontWeight: font.semibold, flex: 1 }}>{message}</Text>
            </View>
          </AnimatedEntry>
        )}

        {/* Match Details */}
        {info && (
          <>
            {/* Hero Time */}
            <AnimatedEntry delay={0}>
              <Card noPadding style={{ marginBottom: spacing['5'] }}>
                <View style={{
                  backgroundColor: hasSpots ? colors.brandMuted : colors.errorMuted,
                  padding: spacing['6'], alignItems: 'center',
                }}>
                  <Badge variant={hasSpots ? 'lime' : 'error'} icon={hasSpots ? '✓' : '✕'}>
                    {hasSpots ? 'PLACES DISPONIBLES' : 'COMPLET'}
                  </Badge>
                  <Text style={{ 
                    color: colors.textPrimary, fontSize: font['5xl'], fontWeight: font.black,
                    letterSpacing: -2, marginTop: spacing['3'],
                  }}>
                    {timeStr}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: font.base, marginTop: spacing['1'] }}>
                    {dayName} {dayNum} {month} {year}
                  </Text>
                </View>

                {/* Stats */}
                <View style={{ padding: spacing['4'] }}>
                  <View style={{ flexDirection: 'row', gap: spacing['3'], marginBottom: spacing['5'] }}>
                    <Stat value={`${info.slot.durationMin}min`} label="Durée" icon="⏱️" color={colors.textPrimary} />
                    <Stat value={`${acceptedCount}/${info.slot.capacity}`} label="Inscrits" icon="👥" color={colors.brand} />
                    <Stat value={hasSpots ? info.restants.toString() : '0'} label="Restantes" icon={hasSpots ? '✓' : '✕'} color={hasSpots ? colors.lime : colors.error} />
                  </View>

                  {/* Accept Button */}
                  <Button 
                    onPress={accept} 
                    disabled={!hasSpots || accepting || hasAccepted}
                    loading={accepting}
                    variant={hasAccepted ? 'secondary' : hasSpots ? 'lime' : 'secondary'}
                    icon={hasAccepted ? '✓' : hasSpots ? '🎉' : '🔒'}
                    size="lg"
                  >
                    {hasAccepted ? 'Vous êtes inscrit !' : hasSpots ? 'Je participe !' : 'Complet'}
                  </Button>
                </View>
              </Card>
            </AnimatedEntry>

            {/* Share */}
            {(paramInviteUrl || token) && (
              <AnimatedEntry delay={100}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing['4'] }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.limeMuted,
                      alignItems: 'center', justifyContent: 'center', marginRight: spacing['4'],
                    }}>
                      <Text style={{ fontSize: 20 }}>📤</Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold }}>
                        Partager
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: font.sm }}>
                        Invitez vos amis !
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{
                    backgroundColor: colors.bgInput, padding: spacing['3'], borderRadius: radius.md,
                    marginBottom: spacing['4'], borderWidth: 1, borderColor: colors.border,
                  }}>
                    <Text style={{ color: colors.textSecondary, fontSize: font.xs, fontFamily: 'monospace' }} numberOfLines={2}>
                      {paramInviteUrl || `${BASE_URL}/invitations/${token}`}
                    </Text>
                  </View>
                  
                  <Button 
                    onPress={() => { Clipboard.setStringAsync(paramInviteUrl || `${BASE_URL}/invitations/${token}`); window.alert('📋 Lien copié !'); }}
                    variant="lime"
                    icon="📋"
                  >
                    Copier le lien
                  </Button>
                </Card>
              </AnimatedEntry>
            )}
          </>
        )}

        <View style={{ height: spacing['8'] }} />
      </View>
    </ScrollView>
  );
}

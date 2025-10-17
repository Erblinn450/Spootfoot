import React from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { BASE_URL } from '../config';
import { colors, spacing, radius, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useUser } from '../state/UserContext';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

type InviteInfo = { 
  slot: { 
    startAt: string; 
    durationMin: number;
    capacity: number; 
    status: string 
  }, 
  restants: number 
};

export default function InviteLanding() {
  const route = useRoute<RouteProp<RootStackParamList, 'InviteLanding'>>();
  const navigation = useNavigation<any>();
  const initialToken = route.params?.token ?? '';
  const paramInviteUrl = route.params?.inviteUrl;
  const autoAccept = route.params?.autoAccept ?? false;
  // Token d'invitation saisi par l'utilisateur (ou fourni via navigation)
  const sanitizeToken = React.useCallback((raw: string) => {
    if (!raw) return '';
    // Si l'utilisateur colle une URL complète, extraire la partie token
    // Exemples supportés: /invitations/{token}, /invite/{token}, /i/{token}
    const m = raw.match(/\/(?:invitations|invite|i)\/([^/?#]+)/);
    if (m && m[1]) return m[1];
    // Sinon, si c'est déjà un token simple, retourner tel quel
    return raw.trim();
  }, []);
  const [token, setToken] = React.useState(sanitizeToken(initialToken));
  const [info, setInfo] = React.useState<InviteInfo | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [accepting, setAccepting] = React.useState(false); // État pour éviter double clic
  const [hasAccepted, setHasAccepted] = React.useState(false); // Marquer si déjà accepté
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
      const data = await r.json();
      setInfo(data);
    } catch (e: any) {
      setInfo(null);
      setError(e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Vérifier si l'utilisateur a déjà accepté cette invitation
  const checkIfAlreadyAccepted = React.useCallback(async (inviteToken: string) => {
    try {
      const key = `accepted_${inviteToken}`;
      console.log('🔍 Vérification acceptation pour:', key);
      const value = await AsyncStorage.getItem(key);
      console.log('📦 Valeur AsyncStorage:', value);
      if (value === 'true') {
        console.log('✅ Déjà accepté !');
        setHasAccepted(true);
      } else {
        console.log('❌ Pas encore accepté');
        setHasAccepted(false);
      }
    } catch (e) {
      console.warn('Erreur vérification acceptation:', e);
    }
  }, []);

  // Charger automatiquement si un token/URL est fourni par navigation
  React.useEffect(() => {
    const t = sanitizeToken(initialToken || paramInviteUrl || '');
    if (t && t !== token) setToken(t);
    if (t) {
      load();
      // Vérifier si déjà accepté
      checkIfAlreadyAccepted(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken, paramInviteUrl]);

  // Vérifier aussi quand le token change
  React.useEffect(() => {
    if (token) {
      checkIfAlreadyAccepted(token);
    }
  }, [token, checkIfAlreadyAccepted]);

  // Acceptation de l'invitation
  const accept = async () => {
    if (!token || accepting || hasAccepted) return; // Empêcher double clic et re-clic après succès
    
    setAccepting(true); // Désactiver le bouton
    try {
      const r = await fetch(`${BASE_URL}/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: user.email ? JSON.stringify({ email: user.email }) : undefined,
      });
      if (r.ok) {
        setHasAccepted(true); // Marquer comme accepté définitivement
        
        // Sauvegarder dans AsyncStorage pour persistance
        try {
          const key = `accepted_${token}`;
          console.log('💾 Sauvegarde acceptation:', key);
          await AsyncStorage.setItem(key, 'true');
          console.log('✅ Acceptation sauvegardée !');
        } catch (e) {
          console.warn('❌ Erreur sauvegarde acceptation:', e);
        }
        
        let acceptedCount: number | undefined = undefined;
        try {
          // Certaines implémentations peuvent renvoyer 204 No Content
          const text = await r.text();
          if (text) {
            const data = JSON.parse(text);
            acceptedCount = data?.acceptedCount;
          }
        } catch {}
        const msg = acceptedCount !== undefined
          ? `Merci, vous êtes inscrit. acceptedCount=${acceptedCount}`
          : 'Merci, vous êtes inscrit.';
        setMessage(msg);
        Alert.alert('Inscription', msg);
        // Recharger les infos pour mettre à jour "Restants"
        await load();
        // Aller vers l'onglet Réservations pour visualiser immédiatement
        try {
          navigation.getParent()?.navigate('Réservations');
        } catch {}
      } else {
        // Tenter de récupérer un message d'erreur utile
        let errText = '';
        try { errText = await r.text(); } catch {}
        const txt = errText || 'Malheureusement, le créneau est plein';
        setMessage(txt);
        Alert.alert('Complet', txt);
      }
    } finally {
      setAccepting(false); // Réactiver le bouton (sauf si hasAccepted est true)
    }
  };

  // Si autoAccept est demandé, accepter après chargement des infos
  React.useEffect(() => {
    if (autoAccept && info && !loading && !didAutoAccept.current) {
      didAutoAccept.current = true;
      accept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAccept, info, loading]);

  const dateObj = info ? new Date(info.slot.startAt) : null;
  const dateStr = dateObj?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  const acceptedCount = info ? (info.slot.capacity - info.restants) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: colors.secondary, 
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        ...shadows.lg,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', marginBottom: spacing.xs }}>
          👥 Invitation
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>
          Rejoignez le match !
        </Text>
      </View>

      <View style={{ padding: spacing.xl }}>
        {/* Formulaire token */}
        {!info && (
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
              🔗 Entrez votre lien
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: spacing.md, lineHeight: 20 }}>
              Collez le lien d'invitation que vous avez reçu
            </Text>
            <TextInput
              value={token}
              onChangeText={(t) => setToken(sanitizeToken(t))}
              placeholder="http://localhost:3001/invitations/..."
              autoCapitalize="none"
              style={{
                borderWidth: 2,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderColor: colors.border,
                backgroundColor: colors.background,
                fontSize: 14,
              }}
            />
            <TouchableOpacity
              style={{
                backgroundColor: loading ? colors.textMuted : colors.secondary,
                padding: spacing.md,
                borderRadius: radius.lg,
                alignItems: 'center',
                ...shadows.sm,
              }}
              onPress={load}
              disabled={!token || loading}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                {loading ? '⏳ Chargement...' : '🔍 Consulter'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
            <Text style={{ color: colors.danger, fontWeight: '600' }}>❌ {error}</Text>
          </View>
        )}

        {message && (
          <View style={{ 
            backgroundColor: colors.primarySoft, 
            padding: spacing.md, 
            borderRadius: radius.lg, 
            marginBottom: spacing.md,
            borderLeftWidth: 4,
            borderLeftColor: colors.success,
            ...shadows.sm,
          }}>
            <Text style={{ color: colors.success, fontWeight: '600' }}>✅ {message}</Text>
          </View>
        )}

        {/* Carte détails du créneau */}
        {info && (
          <>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: radius.xl,
                padding: spacing.xl,
                marginBottom: spacing.lg,
                borderLeftWidth: 4,
                borderLeftColor: colors.secondary,
                ...shadows.md,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg }}>
                ⚽ Détails du match
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

              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                <View style={{ flex: 1, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                    Durée
                  </Text>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                    {info.slot.durationMin} min
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#DBEAFE', padding: spacing.md, borderRadius: radius.md }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                    Inscrits
                  </Text>
                  <Text style={{ color: colors.secondary, fontWeight: '700', fontSize: 15 }}>
                    {acceptedCount}/{info.slot.capacity}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: info.restants > 0 ? colors.primarySoft : '#FEE2E2', padding: spacing.md, borderRadius: radius.md }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: spacing.xs }}>
                    Places
                  </Text>
                  <Text style={{ color: info.restants > 0 ? colors.success : colors.danger, fontWeight: '700', fontSize: 15 }}>
                    {info.restants > 0 ? `${info.restants} libres` : 'Complet'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: (info.restants > 0 && !accepting && !hasAccepted) ? colors.success : colors.textMuted,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  alignItems: 'center',
                  ...shadows.md,
                  opacity: (accepting || hasAccepted) ? 0.6 : 1,
                }}
                onPress={accept}
                disabled={info.restants === 0 || accepting || hasAccepted}
              >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                  {hasAccepted ? '✅ Déjà inscrit' : accepting ? '⏳ Inscription...' : info.restants > 0 ? '✅ Je viens !' : '❌ Complet'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Partage du lien */}
            {(paramInviteUrl || token) && (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.xl,
                  padding: spacing.xl,
                  ...shadows.md,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>
                  🔗 Partager l'invitation
                </Text>
                <View style={{ 
                  backgroundColor: colors.backgroundDark, 
                  padding: spacing.md, 
                  borderRadius: radius.md,
                  marginBottom: spacing.md,
                }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={2}>
                    {paramInviteUrl || `${BASE_URL}/invitations/${token}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.secondary,
                    padding: spacing.md,
                    borderRadius: radius.lg,
                    alignItems: 'center',
                    ...shadows.sm,
                  }}
                  onPress={() => Clipboard.setStringAsync(paramInviteUrl || `${BASE_URL}/invitations/${token}`)}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>📋 Copier le lien</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

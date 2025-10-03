import React from 'react';
import { View, Text, Alert, TextInput } from 'react-native';
import { BASE_URL } from '../config';
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useUser } from '../state/UserContext';
import * as Clipboard from 'expo-clipboard';

type InviteInfo = { slot: { startAt: string; capacity: number; status: string }, restants: number };

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

  // Charger automatiquement si un token/URL est fourni par navigation
  React.useEffect(() => {
    const t = sanitizeToken(initialToken || paramInviteUrl || '');
    if (t && t !== token) setToken(t);
    if (t) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken, paramInviteUrl]);

  // Acceptation de l'invitation
  const accept = async () => {
    if (!token) return;
    const r = await fetch(`${BASE_URL}/invitations/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: user.email ? JSON.stringify({ email: user.email }) : undefined,
    });
    if (r.ok) {
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
  };

  // Si autoAccept est demandé, accepter après chargement des infos
  React.useEffect(() => {
    if (autoAccept && info && !loading && !didAutoAccept.current) {
      didAutoAccept.current = true;
      accept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAccept, info, loading]);

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Invitation</Text>

      {/* Champ token + bouton Consulter */}
      <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
        <TextInput
          value={token}
          onChangeText={(t) => setToken(sanitizeToken(t))}
          placeholder="Collez l'URL complète ou le token"
          autoCapitalize="none"
          style={{
            flex: 1,
            borderWidth: 1,
            borderRadius: radius.md,
            padding: spacing.md,
            marginRight: spacing.sm,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        />
        <PrimaryButton title={loading ? '...' : 'Consulter'} onPress={load} disabled={!token || loading} />
      </View>
      <Text style={{ color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.md, fontSize: 12 }}>
        Exemple: http://localhost:3001/invitations/ABCDEF ou collez directement le token ABCDEF
      </Text>

      {error && <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>Erreur: {error}</Text>}
      {message && <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>{message}</Text>}

      {/* Carte détails de l'invitation */}
      {info && (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: spacing.xs }}>Créneau invité</Text>
          <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>
            {new Date(info.slot.startAt).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}{' '}
            {new Date(info.slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted }}>Restants: {info.restants}</Text>
            <PrimaryButton title="Je viens" onPress={accept} />
          </View>
          {(paramInviteUrl || token) && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ color: colors.textMuted, marginBottom: spacing.xs }}>Lien d'invitation</Text>
              <Text style={{ color: colors.text, marginBottom: spacing.sm }}>
                {paramInviteUrl || `${BASE_URL}/invitations/${token}`}
              </Text>
              <PrimaryButton
                title="Copier le lien"
                onPress={() => Clipboard.setStringAsync(paramInviteUrl || `${BASE_URL}/invitations/${token}`)}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

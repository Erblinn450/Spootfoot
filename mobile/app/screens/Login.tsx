import React from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../state/UserContext';
import { BASE_URL } from '../config';

export default function Login() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { user, setAuth } = useUser();
  const [error, setError] = React.useState<string | null>(null);

  const isValidEmail = React.useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const isValidForm = isValidEmail && password.length >= 6;

  const onAuth = async (mode: 'login' | 'signup') => {
    if (!isValidForm) {
      setError('Veuillez entrer un email valide et un mot de passe (≥ 6 caractères)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text || 'Erreur');
      const data = JSON.parse(text);
      await setAuth({ email: data.user.email, roles: data.user.roles || [], accessToken: data.accessToken });
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      setError(e?.message ?? 'Erreur réseau');
      Alert.alert('Connexion', e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // Si déjà connecté, sauter l'écran Login
  React.useEffect(() => {
    if (user.accessToken) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [user.accessToken, navigation]);

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>SpotFoot</Text>
        <Text style={{ marginTop: spacing.xs, color: colors.textMuted }}>Espace utilisateur et admin</Text>
      </View>

      <Text style={{ marginBottom: spacing.xs, color: colors.text }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (error) setError(null);
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="vous@exemple.com"
        style={{
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.card,
        }}
        returnKeyType="next"
      />

      <Text style={{ marginBottom: spacing.xs, color: colors.text }}>Mot de passe</Text>
      <TextInput
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (error) setError(null);
        }}
        secureTextEntry
        placeholder="••••••"
        style={{
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.card,
        }}
        returnKeyType="done"
        onSubmitEditing={() => onAuth('login')}
      />

      {error && <Text style={{ color: colors.danger, marginTop: -spacing.lg, marginBottom: spacing.lg }}>{error}</Text>}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PrimaryButton title={loading ? '...' : "S'inscrire"} onPress={() => onAuth('signup')} disabled={!isValidForm || loading} />
        <View style={{ width: spacing.md }} />
        <PrimaryButton title={loading ? '...' : 'Se connecter'} onPress={() => onAuth('login')} disabled={!isValidForm || loading} />
      </View>

      <Text style={{ color: colors.textMuted, marginTop: spacing.md, fontSize: 12 }}>
        Remarque: si votre email correspond à ADMIN_EMAIL côté serveur, vous obtenez le rôle admin.
      </Text>
    </View>
  );
}

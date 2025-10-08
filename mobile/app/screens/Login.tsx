import React from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../state/UserContext';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      await setAuth({ email: data.user.email, roles: data.user.roles || [], accessToken: data.accessToken }, password);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header avec fond vert */}
      <View style={{ 
        backgroundColor: colors.primary, 
        paddingTop: spacing.xxl * 2,
        paddingBottom: spacing.xxl,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: radius.xl * 2,
        borderBottomRightRadius: radius.xl * 2,
        ...shadows.xl,
      }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: spacing.xs }}>
          ⚽ SpotFoot
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
          Réservez vos terrains facilement
        </Text>
      </View>

      {/* Formulaire dans une carte */}
      <View style={{ 
        marginHorizontal: spacing.xl, 
        marginTop: -spacing.xxl,
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing.xl,
        ...shadows.lg,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, textAlign: 'center' }}>
          Connexion
        </Text>

        <Text style={{ marginBottom: spacing.xs, color: colors.text, fontWeight: '600', fontSize: 14 }}>Email</Text>
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
            borderWidth: 2,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.background,
            fontSize: 15,
          }}
          returnKeyType="next"
        />

        <Text style={{ marginBottom: spacing.xs, color: colors.text, fontWeight: '600', fontSize: 14 }}>Mot de passe</Text>
        <TextInput
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (error) setError(null);
          }}
          secureTextEntry
          placeholder="••••••"
          style={{
            borderWidth: 2,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.background,
            fontSize: 15,
          }}
          returnKeyType="done"
          onSubmitEditing={() => onAuth('login')}
        />

        {error && (
          <View style={{ 
            backgroundColor: '#FEE2E2', 
            padding: spacing.md, 
            borderRadius: radius.md, 
            marginBottom: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: colors.danger,
          }}>
            <Text style={{ color: colors.danger, fontWeight: '600' }}>❌ {error}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.backgroundDark,
              padding: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              opacity: !isValidForm || loading ? 0.5 : 1,
            }}
            onPress={() => onAuth('signup')}
            disabled={!isValidForm || loading}
          >
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
              {loading ? '⏳' : "S'inscrire"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              padding: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              ...shadows.md,
              opacity: !isValidForm || loading ? 0.5 : 1,
            }}
            onPress={() => onAuth('login')}
            disabled={!isValidForm || loading}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
              {loading ? '⏳' : 'Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.textMuted, marginTop: spacing.lg, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          💡 Astuce : utilisez admin@example.com pour accéder à l'interface admin
        </Text>
      </View>

      {/* Debug button */}
      <TouchableOpacity
        style={{
          marginHorizontal: spacing.xl,
          marginTop: spacing.xl,
          padding: spacing.md,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.sm,
        }}
        onPress={async () => {
          try {
            await AsyncStorage.clear();
            window.alert('✅ Cache vidé ! Vous pouvez vous reconnecter.');
            setEmail('admin@example.com');
            setPassword('secret123');
          } catch (e) {
            window.alert('❌ Impossible de vider le cache');
          }
        }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
          🔧 Vider le cache (Debug)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

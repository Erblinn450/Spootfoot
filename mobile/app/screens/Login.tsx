import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../state/UserContext';

export default function Login() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = React.useState('');
  const { user, setEmail: setCtxEmail } = useUser();
  const [error, setError] = React.useState<string | null>(null);

  const isValidEmail = React.useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);

  const onContinue = () => {
    // MVP: pas d'auth réelle, on passe direct sur les onglets
    if (isValidEmail) {
      setCtxEmail(email);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      setError("Email invalide");
    }
  };

  // Si déjà connecté (email en mémoire), on saute l'écran Login
  React.useEffect(() => {
    if (user.email) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [user.email, navigation]);

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>SpotFoot</Text>
        <Text style={{ marginTop: spacing.xs, color: colors.textMuted }}>Connectez-vous pour continuer</Text>
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
        returnKeyType="done"
        onSubmitEditing={onContinue}
      />
      {error && <Text style={{ color: colors.danger, marginTop: -spacing.lg, marginBottom: spacing.lg }}>{error}</Text>}
      <PrimaryButton title="Continuer" onPress={onContinue} disabled={!isValidEmail} />
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, radius } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../state/UserContext';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
  const { user, setEmail } = useUser();
  const navigation = useNavigation<any>();

  const logout = () => {
    setEmail(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Profil</Text>

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
        <Text style={{ color: colors.textMuted, marginBottom: spacing.xs }}>Email</Text>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{user.email ?? 'non renseigné'}</Text>
      </View>

      <PrimaryButton title="Déconnexion" onPress={logout} />
    </View>
  );
}

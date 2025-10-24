import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../state/UserContext';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
  const { user, logout: doLogout, isAdmin } = useUser();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    // Réinitialise complètement la session (email, roles, accessToken, caches)
    void (async () => {
      await doLogout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    })();
  };

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
        <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
            ...shadows.md,
          }}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: 'white', marginBottom: spacing.xs }}>
            Mon Profil
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
            {user.email ?? 'Utilisateur'}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, padding: spacing.xl }}>
        {/* Carte informations */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
            ...shadows.md,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg }}>
            📧 Informations
          </Text>

          <View style={{ 
            backgroundColor: colors.backgroundDark, 
            padding: spacing.md, 
            borderRadius: radius.md,
            marginBottom: spacing.md,
          }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}>
              Adresse email
            </Text>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
              {user.email ?? 'non renseigné'}
            </Text>
          </View>

          <View style={{ 
            backgroundColor: colors.backgroundDark, 
            padding: spacing.md, 
            borderRadius: radius.md,
          }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}>
              Rôles
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <View 
                    key={role}
                    style={{ 
                      backgroundColor: role === 'admin' ? colors.primarySoft : colors.backgroundDark,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: role === 'admin' ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ 
                      color: role === 'admin' ? colors.primary : colors.text, 
                      fontSize: 13, 
                      fontWeight: '700' 
                    }}>
                      {role === 'admin' ? '👑 Admin' : '👤 User'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>Aucun rôle</Text>
              )}
            </View>
          </View>
        </View>

        {/* Statistiques */}
        {isAdmin && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.xl,
              padding: spacing.xl,
              marginBottom: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              ...shadows.md,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>
              👑 Accès Admin
            </Text>
            <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
              Vous avez accès à l'interface d'administration pour gérer les terrains et créneaux.
            </Text>
          </View>
        )}

        {/* Bouton déconnexion */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.danger,
            padding: spacing.lg,
            borderRadius: radius.xl,
            alignItems: 'center',
            ...shadows.md,
          }}
          onPress={handleLogout}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
            🚪 Déconnexion
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

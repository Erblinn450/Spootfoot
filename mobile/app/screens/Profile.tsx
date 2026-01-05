import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';
import { Header, Card, Badge, Button, AnimatedEntry, Divider } from '../components/UI';
import { useUser } from '../state/UserContext';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
  const { user, logout: doLogout, isAdmin } = useUser();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    void (async () => {
      await doLogout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    })();
  };

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : '??';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Gradient blobs */}
      <View style={{
        position: 'absolute', top: -100, right: -100, width: 300, height: 300,
        borderRadius: 150, backgroundColor: colors.brandGlow, opacity: 0.15,
      }} />
      <View style={{
        position: 'absolute', bottom: 100, left: -150, width: 400, height: 400,
        borderRadius: 200, backgroundColor: colors.limeGlow, opacity: 0.1,
      }} />

      {/* Avatar Section */}
      <AnimatedEntry delay={0}>
        <View style={{ alignItems: 'center', paddingTop: spacing['16'], paddingBottom: spacing['6'] }}>
          <View style={{
            width: 100, height: 100, borderRadius: radius['2xl'],
            backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
            marginBottom: spacing['4'], ...shadow.glow,
          }}>
            <Text style={{ color: colors.gray950, fontSize: font['3xl'], fontWeight: font.black }}>
              {initials}
            </Text>
          </View>
          
          {isAdmin && (
            <Badge variant="lime" icon="👑">
              ADMINISTRATEUR
            </Badge>
          )}
          
          <Text style={{ 
            color: colors.textPrimary, fontSize: font['2xl'], fontWeight: font.black,
            marginTop: spacing['3'],
          }}>
            Mon Profil
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: font.base, marginTop: spacing['1'] }}>
            {user.email ?? 'Utilisateur'}
          </Text>
        </View>
      </AnimatedEntry>

      <View style={{ paddingHorizontal: spacing['5'] }}>
        {/* Email Card */}
        <AnimatedEntry delay={100}>
          <Card style={{ marginBottom: spacing['4'] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing['4'] }}>
              <View style={{
                width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandMuted,
                alignItems: 'center', justifyContent: 'center', marginRight: spacing['4'],
              }}>
                <Text style={{ fontSize: 20 }}>📧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold }}>
                  Adresse email
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: font.sm }}>
                  Votre identifiant
                </Text>
              </View>
            </View>
            
            <View style={{
              backgroundColor: colors.bgInput, padding: spacing['4'], borderRadius: radius.lg,
              borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ color: colors.textPrimary, fontSize: font.base, fontWeight: font.semibold }}>
                {user.email ?? 'non renseigné'}
              </Text>
            </View>
          </Card>
        </AnimatedEntry>

        {/* Roles Card */}
        <AnimatedEntry delay={200}>
          <Card style={{ marginBottom: spacing['4'] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing['4'] }}>
              <View style={{
                width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.limeMuted,
                alignItems: 'center', justifyContent: 'center', marginRight: spacing['4'],
              }}>
                <Text style={{ fontSize: 20 }}>🛡️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold }}>
                  Permissions
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: font.sm }}>
                  Vos rôles
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing['2'] }}>
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} variant={role === 'admin' ? 'lime' : 'default'} icon={role === 'admin' ? '👑' : '👤'}>
                    {role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </Badge>
                ))
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: font.sm }}>Aucun rôle</Text>
              )}
            </View>
          </Card>
        </AnimatedEntry>

        {/* Admin Info */}
        {isAdmin && (
          <AnimatedEntry delay={300}>
            <Card style={{ marginBottom: spacing['4'], borderColor: colors.lime, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing['4'] }}>
                <Text style={{ fontSize: 28 }}>🎛️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: font.lg, fontWeight: font.bold, marginBottom: spacing['1'] }}>
                    Accès Administration
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: font.sm, lineHeight: 20 }}>
                    Gérez les terrains et créneaux depuis l'onglet Admin.
                  </Text>
                </View>
              </View>
            </Card>
          </AnimatedEntry>
        )}

        {/* Actions */}
        <AnimatedEntry delay={400}>
          <Card onPress={() => window.alert('📧 Contact: support@spotfoot.com')} style={{ marginBottom: spacing['4'] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.bgElevated,
                alignItems: 'center', justifyContent: 'center', marginRight: spacing['4'],
              }}>
                <Text style={{ fontSize: 20 }}>💬</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: font.base, fontWeight: font.semibold }}>
                  Besoin d'aide ?
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: font.sm }}>
                  Contactez notre support
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: font.lg }}>→</Text>
            </View>
          </Card>
        </AnimatedEntry>

        <AnimatedEntry delay={500}>
          <Button onPress={handleLogout} variant="danger" icon="🚪" size="lg">
            Déconnexion
          </Button>
        </AnimatedEntry>

        {/* Version */}
        <AnimatedEntry delay={600}>
          <Text style={{ 
            color: colors.textDisabled, fontSize: font.xs, textAlign: 'center',
            marginTop: spacing['8'], marginBottom: spacing['10'],
          }}>
            SpotFoot v1.0.0 • Made with ⚽
          </Text>
        </AnimatedEntry>
      </View>
    </ScrollView>
  );
}

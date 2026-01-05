import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions } from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';
import { Button, Input, Divider, AnimatedEntry } from '../components/UI';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../state/UserContext';
import { BASE_URL } from '../config';

const { width } = Dimensions.get('window');

export default function Login() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { user, setAuth } = useUser();
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');

  // Animation du logo
  const logoScale = React.useRef(new Animated.Value(0.8)).current;
  const logoRotate = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(logoRotate, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const isValidEmail = React.useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const isValidForm = isValidEmail && password.length >= 6;

  const onAuth = async () => {
    if (!isValidForm) {
      setError('Email valide et mot de passe (min. 6 caractères) requis');
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
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user.accessToken) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [user.accessToken, navigation]);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Background gradient effect */}
      <View style={{
        position: 'absolute',
        top: -100,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: colors.brandGlow,
        opacity: 0.3,
      }} />
      <View style={{
        position: 'absolute',
        bottom: -150,
        right: -150,
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: colors.limeGlow,
        opacity: 0.2,
      }} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing['6'] }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo + Title */}
          <AnimatedEntry delay={0}>
            <View style={{ alignItems: 'center', marginBottom: spacing['10'] }}>
              <Animated.View style={{
                transform: [{ scale: logoScale }, { rotate: spin }],
                marginBottom: spacing['5'],
              }}>
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: radius['2xl'],
                  backgroundColor: colors.bgCard,
                  borderWidth: 2,
                  borderColor: colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadow.glow,
                }}>
                  <Text style={{ fontSize: 48 }}>⚽</Text>
                </View>
              </Animated.View>
              
              <Text style={{ 
                color: colors.textPrimary, 
                fontSize: font['4xl'], 
                fontWeight: font.black,
                letterSpacing: -1,
              }}>
                SpotFoot
              </Text>
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: font.base,
                marginTop: spacing['2'],
              }}>
                Réservez vos terrains
              </Text>
            </View>
          </AnimatedEntry>

          {/* Mode Toggle */}
          <AnimatedEntry delay={100}>
            <View style={{
              flexDirection: 'row',
              backgroundColor: colors.bgCard,
              borderRadius: radius.lg,
              padding: spacing['1'],
              marginBottom: spacing['6'],
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              {(['login', 'signup'] as const).map((m) => (
                <View key={m} style={{ flex: 1 }}>
                  <Button
                    onPress={() => { setMode(m); setError(null); }}
                    variant={mode === m ? 'primary' : 'ghost'}
                    size="md"
                  >
                    {m === 'login' ? 'Connexion' : 'Inscription'}
                  </Button>
                </View>
              ))}
            </View>
          </AnimatedEntry>

          {/* Form */}
          <AnimatedEntry delay={200}>
            <Input
              value={email}
              onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
              label="Email"
              icon="📧"
              placeholder="vous@exemple.com"
              keyboardType="email-address"
              error={error && !isValidEmail ? 'Email invalide' : undefined}
            />
          </AnimatedEntry>

          <AnimatedEntry delay={300}>
            <Input
              value={password}
              onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
              label="Mot de passe"
              icon="🔒"
              placeholder="••••••••"
              secureTextEntry
              error={error && password.length < 6 ? 'Minimum 6 caractères' : undefined}
            />
          </AnimatedEntry>

          {/* Error */}
          {error && (
            <AnimatedEntry delay={0}>
              <View style={{
                backgroundColor: colors.errorMuted,
                padding: spacing['4'],
                borderRadius: radius.lg,
                marginBottom: spacing['4'],
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing['3'],
              }}>
                <Text style={{ fontSize: font.lg }}>⚠️</Text>
                <Text style={{ color: colors.error, fontSize: font.sm, fontWeight: font.medium, flex: 1 }}>
                  {error}
                </Text>
              </View>
            </AnimatedEntry>
          )}

          {/* Submit Button */}
          <AnimatedEntry delay={400}>
            <Button 
              onPress={onAuth} 
              disabled={!isValidForm}
              loading={loading}
              icon={mode === 'login' ? '🚀' : '✨'}
              size="lg"
            >
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </AnimatedEntry>

          <Divider label="OU" />

          {/* Demo Button */}
          <AnimatedEntry delay={500}>
            <Button 
              onPress={() => {
                setEmail('admin@spotfoot.com');
                setPassword('admin123');
              }}
              variant="secondary"
              icon="🎮"
            >
              Utiliser le compte démo
            </Button>
          </AnimatedEntry>

          {/* Footer */}
          <AnimatedEntry delay={600}>
            <Text style={{ 
              color: colors.textMuted, 
              fontSize: font.xs, 
              textAlign: 'center',
              marginTop: spacing['8'],
              lineHeight: 18,
            }}>
              En continuant, vous acceptez nos{'\n'}
              <Text style={{ color: colors.brand }}>Conditions</Text>
              {' '}et{' '}
              <Text style={{ color: colors.brand }}>Politique de confidentialité</Text>
            </Text>
          </AnimatedEntry>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

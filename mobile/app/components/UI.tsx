import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, radius, font, shadow } from '../theme';

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON - Bouton principal avec variantes
// ═══════════════════════════════════════════════════════════════════════════

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'lime';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({ 
  children, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  const variants: Record<ButtonVariant, { bg: string; text: string; border?: string; glow?: object }> = {
    primary: { bg: colors.brand, text: colors.gray950, glow: shadow.glow },
    secondary: { bg: colors.bgCard, text: colors.textPrimary, border: colors.borderLight },
    ghost: { bg: 'transparent', text: colors.textSecondary },
    danger: { bg: colors.error, text: colors.white },
    lime: { bg: colors.lime, text: colors.gray950, glow: shadow.glowLime },
  };

  const sizes: Record<ButtonSize, { py: number; px: number; fontSize: number }> = {
    sm: { py: spacing['2'], px: spacing['4'], fontSize: font.sm },
    md: { py: spacing['3'], px: spacing['5'], fontSize: font.base },
    lg: { py: spacing['4'], px: spacing['6'], fontSize: font.lg },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { flex: 1 }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          {
            backgroundColor: disabled ? colors.gray700 : v.bg,
            paddingVertical: s.py,
            paddingHorizontal: s.px,
            borderRadius: radius.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing['2'],
            borderWidth: v.border ? 1 : 0,
            borderColor: v.border,
          },
          v.glow && !disabled ? v.glow : {},
          style,
        ]}
      >
        {icon && <Text style={{ fontSize: s.fontSize }}>{icon}</Text>}
        <Text style={{ 
          color: disabled ? colors.textDisabled : v.text, 
          fontSize: s.fontSize, 
          fontWeight: font.semibold,
          letterSpacing: 0.3,
        }}>
          {loading ? '⏳' : children}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT - Champ de saisie stylisé
// ═══════════════════════════════════════════════════════════════════════════

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  icon?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  style?: ViewStyle;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  icon,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
}: InputProps) {
  const [focused, setFocused] = React.useState(false);
  
  return (
    <View style={[{ marginBottom: spacing['4'] }, style]}>
      {label && (
        <Text style={{ 
          color: colors.textSecondary, 
          fontSize: font.xs, 
          fontWeight: font.semibold,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: spacing['2'],
        }}>
          {label}
        </Text>
      )}
      <View style={{
        backgroundColor: colors.bgInput,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: error ? colors.error : focused ? colors.borderFocus : colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing['4'],
      }}>
        {icon && (
          <Text style={{ fontSize: font.lg, marginRight: spacing['3'], opacity: 0.6 }}>
            {icon}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontSize: font.base,
            fontWeight: font.medium,
            paddingVertical: spacing['4'],
          }}
        />
      </View>
      {error && (
        <Text style={{ color: colors.error, fontSize: font.xs, marginTop: spacing['1'] }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD - Carte conteneur
// ═══════════════════════════════════════════════════════════════════════════

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, onPress, style, noPadding }: CardProps) {
  const content = (
    <View style={[
      {
        backgroundColor: colors.bgCard,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: noPadding ? 0 : spacing['5'],
        overflow: 'hidden',
      },
      style,
    ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE - Badge/Tag stylisé
// ═══════════════════════════════════════════════════════════════════════════

type BadgeVariant = 'default' | 'brand' | 'lime' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: string;
}

export function Badge({ children, variant = 'default', icon }: BadgeProps) {
  const variants: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: colors.gray800, text: colors.textSecondary },
    brand: { bg: colors.brandMuted, text: colors.brand },
    lime: { bg: colors.limeMuted, text: colors.lime },
    success: { bg: colors.successMuted, text: colors.success },
    warning: { bg: colors.warningMuted, text: colors.warning },
    error: { bg: colors.errorMuted, text: colors.error },
  };

  const v = variants[variant];

  return (
    <View style={{
      backgroundColor: v.bg,
      paddingVertical: spacing['1'],
      paddingHorizontal: spacing['3'],
      borderRadius: radius.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing['1'],
    }}>
      {icon && <Text style={{ fontSize: font.xs }}>{icon}</Text>}
      <Text style={{ 
        color: v.text, 
        fontSize: font.xs, 
        fontWeight: font.semibold,
        letterSpacing: 0.3,
      }}>
        {children}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADER - En-tête de page
// ═══════════════════════════════════════════════════════════════════════════

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  rightElement?: React.ReactNode;
}

export function Header({ title, subtitle, icon, rightElement }: HeaderProps) {
  return (
    <View style={{
      paddingTop: spacing['16'],
      paddingBottom: spacing['6'],
      paddingHorizontal: spacing['5'],
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing['3'], flex: 1 }}>
          {icon && (
            <View style={{
              width: 48,
              height: 48,
              borderRadius: radius.lg,
              backgroundColor: colors.brandMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 24 }}>{icon}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ 
              color: colors.textPrimary, 
              fontSize: font['3xl'], 
              fontWeight: font.black,
              letterSpacing: -0.5,
            }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: font.sm, 
                fontWeight: font.medium,
                marginTop: spacing['1'],
              }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightElement}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE - État vide
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing['12'], paddingHorizontal: spacing['6'] }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: radius['2xl'],
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing['5'],
      }}>
        <Text style={{ fontSize: 36 }}>{icon}</Text>
      </View>
      <Text style={{ 
        color: colors.textPrimary, 
        fontSize: font.xl, 
        fontWeight: font.bold,
        marginBottom: spacing['2'],
        textAlign: 'center',
      }}>
        {title}
      </Text>
      <Text style={{ 
        color: colors.textMuted, 
        fontSize: font.sm, 
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: action ? spacing['6'] : 0,
      }}>
        {description}
      </Text>
      {action && (
        <Button onPress={action.onPress} icon="✨">
          {action.label}
        </Button>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIVIDER - Séparateur
// ═══════════════════════════════════════════════════════════════════════════

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing['5'] }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ 
          color: colors.textMuted, 
          fontSize: font.xs, 
          paddingHorizontal: spacing['4'],
          fontWeight: font.medium,
        }}>
          {label}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
    );
  }
  
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing['4'] }} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT - Statistique
// ═══════════════════════════════════════════════════════════════════════════

interface StatProps {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

export function Stat({ value, label, icon, color = colors.brand }: StatProps) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing['4'],
      alignItems: 'center',
    }}>
      {icon && <Text style={{ fontSize: 20, marginBottom: spacing['2'] }}>{icon}</Text>}
      <Text style={{ 
        color: color, 
        fontSize: font['2xl'], 
        fontWeight: font.black,
      }}>
        {value}
      </Text>
      <Text style={{ 
        color: colors.textMuted, 
        fontSize: font.xs, 
        fontWeight: font.medium,
        marginTop: spacing['1'],
      }}>
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED ENTRY - Wrapper d'animation d'entrée
// ═══════════════════════════════════════════════════════════════════════════

interface AnimatedEntryProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function AnimatedEntry({ children, delay = 0, direction = 'up' }: AnimatedEntryProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translate = React.useRef(new Animated.Value(direction === 'up' || direction === 'left' ? 20 : -20)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translate]);

  const transform = direction === 'up' || direction === 'down' 
    ? [{ translateY: translate }] 
    : [{ translateX: translate }];

  return (
    <Animated.View style={{ opacity, transform }}>
      {children}
    </Animated.View>
  );
}


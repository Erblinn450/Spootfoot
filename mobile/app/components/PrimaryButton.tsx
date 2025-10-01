import React from 'react';
import { TouchableOpacity, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

// Bouton primaire (vert) conforme à la maquette
export default function PrimaryButton({ title, onPress, disabled, style }: { title: string; onPress: () => void; disabled?: boolean; style?: ViewStyle }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? '#A7F3D0' : colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        ...(style || {}),
      }}
    >
      <Text style={{ color: 'white', fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );
}

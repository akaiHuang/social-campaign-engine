import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, gradients, radii, spacing, shadows } from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) => {
  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.ghost,
          pressed && styles.ghostPressed,
          disabled && styles.disabled,
        ]}
        disabled={disabled}
      >
        <Text style={styles.ghostLabel}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, disabled && styles.disabled]}
      >
        <View style={styles.buttonInner}>
          <Text style={styles.label}>{label}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
  buttonInner: {
    alignItems: 'center',
  },
  label: {
    color: colors.background,
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: 0.4,
  },
  ghost: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  ghostPressed: {
    borderColor: colors.accent,
  },
  ghostLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
});

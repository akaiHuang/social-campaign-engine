import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const Chip = ({ label, selected, onPress }: ChipProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipSelected,
      pressed && styles.chipPressed,
    ]}
  >
    <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(30, 227, 207, 0.12)',
  },
  chipPressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  labelSelected: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
  },
});

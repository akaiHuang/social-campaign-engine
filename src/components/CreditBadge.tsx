import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { formatCredits } from '../utils/format';

export const CreditBadge = ({ credits }: { credits: number }) => (
  <View style={styles.badge}>
    <Text style={styles.label}>點數</Text>
    <Text style={styles.value}>{formatCredits(credits)}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 16,
  },
});

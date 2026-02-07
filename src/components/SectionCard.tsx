import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, shadows, spacing } from '../theme';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const SectionCard = ({ title, subtitle, children }: SectionCardProps) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    <View style={styles.content}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 18,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  content: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});

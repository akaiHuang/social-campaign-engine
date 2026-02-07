import { StyleSheet, Text, View } from 'react-native';
import type { VideoStatus } from '../types';
import { colors, fonts, radii, spacing } from '../theme';

const statusColorMap: Record<VideoStatus, string> = {
  queued: colors.warning,
  processing: colors.accent,
  completed: colors.success,
  failed: colors.danger,
};

const statusLabelMap: Record<VideoStatus, string> = {
  queued: '排隊中',
  processing: '處理中',
  completed: '已完成',
  failed: '失敗',
};

export const StatusPill = ({ status }: { status: VideoStatus }) => (
  <View style={[styles.pill, { borderColor: statusColorMap[status] }]}>
    <Text style={[styles.label, { color: statusColorMap[status] }]}>
      {statusLabelMap[status]}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  label: {
    fontFamily: fonts.bodyStrong,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});

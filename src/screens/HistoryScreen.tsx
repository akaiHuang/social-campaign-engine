import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusPill } from '../components/StatusPill';
import { useApp } from '../contexts/AppContext';
import { colors, fonts, radii, spacing } from '../theme';
import { formatDate, formatTime } from '../utils/format';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { VideoItem } from '../types';

const keyExtractor = (item: VideoItem) => item.id;

export const HistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { videos } = useApp();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.title}>您的影片庫</Text>
        <Text style={styles.subtitle}>所有生成的影片，隨時可分享。</Text>
      </View>
      <FlatList
        data={videos}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>{item.theme}</Text>
                <Text style={styles.cardSubtitle}>{item.style}</Text>
              </View>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.cardPrompt} numberOfLines={2}>
              {item.prompt}
            </Text>
            <Text style={styles.cardTime}>
              {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>還沒有影片</Text>
            <Text style={styles.emptySubtitle}>生成您的第一部作品後將顯示在這裡。</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 26,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
    fontSize: 16,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  cardPrompt: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  cardTime: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 18,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
});

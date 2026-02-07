import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Chip } from '../components/Chip';
import { CreditBadge } from '../components/CreditBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { cameraMoves, dailyPrompt, styles as styleOptions, themes } from '../constants/promptTemplates';
import { useApp } from '../contexts/AppContext';
import { estimateCredits } from '../services/videoGeneration';
import { colors, fonts, radii, spacing } from '../theme';
import { formatDate, formatTime } from '../utils/format';
import type { GenerationQuality } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const defaultPrompt = dailyPrompt.prompt;

export const GenerateScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { credits, generateVideo, videos } = useApp();
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [theme, setTheme] = useState(themes[0]);
  const [style, setStyle] = useState(styleOptions[0]);
  const [camera, setCamera] = useState(cameraMoves[0]);
  const [quality, setQuality] = useState<GenerationQuality>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creditCost = useMemo(
    () => estimateCredits({ prompt, theme, style, camera, quality }),
    [prompt, theme, style, camera, quality],
  );

  const recentVideos = videos.slice(0, 2);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('需要提示詞', '請描述您想生成的場景。');
      return;
    }

    setIsSubmitting(true);
    try {
      const item = await generateVideo({
        prompt: prompt.trim(),
        theme,
        style,
        camera,
        quality,
      });
      navigation.navigate('VideoDetail', { videoId: item.id });
    } catch (error) {
      Alert.alert('生成失敗', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>建立新故事</Text>
          <Text style={styles.subtitle}>選擇範本或自己撰寫提示詞。</Text>
        </View>
        <CreditBadge credits={credits} />
      </View>

      <SectionCard title={dailyPrompt.title} subtitle="今日創意靈感">
        <Text style={styles.dailyText}>{dailyPrompt.prompt}</Text>
        <PrimaryButton
          label="使用此提示詞"
          onPress={() => setPrompt(dailyPrompt.prompt)}
          variant="ghost"
        />
      </SectionCard>

      <SectionCard title="提示詞" subtitle="描述場景和氛圍">
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="發光雲層的城市天際線慢動作..."
          placeholderTextColor={colors.textSecondary}
          value={prompt}
          onChangeText={setPrompt}
        />
      </SectionCard>

      <SectionCard title="主題" subtitle="選擇氛圍風格">
        <View style={styles.chipRow}>
          {themes.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={theme === option}
              onPress={() => setTheme(option)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="風格" subtitle="視覺處理方式">
        <View style={styles.chipRow}>
          {styleOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={style === option}
              onPress={() => setStyle(option)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="鏡頭" subtitle="運鏡和取景">
        <View style={styles.chipRow}>
          {cameraMoves.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={camera === option}
              onPress={() => setCamera(option)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="畫質" subtitle="高畫質消耗更多點數">
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>高畫質渲染</Text>
            <Text style={styles.switchSubtitle}>更銳利的細節，較長的渲染時間。</Text>
          </View>
          <Switch
            value={quality === 'high'}
            onValueChange={(value) => setQuality(value ? 'high' : 'standard')}
            thumbColor={colors.textPrimary}
            trackColor={{ false: colors.border, true: colors.accent }}
          />
        </View>
      </SectionCard>

      <View style={styles.actionCard}>
        <View>
          <Text style={styles.costLabel}>預估費用</Text>
          <Text style={styles.costValue}>{creditCost} 點</Text>
        </View>
        <PrimaryButton
          label={isSubmitting ? '生成中...' : '生成影片'}
          onPress={handleGenerate}
          disabled={isSubmitting}
        />
      </View>

      <SectionCard title="最近任務" subtitle="最新生成紀錄">
        {recentVideos.length === 0 ? (
          <Text style={styles.emptyText}>還沒有影片。您的下一部作品將顯示在這裡。</Text>
        ) : (
          recentVideos.map((item) => (
            <View key={item.id} style={styles.taskRow}>
              <View style={styles.taskMeta}>
                <Text style={styles.taskTitle}>{item.theme}</Text>
                <Text style={styles.taskSubtitle}>
                  {formatDate(item.createdAt)} {formatTime(item.createdAt)}
                </Text>
              </View>
              <StatusPill status={item.status} />
            </View>
          ))
        )}
      </SectionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
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
    marginTop: spacing.xs,
  },
  dailyText: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
    fontSize: 15,
  },
  switchSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  costLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  costValue: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 18,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  taskMeta: {
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
    fontSize: 14,
  },
  taskSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});

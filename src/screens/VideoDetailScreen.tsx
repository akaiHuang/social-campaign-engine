import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { useApp } from '../contexts/AppContext';
import { shareToInstagramStory, shareToInstagramFeed } from '../services/instagram';
import { shareForCampaign, isThreadsLoggedIn } from '../services/threads';
import { colors, fonts, gradients, radii, spacing } from '../theme';
import { formatDate, formatTime } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export const VideoDetailScreen = ({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'VideoDetail'>) => {
  const { getVideoById } = useApp();
  const video = getVideoById(route.params.videoId);
  const [isSharing, setIsSharing] = useState(false);
  const [isThreadsLinked, setIsThreadsLinked] = useState(false);

  React.useEffect(() => {
    checkThreadsStatus();
  }, []);

  const checkThreadsStatus = async () => {
    const linked = await isThreadsLoggedIn();
    setIsThreadsLinked(linked);
  };

  if (!video) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>找不到影片</Text>
        <Text style={styles.notFoundSubtitle}>請返回影片庫重試。</Text>
      </View>
    );
  }

  const handleShare = async () => {
    if (video.status !== 'completed') {
      Alert.alert('影片未完成', '請等待渲染完成後再分享。');
      return;
    }

    if (!video.videoUrl) {
      Alert.alert('無影片網址', '影片網址不存在，請嘗試重新生成。');
      return;
    }

    setIsSharing(true);
    
    try {
      // 使用新的分享選項格式，可以附加貼圖和連結
      const result = await shareToInstagramStory({
        videoUrl: video.videoUrl,
        // 測試貼圖功能 - 使用一個範例圖片
        stickerUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png',
        // 測試來源連結（會顯示在分享來源）
        // attributionURL: 'https://example.com',
      });
      
      if (result.success) {
        // 成功開啟 Instagram Stories
        // 注意：無法確認用戶是否真的發布了，因為控制權已交給 Instagram
        Alert.alert(
          '✅ 已開啟 Instagram',
          '影片已傳送到 Instagram Stories 編輯器。\n\n請在 Instagram 中編輯並發布您的限時動態！',
          [{ text: '好的' }]
        );
      } else {
        Alert.alert('分享失敗', result.message ?? '請稍後再試');
      }
    } catch (error: any) {
      Alert.alert('分享錯誤', error?.message ?? '發生未知錯誤');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareToFeed = async () => {
    if (video.status !== 'completed') {
      Alert.alert('影片未完成', '請等待渲染完成後再分享。');
      return;
    }

    if (!video.videoUrl) {
      Alert.alert('無影片網址', '影片網址不存在，請嘗試重新生成。');
      return;
    }

    setIsSharing(true);
    
    try {
      // 分享到 Instagram 一般貼文（Feed）
      const result = await shareToInstagramFeed(
        video.videoUrl,
        // 可以附加說明文字
        // `用 AI 生成的影片 ✨\n\n提示詞：${video.prompt}`
      );
      
      if (!result.success) {
        Alert.alert('分享失敗', result.message ?? '請稍後再試');
      }
    } catch (error: any) {
      Alert.alert('分享錯誤', error?.message ?? '發生未知錯誤');
    } finally {
      setIsSharing(false);
    }
  };

  const handleThreadsShare = async () => {
    if (!isThreadsLinked) {
      Alert.alert(
        '尚未連接 Threads',
        '分享到 Threads 並驗證成功後可領取獎勵！要現在連接嗎？',
        [
          { text: '取消', style: 'cancel' },
          { text: '去連接', onPress: () => navigation.navigate('ThreadsTest') }
        ]
      );
      return;
    }

    if (video.status !== 'completed') {
      Alert.alert('影片未完成', '請等待渲染完成後再分享。');
      return;
    }

    setIsSharing(true);
    try {
      const result = await shareForCampaign({
        campaignText: `我在 IgShare 生成了這段影片：${video.prompt} #IgShare`,
        videoUrl: video.videoUrl,
      });

      if (result.verified) {
        Alert.alert('🎉 分享成功', '已驗證貼文，金幣獎勵已發放！');
      } else {
        Alert.alert('分享失敗', result.message || '無法驗證貼文');
      }
    } catch (error) {
      Alert.alert('錯誤', '分享過程發生問題');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={gradients.primary} style={styles.preview}>
        <Text style={styles.previewLabel}>9:16 預覽</Text>
      </LinearGradient>

      <View style={styles.headerRow}>
        <Text style={styles.title}>生成詳情</Text>
        <StatusPill status={video.status} />
      </View>
      <Text style={styles.metaText}>
        {formatDate(video.createdAt)} · {formatTime(video.createdAt)}
      </Text>

      <SectionCard title="提示詞">
        <Text style={styles.bodyText}>{video.prompt}</Text>
      </SectionCard>

      <SectionCard title="設定">
        <View style={styles.row}>
          <Text style={styles.label}>主題</Text>
          <Text style={styles.value}>{video.theme}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>風格</Text>
          <Text style={styles.value}>{video.style}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>鏡頭</Text>
          <Text style={styles.value}>{video.camera}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>畫質</Text>
          <Text style={styles.value}>{video.quality === 'high' ? '高畫質' : '標準'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>點數</Text>
          <Text style={styles.value}>{video.creditsCost}</Text>
        </View>
      </SectionCard>

      {video.status === 'failed' ? (
        <SectionCard title="生成失敗" subtitle={video.errorMessage || '請稍後重試。'}>
          <PrimaryButton label="重新生成" onPress={() => Alert.alert('重試', '將此連結到重試流程。')} />
        </SectionCard>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton 
          label={isSharing ? "分享中..." : "分享到限時動態"} 
          onPress={handleShare}
          disabled={isSharing}
        />
        <PrimaryButton 
          label={isSharing ? "分享中..." : "分享到貼文"} 
          onPress={handleShareToFeed}
          disabled={isSharing}
          variant="secondary"
        />
        <PrimaryButton 
          label={isSharing ? "處理中..." : "🧵 分享到 Threads (領獎勵)"} 
          onPress={handleThreadsShare}
          disabled={isSharing}
          variant="surface"
        />
        <PrimaryButton
          label="儲存到裝置"
          onPress={() => Alert.alert('儲存', '將此連結到下載流程。')}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  preview: {
    height: 360,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    color: colors.background,
    fontFamily: fonts.heading,
    fontSize: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 22,
  },
  metaText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  bodyText: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
    fontSize: 14,
  },
  actions: {
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  notFoundTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 20,
  },
  notFoundSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});

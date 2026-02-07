/**
 * 🎮 遊戲分享元件範例
 * 
 * 這個元件展示如何在遊戲中實現「分享到 Instagram 限時動態」功能
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { shareImageToStory, shareGameScreenshot, isInstagramInstalled } from '../services/instagram';

interface GameShareCardProps {
  /** 遊戲分數 */
  score: number;
  /** 玩家名稱 */
  playerName: string;
  /** 遊戲名稱 */
  gameName?: string;
  /** App Logo URL（會作為貼圖顯示在限動上） */
  appLogoUrl?: string;
  /** 分享完成後的回調 */
  onShareComplete?: (success: boolean) => void;
}

/**
 * 遊戲結算分享卡片
 * 
 * 功能：
 * 1. 顯示遊戲結算畫面
 * 2. 點擊分享按鈕截圖
 * 3. 直接開啟 Instagram Stories 編輯器
 */
export const GameShareCard: React.FC<GameShareCardProps> = ({
  score,
  playerName,
  gameName = '我的遊戲',
  appLogoUrl,
  onShareComplete,
}) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    // 檢查 Instagram 是否安裝
    const installed = await isInstagramInstalled();
    if (!installed) {
      Alert.alert('未安裝 Instagram', '請先安裝 Instagram App 才能分享');
      return;
    }

    setIsSharing(true);

    try {
      // 截取畫面
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        console.log('📸 截圖完成:', uri);

        // 讀取截圖為 Base64
        // 注意：ViewShot 返回的是 file URI，需要轉換
        // 這裡示範直接用 URI 分享
        const result = await shareImageToStory({
          imageUrl: uri,
          stickerUrl: appLogoUrl,
        });

        if (result.success) {
          // 分享成功（已開啟 Instagram）
          // 注意：這只表示成功開啟 IG，不代表用戶真的發布了
          Alert.alert(
            '🎉 已開啟 Instagram',
            '請在 Instagram 中編輯並發布你的限時動態！\n\n發布後回來領取獎勵！',
            [
              { 
                text: '我已分享', 
                onPress: () => onShareComplete?.(true) 
              },
              { 
                text: '稍後再說', 
                style: 'cancel',
                onPress: () => onShareComplete?.(false) 
              },
            ]
          );
        } else {
          Alert.alert('分享失敗', result.message || '請稍後再試');
          onShareComplete?.(false);
        }
      }
    } catch (error: any) {
      console.error('分享錯誤:', error);
      Alert.alert('分享失敗', error?.message || '發生錯誤');
      onShareComplete?.(false);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 可截圖區域 */}
      <ViewShot 
        ref={viewShotRef} 
        options={{ format: 'png', quality: 1.0 }}
        style={styles.captureArea}
      >
        <View style={styles.card}>
          <Text style={styles.gameName}>{gameName}</Text>
          <Text style={styles.scoreLabel}>我的分數</Text>
          <Text style={styles.score}>{score.toLocaleString()}</Text>
          <Text style={styles.playerName}>玩家：{playerName}</Text>
          <Text style={styles.watermark}>來挑戰我吧！💪</Text>
        </View>
      </ViewShot>

      {/* 分享按鈕 */}
      <TouchableOpacity 
        style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
        onPress={handleShare}
        disabled={isSharing}
      >
        <Text style={styles.shareButtonText}>
          {isSharing ? '準備中...' : '📸 分享到 IG 限時動態'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  captureArea: {
    // 9:16 比例適合限時動態
    width: 300,
    height: 533,
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    backgroundColor: '#667eea',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  gameName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  score: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  playerName: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 30,
  },
  watermark: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  shareButton: {
    marginTop: 20,
    backgroundColor: '#E1306C', // Instagram 粉紅色
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shareButtonDisabled: {
    backgroundColor: '#ccc',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameShareCard;

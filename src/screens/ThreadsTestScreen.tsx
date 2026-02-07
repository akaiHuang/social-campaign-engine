/**
 * 🧵 Threads 活動分享測試畫面
 * 
 * 測試功能：
 * 1. OAuth 登入
 * 2. 一鍵發文/發影片
 * 3. 驗證 callback（確認發文成功才能換獎品）
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  loginWithThreads,
  logoutThreads,
  isThreadsLoggedIn,
  getThreadsUser,
  setThreadsAuth,
  shareForCampaign,
  verifyPostExists,
  ThreadsUser,
  CampaignShareResult,
} from '../services/threads';

const ThreadsTestScreen: React.FC = () => {
  // 狀態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<ThreadsUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // 表單
  const [campaignText, setCampaignText] = useState('我在遊戲中獲得了 12500 分！快來挑戰我！💪');
  const [hashtag, setHashtag] = useState('MyGame');
  const [mention, setMention] = useState('yourbrand');

  // 手動 Token（測試用）
  const [manualAccessToken, setManualAccessToken] = useState('');
  const [manualUserId, setManualUserId] = useState('');
  const [manualUsername, setManualUsername] = useState('');

  // 測試用素材 (改用極速 CDN 與穩定靜態圖)
  // 影片：使用 1MB 以下的小影片，加速 Meta 處理速度
  const testVideoUrl = 'https://cdn.coverr.co/videos/coverr-simulating-a-text-message-on-mobile-device-2940/1080p.mp4'; 
  // 圖片：使用維基百科靜態圖 (Picsum 會被 Meta 擋)
  const testImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1200px-Instagram_logo_2016.svg.png';

  // 分享結果
  const [shareResult, setShareResult] = useState<CampaignShareResult | null>(null);
  const [canClaimReward, setCanClaimReward] = useState(false);

  // 初始化
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const loggedIn = await isThreadsLoggedIn();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const userData = await getThreadsUser();
      setUser(userData);
    }
  };

  const handleManualTokenSave = async () => {
    if (!manualAccessToken || !manualUserId) {
      Alert.alert('需要資料', '請填入 Access Token 與 User ID');
      return;
    }

    setLoading(true);
    setLoadingText('儲存 Token...');

    await setThreadsAuth(manualAccessToken, manualUserId, manualUsername);
    await checkLoginStatus();

    setLoading(false);
    Alert.alert('已儲存', '已設定 Threads 測試 Token');
  };

  // 登入
  const handleLogin = async () => {
    setLoading(true);
    setLoadingText('連接 Threads...');

    const result = await loginWithThreads();

    setLoading(false);
    if (result.success) {
      setIsLoggedIn(true);
      setUser(result.user || null);
      Alert.alert('登入成功', `歡迎, @${result.user?.username}!`);
    } else {
      Alert.alert('登入失敗', result.message);
    }
  };

  // 登出
  const handleLogout = async () => {
    await logoutThreads();
    setIsLoggedIn(false);
    setUser(null);
    setShareResult(null);
    setCanClaimReward(false);
  };

  // 分享文字
  const handleShareText = async () => {
    setLoading(true);
    setLoadingText('發布中...');
    setShareResult(null);

    const result = await shareForCampaign({
      campaignText,
      hashtag,
      mention,
    });

    setLoading(false);
    setShareResult(result);

    if (result.verified) {
      setCanClaimReward(true);
      Alert.alert(
        '✅ 分享成功！',
        `貼文已發布！\n\n貼文 ID: ${result.postId}\n\n你可以領取獎勵了！`,
        [{ text: '太棒了！' }]
      );
    } else {
      Alert.alert('分享失敗', result.message);
    }
  };

  // 分享圖片
  const handleShareImage = async () => {
    setLoading(true);
    setLoadingText('上傳圖片中...');
    setShareResult(null);

    const result = await shareForCampaign({
      campaignText,
      hashtag,
      mention,
      imageUrl: testImageUrl,
    });

    setLoading(false);
    setShareResult(result);

    if (result.verified) {
      setCanClaimReward(true);
      Alert.alert(
        '✅ 圖片分享成功！',
        `貼文已發布！\n\n你可以領取獎勵了！`,
        [{ text: '太棒了！' }]
      );
    } else {
      Alert.alert('分享失敗', result.message);
    }
  };

  // 分享影片
  const handleShareVideo = async () => {
    setLoading(true);
    setLoadingText('上傳影片中（可能需要 30 秒）...');
    setShareResult(null);

    const result = await shareForCampaign({
      campaignText,
      hashtag,
      mention,
      videoUrl: testVideoUrl,
    });

    setLoading(false);
    setShareResult(result);

    if (result.verified) {
      setCanClaimReward(true);
      Alert.alert(
        '✅ 影片分享成功！',
        `貼文已發布！\n\n你可以領取獎勵了！`,
        [{ text: '太棒了！' }]
      );
    } else {
      Alert.alert('分享失敗', result.message);
    }
  };

  // 領取獎勵
  const handleClaimReward = async () => {
    if (!shareResult?.postId) {
      Alert.alert('無法領取', '請先完成分享');
      return;
    }

    setLoading(true);
    setLoadingText('驗證貼文...');

    // 再次驗證貼文是否存在（防止用戶分享後刪除）
    const stillExists = await verifyPostExists(shareResult.postId);

    setLoading(false);

    if (stillExists) {
      Alert.alert(
        '🎉 恭喜獲得獎勵！',
        '已驗證你的 Threads 貼文！\n\n+100 金幣已發送到你的帳戶！',
        [{ text: '收下獎勵' }]
      );
      setCanClaimReward(false);
    } else {
      Alert.alert(
        '❌ 驗證失敗',
        '找不到你的貼文，請確認貼文沒有被刪除。',
        [{ text: '好的' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧵 Threads 活動分享測試</Text>
      <Text style={styles.subtitle}>測試一鍵發文 + 驗證領獎</Text>

      {/* 登入狀態 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>登入狀態</Text>
        {isLoggedIn && user ? (
          <View style={styles.userCard}>
            <Text style={styles.username}>@{user.username}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>登出</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>🧵 連接 Threads 帳號</Text>
          </TouchableOpacity>
        )}

        {!isLoggedIn && (
          <View style={styles.manualBox}>
            <Text style={styles.manualTitle}>手動 Token 測試（繞過 OAuth）</Text>
            <TextInput
              style={styles.input}
              value={manualAccessToken}
              onChangeText={setManualAccessToken}
              placeholder="Threads Access Token"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={manualUserId}
              onChangeText={setManualUserId}
              placeholder="Threads User ID"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={manualUsername}
              onChangeText={setManualUsername}
              placeholder="Username（可選）"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleManualTokenSave}
              disabled={loading}
            >
              <Text style={styles.manualButtonText}>儲存測試 Token</Text>
            </TouchableOpacity>
            <Text style={styles.manualHint}>可用 Threads 後台「用戶權杖產生器」取得 Token</Text>
          </View>
        )}
      </View>

      {/* 活動內容設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>活動內容</Text>
        
        <Text style={styles.label}>分享文字</Text>
        <TextInput
          style={styles.textInput}
          value={campaignText}
          onChangeText={setCampaignText}
          placeholder="輸入活動文字..."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Hashtag（不含 #）</Text>
        <TextInput
          style={styles.input}
          value={hashtag}
          onChangeText={setHashtag}
          placeholder="例如: MyGame"
        />

        <Text style={styles.label}>@提及帳號（不含 @）</Text>
        <TextInput
          style={styles.input}
          value={mention}
          onChangeText={setMention}
          placeholder="例如: yourbrand"
        />

        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>預覽：</Text>
          <Text style={styles.previewText}>
            {campaignText}
            {hashtag ? `\n\n#${hashtag}` : ''}
            {mention ? ` @${mention}` : ''}
          </Text>
        </View>
      </View>

      {/* 分享按鈕 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>一鍵分享</Text>

        <TouchableOpacity
          style={[styles.shareButton, !isLoggedIn && styles.buttonDisabled]}
          onPress={handleShareText}
          disabled={!isLoggedIn || loading}
        >
          <Text style={styles.shareButtonText}>📝 發文字貼文</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, styles.imageButton, !isLoggedIn && styles.buttonDisabled]}
          onPress={handleShareImage}
          disabled={!isLoggedIn || loading}
        >
          <Text style={styles.shareButtonText}>🖼️ 發圖片貼文</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, styles.videoButton, !isLoggedIn && styles.buttonDisabled]}
          onPress={handleShareVideo}
          disabled={!isLoggedIn || loading}
        >
          <Text style={styles.shareButtonText}>🎬 發影片貼文</Text>
        </TouchableOpacity>

        {!isLoggedIn && (
          <Text style={styles.hint}>請先連接 Threads 帳號</Text>
        )}
      </View>

      {/* 分享結果 */}
      {shareResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分享結果</Text>
          <View style={[
            styles.resultBox,
            shareResult.verified ? styles.resultSuccess : styles.resultFail
          ]}>
            <Text style={styles.resultTitle}>
              {shareResult.verified ? '✅ 驗證成功' : '❌ 分享失敗'}
            </Text>
            {shareResult.postId && (
              <Text style={styles.resultText}>貼文 ID: {shareResult.postId}</Text>
            )}
            {shareResult.permalink && (
              <Text style={styles.resultText}>連結: {shareResult.permalink}</Text>
            )}
            {shareResult.message && (
              <Text style={styles.resultText}>{shareResult.message}</Text>
            )}
          </View>
        </View>
      )}

      {/* 領取獎勵 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 獎勵</Text>
        <TouchableOpacity
          style={[
            styles.rewardButton,
            !canClaimReward && styles.buttonDisabled
          ]}
          onPress={handleClaimReward}
          disabled={!canClaimReward || loading}
        >
          <Text style={styles.rewardButtonText}>
            {canClaimReward ? '🎉 領取獎勵 (+100 金幣)' : '完成分享後可領取獎勵'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.rewardHint}>
          只有完成分享並通過驗證才能領取獎勵
        </Text>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#666',
  },
  manualBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    gap: 8,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  manualButton: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  manualHint: {
    fontSize: 12,
    color: '#888',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: '#4A90D9',
  },
  videoButton: {
    backgroundColor: '#E1306C',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  hint: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  },
  resultBox: {
    borderRadius: 8,
    padding: 12,
  },
  resultSuccess: {
    backgroundColor: '#e8f5e9',
  },
  resultFail: {
    backgroundColor: '#ffebee',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  rewardButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rewardButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rewardHint: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});

export default ThreadsTestScreen;

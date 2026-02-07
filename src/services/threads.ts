/**
 * 🧵 Threads API 服務
 * 
 * 功能：
 * - OAuth 登入授權
 * - 一鍵發文（文字、圖片、影片）
 * - 驗證發文成功（用於獎勵機制）
 * 
 * 文檔：https://developers.facebook.com/docs/threads
 */

import { Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  isBackgroundUploadAvailable,
  downloadToLocal,
  cleanupTempFiles,
} from './backgroundUpload';

// ────────────────────────────────────────
// 設定
// ────────────────────────────────────────

// 從環境變數讀取（Threads 專用 App）
const THREADS_APP_ID = process.env.EXPO_PUBLIC_THREADS_APP_ID || '1243832527885810';
const THREADS_APP_SECRET = process.env.EXPO_PUBLIC_THREADS_APP_SECRET || '';

// Threads API 端點
const THREADS_API_BASE = 'https://graph.threads.net/v1.0';
const THREADS_AUTH_URL = 'https://threads.net/oauth/authorize';
const THREADS_TOKEN_URL = 'https://graph.threads.net/oauth/access_token';

// 權限範圍
const SCOPES = [
  'threads_basic',           // 基本個人資料
  'threads_content_publish', // 發文權限
  'threads_manage_insights', // 洞察報告（可選）
].join(',');

// 本地儲存 Key
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@threads_access_token',
  USER_ID: '@threads_user_id',
  USERNAME: '@threads_username',
};

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

export interface ThreadsUser {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
}

export interface ThreadsPostResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  message?: string;
}

export interface ThreadsAuthResult {
  success: boolean;
  user?: ThreadsUser;
  message?: string;
}

// ────────────────────────────────────────
// OAuth 登入
// ────────────────────────────────────────

/**
 * 取得 OAuth Redirect URI
 * 
 * 使用 Firebase Hosting 提供穩定的 https 網址
 */
const getRedirectUri = (): string => {
  return 'https://ai-insta-f45d7.web.app/threads-callback.html';
};

/**
 * 開始 Threads OAuth 登入流程
 */
export const loginWithThreads = async (): Promise<ThreadsAuthResult> => {
  try {
    // 動態載入，避免沒建置時崩潰
    let WebBrowser;
    try {
      WebBrowser = require('expo-web-browser');
    } catch (e) {
      throw new Error('請重新建置 App 以啟用原生的瀏覽器登入功能（npx expo run:ios）');
    }

    const redirectUri = getRedirectUri();
    console.log('🧵 Redirect URI:', redirectUri);

    // 建立授權 URL
    const authUrl = `${THREADS_AUTH_URL}?` + new URLSearchParams({
      client_id: THREADS_APP_ID,
      redirect_uri: redirectUri,
      scope: SCOPES,
      response_type: 'code',
      state: Math.random().toString(36).substring(7), // 防 CSRF
    }).toString();

    console.log('🧵 開始 OAuth 登入...');

    // 開啟瀏覽器進行授權
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success') {
      console.log('🧵 用戶取消登入');
      return { success: false, message: '登入已取消' };
    }

    // 從回調 URL 取得 code
    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return { success: false, message: '無法取得授權碼' };
    }

    console.log('🧵 取得授權碼，交換 Access Token...');

    // 交換 Access Token
    const tokenResponse = await fetch(THREADS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: THREADS_APP_ID,
        client_secret: THREADS_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('🧵 Token 錯誤:', tokenData.error);
      return { success: false, message: tokenData.error_message || '授權失敗' };
    }

    const accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    console.log('🧵 取得 Access Token，取得用戶資料...');

    // 取得用戶資料
    const userResponse = await fetch(
      `${THREADS_API_BASE}/${userId}?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`
    );
    const userData = await userResponse.json();

    // 儲存到本地
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [STORAGE_KEYS.USER_ID, userId],
      [STORAGE_KEYS.USERNAME, userData.username || ''],
    ]);

    console.log('🧵 登入成功！用戶:', userData.username);

    return {
      success: true,
      user: {
        id: userId,
        username: userData.username,
        name: userData.name,
        threads_profile_picture_url: userData.threads_profile_picture_url,
      },
    };

  } catch (error: any) {
    console.error('🧵 登入錯誤:', error);
    return { success: false, message: error?.message || '登入失敗' };
  }
};

/**
 * 檢查是否已登入
 */
export const isThreadsLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  } catch {
    return false;
  }
};

/**
 * 取得已登入的用戶資料
 */
export const getThreadsUser = async (): Promise<ThreadsUser | null> => {
  try {
    const [token, userId, username] = await AsyncStorage.multiGet([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USERNAME,
    ]);

    if (!token[1] || !userId[1]) return null;

    return {
      id: userId[1],
      username: username[1] || '',
    };
  } catch {
    return null;
  }
};

/**
 * 登出
 */
export const logoutThreads = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.USER_ID,
    STORAGE_KEYS.USERNAME,
  ]);
  console.log('🧵 已登出 Threads');
};

/**
 * 手動設定 Threads Token（測試用）
 */
export const setThreadsAuth = async (
  accessToken: string,
  userId: string,
  username?: string,
): Promise<void> => {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACCESS_TOKEN, accessToken.trim()],
    [STORAGE_KEYS.USER_ID, userId.trim()],
    [STORAGE_KEYS.USERNAME, username?.trim() || ''],
  ]);
};

// ────────────────────────────────────────
// 發文功能
// ────────────────────────────────────────

/**
 * 🔑 取得 Access Token
 */
const getAccessToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * 📝 發文字貼文
 * 
 * @param text - 貼文內容（最多 500 字，可包含 #hashtag 和 @mention）
 */
export const postTextToThreads = async (text: string): Promise<ThreadsPostResult> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, message: '請先登入 Threads' };
    }

    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      return { success: false, message: '找不到用戶 ID' };
    }

    console.log('🧵 建立貼文容器...');

    // Step 1: 建立媒體容器
    const createResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: text,
          access_token: accessToken,
        }),
      }
    );

    const createData = await createResponse.json();
    
    if (createData.error) {
      console.error('🧵 建立容器失敗:', createData.error);
      return { success: false, message: createData.error.message };
    }

    const containerId = createData.id;
    console.log('🧵 容器 ID:', containerId);

    // Step 2: 發布貼文
    console.log('🧵 發布貼文...');
    const publishResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error('🧵 發布失敗:', publishData.error);
      return { success: false, message: publishData.error.message };
    }

    const postId = publishData.id;
    console.log('🧵 發布成功！貼文 ID:', postId);

    // Step 3: 取得貼文連結
    const postResponse = await fetch(
      `${THREADS_API_BASE}/${postId}?fields=id,permalink&access_token=${accessToken}`
    );
    const postData = await postResponse.json();

    return {
      success: true,
      postId: postId,
      permalink: postData.permalink,
      message: '發文成功！',
    };

  } catch (error: any) {
    console.error('🧵 發文錯誤:', error);
    return { success: false, message: error?.message || '發文失敗' };
  }
};

/**
 * 🖼️ 發圖片貼文
 * 
 * @param imageUrl - 圖片 URL（必須是公開可存取的 URL）
 * @param text - 可選的說明文字
 */
export const postImageToThreads = async (
  imageUrl: string,
  text?: string
): Promise<ThreadsPostResult> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, message: '請先登入 Threads' };
    }

    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      return { success: false, message: '找不到用戶 ID' };
    }

    console.log('🧵 建立圖片貼文容器...');

    // Step 1: 建立媒體容器
    const createBody: any = {
      media_type: 'IMAGE',
      image_url: imageUrl,
      access_token: accessToken,
    };
    if (text) createBody.text = text;

    const createResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      }
    );

    const createData = await createResponse.json();
    
    if (createData.error) {
      console.error('🧵 建立容器失敗:', createData.error);
      return { success: false, message: createData.error.message };
    }

    const containerId = createData.id;
    console.log('🧵 容器 ID:', containerId);

    // Step 2: 發布貼文
    console.log('🧵 發布圖片貼文...');
    const publishResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error('🧵 發布失敗:', publishData.error);
      return { success: false, message: publishData.error.message };
    }

    const postId = publishData.id;
    console.log('🧵 發布成功！貼文 ID:', postId);

    // 取得連結
    const postResponse = await fetch(
      `${THREADS_API_BASE}/${postId}?fields=id,permalink&access_token=${accessToken}`
    );
    const postData = await postResponse.json();

    return {
      success: true,
      postId: postId,
      permalink: postData.permalink,
      message: '圖片發文成功！',
    };

  } catch (error: any) {
    console.error('🧵 發文錯誤:', error);
    return { success: false, message: error?.message || '發文失敗' };
  }
};

/**
 * 🎬 發影片貼文
 * 
 * @param videoUrl - 影片 URL（必須是公開可存取的 URL，最長 5 分鐘）
 * @param text - 可選的說明文字
 */
export const postVideoToThreads = async (
  videoUrl: string,
  text?: string
): Promise<ThreadsPostResult> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, message: '請先登入 Threads' };
    }

    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      return { success: false, message: '找不到用戶 ID' };
    }

    console.log('🧵 建立影片貼文容器...');

    // Step 1: 建立媒體容器
    const createBody: any = {
      media_type: 'VIDEO',
      video_url: videoUrl,
      access_token: accessToken,
    };
    if (text) createBody.text = text;

    const createResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      }
    );

    const createData = await createResponse.json();
    
    if (createData.error) {
      console.error('🧵 建立容器失敗:', createData.error);
      return { success: false, message: createData.error.message };
    }

    const containerId = createData.id;
    console.log('🧵 容器 ID:', containerId);

    // Step 2: 等待影片處理完成（影片需要時間處理）
    console.log('🧵 等待影片處理...');
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30; // 最多等 30 次（約 30 秒）

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等 1 秒
      
      try {
        const statusResponse = await fetch(
          `${THREADS_API_BASE}/${containerId}?fields=status,error_message&access_token=${accessToken}`
        );
        const statusData = await statusResponse.json();
        
        if (statusData.error) {
           console.log(`🧵 狀態檢查 API 錯誤: ${statusData.error.message}, 重試中...`);
           // 保持 IN_PROGRESS 狀態，繼續下一次輪詢
        } else {
           status = statusData.status;
           if (status === 'ERROR') {
             console.error('🧵 影片處理錯誤:', statusData.error_message);
           }
        }
      } catch (e: any) {
        console.log(`🧵 狀態檢查網路錯誤 (可能是背景執行): ${e.message}, 重試中...`);
        // 忽略網路錯誤，保持 IN_PROGRESS，繼續嘗試
      }
      
      attempts++;
      console.log(`🧵 處理狀態: ${status} (${attempts}/${maxAttempts})`);
    }

    if (status !== 'FINISHED') {
      return { 
        success: false, 
        message: status === 'ERROR' ? '影片處理失敗' : '影片處理超時，請稍後再試' 
      };
    }

    // Step 3: 發布貼文
    console.log('🧵 發布影片貼文...');
    const publishResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error('🧵 發布失敗:', publishData.error);
      return { success: false, message: publishData.error.message };
    }

    const postId = publishData.id;
    console.log('🧵 發布成功！貼文 ID:', postId);

    // 取得連結
    const postResponse = await fetch(
      `${THREADS_API_BASE}/${postId}?fields=id,permalink&access_token=${accessToken}`
    );
    const postData = await postResponse.json();

    return {
      success: true,
      postId: postId,
      permalink: postData.permalink,
      message: '影片發文成功！',
    };

  } catch (error: any) {
    console.error('🧵 發文錯誤:', error);
    return { success: false, message: error?.message || '發文失敗' };
  }
};

/**
 * 🎬 發影片貼文 (背景上傳版本)
 * 
 * 特點：
 * - 支援 App 切換到背景後繼續上傳
 * - 更穩定的網路重試機制
 * - 上傳進度回調
 * 
 * @param videoUrl - 影片 URL（必須是公開可存取的 URL，最長 5 分鐘）
 * @param text - 可選的說明文字
 * @param onProgress - 進度回調 (0-100)
 */
export const postVideoToThreadsWithBackground = async (
  videoUrl: string,
  text?: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<ThreadsPostResult> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, message: '請先登入 Threads' };
    }

    const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      return { success: false, message: '找不到用戶 ID' };
    }

    // 檢查背景上傳是否可用
    const canBackgroundUpload = isBackgroundUploadAvailable();
    console.log(`🧵 背景上傳${canBackgroundUpload ? '可用' : '不可用，使用標準模式'}`);

    onProgress?.('準備中', 5);

    // Step 1: 建立媒體容器（使用遠端 URL）
    console.log('🧵 建立影片貼文容器...');
    const createBody: any = {
      media_type: 'VIDEO',
      video_url: videoUrl,
      access_token: accessToken,
    };
    if (text) createBody.text = text;

    const createResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      }
    );

    const createData = await createResponse.json();
    
    if (createData.error) {
      console.error('🧵 建立容器失敗:', createData.error);
      return { success: false, message: createData.error.message };
    }

    const containerId = createData.id;
    console.log('🧵 容器 ID:', containerId);
    onProgress?.('影片處理中', 20);

    // Step 2: 等待影片處理完成（使用增強版重試邏輯）
    console.log('🧵 等待影片處理...');
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 60; // 增加到 60 次（約 60 秒）
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const statusResponse = await fetch(
          `${THREADS_API_BASE}/${containerId}?fields=status,error_message&access_token=${accessToken}`
        );
        const statusData = await statusResponse.json();
        
        if (statusData.error) {
          console.log(`🧵 狀態檢查 API 錯誤: ${statusData.error.message}`);
          consecutiveErrors++;
        } else {
          status = statusData.status;
          consecutiveErrors = 0; // 重置連續錯誤計數
          
          if (status === 'ERROR') {
            console.error('🧵 影片處理錯誤:', statusData.error_message);
            return { success: false, message: statusData.error_message || '影片處理失敗' };
          }
        }
      } catch (e: any) {
        console.log(`🧵 狀態檢查網路錯誤: ${e.message}, 重試中... (${consecutiveErrors + 1}/${maxConsecutiveErrors})`);
        consecutiveErrors++;
        
        // 如果連續太多次網路錯誤，可能是真的斷線了
        if (consecutiveErrors >= maxConsecutiveErrors) {
          // 等待更長時間再重試
          console.log('🧵 網路不穩定，等待 5 秒後重試...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          consecutiveErrors = 0; // 給予更多機會
        }
      }
      
      attempts++;
      const progress = 20 + Math.min((attempts / maxAttempts) * 60, 60);
      onProgress?.('影片處理中', Math.round(progress));
      console.log(`🧵 處理狀態: ${status} (${attempts}/${maxAttempts})`);
    }

    if (status !== 'FINISHED') {
      return { 
        success: false, 
        message: status === 'ERROR' ? '影片處理失敗' : '影片處理超時，請稍後再試' 
      };
    }

    onProgress?.('發布中', 85);

    // Step 3: 發布貼文
    console.log('🧵 發布影片貼文...');
    const publishResponse = await fetch(
      `${THREADS_API_BASE}/${userId}/threads_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error('🧵 發布失敗:', publishData.error);
      return { success: false, message: publishData.error.message };
    }

    const postId = publishData.id;
    console.log('🧵 發布成功！貼文 ID:', postId);
    onProgress?.('取得連結', 95);

    // 取得連結
    const postResponse = await fetch(
      `${THREADS_API_BASE}/${postId}?fields=id,permalink&access_token=${accessToken}`
    );
    const postData = await postResponse.json();

    onProgress?.('完成', 100);

    // 清理暫存檔案
    cleanupTempFiles().catch(() => {});

    return {
      success: true,
      postId: postId,
      permalink: postData.permalink,
      message: '影片發文成功！',
    };

  } catch (error: any) {
    console.error('🧵 發文錯誤:', error);
    return { success: false, message: error?.message || '發文失敗' };
  }
};

// ────────────────────────────────────────
// 🎁 活動分享獎勵功能
// ────────────────────────────────────────

export interface CampaignShareOptions {
  /** 活動文字 */
  campaignText: string;
  /** Hashtag（不含 #） */
  hashtag?: string;
  /** @mention 帳號（不含 @） */
  mention?: string;
  /** 圖片 URL（可選） */
  imageUrl?: string;
  /** 影片 URL（可選） */
  videoUrl?: string;
}

export interface CampaignShareResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  verified: boolean; // ✅ 確認已發文
  message?: string;
}

/**
 * 🎁 活動分享 - 一鍵發文並驗證
 * 
 * 用於：分享遊戲成績、活動內容，並確認發文成功才能換獎品
 * 
 * @example
 * const result = await shareForCampaign({
 *   campaignText: '我在遊戲中獲得了 12500 分！快來挑戰我！',
 *   hashtag: '你的遊戲名',
 *   mention: '你的帳號',
 *   imageUrl: 'https://example.com/screenshot.png',
 * });
 * 
 * if (result.verified) {
 *   // 發送獎勵
 *   giveReward();
 * }
 */
export const shareForCampaign = async (
  options: CampaignShareOptions
): Promise<CampaignShareResult> => {
  const { campaignText, hashtag, mention, imageUrl, videoUrl } = options;

  // 檢查登入狀態
  const isLoggedIn = await isThreadsLoggedIn();
  if (!isLoggedIn) {
    // 如果沒登入，先進行登入
    const loginResult = await loginWithThreads();
    if (!loginResult.success) {
      return {
        success: false,
        verified: false,
        message: loginResult.message || '登入失敗，無法分享',
      };
    }
  }

  // 組合完整文字
  let fullText = campaignText;
  if (hashtag) fullText += `\n\n#${hashtag}`;
  if (mention) fullText += ` @${mention}`;

  console.log('🎁 活動分享內容:', fullText);

  // 根據媒體類型發文
  let result: ThreadsPostResult;

  if (videoUrl) {
    // 使用增強版背景上傳
    result = await postVideoToThreadsWithBackground(videoUrl, fullText);
  } else if (imageUrl) {
    result = await postImageToThreads(imageUrl, fullText);
  } else {
    result = await postTextToThreads(fullText);
  }

  // 返回結果（包含驗證狀態）
  return {
    success: result.success,
    postId: result.postId,
    permalink: result.permalink,
    verified: result.success && !!result.postId, // ✅ 有 postId 就是驗證成功
    message: result.message,
  };
};

/**
 * 🔍 驗證貼文是否存在
 * 
 * 用於：用戶稍後回來領獎時，再次確認貼文還在
 */
export const verifyPostExists = async (postId: string): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return false;

    const response = await fetch(
      `${THREADS_API_BASE}/${postId}?fields=id&access_token=${accessToken}`
    );
    const data = await response.json();

    return !data.error && !!data.id;
  } catch {
    return false;
  }
};

// ────────────────────────────────────────
// Web Intent（網站用，簡單分享）
// ────────────────────────────────────────

/**
 * 🌐 使用 Web Intent 分享到 Threads（網站用）
 * 
 * ⚠️ 限制：只能分享文字，無法驗證
 */
export const shareViaWebIntent = async (text: string): Promise<void> => {
  const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
  
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    await Linking.openURL(url);
  }
};

// ────────────────────────────────────────
// 導出
// ────────────────────────────────────────

export default {
  // 登入
  loginWithThreads,
  isThreadsLoggedIn,
  getThreadsUser,
  logoutThreads,
  setThreadsAuth,
  // 發文
  postTextToThreads,
  postImageToThreads,
  postVideoToThreads,
  postVideoToThreadsWithBackground,
  // 活動分享
  shareForCampaign,
  verifyPostExists,
  // Web Intent
  shareViaWebIntent,
};

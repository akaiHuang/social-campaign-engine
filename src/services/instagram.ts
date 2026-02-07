import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Linking, Alert } from 'react-native';
import Share from 'react-native-share';

// Facebook App ID（從 .env 取得）
const FB_APP_ID = process.env.EXPO_PUBLIC_META_APP_ID || '1350870370104395';

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────
export interface IGShareResult {
  success: boolean;
  message?: string;
}

export interface IGShareOptions {
  /** 影片 URL（必填） */
  videoUrl: string;
  /** 貼圖圖片 URL（可選）- 會疊加在影片上 */
  stickerUrl?: string;
  /** 連結 URL（可選）- 用戶可點擊的連結貼紙 */
  linkUrl?: string;
  /** 背景頂部顏色（可選）- 十六進位色碼如 #FF0000 */
  backgroundTopColor?: string;
  /** 背景底部顏色（可選）- 十六進位色碼如 #0000FF */
  backgroundBottomColor?: string;
}

export interface IGImageShareOptions {
  /** 圖片 URL 或 Base64（必填） */
  imageUrl?: string;
  /** Base64 圖片數據（可選，與 imageUrl 二選一） */
  imageBase64?: string;
  /** 貼圖圖片 URL（可選）- 會疊加在背景上 */
  stickerUrl?: string;
  /** 背景頂部顏色（可選） */
  backgroundTopColor?: string;
  /** 背景底部顏色（可選） */
  backgroundBottomColor?: string;
}

// ────────────────────────────────────────
// 檢查分享功能是否可用
// ────────────────────────────────────────
export const instagramReady = true; // 原生分享不需要 API 設定

/**
 * 檢查 Instagram App 是否已安裝
 */
export const isInstagramInstalled = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    const instagramUrl = Platform.OS === 'ios' 
      ? 'instagram://' 
      : 'instagram://user?username=instagram';
    return await Linking.canOpenURL(instagramUrl);
  } catch {
    return false;
  }
};

/**
 * 下載檔案到本地（影片或圖片）
 */
const downloadFile = async (url: string, extension: string = 'mp4'): Promise<string | null> => {
  try {
    console.log('📥 開始下載:', url);
    
    const filename = `file_${Date.now()}.${extension}`;
    const localUri = `${FileSystem.cacheDirectory}${filename}`;
    
    const downloadResult = await FileSystem.downloadAsync(url, localUri);
    
    if (downloadResult.status === 200) {
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      if (fileInfo.exists) {
        console.log('✅ 下載成功:', downloadResult.uri);
        return downloadResult.uri;
      }
    }
    
    console.error('❌ 下載失敗');
    return null;
  } catch (error: any) {
    console.error('❌ 下載錯誤:', error?.message);
    return null;
  }
};

/**
 * 下載影片到本地檔案系統
 */
const downloadVideo = async (videoUrl: string): Promise<string | null> => {
  try {
    console.log('📥 開始下載影片:', videoUrl);
    console.log('📁 快取目錄:', FileSystem.cacheDirectory);
    
    const filename = `story_${Date.now()}.mp4`;
    const localUri = `${FileSystem.cacheDirectory}${filename}`;
    
    console.log('📍 目標路徑:', localUri);
    
    const downloadResult = await FileSystem.downloadAsync(videoUrl, localUri);
    
    console.log('📦 下載結果:', JSON.stringify(downloadResult, null, 2));
    
    if (downloadResult.status === 200) {
      // 確認檔案存在
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      console.log('📄 檔案資訊:', JSON.stringify(fileInfo, null, 2));
      
      if (fileInfo.exists) {
        return downloadResult.uri;
      }
    }
    
    console.error('❌ 下載失敗，狀態碼:', downloadResult.status);
    return null;
  } catch (error: any) {
    console.error('❌ 下載錯誤:', error?.message, error);
    return null;
  }
};

/**
 * 讀取檔案並轉換為 base64
 */
const fileToBase64 = async (fileUri: string): Promise<string | null> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error: any) {
    console.error('❌ Base64 轉換錯誤:', error?.message);
    return null;
  }
};

/**
 * 備用方案：儲存到相簿後開啟 Instagram
 */
const fallbackShareToStory = async (localVideoUri: string): Promise<IGShareResult> => {
  try {
    console.log('💾 備用方案：儲存到相簿...');
    
    // 儲存到相簿
    const asset = await MediaLibrary.createAssetAsync(localVideoUri);
    console.log('✅ 已儲存到相簿:', asset.uri);

    // 開啟 Instagram
    const instagramUrl = 'instagram://';
    const canOpen = await Linking.canOpenURL(instagramUrl);
    
    if (canOpen) {
      await Linking.openURL(instagramUrl);
      
      Alert.alert(
        '影片已儲存',
        '影片已儲存到您的相簿。\n\n請手動操作：\n1. 點選左上角「+」或向右滑\n2. 選擇「限時動態」\n3. 從相簿選擇剛下載的影片',
        [{ text: '好的' }]
      );
      
      return { 
        success: true, 
        message: '影片已儲存到相簿，請手動選擇發布限時動態' 
      };
    } else {
      Alert.alert(
        '影片已儲存',
        '影片已儲存到您的相簿，請打開 Instagram 手動發布限時動態。',
        [{ text: '好的' }]
      );
      
      return { 
        success: true, 
        message: '影片已儲存到相簿' 
      };
    }
  } catch (error: any) {
    console.error('❌ 備用方案錯誤:', error?.message);
    return { 
      success: false, 
      message: '儲存失敗，請稍後再試。' 
    };
  }
};

/**
 * 使用 react-native-share 分享到 Instagram 限時動態
 * 
 * @param options - 分享選項
 * @param options.videoUrl - 影片 URL（必填）
 * @param options.stickerUrl - 貼圖 URL（可選）- 會顯示在影片上方
 * @param options.linkUrl - 連結 URL（可選）- 可點擊的連結貼紙
 * @param options.backgroundTopColor - 背景頂部顏色（可選）
 * @param options.backgroundBottomColor - 背景底部顏色（可選）
 */
export const shareToInstagramStory = async (
  videoUrlOrOptions: string | IGShareOptions
): Promise<IGShareResult> => {
  // 支援舊的 string 參數格式
  const options: IGShareOptions = typeof videoUrlOrOptions === 'string' 
    ? { videoUrl: videoUrlOrOptions }
    : videoUrlOrOptions;

  const { videoUrl, stickerUrl, linkUrl, backgroundTopColor, backgroundBottomColor } = options;

  // Web 平台不支援原生分享
  if (Platform.OS === 'web') {
    return { 
      success: false, 
      message: '請使用手機 App 來分享到 Instagram 限時動態。網頁版不支援此功能。' 
    };
  }

  try {
    // 請求相簿權限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要權限', '請允許存取相簿才能分享到 Instagram');
      return { success: false, message: '需要相簿存取權限' };
    }

    console.log('📥 開始下載影片...');
    
    // 下載影片到本地
    const localVideoUri = await downloadVideo(videoUrl);
    if (!localVideoUri) {
      return { success: false, message: '無法下載影片，請稍後再試。' };
    }

    // 如果有貼圖，也下載它
    let localStickerUri: string | null = null;
    if (stickerUrl) {
      console.log('🎨 下載貼圖...');
      localStickerUri = await downloadFile(stickerUrl, 'png');
    }

    console.log('🔄 準備分享...');
    console.log('📱 Facebook App ID:', FB_APP_ID);
    console.log('📁 影片路徑:', localVideoUri);
    if (localStickerUri) console.log('🎨 貼圖路徑:', localStickerUri);
    if (linkUrl) console.log('🔗 連結 URL:', linkUrl);

    // 建立分享選項
    try {
      console.log('📤 分享到 Instagram Stories...');
      
      const shareOptions: any = {
        social: Share.Social.INSTAGRAM_STORIES,
        appId: FB_APP_ID,
        backgroundVideo: localVideoUri,
      };

      // 添加貼圖（如果有）
      if (localStickerUri) {
        shareOptions.stickerImage = localStickerUri;
      }

      // 添加連結貼紙（如果有）
      // 注意：attributionURL 會顯示為「更多」連結
      if (linkUrl) {
        shareOptions.attributionURL = linkUrl;
      }

      // 添加背景色（如果有）
      if (backgroundTopColor) {
        shareOptions.backgroundTopColor = backgroundTopColor;
      }
      if (backgroundBottomColor) {
        shareOptions.backgroundBottomColor = backgroundBottomColor;
      }

      console.log('📤 shareOptions:', JSON.stringify(shareOptions, null, 2));
      
      const result = await Share.shareSingle(shareOptions);
      console.log('✅ 分享成功:', JSON.stringify(result, null, 2));
      
      return { 
        success: true, 
        message: '已成功分享到 Instagram 限時動態！' 
      };
    } catch (err1: any) {
      console.log('⚠️ 分享失敗:', err1?.message);
      throw err1;
    }

  } catch (error: any) {
    console.error('❌ 所有分享方法都失敗:', error?.message, error);
    
    // 最終備用方案：儲存到相簿
    console.log('⚠️ 使用備用方案：儲存到相簿...');
    try {
      const localVideoUri = await downloadVideo(videoUrl);
      if (localVideoUri) {
        return await fallbackShareToStory(localVideoUri);
      }
    } catch (fallbackError) {
      console.error('❌ 備用方案也失敗:', fallbackError);
    }
    
    return { 
      success: false, 
      message: error?.message || '分享失敗，請稍後再試。' 
    };
  }
};

/**
 * 直接開啟 Instagram App（備用方案）
 */
export const openInstagram = async (): Promise<void> => {
  const url = Platform.OS === 'ios' ? 'instagram://' : 'instagram://user?username=instagram';
  const canOpen = await Linking.canOpenURL(url);
  
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Instagram 未安裝', '請先安裝 Instagram App。');
  }
};

// ────────────────────────────────────────
// 🎮 遊戲截圖分享功能
// ────────────────────────────────────────

/**
 * 分享截圖/圖片到 Instagram 限時動態
 * 
 * 適合遊戲分享場景：
 * - 遊戲結算畫面截圖
 * - 成就分享
 * - 排行榜截圖
 * 
 * @param options - 分享選項
 * @param options.imageUrl - 圖片 URL
 * @param options.imageBase64 - 或者直接傳 Base64 圖片
 * @param options.stickerUrl - 可選的貼圖（如 App Logo）
 */
export const shareImageToStory = async (
  options: IGImageShareOptions
): Promise<IGShareResult> => {
  const { imageUrl, imageBase64, stickerUrl, backgroundTopColor, backgroundBottomColor } = options;

  if (Platform.OS === 'web') {
    return { 
      success: false, 
      message: '請使用手機 App 來分享到 Instagram 限時動態。' 
    };
  }

  try {
    console.log('🖼️ 分享圖片到 Instagram Stories...');

    let localImageUri: string | null = null;
    let localStickerUri: string | null = null;

    // 處理圖片來源
    if (imageBase64) {
      // 如果是 Base64，先存成檔案
      console.log('📝 處理 Base64 圖片...');
      const filename = `screenshot_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, imageBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      localImageUri = fileUri;
    } else if (imageUrl) {
      // 如果是 URL，下載圖片
      console.log('📥 下載圖片...');
      localImageUri = await downloadFile(imageUrl, 'png');
    }

    if (!localImageUri) {
      return { success: false, message: '無法處理圖片' };
    }

    // 下載貼圖（如果有）
    if (stickerUrl) {
      console.log('🎨 下載貼圖...');
      localStickerUri = await downloadFile(stickerUrl, 'png');
    }

    // 使用 react-native-share 分享
    const shareOptions: any = {
      social: Share.Social.INSTAGRAM_STORIES,
      appId: FB_APP_ID,
      backgroundImage: localImageUri,
    };

    if (localStickerUri) {
      shareOptions.stickerImage = localStickerUri;
    }
    if (backgroundTopColor) {
      shareOptions.backgroundTopColor = backgroundTopColor;
    }
    if (backgroundBottomColor) {
      shareOptions.backgroundBottomColor = backgroundBottomColor;
    }

    console.log('📤 分享選項:', JSON.stringify(shareOptions, null, 2));

    const result = await Share.shareSingle(shareOptions);
    console.log('✅ 分享成功:', result);

    return { 
      success: true, 
      message: '已開啟 Instagram 限時動態！' 
    };

  } catch (error: any) {
    console.error('❌ 分享錯誤:', error?.message);
    return { 
      success: false, 
      message: error?.message || '分享失敗' 
    };
  }
};

/**
 * 🎮 遊戲分享 - 分享當前畫面截圖到限時動態
 * 
 * 使用方式：
 * 1. 使用 react-native-view-shot 截取遊戲畫面
 * 2. 將 Base64 傳入此函數
 * 
 * @param screenshotBase64 - 截圖的 Base64 數據
 * @param appLogoUrl - 可選的 App Logo 作為貼圖
 */
export const shareGameScreenshot = async (
  screenshotBase64: string,
  appLogoUrl?: string
): Promise<IGShareResult> => {
  return shareImageToStory({
    imageBase64: screenshotBase64,
    stickerUrl: appLogoUrl,
  });
};

/**
 * 分享影片到 Instagram 一般貼文（Feed）
 * 
 * ⚠️ 限制：
 * - Instagram 只允許分享 60 秒以內的影片到 Feed
 * - 影片會先儲存到相簿，然後開啟 Instagram 讓用戶選擇
 * - 用戶需要手動在 Instagram 中完成發布
 * 
 * @param videoUrl - 影片 URL
 * @param caption - 可選的文字說明（會複製到剪貼板）
 */
export const shareToInstagramFeed = async (
  videoUrl: string,
  caption?: string
): Promise<IGShareResult> => {
  if (Platform.OS === 'web') {
    return { 
      success: false, 
      message: '請使用手機 App 來分享到 Instagram。網頁版不支援此功能。' 
    };
  }

  try {
    // 請求相簿權限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要權限', '請允許存取相簿才能分享到 Instagram');
      return { success: false, message: '需要相簿存取權限' };
    }

    console.log('📥 開始下載影片...');
    
    // 下載影片到本地
    const localVideoUri = await downloadVideo(videoUrl);
    if (!localVideoUri) {
      return { success: false, message: '無法下載影片，請稍後再試。' };
    }

    console.log('💾 儲存到相簿...');
    
    // 儲存到相簿（Instagram Feed 需要從相簿讀取）
    const asset = await MediaLibrary.createAssetAsync(localVideoUri);
    console.log('✅ 已儲存到相簿:', asset.uri);

    // 取得相簿中的 Local Identifier
    const localIdentifier = asset.id;
    console.log('📱 Local Identifier:', localIdentifier);

    // 使用 react-native-share 分享到 Instagram
    try {
      console.log('📤 分享到 Instagram Feed...');
      
      const shareOptions: any = {
        social: Share.Social.INSTAGRAM,
        url: `ph://${localIdentifier}`,
        type: 'video/mp4',
      };

      if (caption) {
        shareOptions.message = caption;
      }

      console.log('📤 shareOptions:', JSON.stringify(shareOptions, null, 2));
      
      const result = await Share.shareSingle(shareOptions);
      console.log('✅ 分享成功:', JSON.stringify(result, null, 2));

      // 顯示提示
      Alert.alert(
        '已開啟 Instagram',
        caption 
          ? '影片已傳送到 Instagram。\n\n說明文字已準備好，請在 Instagram 中貼上並完成發布！'
          : '影片已傳送到 Instagram。\n\n請在 Instagram 中完成發布！',
        [{ text: '好的' }]
      );
      
      return { 
        success: true, 
        message: '已開啟 Instagram，請完成發布！' 
      };
    } catch (err: any) {
      console.log('⚠️ Instagram 分享失敗:', err?.message);
      
      // 備用：直接開啟 Instagram
      const instagramUrl = 'instagram://library?LocalIdentifier=' + localIdentifier;
      const canOpen = await Linking.canOpenURL(instagramUrl);
      
      if (canOpen) {
        await Linking.openURL(instagramUrl);
        Alert.alert(
          '已開啟 Instagram',
          '影片已儲存到相簿，請選擇該影片發布貼文。',
          [{ text: '好的' }]
        );
        return { success: true, message: '已開啟 Instagram' };
      }
      
      throw err;
    }

  } catch (error: any) {
    console.error('❌ 分享錯誤:', error?.message, error);
    
    return { 
      success: false, 
      message: error?.message || '分享失敗，請稍後再試。' 
    };
  }
};

/**
 * 分享影片到 Instagram Reels
 * 
 * ⚠️ 注意：Reels 分享使用與 Stories 類似的方式
 * 但 Instagram 可能會根據影片長度自動判斷是 Reels 還是 Stories
 * 
 * @param videoUrl - 影片 URL
 */
export const shareToInstagramReels = async (videoUrl: string): Promise<IGShareResult> => {
  // Reels 分享目前使用相同的 Stories API
  // Instagram 會根據影片長度（> 15 秒）自動判斷為 Reels
  return shareToInstagramStory({ videoUrl });
};

/**
 * 測試分享（用於開發）
 */
export const testInstagramShare = async (): Promise<void> => {
  const testVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
  const result = await shareToInstagramStory(testVideoUrl);
  console.log('🧪 測試結果:', result);
};

// ────────────────────────────────────────
// 保留舊的 API 函數供參考（已棄用）
// ────────────────────────────────────────

/** @deprecated 使用 shareToInstagramStory 代替 */
export const createMediaContainer = async (_videoUrl: string): Promise<IGShareResult> => {
  return { success: false, message: 'API 方式已棄用，請使用原生分享。' };
};

/** @deprecated 使用 shareToInstagramStory 代替 */
export const publishMedia = async (_containerId: string): Promise<IGShareResult> => {
  return { success: false, message: 'API 方式已棄用，請使用原生分享。' };
};

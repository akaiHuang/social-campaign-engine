/**
 * Instagram Graph API - Content Publishing
 * 
 * 用於自動發布貼文、Reels、Stories 到 Instagram Professional 帳號
 * 
 * ⚠️ 必要條件：
 * 1. 用戶需要 Instagram Professional 帳號（Business 或 Creator）
 * 2. 需要 Meta App Review 批准 instagram_content_publish 權限
 * 3. 用戶需要 OAuth 授權你的 App
 * 
 * 文檔：https://developers.facebook.com/docs/instagram-platform/content-publishing
 */

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`;

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

export interface IGPublishResult {
  success: boolean;
  mediaId?: string;
  containerId?: string;
  error?: string;
  status?: 'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED' | 'PUBLISHED';
}

export interface IGUserToken {
  /** Instagram Professional Account ID */
  igUserId: string;
  /** Long-lived access token */
  accessToken: string;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES' | 'CAROUSEL';

export interface PublishOptions {
  /** 媒體類型 */
  mediaType: MediaType;
  /** 圖片或影片的公開 URL（必須是可公開存取的） */
  mediaUrl: string;
  /** 貼文說明（caption） */
  caption?: string;
  /** 標記的用戶（需要用戶同意） */
  userTags?: { username: string; x?: number; y?: number }[];
  /** 位置 ID */
  locationId?: string;
  /** 是否是輪播的一部分 */
  isCarouselItem?: boolean;
}

// ────────────────────────────────────────
// Step 1: 建立媒體容器
// ────────────────────────────────────────

/**
 * 建立媒體容器（上傳媒體）
 * 
 * @param userToken - 用戶的 IG ID 和 Access Token
 * @param options - 發布選項
 * @returns 容器 ID
 */
export const createMediaContainer = async (
  userToken: IGUserToken,
  options: PublishOptions
): Promise<IGPublishResult> => {
  const { igUserId, accessToken } = userToken;
  const { mediaType, mediaUrl, caption, userTags, locationId, isCarouselItem } = options;

  try {
    console.log('📦 建立媒體容器...');
    console.log('📱 Media Type:', mediaType);
    console.log('🔗 Media URL:', mediaUrl);

    // 建立請求 body
    const body: Record<string, any> = {
      access_token: accessToken,
    };

    // 根據媒體類型設定不同參數
    if (mediaType === 'IMAGE') {
      body.image_url = mediaUrl;
    } else if (mediaType === 'VIDEO' || mediaType === 'REELS') {
      body.video_url = mediaUrl;
      body.media_type = mediaType === 'REELS' ? 'REELS' : 'VIDEO';
    } else if (mediaType === 'STORIES') {
      // Stories 可以是圖片或影片
      if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
        body.video_url = mediaUrl;
      } else {
        body.image_url = mediaUrl;
      }
      body.media_type = 'STORIES';
    }

    // 添加說明（caption）
    if (caption) {
      body.caption = caption;
    }

    // 添加位置
    if (locationId) {
      body.location_id = locationId;
    }

    // 添加用戶標記
    if (userTags && userTags.length > 0) {
      body.user_tags = JSON.stringify(userTags);
    }

    // 是否為輪播項目
    if (isCarouselItem) {
      body.is_carousel_item = true;
    }

    console.log('📤 發送請求到:', `${GRAPH_API_BASE}/${igUserId}/media`);

    const response = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('📥 回應:', JSON.stringify(data, null, 2));

    if (data.error) {
      return {
        success: false,
        error: data.error.message || '建立媒體容器失敗',
      };
    }

    return {
      success: true,
      containerId: data.id,
    };

  } catch (error: any) {
    console.error('❌ 建立媒體容器錯誤:', error?.message);
    return {
      success: false,
      error: error?.message || '網路錯誤',
    };
  }
};

// ────────────────────────────────────────
// Step 2: 檢查容器狀態
// ────────────────────────────────────────

/**
 * 檢查媒體容器的處理狀態
 * 
 * 影片上傳後需要時間處理，需要輪詢此 API 直到狀態為 FINISHED
 * 
 * @param containerId - 容器 ID
 * @param accessToken - Access Token
 * @returns 容器狀態
 */
export const checkContainerStatus = async (
  containerId: string,
  accessToken: string
): Promise<IGPublishResult> => {
  try {
    console.log('🔍 檢查容器狀態:', containerId);

    const response = await fetch(
      `${GRAPH_API_BASE}/${containerId}?fields=status_code,status&access_token=${accessToken}`
    );

    const data = await response.json();
    console.log('📥 容器狀態:', JSON.stringify(data, null, 2));

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        status: 'ERROR',
      };
    }

    return {
      success: data.status_code === 'FINISHED',
      containerId,
      status: data.status_code,
    };

  } catch (error: any) {
    console.error('❌ 檢查狀態錯誤:', error?.message);
    return {
      success: false,
      error: error?.message,
      status: 'ERROR',
    };
  }
};

/**
 * 等待容器處理完成（輪詢）
 * 
 * @param containerId - 容器 ID
 * @param accessToken - Access Token
 * @param maxAttempts - 最大嘗試次數（預設 30 次，每次間隔 2 秒 = 最多等 1 分鐘）
 */
export const waitForContainerReady = async (
  containerId: string,
  accessToken: string,
  maxAttempts: number = 30
): Promise<IGPublishResult> => {
  console.log('⏳ 等待容器處理完成...');

  for (let i = 0; i < maxAttempts; i++) {
    const result = await checkContainerStatus(containerId, accessToken);

    if (result.status === 'FINISHED') {
      console.log('✅ 容器已準備好');
      return result;
    }

    if (result.status === 'ERROR' || result.status === 'EXPIRED') {
      console.error('❌ 容器處理失敗:', result.status);
      return result;
    }

    console.log(`⏳ 等待中... (${i + 1}/${maxAttempts}) 狀態: ${result.status}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒
  }

  return {
    success: false,
    error: '處理超時，請稍後再試',
    status: 'IN_PROGRESS',
  };
};

// ────────────────────────────────────────
// Step 3: 發布媒體
// ────────────────────────────────────────

/**
 * 發布媒體（將容器發布為貼文）
 * 
 * @param userToken - 用戶的 IG ID 和 Access Token
 * @param containerId - 媒體容器 ID
 * @returns 發布結果，包含 Media ID
 */
export const publishMedia = async (
  userToken: IGUserToken,
  containerId: string
): Promise<IGPublishResult> => {
  const { igUserId, accessToken } = userToken;

  try {
    console.log('📤 發布媒體...');

    const response = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    const data = await response.json();
    console.log('📥 發布結果:', JSON.stringify(data, null, 2));

    if (data.error) {
      return {
        success: false,
        error: data.error.message || '發布失敗',
      };
    }

    return {
      success: true,
      mediaId: data.id,
      status: 'PUBLISHED',
    };

  } catch (error: any) {
    console.error('❌ 發布錯誤:', error?.message);
    return {
      success: false,
      error: error?.message || '網路錯誤',
    };
  }
};

// ────────────────────────────────────────
// 一站式發布函數
// ────────────────────────────────────────

/**
 * 自動發布到 Instagram（一站式）
 * 
 * 此函數會自動執行：
 * 1. 建立媒體容器
 * 2. 等待處理完成
 * 3. 發布媒體
 * 
 * @param userToken - 用戶的 IG ID 和 Access Token
 * @param options - 發布選項
 * @returns 發布結果
 */
export const autoPublish = async (
  userToken: IGUserToken,
  options: PublishOptions
): Promise<IGPublishResult> => {
  console.log('🚀 開始自動發布到 Instagram...');
  console.log('📱 IG User ID:', userToken.igUserId);
  console.log('📝 Media Type:', options.mediaType);

  // Step 1: 建立容器
  const containerResult = await createMediaContainer(userToken, options);
  if (!containerResult.success || !containerResult.containerId) {
    return containerResult;
  }

  // Step 2: 等待處理完成（影片需要時間處理）
  if (options.mediaType === 'VIDEO' || options.mediaType === 'REELS' || options.mediaType === 'STORIES') {
    const waitResult = await waitForContainerReady(
      containerResult.containerId,
      userToken.accessToken
    );
    if (!waitResult.success) {
      return waitResult;
    }
  }

  // Step 3: 發布
  const publishResult = await publishMedia(userToken, containerResult.containerId);

  if (publishResult.success) {
    console.log('🎉 發布成功！Media ID:', publishResult.mediaId);
  }

  return publishResult;
};

// ────────────────────────────────────────
// 檢查發布限制
// ────────────────────────────────────────

/**
 * 檢查用戶的發布限制（每 24 小時 100 則）
 */
export const checkPublishingLimit = async (
  userToken: IGUserToken
): Promise<{ quota_usage: number; config: any } | null> => {
  const { igUserId, accessToken } = userToken;

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${igUserId}/content_publishing_limit?fields=quota_usage,config&access_token=${accessToken}`
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ 檢查限制錯誤:', data.error.message);
      return null;
    }

    console.log('📊 發布限制:', data);
    return data;

  } catch (error) {
    console.error('❌ 網路錯誤');
    return null;
  }
};

// ────────────────────────────────────────
// 便捷函數
// ────────────────────────────────────────

/**
 * 發布圖片貼文
 */
export const publishImagePost = async (
  userToken: IGUserToken,
  imageUrl: string,
  caption?: string
): Promise<IGPublishResult> => {
  return autoPublish(userToken, {
    mediaType: 'IMAGE',
    mediaUrl: imageUrl,
    caption,
  });
};

/**
 * 發布影片貼文
 */
export const publishVideoPost = async (
  userToken: IGUserToken,
  videoUrl: string,
  caption?: string
): Promise<IGPublishResult> => {
  return autoPublish(userToken, {
    mediaType: 'VIDEO',
    mediaUrl: videoUrl,
    caption,
  });
};

/**
 * 發布 Reels
 */
export const publishReels = async (
  userToken: IGUserToken,
  videoUrl: string,
  caption?: string
): Promise<IGPublishResult> => {
  return autoPublish(userToken, {
    mediaType: 'REELS',
    mediaUrl: videoUrl,
    caption,
  });
};

/**
 * 發布 Stories
 */
export const publishStories = async (
  userToken: IGUserToken,
  mediaUrl: string
): Promise<IGPublishResult> => {
  return autoPublish(userToken, {
    mediaType: 'STORIES',
    mediaUrl,
  });
};

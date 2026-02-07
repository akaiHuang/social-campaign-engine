/**
 * 📤 背景上傳服務
 * 
 * 使用 react-native-background-upload 實現：
 * - App 切換到背景仍可繼續上傳
 * - 進度追蹤
 * - 錯誤重試
 */

import { Platform } from 'react-native';
import {
  cacheDirectory,
  downloadAsync,
  getInfoAsync,
  readDirectoryAsync,
  deleteAsync,
} from 'expo-file-system/legacy';

// 動態載入 (避免在不支援的環境報錯)
let Upload: any = null;
try {
  Upload = require('react-native-background-upload').default;
} catch (e) {
  console.log('📤 react-native-background-upload 不可用，將使用 fallback');
}

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

export interface UploadOptions {
  url: string;
  fileUri: string;
  fieldName?: string;
  mimeType?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, string>;
  onProgress?: (progress: number) => void;
  onComplete?: (response: string) => void;
  onError?: (error: string) => void;
}

export interface BackgroundUploadResult {
  success: boolean;
  uploadId?: string;
  response?: string;
  error?: string;
}

// ────────────────────────────────────────
// 下載遠端檔案到本地 (背景上傳需要本地檔案)
// ────────────────────────────────────────

export const downloadToLocal = async (
  remoteUrl: string,
  filename?: string
): Promise<string | null> => {
  try {
    const ext = remoteUrl.split('.').pop()?.split('?')[0] || 'mp4';
    const localFilename = filename || `temp_${Date.now()}.${ext}`;
    const localUri = `${cacheDirectory}${localFilename}`;

    console.log(`📥 下載檔案到本地: ${remoteUrl}`);
    
    const downloadResult = await downloadAsync(remoteUrl, localUri);
    
    if (downloadResult.status === 200) {
      console.log(`📥 下載完成: ${localUri}`);
      return localUri;
    } else {
      console.error(`📥 下載失敗: HTTP ${downloadResult.status}`);
      return null;
    }
  } catch (error: any) {
    console.error('📥 下載錯誤:', error);
    return null;
  }
};

// ────────────────────────────────────────
// 背景上傳 (主要功能)
// ────────────────────────────────────────

export const startBackgroundUpload = async (
  options: UploadOptions
): Promise<BackgroundUploadResult> => {
  // 檢查是否可用
  if (!Upload) {
    console.log('📤 背景上傳不可用，使用 fallback fetch');
    return fallbackUpload(options);
  }

  try {
    const uploadOptions = {
      url: options.url,
      path: options.fileUri.replace('file://', ''),
      method: 'POST' as const,
      type: 'multipart' as const,
      field: options.fieldName || 'file',
      headers: {
        'Content-Type': options.mimeType || 'video/mp4',
        ...options.headers,
      },
      parameters: options.parameters || {},
      // iOS 專用：允許背景執行
      ...(Platform.OS === 'ios' && {
        ios: {
          uploadType: 'uploadTask',
        },
      }),
      // Android 專用
      ...(Platform.OS === 'android' && {
        notification: {
          enabled: true,
          autoClear: true,
          notificationChannel: 'upload-channel',
          enableRingTone: false,
          onProgressTitle: '上傳中...',
          onProgressMessage: '正在上傳影片到 Threads',
          onCompleteTitle: '上傳完成',
          onCompleteMessage: '影片已成功上傳',
          onErrorTitle: '上傳失敗',
          onErrorMessage: '請重試',
        },
      }),
    };

    console.log('📤 開始背景上傳:', options.url);

    return new Promise((resolve) => {
      Upload.startUpload(uploadOptions)
        .then((uploadId: string) => {
          console.log(`📤 上傳已啟動，ID: ${uploadId}`);

          // 監聽進度
          Upload.addListener('progress', uploadId, (data: any) => {
            const progress = Math.round(data.progress);
            console.log(`📤 上傳進度: ${progress}%`);
            options.onProgress?.(progress);
          });

          // 監聽完成
          Upload.addListener('completed', uploadId, (data: any) => {
            console.log('📤 上傳完成:', data);
            options.onComplete?.(data.responseBody);
            resolve({
              success: true,
              uploadId,
              response: data.responseBody,
            });
          });

          // 監聽錯誤
          Upload.addListener('error', uploadId, (data: any) => {
            console.error('📤 上傳錯誤:', data.error);
            options.onError?.(data.error);
            resolve({
              success: false,
              uploadId,
              error: data.error,
            });
          });

          // 監聯取消
          Upload.addListener('cancelled', uploadId, () => {
            console.log('📤 上傳已取消');
            resolve({
              success: false,
              uploadId,
              error: '上傳已取消',
            });
          });
        })
        .catch((err: any) => {
          console.error('📤 啟動上傳失敗:', err);
          resolve({
            success: false,
            error: err.message || '啟動上傳失敗',
          });
        });
    });
  } catch (error: any) {
    console.error('📤 背景上傳錯誤:', error);
    return {
      success: false,
      error: error.message || '背景上傳錯誤',
    };
  }
};

// ────────────────────────────────────────
// Fallback: 使用一般 fetch (App 需保持前台)
// ────────────────────────────────────────

const fallbackUpload = async (
  options: UploadOptions
): Promise<BackgroundUploadResult> => {
  try {
    console.log('📤 使用 fallback fetch 上傳...');

    // 讀取檔案
    const fileInfo = await getInfoAsync(options.fileUri);
    if (!fileInfo.exists) {
      return { success: false, error: '檔案不存在' };
    }

    // 建立 FormData
    const formData = new FormData();
    
    // 加入檔案
    formData.append(options.fieldName || 'file', {
      uri: options.fileUri,
      type: options.mimeType || 'video/mp4',
      name: options.fileUri.split('/').pop() || 'upload.mp4',
    } as any);

    // 加入其他參數
    if (options.parameters) {
      Object.entries(options.parameters).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(options.url, {
      method: 'POST',
      headers: options.headers,
      body: formData,
    });

    const responseText = await response.text();

    if (response.ok) {
      options.onComplete?.(responseText);
      return { success: true, response: responseText };
    } else {
      options.onError?.(responseText);
      return { success: false, error: responseText };
    }
  } catch (error: any) {
    console.error('📤 Fallback 上傳錯誤:', error);
    options.onError?.(error.message);
    return { success: false, error: error.message };
  }
};

// ────────────────────────────────────────
// 取消上傳
// ────────────────────────────────────────

export const cancelUpload = async (uploadId: string): Promise<boolean> => {
  if (!Upload) return false;
  
  try {
    await Upload.cancelUpload(uploadId);
    console.log(`📤 已取消上傳: ${uploadId}`);
    return true;
  } catch (error) {
    console.error('📤 取消上傳失敗:', error);
    return false;
  }
};

// ────────────────────────────────────────
// 清理暫存檔案
// ────────────────────────────────────────

export const cleanupTempFiles = async (): Promise<void> => {
  try {
    const cacheDir = cacheDirectory;
    if (!cacheDir) return;

    const files = await readDirectoryAsync(cacheDir);
    const tempFiles = files.filter(f => f.startsWith('temp_'));

    for (const file of tempFiles) {
      await deleteAsync(`${cacheDir}${file}`, { idempotent: true });
    }

    console.log(`📤 已清理 ${tempFiles.length} 個暫存檔案`);
  } catch (error) {
    console.error('📤 清理暫存檔案失敗:', error);
  }
};

// ────────────────────────────────────────
// 檢查背景上傳是否可用
// ────────────────────────────────────────

export const isBackgroundUploadAvailable = (): boolean => {
  return Upload !== null;
};

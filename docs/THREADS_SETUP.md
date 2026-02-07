# 🧵 Threads API 設定指南

## 步驟 1：在 Meta Developer Console 啟用 Threads API

1. 前往 [Meta for Developers](https://developers.facebook.com/)
2. 選擇你的 App（Fanbot）
3. 在左側選單找到 **"Use cases"** → **"Add"**
4. 選擇 **"Threads API"** 並啟用

## 步驟 2：設定權限

在 Threads API 使用案例中，需要啟用以下權限：

- ✅ `threads_basic` - 基本個人資料
- ✅ `threads_content_publish` - 發文權限
- ✅ `threads_manage_insights` - 洞察報告（可選）

## 步驟 3：設定 OAuth Redirect URI

1. 在 App Settings → Basic 中找到 **Valid OAuth Redirect URIs**
2. 加入以下 URI：

### Development（開發測試用）
```
https://auth.expo.io/@akaihuang/igshare
exp://192.168.31.123:8087/--/threads-callback
```

### Production（正式版）
```
igshare://threads-callback
```

## 步驟 4：確認 App Secret

確保 `.env` 檔案中有正確的 App Secret：

```env
EXPO_PUBLIC_META_APP_ID=1350870370104395
EXPO_PUBLIC_META_APP_SECRET=你的_app_secret
```

## 步驟 5：測試流程

1. 啟動 App
2. 進入「個人檔案」頁面
3. 點擊「Threads」區塊的「測試」按鈕
4. 登入 Threads 帳號並授權
5. 測試發文功能

## ⚠️ 重要注意事項

### Threads API 限制
- 每 24 小時最多發 **250 則貼文**
- 影片最長 **5 分鐘**，最大 **1GB**
- 文字最多 **500 字元**
- 圖片最大 **8MB**

### 帳號要求
- ✅ **任何 Threads 帳號都可以**（不需要商業帳號）
- ✅ 帳號必須是公開或私人都可以
- ✅ 需要用戶授權才能代表用戶發文

### App Review
- 開發模式下只有 App 管理員/開發者可以測試
- 正式上線需要提交 App Review 審核

---

## 🎯 完整流程

```
用戶點擊「分享到 Threads」
        ↓
OAuth 授權（首次需要）
        ↓
App 透過 API 自動發文
        ↓
API 回傳 postId（驗證成功）
        ↓
用戶可以領取獎勵
```

## 📱 測試 URL

用這個 URL 測試 OAuth 是否正確設定：

```
https://threads.net/oauth/authorize?client_id=1350870370104395&redirect_uri=https://auth.expo.io/@akaihuang/igshare&scope=threads_basic,threads_content_publish&response_type=code
```

點擊後應該會進入 Threads 授權頁面。

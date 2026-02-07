# Sara2 影片生成與 IG 限動分享 App 開發文件

更新日期：2026-01-23

## 0. 目標與範圍
- 使用 Expo 製作 iOS/Android App。
- 透過 GPT/影片生成 API 製作 Sara2/Sora2 風格短影片。
- 生成後可一鍵分享至 Instagram 限時動態。
- 具備會員系統與點數內購機制。

## 1. 使用者流程（User Flow）
1) 註冊/登入（Firebase Auth）。
2) 選擇影片主題/風格/模板（Prompt 模板庫）。
3) 送出生成任務（扣點）。
4) 生成完成 → 預覽 → 裁切 9:16 + 字幕/水印。
5) 分享到 Instagram 限動。
6) 歷史作品庫檢視與再次分享。

## 2. 功能清單
### 2.1 核心功能
- 影片生成：輸入 Prompt 或使用模板。
- 影片處理：裁切 9:16、加字幕/水印、縮圖。
- IG 限動分享：透過 Meta Graph API。
- 作品管理：歷史影片列表、分享紀錄。

### 2.2 會員與點數
- Firebase Auth（Email/Google/Apple）。
- Firestore 儲存使用者資料、點數、作品資訊。
- 內購點數：iOS/Android IAP。
- 點數扣除：發起生成任務時扣點；失敗可回補。

### 2.3 追蹤與監控（可選）
- 錯誤追蹤（Sentry）。
- 行為分析（Analytics）。

## 3. 影片生成與玩法建議
### 3.1 Prompt 模板
- 主題：霓虹雨夜/懷舊動畫/旅行明信片/魔幻城市
- 風格：賽博龐克/黏土風/動畫卡通/寫實
- 鏡頭：推軌/航拍/慢動作/手持

### 3.2 好玩玩法
- 每日主題挑戰（當日主題推薦）。
- 風格卡包（收藏/解鎖）。
- 連續劇模式（沿用上一段敘事）。

## 4. 系統架構
### 4.1 前端（Expo App）
- React Native + Expo
- 任務送出、狀態輪詢、結果預覽與分享

### 4.2 後端（建議）
- API 服務：負責影片生成、狀態回傳、IG 上傳
- 影片處理：裁切/轉檔/字幕

### 4.3 Firebase
- Auth：登入/註冊
- Firestore：用戶資料/點數/作品
- Storage：影片檔案與縮圖
- Cloud Functions：內購驗證、扣點、任務排程

## 5. IG 限動分享（需求與注意事項）
- 需 Meta App + IG 商業帳號。
- 使用 Graph API 進行上傳與分享。
- 需取得長期 Access Token。
- 使用者須同意分享授權。

## 6. 內購與點數
### 6.1 商品規劃（示例）
- 100 點
- 300 點
- 1000 點

### 6.2 點數消耗規則（示例）
- 每支影片 20 點
- 高畫質模式 30 點

### 6.3 驗證流程
- App 端完成購買 → 傳送收據至後端
- 後端驗證 → 更新點數

## 7. 需要的 API Key（填入 .env）
參考取得說明文件：docs/ENV_KEYS_GUIDE.md

### 7.1 影片生成
- OPENAI_API_KEY（或指定的影片生成 API Key）

### 7.2 Firebase
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID

### 7.3 Meta / Instagram
- META_APP_ID
- META_APP_SECRET
- META_LONG_LIVED_ACCESS_TOKEN
- IG_BUSINESS_ACCOUNT_ID

### 7.4 可選
- SENTRY_DSN
- ANALYTICS_KEY

## 7.5 無 Key 的開發模式（Fallback）
在尚未取得關鍵金鑰時，仍可先完成前端與流程開發：
- 影片生成：使用假資料與本地假影片（Mock）。
- IG 分享：顯示「待啟用」狀態，或導向示意頁。
- 內購：使用本地沙盒資料與模擬扣點。
- 監控/分析：先放置 SDK 初始化空殼。
- 風險控管：缺少 key 時顯示友善提示，不阻斷整體流程。

## 8. 你需要提供的資料（用於部署/發布）
- 發布平台：iOS / Android / 兩者
- Apple Developer / Google Play 帳號
- 是否允許使用 Expo EAS 進行打包與上架
- 影片生成 API 供應商與 Key
- Meta App 與 IG 商業帳號資訊
- Firebase 專案資訊
- App 名稱、圖示、隱私權政策連結

## 9. 驗收標準（Definition of Done）
- 使用者可登入並建立帳戶
- 可成功生成一支 9:16 影片
- 可完成點數購買與扣點
- 可分享至 IG 限動
- 可查看歷史作品與分享紀錄

## 10. 開發進度摘要（2026-01-23）
### 已完成
- [x] Expo 專案架構（React Native + TypeScript）
- [x] 登入/註冊（Firebase Auth + Mock Fallback）
- [x] 生成畫面（Prompt 模板、風格、鏡頭選擇）
- [x] 歷史作品列表
- [x] 個人設定（點數、IG 連線狀態）
- [x] 影片詳情與 IG 分享按鈕
- [x] OpenAI/Sora2 API Client（Mock Fallback）
- [x] Firestore/Storage 服務層
- [x] IG Graph API 分享框架
- [x] 內購 IAP 服務層（Mock）
- [x] Jest 單元測試（7 passing）
- [x] EAS Build 設定檔

### 待完成
- [ ] 真實 Firebase Auth 與 Firestore 整合測試
- [ ] IG OAuth 授權流程
- [ ] 內購商品建立與驗證（Apple/Google）
- [ ] 影片處理（ffmpeg 裁切/字幕）
- [ ] E2E 測試
- [ ] 上架審核資料

## 11. 待你確認的事項
- 影片生成 API 供應商與能力
- IAP 方案與點數規則
- 上架策略與地區
- 內容審核與使用者條款

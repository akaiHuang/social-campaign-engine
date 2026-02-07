# 環境變數取得指南

更新日期：2026-01-23

本文件說明以下環境變數的取得位置與流程：
- EXPO_PUBLIC_META_APP_ID
- EXPO_PUBLIC_META_APP_SECRET
- EXPO_PUBLIC_META_LONG_LIVED_ACCESS_TOKEN
- EXPO_PUBLIC_IG_BUSINESS_ACCOUNT_ID
- EXPO_PUBLIC_SENTRY_DSN
- EXPO_PUBLIC_ANALYTICS_KEY

---

## 1) Meta / Instagram
### 1.1 EXPO_PUBLIC_META_APP_ID & EXPO_PUBLIC_META_APP_SECRET
**取得位置**：Meta for Developers → 你的 App → Settings → Basic
**流程**：
1. 前往 Meta for Developers 建立 App。
2. 進入 App 的 Settings → Basic。
3. 複製 App ID 與 App Secret。

### 1.2 EXPO_PUBLIC_META_LONG_LIVED_ACCESS_TOKEN
**取得位置**：Meta Graph API Explorer（或 App Dashboard）
**流程**：
1. 先取得短期使用者 Access Token（Graph API Explorer）。
2. 將短期 Token 交換為長期 Token（Long-Lived Token）。
3. 將長期 Token 填入此欄位。

### 1.3 EXPO_PUBLIC_IG_BUSINESS_ACCOUNT_ID
**取得位置**：Meta Graph API
**流程**：
1. IG 帳號需先切換為「專業帳號」並連結至 Facebook 專頁。
2. 透過 Graph API 取得 Page ID。
3. 用 Page ID 查詢對應的 IG Business Account ID。

---

## 2) Sentry
### EXPO_PUBLIC_SENTRY_DSN
**取得位置**：Sentry → Projects → Client Keys (DSN)
**流程**：
1. 建立 Sentry 專案。
2. 進入專案設定 → Client Keys (DSN)。
3. 複製 DSN 填入此欄位。

---

## 3) Analytics
### EXPO_PUBLIC_ANALYTICS_KEY
**取得位置**：依你選擇的分析平台而定（例如 GA4、Mixpanel、Amplitude）
**流程（以 GA4 為例）**：
1. 建立 GA4 Property。
2. 建立 Web/App Data Stream。
3. 取得 Measurement ID / API Key。

---

## 4) 建議與注意
- 這些變數含敏感資訊，請勿提交到公開儲存庫。
- 需使用者授權的 Token 建議定期更新。
- IG 發布需符合 Meta 平台政策，並通過 App Review（視功能）。

# EAS Build 設定

本文件說明如何使用 Expo EAS 進行打包與上架。

## 1) 安裝 EAS CLI
```bash
npm install -g eas-cli
eas login
```

## 2) 初始化 EAS
```bash
eas build:configure
```
這會產生 `eas.json` 設定檔。

## 3) 建議的 eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## 4) 開發版本打包（Development Build）
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## 5) 預覽版本打包（Internal Distribution）
```bash
eas build --profile preview --platform all
```

## 6) 正式版本打包
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

## 7) 上架（Submit）
```bash
eas submit --platform ios
eas submit --platform android
```

## 8) 注意事項
- iOS 需要 Apple Developer 帳號與 App Store Connect 權限。
- Android 需要 Google Play Console 帳號。
- 首次上架需手動設定 App 資料（名稱、圖示、隱私權政策連結）。
- 內購商品需在各平台後台先建立。

## 9) 環境變數
EAS Build 會自動讀取專案根目錄的 `.env` 檔案。  
敏感金鑰建議使用 EAS Secrets：
```bash
eas secret:create --name EXPO_PUBLIC_OPENAI_API_KEY --value sk-xxx
```

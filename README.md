# Social Campaign Engine

**End-to-End Cross-Platform Publishing Pipeline with Full Threads API Integration**

## 📋 Quick Summary

> 📱 **一站式跨平台社群行銷引擎，從內容生成到發布驗證全自動化！** 本專案打造行動優先的社群媒體管理平台，完整整合 Meta Threads API 與 Instagram Graph API。🔐 內建完整 OAuth 2.0 認證流程，支援 Token 自動刷新與安全儲存，實現多帳號管理。🤖 透過 OpenAI API 搭配可自訂的 Prompt 模板，一鍵生成文字、圖片說明與影片描述等多類型內容。📤 發布管線支援三種媒體格式——純文字、圖片（含媒體容器建立）、影片（含背景上傳與進度追蹤），發布後自動透過 API 回呼驗證貼文成功並取得 Post ID。🔥 背景上傳管理器具備重試邏輯與暫存檔案清理機制。📊 所有行銷活動歷史記錄持久化至 Firebase Firestore，完整保留時間戳與狀態稽核軌跡。⚡ 使用 Expo SDK 54 + React Native 0.81 開發，單一程式碼庫同時支援 iOS、Android 與 Web。🧪 內含 Jest 單元測試涵蓋格式化、Instagram、OpenAI 與影片生成模組。

---

## 🤔 Why This Exists

Social media campaign management is fragmented -- creators juggle multiple apps, manual posting workflows, and disconnected analytics. This project is a unified mobile-first engine that handles the entire content lifecycle: authenticate via OAuth, generate copy with AI, publish text/image/video to Meta Threads and Instagram, verify post success, and track campaign history. One app, multiple platforms, complete automation from creation to confirmation.

## 🏗️ Architecture

```
+-----------------------------------------------------------+
|  Authentication Layer                                      |
|  OAuth 2.0 (Threads) + Firebase Auth                       |
|  Token refresh, secure storage, multi-account              |
+-----------------------------------------------------------+
        |
        v
+-----------------------------------------------------------+
|  Content Generation                                        |
|  OpenAI API --> Prompt Templates --> Formatted Output       |
|  Text / Image captions / Video descriptions                |
+-----------------------------------------------------------+
        |
        v
+-----------------------------------------------------------+
|  Publishing Pipeline                                       |
|                                                            |
|  Threads API (threads.ts, ~890 lines)                      |
|    - Create media container (text / image / video)         |
|    - Background upload with progress tracking              |
|    - Publish container to feed                             |
|    - Verify publication (postId confirmation)              |
|                                                            |
|  Instagram Graph API (instagramGraphAPI.ts)                |
|    - Business account publishing                           |
|    - Media upload and captioning                           |
+-----------------------------------------------------------+
        |
        v
+-----------------------------------------------------------+
|  Campaign History & Analytics                              |
|  Firestore persistence --> Full audit trail                |
|  Post status tracking, engagement data                     |
+-----------------------------------------------------------+
```

### Key Capabilities

- **Complete Threads OAuth 2.0 flow** with token management, refresh, and secure AsyncStorage persistence
- **Multi-format publishing** -- text posts, image posts with media container creation, video posts with background upload
- **Background upload manager** -- native file upload with progress tracking, retry logic, and temp file cleanup
- **Post verification** -- confirms published content via API callback and returns the Threads post ID
- **AI content generation** using OpenAI with customizable prompt templates
- **Campaign history** persisted in Firestore with full timestamp and status audit trail
- **Cross-platform** -- single codebase runs on iOS, Android, and Web via Expo SDK 54
- **Comprehensive testing** -- Jest unit tests for formatting, Instagram, OpenAI, and video generation

### API Rate Limits (Threads)

| Resource | Limit |
|---|---|
| Posts per 24 hours | 250 |
| Text length | 500 characters |
| Image size | 8 MB max |
| Video length | 5 minutes max |
| Video size | 1 GB max |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81 |
| Navigation | React Navigation 7 (Bottom Tabs + Native Stack) |
| API Integration | Meta Threads API, Instagram Graph API |
| AI | OpenAI API |
| Backend | Firebase (Auth, Firestore, Storage) |
| State Management | React Context (AuthContext, AppContext) |
| Background Tasks | react-native-background-upload |
| Sharing | react-native-share, expo-sharing |
| Media | expo-media-library, expo-file-system |
| Testing | Jest, @testing-library/react-native |
| Language | TypeScript |

## 🏁 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env with:
#   EXPO_PUBLIC_THREADS_APP_ID=your_threads_app_id
#   EXPO_PUBLIC_THREADS_APP_SECRET=your_threads_app_secret

# Start the Expo development server
npx expo start
```

> **Prerequisites:**
> - A Meta Developer App with Threads API enabled and permissions configured
> - Firebase project with Auth and Firestore enabled
> - See `docs/THREADS_SETUP.md` for the complete OAuth redirect URI and permission setup guide

### Run Tests

```bash
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

## 📁 Project Structure

```
social-campaign-engine/
  src/
    screens/
      AuthScreen.tsx             # Login and signup
      GenerateScreen.tsx         # AI-powered content creation
      ThreadsTestScreen.tsx      # Threads API testing and debugging
      HistoryScreen.tsx          # Campaign history feed
      ProfileScreen.tsx          # User profile and connected accounts
      VideoDetailScreen.tsx      # Video content detail view
    services/
      threads.ts                 # Threads API client (~890 lines)
                                 #   OAuth flow, token management
                                 #   Text/image/video publishing
                                 #   Post verification, user profile
      instagram.ts               # Instagram sharing
      instagramGraphAPI.ts       # Instagram Graph API (business accounts)
      openai.ts                  # AI content generation
      backgroundUpload.ts        # Native background upload with progress
      firebase.ts                # Firebase initialization
      firestore.ts               # Campaign data persistence
      storage.ts                 # File storage operations
    components/                  # Reusable UI (Chip, StatusPill, CreditBadge, etc.)
    constants/
      promptTemplates.ts         # AI prompt templates
    contexts/
      AuthContext.tsx             # Authentication state provider
      AppContext.tsx              # Global app state
    navigation/
      RootNavigator.tsx          # Root navigation structure
      MainTabs.tsx               # Bottom tab navigator
    __tests__/                   # Unit tests (format, instagram, openai, video)
  docs/
    THREADS_SETUP.md             # Complete Threads API setup guide
  app.json                       # Expo configuration
  package.json                   # Dependencies and scripts
```

---

Built by [Huang Akai (Kai)](https://github.com/akaihuang) -- Creative Technologist, Founder @ Universal FAW Labs

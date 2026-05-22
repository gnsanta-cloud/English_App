# 영어 단어장 하이브리드 앱

React + Vite 웹 UI와 Capacitor로 Android / iOS에 설치할 수 있는 영어 단어장 앱입니다.

## 주요 기능

- **카드형 단어 학습** — 스피커 버튼으로 원어민 발음(TTS)
- **예문 보기** — 영문/한글 예문 (잘림 없이 스크롤)
- **스와이프**
  - 왼쪽 → 다음 단어
  - 오른쪽 → 이전 단어
  - 위 → 나의 단어장 저장
  - 책장 넘기듯 3D 플립 애니메이션
- **홈 화면** — 중학·고등·일상 패턴·여행 대화 주제 선택
- **학습 단계** — 선택한 주제로 단어카드·퀴즈·AI 연동
- **퀴즈** — 10문제, 틀린 단어 자동 저장, 100점 시 "참 잘했어요" + 축포
- **AI대화 탭** — Julia AI 영어 대화 (음성 입력·TTS, APK 권장)
- **진행 저장** — 앱 종료 시 단어 위치 저장, 재실행 시 이어서 학습

## 개발 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## GitHub Pages (iPhone Safari 홈 화면)

**별도 웹서버 없이** GitHub Actions가 빌드·배포합니다.

1. 저장소를 GitHub에 push (`main` 브랜치)
2. **Settings → Pages → Source: GitHub Actions**
3. 배포 URL: **https://gnsanta-cloud.github.io/English_App/**
4. iPhone **Safari** → URL 접속 → **공유 → 홈 화면에 추가**

자세한 절차: [docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md)

## Android / iOS 빌드

```bash
npm install
npm run build
npx cap add android   # 최초 1회
npx cap add ios       # 최초 1회 (macOS + Xcode 필요)
npm run cap:sync
npm run cap:android   # Android Studio
npm run cap:ios       # Xcode
```

### 네이티브만 사용하는 부분

| 기능 | 구현 |
|------|------|
| TTS 발음 | `@capacitor-community/text-to-speech` (네이티브), 웹은 Web Speech API |
| 데이터 저장 | `@capacitor/preferences` |
| 앱 종료 시 위치 저장 | `@capacitor/app` pause / appStateChange |

나머지 UI·퀴즈·스와이프·반응형 레이아웃은 웹(React)으로 처리합니다.

## 앱 아이콘

캐릭터 이미지에서 인물만 추출해 **ABC** 텍스트와 합성한 아이콘입니다.

```bash
npm run icon
```

생성 위치:
- `assets/app-icon.png` (1024×1024)
- `public/icon.png` (512×512, 웹/PWA)
- `android/.../mipmap-*/ic_launcher.png` (Android 설치 아이콘)

## 단어 데이터 (중·고등)

Android **EnglishApp**의 `words_middle.json`, `words_high.json`을 이 프로젝트로 옮겼습니다.

| 원본 (보관) | 앱에서 사용 |
|-------------|-------------|
| `assets/word-sources/words_middle.json` | `src/data/middleSchool.json` (1003개) |
| `assets/word-sources/words_high.json` | `src/data/highSchool.json` (954개) |

원본을 갱신한 뒤 다시 변환 (`src/data` + `public/data` 동시 반영):

```bash
npm run words:import
# 또는 일상 회화까지 한 번에
npm run vocab
```

## 기술 스택

- React 19 + TypeScript + Vite
- Framer Motion (카드 스와이프·플립)
- Capacitor 7

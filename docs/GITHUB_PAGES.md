# GitHub Pages 배포 (Safari 홈 화면 추가)

별도 웹서버 없이 GitHub가 `dist`를 HTTPS로 호스팅합니다.

## 1. GitHub 저장소 만들기

1. [GitHub](https://github.com)에서 **New repository** 생성  
   저장소: [gnsanta-cloud/English_App](https://github.com/gnsanta-cloud/English_App)
2. PC에서 프로젝트 폴더에서:

```bash
git init
git add .
git commit -m "Initial commit: English Hybrid App"
git branch -M main
git remote add origin https://github.com/gnsanta-cloud/English_App.git
git push -u origin main
```

## 2. GitHub Pages 켜기

1. 저장소 → **Settings** → **Pages**
2. **Build and deployment**
   - Source: **GitHub Actions** (Deploy to GitHub Pages 워크플로 사용)
3. `main` 브랜치에 push하면 `.github/workflows/deploy-pages.yml` 이 자동 실행됩니다.

## 3. 접속 URL

배포가 끝나면:

```
https://gnsanta-cloud.github.io/English_App/
```

- Actions 탭에서 워크플로 ✅ 확인
- Pages 설정에 표시된 URL 확인

## 4. iPhone Safari — 홈 화면에 추가

1. **Safari**로 위 URL 접속
2. 로딩이 끝날 때까지 대기
3. 하단 **공유(□↑)** → **홈 화면에 추가**
4. **추가** → 홈 화면 아이콘으로 실행

## 5. 수동 배포 (로컬)

```bash
npm install
npm run icon          # public/icon.png 생성 (Python + Pillow)
# public/avatar.png 없으면: assets/source-character.png 복사
npm run build
# dist 내용을 Pages에 올리거나, main push로 Actions 자동 배포
```

## 참고

| 항목 | GitHub Pages (웹) | Android APK |
|------|-------------------|-------------|
| Mac 필요 | ❌ | ❌ |
| AI 말하기·네이티브 TTS | 제한적 | ✅ |
| 단어카드·퀴즈·홈 | ✅ | ✅ |

코드 수정 후 `git push` 하면 몇 분 안에 사이트가 갱신됩니다.

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

## 2. GitHub Pages 켜기 (필수 — 안 하면 deploy 404 오류)

Actions에서 `build`는 성공하는데 `deploy`가 **404 Not Found** 이면 이 단계가 빠진 것입니다.

1. 브라우저에서 열기:  
   **https://github.com/gnsanta-cloud/English_App/settings/pages**
2. **Build and deployment** → **Source** 를 반드시 **GitHub Actions** 로 선택  
   (❌ `Deploy from a branch` 가 아님)
3. 저장 후 **Actions** 탭 → 실패한 **Deploy to GitHub Pages** → **Re-run failed jobs**

> Private 저장소도 Pages 사용 가능합니다. 첫 설정 후 `github-pages` 환경이 자동 생성됩니다.

`main` 브랜치에 push하면 `.github/workflows/deploy-pages.yml` 이 자동 실행됩니다.

## 3. 접속 URL

배포가 끝나면:

```
https://gnsanta-cloud.github.io/English_App/
```

- Actions 탭에서 워크플로 ✅ 확인
- Pages 설정에 표시된 URL 확인

## 4. 문제 해결

| 증상 | 해결 |
|------|------|
| deploy **404** / `Ensure GitHub Pages has been enabled` | 위 **2번** — Settings → Pages → Source: **GitHub Actions** |
| build 실패 | Actions 로그에서 `npm ci` / `npm run build` 오류 확인 |
| 사이트 404 | deploy job 성공 여부 확인 후 URL 대소문자 확인 |

## 5. iPhone Safari — 홈 화면에 추가

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

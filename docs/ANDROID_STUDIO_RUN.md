# Android Studio에서 Run 버튼 활성화

## 1. 올바른 폴더 열기 (가장 중요)

**반드시 `android` 폴더만** 엽니다. 상위 `English_Hybrid_App` 루트를 열면 Run이 비활성화됩니다.

```
English_Hybrid_App/android   ← 이 폴더
```

터미널:

```powershell
cd English_Hybrid_App
npx cap open android
```

또는:

```powershell
.\scripts\setup-android-studio.ps1
```

## 2. local.properties

`android/local.properties` 파일이 있어야 합니다. 없으면 `local.properties.example`을 복사해 `sdk.dir` 경로를 수정합니다.

## 3. Gradle JDK

**File → Settings → Build, Execution, Deployment → Build Tools → Gradle**

- **Gradle JDK**: `Embedded JDK` 또는 `jbr-21` (Java 11 이상)

시스템 Java 8이면 동기화가 실패하고 Run이 비활성화됩니다.

## 4. Gradle Sync

메뉴 **File → Sync Project with Gradle Files** (또는 코끼리 아이콘 🐘 Sync).

하단 **Build** 탭에 에러가 없어야 합니다.

## 5. Run 설정

상단 툴바:

- 구성: **app**
- 기기: **Pixel_7** (에뮬레이터) 또는 연결된 폰

그다음 **Run ▶** (`Shift+F10`).

## 6. 에뮬레이터

**Tools → Device Manager** → Pixel_7 ▶ 실행.

## CLI로 실행 (Studio Run 대안)

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd android
.\gradlew installDebug
adb -s emulator-5554 shell am start -n com.english.hybridapp/.MainActivity
```

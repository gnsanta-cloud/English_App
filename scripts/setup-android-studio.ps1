# Android Studio Run 버튼 / Gradle sync용 환경 준비
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$android = Join-Path $root 'android'
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$jbr = 'C:\Program Files\Android\Android Studio\jbr'
$studio = 'C:\Program Files\Android\Android Studio\bin\studio64.exe'

if (-not (Test-Path $sdk)) {
  Write-Error "Android SDK not found: $sdk"
}

$localProps = Join-Path $android 'local.properties'
$sdkEscaped = $sdk -replace '\\', '\\'
"sdk.dir=$sdkEscaped" | Set-Content -Path $localProps -Encoding ASCII
Write-Host "Wrote $localProps"

$gradleProps = Join-Path $android 'gradle.properties'
$javaHomeLine = "org.gradle.java.home=$($jbr -replace '\\', '/')"
$content = Get-Content $gradleProps -Raw
if ($content -notmatch 'org\.gradle\.java\.home=') {
  Add-Content -Path $gradleProps -Value "`n$javaHomeLine"
  Write-Host "Added org.gradle.java.home to gradle.properties"
}

$env:JAVA_HOME = $jbr
$env:ANDROID_HOME = $sdk
$env:PATH = "$jbr\bin;$sdk\platform-tools;$env:PATH"

Push-Location $android
npm run build --prefix $root 2>$null | Out-Null
npx cap sync android --project $root 2>$null | Out-Null
.\gradlew --stop 2>$null | Out-Null
.\gradlew :app:assembleDebug
Pop-Location

if (Test-Path $studio) {
  Start-Process $studio -ArgumentList "`"$android`""
  Write-Host "Android Studio opened: $android"
} else {
  Write-Host "Open Android Studio manually: $android"
}

Write-Host "In Studio: Run configuration = app, device = Pixel_7 emulator"

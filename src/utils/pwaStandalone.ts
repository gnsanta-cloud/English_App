/** 홈 화면에 추가(PWA) 실행 여부 */
export function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function initStandaloneMode(): void {
  if (isStandalonePwa()) {
    document.documentElement.classList.add('standalone');
  }
}

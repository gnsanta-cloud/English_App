/** 주관식 답안 비교 (앞뒤 공백·연속 공백 정규화) */
export function normalizeQuizAnswer(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function isQuizAnswerCorrect(userAnswer: string, correctMeaning: string): boolean {
  return normalizeQuizAnswer(userAnswer) === normalizeQuizAnswer(correctMeaning);
}

/** 한→영: 영단어 비교 (대소문자 무시) */
export function isEnglishQuizAnswerCorrect(userAnswer: string, correctWord: string): boolean {
  return (
    normalizeQuizAnswer(userAnswer).toLowerCase() === normalizeQuizAnswer(correctWord).toLowerCase()
  );
}

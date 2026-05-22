import type { Word } from '../types';
import type { VideoKeyword } from './videoKeywords';
import { findWordInBank } from './words';
import { translateWordToKorean } from './translate';

export function buildScriptText(
  captions: { start: number; text: string; textKo: string }[],
): string {
  return captions
    .map((c) => {
      const m = Math.floor(c.start / 60);
      const s = Math.floor(c.start % 60)
        .toString()
        .padStart(2, '0');
      return `[${m}:${s}] ${c.text}\n${c.textKo}`;
    })
    .join('\n\n');
}

export async function keywordsToWords(
  keywords: VideoKeyword[],
  videoId: string,
  captionMap: Map<string, { exampleKo: string }>,
): Promise<Word[]> {
  const results: Word[] = [];

  for (const kw of keywords) {
    const bank = findWordInBank(kw.word);
    if (bank) {
      results.push(bank);
      continue;
    }

    const meaning = await translateWordToKorean(kw.word);
    const ko =
      captionMap.get(kw.example.toLowerCase())?.exampleKo ??
      '(영상 자막에서 추출)';

    results.push({
      id: `video-${videoId}-${kw.word.toLowerCase()}`,
      word: kw.word,
      meaning: meaning || kw.word,
      example: kw.example,
      exampleKo: ko,
      level: 'daily',
      fromVideo: true,
    });

    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

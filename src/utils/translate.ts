const BATCH_SEP = '\n|||LINE|||\n';
const MAX_CHUNK = 420;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type TranslatePair = 'en|ko' | 'ko|en';

async function translateChunk(text: string, langpair: TranslatePair): Promise<string> {
  const q = encodeURIComponent(text);
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${q}&langpair=${langpair}`,
  );
  if (!res.ok) throw new Error('번역 요청 실패');
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };
  if (data.responseStatus && data.responseStatus !== 200) {
    throw new Error('번역 서비스 응답 오류');
  }
  return data.responseData?.translatedText?.trim() ?? text;
}

/** 문장 배열 번역 (배치) */
export async function translateLines(
  lines: string[],
  langpair: TranslatePair,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const results: string[] = new Array(lines.length).fill('');
  let batch: { index: number; text: string }[] = [];
  let charCount = 0;

  const flush = async () => {
    if (batch.length === 0) return;
    const payload = batch.map((b) => b.text).join(BATCH_SEP);
    try {
      const translated = await translateChunk(payload, langpair);
      const parts = translated.split(/\s*\|\|\|LINE\|\|\|\s*/i);
      batch.forEach((b, i) => {
        results[b.index] = parts[i]?.trim() || b.text;
      });
    } catch {
      for (const b of batch) {
        try {
          results[b.index] = await translateChunk(b.text, langpair);
          await sleep(350);
        } catch {
          results[b.index] = '(번역 실패)';
        }
      }
    }
    onProgress?.(results.filter((r) => r).length, lines.length);
    batch = [];
    charCount = 0;
    await sleep(400);
  };

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    const addLen = text.length + BATCH_SEP.length;
    if (batch.length > 0 && charCount + addLen > MAX_CHUNK) await flush();

    batch.push({ index: i, text });
    charCount += addLen;

    if (batch.length >= 8) await flush();
  }
  await flush();

  return results;
}

/** 영어 → 한국어 */
export function translateLinesToKorean(
  lines: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  return translateLines(lines, 'en|ko', onProgress);
}

/** 한국어 → 영어 */
export function translateLinesToEnglish(
  lines: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  return translateLines(lines, 'ko|en', onProgress);
}

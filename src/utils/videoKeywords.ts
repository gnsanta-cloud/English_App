/** 영상 자막에서 학습용 주요 단어 추출 */

const STOP_WORDS = new Set([
  'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'there',
  'what', 'when', 'where', 'which', 'while', 'would', 'could', 'should', 'about',
  'into', 'your', 'you', 'our', 'are', 'was', 'for', 'and', 'the', 'but', 'not',
  'can', 'will', 'just', 'like', 'know', 'think', 'going', 'want', 'yeah', 'okay',
  'well', 'really', 'very', 'also', 'than', 'then', 'them', 'these', 'those', 'here',
  'how', 'why', 'who', 'its', "it's", "that's", "i'm", "you're", "we're", "don't",
  "didn't", "doesn't", "isn't", "aren't", "wasn't", "weren't", "can't", "won't",
  'one', 'two', 'get', 'got', 'say', 'said', 'tell', 'told', 'come', 'came', 'make',
  'made', 'take', 'took', 'see', 'saw', 'look', 'looking', 'thing', 'things', 'people',
  'something', 'anything', 'everything', 'because', 'maybe', 'actually', 'right', 'now',
]);

export interface VideoKeyword {
  word: string;
  count: number;
  example: string;
}

export function extractVideoKeywords(
  englishLines: string[],
  maxWords = 18,
): VideoKeyword[] {
  const freq = new Map<string, { count: number; example: string }>();

  for (const line of englishLines) {
    const clean = line.replace(/\[.*?\]/g, '').trim();
    if (!clean || clean === '번역 중…' || clean.startsWith('(')) continue;

    const tokens = clean.match(/[a-zA-Z']+/g) ?? [];
    for (let raw of tokens) {
      const w = raw.toLowerCase().replace(/^'+|'+$/g, '');
      if (w.length < 4 || STOP_WORDS.has(w)) continue;
      const prev = freq.get(w);
      if (prev) {
        prev.count += 1;
      } else {
        freq.set(w, { count: 1, example: clean });
      }
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxWords)
    .map(([word, { count, example }]) => ({
      word,
      count,
      example,
    }));
}

import { hasYoutubeCaptions } from './youtubeCaptions';
import { searchYoutube, type YoutubeVideoItem } from './youtubeSearch';

const SEARCH_QUERIES = [
  'english conversation lesson subtitles',
  'BBC Learning English',
  'TED talk english subtitles',
  'english listening practice beginner',
  'VOA Learning English',
  'english speaking practice short',
  '영어 회화 공부 english lesson',
  'english vocabulary story',
  'english podcast for learners',
  'daily english conversation',
];

/** 검색 실패 시 사용 (자막 있는 학습 영상으로 알려진 ID) */
const FALLBACK_VIDEOS: YoutubeVideoItem[] = [
  {
    videoId: 'mRR0z8Kbf6E',
    title: 'BBC Learning English - 6 Minute English',
    channel: 'BBC Learning English',
    thumbnailUrl: 'https://i.ytimg.com/vi/mRR0z8Kbf6E/mqdefault.jpg',
  },
  {
    videoId: 'Xqm1d_bRPYw',
    title: 'English Conversation Practice',
    channel: 'English Speaking Course',
    thumbnailUrl: 'https://i.ytimg.com/vi/Xqm1d_bRPYw/mqdefault.jpg',
  },
  {
    videoId: 'kizDm35y8K8',
    title: 'Learn English with Stories',
    channel: 'English Easy Practice',
    thumbnailUrl: 'https://i.ytimg.com/vi/kizDm35y8K8/mqdefault.jpg',
  },
  {
    videoId: '3z9R6YxEDZo',
    title: 'English Listening Practice',
    channel: 'English with Lucy',
    thumbnailUrl: 'https://i.ytimg.com/vi/3z9R6YxEDZo/mqdefault.jpg',
  },
  {
    videoId: 'R3uC76NrFgc',
    title: 'Everyday English Conversation',
    channel: 'Learn English with EnglishClass101',
    thumbnailUrl: 'https://i.ytimg.com/vi/R3uC76NrFgc/mqdefault.jpg',
  },
  {
    videoId: 'n4N0pU8d5Q4',
    title: 'English Speaking Practice',
    channel: 'POC English',
    thumbnailUrl: 'https://i.ytimg.com/vi/n4N0pU8d5Q4/mqdefault.jpg',
  },
  {
    videoId: 'p6E3R9V4VYw',
    title: 'English Listening Comprehension',
    channel: 'Learn English with Emma',
    thumbnailUrl: 'https://i.ytimg.com/vi/p6E3R9V4VYw/mqdefault.jpg',
  },
  {
    videoId: '9E6Wc-f74x0',
    title: 'Improve Your English Listening',
    channel: 'English with Lucy',
    thumbnailUrl: 'https://i.ytimg.com/vi/9E6Wc-f74x0/mqdefault.jpg',
  },
  {
    videoId: 'aY7bZgL8ovk',
    title: 'English Conversation for Beginners',
    channel: 'Learn English with Jessica',
    thumbnailUrl: 'https://i.ytimg.com/vi/aY7bZgL8ovk/mqdefault.jpg',
  },
  {
    videoId: 'H2f7MZaw3zE',
    title: 'Learn English Through Stories',
    channel: 'English Story',
    thumbnailUrl: 'https://i.ytimg.com/vi/H2f7MZaw3zE/mqdefault.jpg',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function filterWithCaptions(
  candidates: YoutubeVideoItem[],
  need: number,
  tried: Set<string>,
): Promise<YoutubeVideoItem[]> {
  const ok: YoutubeVideoItem[] = [];
  for (const v of candidates) {
    if (ok.length >= need) break;
    if (tried.has(v.videoId)) continue;
    tried.add(v.videoId);
    try {
      if (await hasYoutubeCaptions(v.videoId)) ok.push(v);
    } catch {
      /* skip */
    }
  }
  return ok;
}

/** 앱/탭 열 때마다 YouTube에서 자막 가능 영상 10개 검색 */
export async function fetchCaptionFriendlyVideos(count = 10): Promise<YoutubeVideoItem[]> {
  const tried = new Set<string>();
  const results: YoutubeVideoItem[] = [];
  const queries = shuffle(SEARCH_QUERIES);

  for (const query of queries) {
    if (results.length >= count) break;
    try {
      const found = await searchYoutube(query, 18);
      const added = await filterWithCaptions(found, count - results.length, tried);
      results.push(...added);
    } catch {
      continue;
    }
  }

  if (results.length < count) {
    const fallback = shuffle(FALLBACK_VIDEOS);
    const added = await filterWithCaptions(fallback, count - results.length, tried);
    results.push(...added);
  }

  if (results.length < count) {
    for (const v of shuffle(FALLBACK_VIDEOS)) {
      if (results.length >= count) break;
      if (!results.some((r) => r.videoId === v.videoId)) results.push(v);
    }
  }

  return results.slice(0, count);
}

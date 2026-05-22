/** YouTube 검색 (Innertube API) */

const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHL6lNFOKAs_AhrUe8';

const ANDROID_CONTEXT = {
  client: { clientName: 'ANDROID', clientVersion: '19.09.37', hl: 'en', gl: 'US' },
};

export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
}

function getText(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return '';
  const o = obj as { simpleText?: string; runs?: { text?: string }[] };
  if (o.simpleText) return o.simpleText;
  if (o.runs?.length) return o.runs.map((r) => r.text ?? '').join('');
  return '';
}

function extractFromRenderer(renderer: Record<string, unknown>): YoutubeVideoItem | null {
  const videoId = renderer.videoId as string | undefined;
  if (!videoId || videoId.length !== 11) return null;

  const title = getText(renderer.title);
  const channel =
    getText(renderer.ownerText) ||
    getText(renderer.longBylineText) ||
    getText(renderer.shortBylineText) ||
    'YouTube';

  const thumbs = renderer.thumbnail as { thumbnails?: { url?: string }[] } | undefined;
  const thumbnailUrl =
    thumbs?.thumbnails?.[thumbs.thumbnails.length - 1]?.url ??
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  if (!title) return null;

  return { videoId, title, channel, thumbnailUrl };
}

function collectVideos(node: unknown, out: YoutubeVideoItem[], seen: Set<string>) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectVideos(item, out, seen);
    return;
  }

  const o = node as Record<string, unknown>;
  if (o.videoRenderer && typeof o.videoRenderer === 'object') {
    const v = extractFromRenderer(o.videoRenderer as Record<string, unknown>);
    if (v && !seen.has(v.videoId)) {
      seen.add(v.videoId);
      out.push(v);
    }
  }

  for (const value of Object.values(o)) {
    collectVideos(value, out, seen);
  }
}

export async function searchYoutube(query: string, limit = 20): Promise<YoutubeVideoItem[]> {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/search?key=${INNERTUBE_KEY}&prettyPrint=false`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: ANDROID_CONTEXT,
        query,
      }),
    },
  );

  if (!res.ok) throw new Error('YouTube 검색에 실패했습니다.');

  const data = await res.json();
  const found: YoutubeVideoItem[] = [];
  const seen = new Set<string>();
  collectVideos(data, found, seen);
  return found.slice(0, limit);
}

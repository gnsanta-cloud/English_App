import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoCaptionLine } from '../types';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { parseYoutubeVideoId } from '../utils/youtube';
import { fetchYoutubeCaptions } from '../utils/youtubeCaptions';
import { translateLinesToKorean } from '../utils/translate';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoLearnTab() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [captions, setCaptions] = useState<VideoCaptionLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const playerHostRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);

  const { ready, playing, currentTime, loadVideo, seekTo } = useYouTubePlayer(playerHostRef);

  const activeIndex = captions.findIndex(
    (c) => currentTime >= c.start && currentTime < c.start + c.duration,
  );

  useEffect(() => {
    if (activeIndex < 0 || !scriptRef.current) return;
    const el = scriptRef.current.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  const handlePlay = useCallback(async () => {
    const id = parseYoutubeVideoId(url);
    if (!id) {
      setError('YouTube 링크 또는 11자리 영상 ID를 입력해 주세요.');
      return;
    }

    setError(null);
    setLoading(true);
    setCaptions([]);
    setVideoId(null);

    try {
      const raw = await fetchYoutubeCaptions(id);
      const baseLines: VideoCaptionLine[] = raw.map((line) => ({
        ...line,
        id: uid(),
        textKo: '번역 중…',
      }));
      setCaptions(baseLines);
      setVideoId(id);
      await loadVideo(id);

      setTranslating(true);
      setTranslateProgress('0%');
      void translateLinesToKorean(
        baseLines.map((c) => c.text),
        (done, total) => setTranslateProgress(`${Math.round((done / total) * 100)}%`),
      )
        .then((ko) => {
          setCaptions((prev) =>
            prev.map((line, i) => ({ ...line, textKo: ko[i] ?? line.textKo })),
          );
        })
        .catch(() => {
          setCaptions((prev) =>
            prev.map((line) => ({
              ...line,
              textKo: line.textKo === '번역 중…' ? '(번역 실패)' : line.textKo,
            })),
          );
        })
        .finally(() => {
          setTranslating(false);
          setTranslateProgress('');
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : '영상을 불러오지 못했습니다.');
      setVideoId(null);
    } finally {
      setLoading(false);
    }
  }, [url, loadVideo]);

  return (
    <section className="video-learn-tab">
      <div className="video-url-bar">
        <input
          type="url"
          className="video-url-input"
          placeholder="YouTube 링크 붙여넣기 (예: https://youtu.be/...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handlePlay()}
          enterKeyHint="go"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          type="button"
          className="video-play-btn"
          onClick={() => void handlePlay()}
          disabled={loading || !url.trim()}
        >
          {loading ? '불러오는 중…' : '▶ 재생'}
        </button>
      </div>

      {error && <p className="video-error">{error}</p>}

      <div className="video-player-wrap">
        <div
          ref={playerHostRef}
          className={`video-player-host ${videoId ? 'active' : ''}`}
          aria-label="YouTube 영상 플레이어"
        />
        {!videoId && !loading && (
          <div className="video-player-placeholder">
            <span>🎬</span>
            <p>링크 입력 후 재생 버튼을 눌러 주세요</p>
            <small>YouTube 자막(영어)이 있는 영상만 지원합니다</small>
          </div>
        )}
      </div>

      {videoId && (
        <div className="video-meta">
          <span>{ready ? (playing ? '재생 중' : '일시정지') : '플레이어 준비 중'}</span>
          {translating && <span className="video-translate-status">번역 {translateProgress}</span>}
        </div>
      )}

      <div className="video-script-panel" ref={scriptRef}>
        <h3 className="video-script-title">자막 · 번역</h3>
        {captions.length === 0 && !loading && (
          <p className="video-script-empty">재생하면 영어 자막과 한국어 번역이 표시됩니다.</p>
        )}
        {captions.map((line, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={line.id}
              type="button"
              data-line={index}
              className={`video-script-line ${active ? 'active' : ''}`}
              onClick={() => {
                seekTo(line.start);
              }}
            >
              <span className="video-script-time">{formatTime(line.start)}</span>
              <span className="video-script-en">{line.text}</span>
              <span className="video-script-ko">{line.textKo}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

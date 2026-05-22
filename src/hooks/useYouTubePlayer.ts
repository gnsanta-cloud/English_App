import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YtPlayer }) => void;
            onStateChange?: (e: { data: number; target: YtPlayer }) => void;
          };
        },
      ) => YtPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YtPlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

let apiPromise: Promise<void> | null = null;

function loadYoutubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existing) {
      const check = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        if (!window.YT?.Player) reject(new Error('YouTube API 로드 실패'));
      }, 10000);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => reject(new Error('YouTube API 스크립트 로드 실패'));
    document.head.appendChild(tag);
  });

  return apiPromise;
}

export function useYouTubePlayer(containerRef: React.RefObject<HTMLDivElement | null>) {
  const playerRef = useRef<YtPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const destroyPlayer = useCallback(() => {
    playerRef.current?.destroy();
    playerRef.current = null;
    if (containerRef.current) containerRef.current.innerHTML = '';
    setReady(false);
    setPlaying(false);
    setCurrentTime(0);
  }, [containerRef]);

  const loadVideo = useCallback(
    async (videoId: string) => {
      destroyPlayer();
      await loadYoutubeIframeApi();
      const el = containerRef.current;
      if (!el || !window.YT?.Player) throw new Error('플레이어를 초기화할 수 없습니다.');

      return new Promise<YtPlayer>((resolve, reject) => {
        try {
          const player = new window.YT!.Player(el, {
            videoId,
            width: '100%',
            height: '100%',
            playerVars: {
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              enablejsapi: 1,
            },
            events: {
              onReady: (e) => {
                playerRef.current = e.target;
                setReady(true);
                resolve(e.target);
              },
              onStateChange: (e) => {
                const YT = window.YT!;
                setPlaying(e.data === YT.PlayerState.PLAYING);
              },
            },
          });
          void player;
        } catch (err) {
          reject(err);
        }
      });
    },
    [containerRef, destroyPlayer],
  );

  useEffect(() => {
    if (!ready || !playing) return;

    const id = window.setInterval(() => {
      const t = playerRef.current?.getCurrentTime();
      if (typeof t === 'number' && !Number.isNaN(t)) setCurrentTime(t);
    }, 250);

    return () => window.clearInterval(id);
  }, [ready, playing]);

  useEffect(() => () => destroyPlayer(), [destroyPlayer]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);

  return {
    ready,
    playing,
    currentTime,
    loadVideo,
    destroyPlayer,
    seekTo,
    play,
    pause,
  };
}

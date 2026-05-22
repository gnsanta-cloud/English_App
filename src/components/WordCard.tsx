import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import type { Word } from '../types';
import { speakEnglish } from '../utils/speech';

interface WordCardProps {
  word: Word;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  saved: boolean;
}

const SWIPE_THRESHOLD = 80;
const TAP_THRESHOLD = 24;

export function WordCard({ word, onSwipeLeft, onSwipeRight, onSwipeUp, saved }: WordCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    setFlipped(false);
  }, [word.id]);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speaking) return;
    setSpeaking(true);
    try {
      await speakEnglish(word.word);
    } finally {
      setSpeaking(false);
    }
  };

  const handleFlipTap = () => {
    setFlipped((v) => !v);
  };

  const resetPosition = () => {
    animate(x, 0, { type: 'spring', stiffness: 320, damping: 28 });
    animate(y, 0, { type: 'spring', stiffness: 320, damping: 28 });
  };

  const flyOff = (dir: 'left' | 'right' | 'up', callback: () => void) => {
    const targets =
      dir === 'left'
        ? { x: -window.innerWidth * 1.2, y: 0 }
        : dir === 'right'
          ? { x: window.innerWidth * 1.2, y: 0 }
          : { x: 0, y: -window.innerHeight * 0.8 };

    Promise.all([
      animate(x, targets.x, { duration: 0.38, ease: [0.32, 0.72, 0, 1] }),
      animate(y, targets.y, { duration: 0.38, ease: [0.32, 0.72, 0, 1] }),
    ]).then(() => {
      setFlipped(false);
      callback();
      x.set(0);
      y.set(0);
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointerStart.current || didDrag.current) {
      pointerStart.current = null;
      return;
    }
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    pointerStart.current = null;
    if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) handleFlipTap();
  };

  const onDragStart = () => {
    didDrag.current = true;
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    if (absX < TAP_THRESHOLD && absY < TAP_THRESHOLD) {
      handleFlipTap();
      resetPosition();
      return;
    }

    if (absY > absX && (offset.y < -SWIPE_THRESHOLD || velocity.y < -400)) {
      flyOff('up', onSwipeUp);
      return;
    }
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -400) {
      flyOff('left', onSwipeLeft);
      return;
    }
    if (offset.x > SWIPE_THRESHOLD || velocity.x > 400) {
      flyOff('right', onSwipeRight);
      return;
    }
    resetPosition();
  };

  return (
    <div className="card-stage">
      <motion.div
        className="card-drag-wrapper"
        style={{ x, y }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        key={word.id}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className={`flip-container ${flipped ? 'is-flipped' : ''}`}>
          <div className="flip-inner">
            <div className="flip-face flip-front">
              {saved && <span className="saved-badge">저장됨</span>}
              <div className="flip-front-main">
                <div className="card-header">
                  <h2 className="word-text">{word.word}</h2>
                  <button
                    type="button"
                    className="speaker-btn"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleSpeak}
                    aria-label="원어민 발음 듣기"
                    disabled={speaking}
                  >
                    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flip-front-footer">
                <div className="swipe-hints">
                  <span>← 다음</span>
                  <span>↑ 저장</span>
                  <span>→ 이전</span>
                </div>
                <button
                  type="button"
                  className="flip-action-btn"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFlipTap();
                  }}
                >
                  뜻 · 예문 보기
                </button>
              </div>
            </div>

            <div className="flip-face flip-back">
              <div className="flip-back-content">
                <p className="back-label">뜻</p>
                <p className="meaning-text">{word.meaning}</p>
                <div className="example-block">
                  <p className="back-label">예문</p>
                  <p className="example-en">{word.example}</p>
                  <p className="example-ko">{word.exampleKo}</p>
                </div>
              </div>
              <button
                type="button"
                className="flip-action-btn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlipTap();
                }}
              >
                앞면으로
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

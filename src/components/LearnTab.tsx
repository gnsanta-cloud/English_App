import type { Word } from '../types';
import { WordCard } from './WordCard';

interface LearnTabProps {
  word: Word | null;
  levelLabel: string;
  index: number;
  total: number;
  saved: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
}

export function LearnTab({
  word,
  levelLabel,
  index,
  total,
  saved,
  onNext,
  onPrevious,
  onSave,
}: LearnTabProps) {
  if (!word) {
    return (
      <div className="empty-state">
        <p>단어가 없습니다.</p>
      </div>
    );
  }

  return (
    <section className="learn-tab">
      <header className="learn-header">
        <span className="level-chip">{levelLabel}</span>
        <span className="progress-text">
          {index + 1} / {total}
        </span>
      </header>
      <WordCard
        word={word}
        onSwipeLeft={onNext}
        onSwipeRight={onPrevious}
        onSwipeUp={onSave}
        saved={saved}
      />
    </section>
  );
}

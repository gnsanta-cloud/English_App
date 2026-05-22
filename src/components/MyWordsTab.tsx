import type { Word } from '../types';
import { speakEnglish } from '../utils/speech';

interface MyWordsTabProps {
  savedWords: Word[];
  onRemove: (wordId: string) => void;
}

export function MyWordsTab({ savedWords, onRemove }: MyWordsTabProps) {
  if (savedWords.length === 0) {
    return (
      <section className="mywords-tab">
        <h2>나의 단어장</h2>
        <p className="empty-hint">
          카드 스와이프나 퀴즈 오답 시 단어가 여기에 저장됩니다.
        </p>
      </section>
    );
  }

  return (
    <section className="mywords-tab">
      <h2>나의 단어장 ({savedWords.length})</h2>
      <ul className="mywords-list">
        {savedWords.map((w) => (
          <li key={w.id} className="myword-item">
            <div className="myword-main">
              <strong>{w.word}</strong>
              <span>{w.meaning}</span>
            </div>
            <div className="myword-actions">
              <button type="button" onClick={() => speakEnglish(w.word)} aria-label="발음">
                🔊
              </button>
              <button type="button" className="remove-btn" onClick={() => onRemove(w.id)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

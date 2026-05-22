import type { TabId } from '../types';

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'learn', label: '학습', icon: '📖' },
  { id: 'quiz', label: '퀴즈', icon: '✏️' },
  { id: 'conversation', label: 'AI', icon: '🤖' },
  { id: 'mywords', label: '단어', icon: '📚' },
  { id: 'settings', label: '설정', icon: '⚙️' },
];

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

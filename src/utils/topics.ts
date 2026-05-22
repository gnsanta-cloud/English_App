import type { LearningLevel } from '../types';

export interface TopicInfo {
  id: LearningLevel;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
}

export const TOPICS: TopicInfo[] = [
  {
    id: 'middle',
    title: '중학 단어',
    subtitle: '중학교 기초 영단어',
    icon: '📗',
    accent: '#4f46e5',
  },
  {
    id: 'high',
    title: '고등 단어',
    subtitle: '고등학교 필수 영단어',
    icon: '📘',
    accent: '#0891b2',
  },
  {
    id: 'daily',
    title: '일상 패턴',
    subtitle: '실생활 영어 회화 표현',
    icon: '💬',
    accent: '#16a34a',
  },
  {
    id: 'travel',
    title: '여행 대화',
    subtitle: '공항·호텔·관광 필수 영어',
    icon: '✈️',
    accent: '#ea580c',
  },
];

export function getTopicInfo(level: LearningLevel): TopicInfo {
  return TOPICS.find((t) => t.id === level) ?? TOPICS[0];
}

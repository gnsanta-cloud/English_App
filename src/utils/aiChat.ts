import type { LearningLevel } from '../types';

interface ChatContext {
  level: LearningLevel;
  userName?: string;
}

const GREETINGS = [
  "Hi! I'm Julia, your English tutor. What would you like to talk about today?",
  "Hello! Ready to practice English together?",
];

const LEVEL_HINT: Record<LearningLevel, string> = {
  middle: 'middle school',
  high: 'high school',
  daily: 'daily conversation',
  travel: 'travel English',
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectIntent(text: string): string {
  const t = text.toLowerCase().trim();
  if (/^(hi|hello|hey|안녕)/.test(t)) return 'greet';
  if (/how are you|어떻게|잘 지내/.test(t)) return 'howareyou';
  if (/thank|thanks|감사/.test(t)) return 'thanks';
  if (/bye|goodbye|잘 가|안녕히/.test(t)) return 'bye';
  if (/help|도움|어떻게 사용/.test(t)) return 'help';
  if (/translate|뜻|meaning|무슨 뜻/.test(t)) return 'translate';
  if (/practice|연습|말하기/.test(t)) return 'practice';
  if (/quiz|퀴즈|테스트/.test(t)) return 'quiz';
  if (/weather|날씨/.test(t)) return 'topic_weather';
  if (/food|eat|음식|먹/.test(t)) return 'topic_food';
  if (/school|학교|study|공부/.test(t)) return 'topic_school';
  if (/travel|trip|airport|hotel|flight|여행|공항|호텔|비행/.test(t)) return 'topic_travel';
  if (t.includes('?')) return 'question';
  if (t.split(/\s+/).length <= 3) return 'short';
  return 'general';
}

function buildPracticePrompt(level: LearningLevel): string {
  const samples: Record<LearningLevel, string[]> = {
    middle: [
      'Try saying: "I study English every day."',
      'Can you make a sentence with the word "friend"?',
      'Describe your favorite food in one sentence.',
    ],
    high: [
      'Try using "significant" in a sentence about your life.',
      'Explain your future goal in two English sentences.',
      'What is an important issue at school? Answer in English.',
    ],
    daily: [
      'Practice ordering: "I would like a coffee, please."',
      'How would you ask for directions in English?',
      'Role-play: greet a shop clerk politely.',
    ],
    travel: [
      'Try saying: "Where is the boarding gate?"',
      'Practice check-in: "I have a reservation."',
      'How would you ask for help if you lost your passport?',
    ],
  };
  return pick(samples[level]);
}

export function getInitialMessage(): { text: string; textKo: string } {
  return {
    text: GREETINGS[0],
    textKo: '안녕! 나는 영어 튜터 Julia야. 오늘 무엇을 이야기해 볼까?',
  };
}

export async function getAiReply(
  userText: string,
  ctx: ChatContext,
): Promise<{ text: string; textKo?: string }> {
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));

  const intent = detectIntent(userText);
  const level = LEVEL_HINT[ctx.level];

  switch (intent) {
    case 'greet':
      return {
        text: `Hello! I'm Julia. Let's practice ${level} English together. Tell me about your day!`,
        textKo: '안녕! 같이 영어 연습해요. 오늘 하루를 영어로 말해 볼까요?',
      };
    case 'howareyou':
      return {
        text: "I'm great, thank you! How are you feeling today? Try answering in English.",
        textKo: '좋아요! 오늘 기분이 어때요? 영어로 답해 보세요.',
      };
    case 'thanks':
      return {
        text: "You're welcome! Keep practicing — you're doing well.",
        textKo: '천만에요! 계속 연습하면 실력이 늘어요.',
      };
    case 'bye':
      return {
        text: 'Goodbye! See you next time. Great job today!',
        textKo: '안녕히 가세요! 다음에 또 만나요. 오늘도 잘했어요!',
      };
    case 'help':
      return {
        text: 'You can: chat in English, ask meanings, or say "practice" for exercises. I will correct simple mistakes gently.',
        textKo: '영어로 대화하고, 단어 뜻을 물어보고, "practice"라고 하면 연습 문제를 줄게요.',
      };
    case 'practice':
      return {
        text: buildPracticePrompt(ctx.level),
        textKo: '아래 문장을 따라 말해 보세요!',
      };
    case 'quiz':
      return {
        text: 'Go to the Quiz tab to test your vocabulary! Wrong answers are saved to My Words.',
        textKo: '퀴즈 탭에서 단어를 테스트해 보세요. 틀린 단어는 나의 단어장에 저장돼요.',
      };
    case 'translate':
      return {
        text: 'Tell me the word or sentence, and I will help you express it in natural English.',
        textKo: '단어나 문장을 알려주면 자연스러운 영어 표현을 도와줄게요.',
      };
    case 'topic_weather':
      return {
        text: 'The weather is nice today. How is the weather where you are?',
        textKo: '오늘 날씨가 좋네요. 지금 있는 곳 날씨는 어때요?',
      };
    case 'topic_food':
      return {
        text: 'I love Korean food! What did you eat today? Try describing it in English.',
        textKo: '한국 음식 좋아해요! 오늘 뭘 먹었어요? 영어로 설명해 보세요.',
      };
    case 'topic_school':
      return {
        text: 'School is a great place to learn. What is your favorite subject?',
        textKo: '학교는 배우기 좋은 곳이에요. 가장 좋아하는 과목이 뭐예요?',
      };
    case 'topic_travel':
      return {
        text: 'Travel English is fun! Where are you going? Try asking: "How do I get to the hotel?"',
        textKo: '여행 영어를 연습해 봐요! "How do I get to the hotel?"처럼 말해 보세요.',
      };
    case 'question':
      return {
        text: `Good question! For ${level} level: try answering in full sentences. ${buildPracticePrompt(ctx.level)}`,
        textKo: '좋은 질문이에요! 완전한 문장으로 답해 보세요.',
      };
    case 'short':
      return {
        text: `Good start! Can you make a longer sentence? For example, add "I think..." or "because..."`,
        textKo: '좋아요! "I think..." 나 "because..."를 붙여서 문장을 길게 만들어 보세요.',
      };
    default: {
      const reply = correctAndRespond(userText);
      return reply;
    }
  }
}

function correctAndRespond(text: string): { text: string; textKo?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { text: 'Please type a message in English or Korean.', textKo: '영어나 한국어로 메시지를 입력해 주세요.' };
  }

  const fixes: [RegExp, string, string?][] = [
    [/\bi am go\b/i, 'I am going', '→ "I am going" 이 더 자연스러워요.'],
    [/\bhe are\b/i, 'he is', '→ 주어가 he이면 is를 써요.'],
    [/\bshe are\b/i, 'she is'],
    [/\bthey is\b/i, 'they are'],
    [/\byesterday i go\b/i, 'yesterday I went', '→ 과거는 went를 사용해요.'],
    [/\bdon't has\b/i, "don't have"],
    [/\bmore better\b/i, 'better', '→ better만 쓰면 돼요 (more 없이).'],
  ];

  let tip: string | undefined;
  for (const [pattern, fix, hint] of fixes) {
    if (pattern.test(trimmed)) {
      tip = hint ?? `→ "${fix}" expression is more natural.`;
      break;
    }
  }

  const responses = [
    `I understand! You said: "${trimmed}". ${tip ?? 'That sounds good! Can you tell me more?'}`,
    `Nice! ${tip ?? 'Keep going — try adding one more sentence.'}`,
    `${tip ?? 'Great effort!'} What do you think about that?`,
  ];

  return {
    text: responses[Math.floor(Math.random() * responses.length)],
    textKo: tip ?? '잘하고 있어요! 한 문장 더 이어서 말해 보세요.',
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, LearningLevel } from '../types';
import { getAiReply, getInitialMessage } from '../utils/aiChat';
import { speakEnglish } from '../utils/speech';
import { useBackHandler } from '../hooks/useAndroidBackButton';
import { listenOnce, requestMicPermission, startListening } from '../utils/speechRecognition';

interface AvatarChatTabProps {
  level: LearningLevel;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AvatarChatTab({ level }: AvatarChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micReady, setMicReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const voiceModeRef = useRef(false);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    const init = getInitialMessage();
    setMessages([{ id: uid(), role: 'assistant', text: init.text, textKo: init.textKo }]);
    requestMicPermission().then(setMicReady);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, liveTranscript]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = { id: uid(), role: 'user', text: trimmed };
      setMessages((m) => [...m, userMsg]);
      setInput('');
      setLiveTranscript('');
      setLoading(true);

      try {
        const reply = await getAiReply(trimmed, { level });
        const botMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          text: reply.text,
          textKo: reply.textKo,
        };
        setMessages((m) => [...m, botMsg]);
        await speakEnglish(reply.text);
      } finally {
        setLoading(false);
      }
    },
    [level, loading],
  );

  const stopListening = useCallback(() => {
    stopListenRef.current?.();
    stopListenRef.current = null;
    setListening(false);
  }, []);

  const beginVoiceMode = useCallback(async () => {
    const ok = await requestMicPermission();
    setMicReady(ok);
    if (!ok) {
      alert('마이크 권한을 허용해야 말로 대화할 수 있습니다.');
      return;
    }
    setVoiceMode(true);
    setListening(true);
    setLiveTranscript('');

    let debounceId: ReturnType<typeof setTimeout> | null = null;

    const stop = await startListening(
      (text, isFinal) => {
        setLiveTranscript(text);
        if (!text.trim() || !voiceModeRef.current) return;

        if (isFinal) {
          if (debounceId) clearTimeout(debounceId);
          sendMessage(text);
          return;
        }

        if (debounceId) clearTimeout(debounceId);
        debounceId = setTimeout(() => {
          if (voiceModeRef.current && text.trim()) sendMessage(text);
        }, 1800);
      },
      (err) => {
        if (err) alert(err);
        setVoiceMode(false);
        setListening(false);
      },
    );
    stopListenRef.current = stop;
  }, [sendMessage]);

  const endVoiceMode = useCallback(() => {
    stopListening();
    setVoiceMode(false);
    setLiveTranscript('');
  }, [stopListening]);

  useBackHandler(() => {
    if (voiceMode) {
      endVoiceMode();
      return true;
    }
    return false;
  }, voiceMode);

  const handlePushToTalkStart = async () => {
    if (loading || listening) return;
    const ok = await requestMicPermission();
    if (!ok) {
      alert('마이크 권한을 허용해 주세요.');
      return;
    }
    setListening(true);
    setLiveTranscript('듣는 중...');
    try {
      const text = await listenOnce();
      setLiveTranscript('');
      setListening(false);
      if (text.trim()) await sendMessage(text);
    } catch {
      setListening(false);
      setLiveTranscript('');
    }
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  const quickPrompts = ['Hello!', 'Help me practice', 'How are you?', 'I want to order coffee'];

  return (
    <section className="avatar-chat-tab">
      <div className="avatar-chat-body">
        <div className="avatar-chat-header">
          <img src="./avatar.png" alt="Julia AI 튜터" className="avatar-img" />
          <div className="avatar-chat-header-text">
            <h2>Julia AI 대화</h2>
            <p>{voiceMode ? '말하면 Julia가 영어로 답해요' : '영어로 말하거나 입력하세요'}</p>
          </div>
        </div>

        {!micReady && (
          <p className="mic-warning">마이크 권한을 허용하면 말로 대화할 수 있어요.</p>
        )}

        <div className="voice-mode-bar">
          {voiceMode ? (
            <button type="button" className="voice-mode-btn active" onClick={endVoiceMode}>
              <span className="voice-mode-btn-label">말하기 종료</span>
            </button>
          ) : (
            <button
              type="button"
              className="voice-mode-btn"
              onClick={beginVoiceMode}
              disabled={loading || !micReady}
            >
              <span className="voice-mode-btn-label">말로 대화하기</span>
            </button>
          )}
          {listening && voiceMode && (
            <span className="listening-pulse">듣는 중...</span>
          )}
        </div>

        {liveTranscript && (
          <div className="live-transcript">
            <span>{liveTranscript}</span>
          </div>
        )}

        <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            {msg.role === 'assistant' && (
              <img src="./avatar.png" alt="" className="bubble-avatar" />
            )}
            <div className="bubble-body">
              <p className="bubble-en">{msg.text}</p>
              {msg.textKo && <p className="bubble-ko">{msg.textKo}</p>}
              {msg.role === 'assistant' && (
                <button
                  type="button"
                  className="bubble-speak"
                  onClick={() => speakEnglish(msg.text)}
                  aria-label="Julia 말하기"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant typing">
            <img src="./avatar.png" alt="" className="bubble-avatar" />
            <div className="bubble-body">
              <span className="typing-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
        </div>
      </div>

      <div className="avatar-chat-footer">
        <div className="quick-prompts">
          {quickPrompts.map((p) => (
            <button key={p} type="button" className="prompt-chip" onClick={() => sendMessage(p)}>
              {p}
            </button>
          ))}
        </div>

        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <button
            type="button"
            className={`voice-btn ${listening ? 'active' : ''}`}
            onClick={handlePushToTalkStart}
            disabled={loading || voiceMode}
            aria-label="누르고 말하기"
          >
            <span aria-hidden="true">🎤</span>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voiceMode ? '말하기 모드' : '영어로 입력...'}
            disabled={loading || voiceMode}
            enterKeyHint="send"
            autoComplete="off"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={loading || voiceMode || !input.trim()}
            aria-label="전송"
          >
            <span className="send-btn-icon" aria-hidden="true">
              ↑
            </span>
            <span className="send-btn-text">전송</span>
          </button>
        </form>
      </div>
    </section>
  );
}

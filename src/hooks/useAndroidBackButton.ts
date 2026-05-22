import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/** true를 반환하면 뒤로가기를 처리한 것으로 간주 */
type BackHandler = () => boolean;

const handlers: BackHandler[] = [];
let fallbackHandler: BackHandler = () => false;
let listenerInstalled = false;

function runHandlers(): void {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return;
  }
  fallbackHandler();
}

export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  };
}

export function setAndroidBackFallback(handler: BackHandler) {
  fallbackHandler = handler;
}

export function useBackHandler(handler: BackHandler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    return registerBackHandler(() => handlerRef.current());
  }, [enabled]);
}

export function installAndroidBackButton() {
  if (listenerInstalled || Capacitor.getPlatform() !== 'android') return;
  listenerInstalled = true;

  void App.addListener('backButton', () => {
    runHandlers();
  });
}

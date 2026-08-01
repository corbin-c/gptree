import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "gptree-panel-state";

export interface PanelState {
  isOpen: boolean;
  width: number;
}

const DEFAULT_STATE: PanelState = {
  isOpen: false,
  width: Math.max(320, Math.floor(window.innerWidth * 0.5)),
};

function loadState(): PanelState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_STATE;
}

export function usePanelState() {
  const [state, setState] = useState<PanelState>(loadState);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  const toggle = useCallback(() => {
    setState((s) => ({ ...s, isOpen: !s.isOpen }));
  }, []);

  const setWidth = useCallback((width: number) => {
    setState((s) => ({ ...s, width }));
  }, []);

  return { ...state, toggle, setWidth };
}

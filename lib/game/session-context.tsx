"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSession, type SessionAccountDto } from "@/lib/api-client";

const STORAGE_KEY = "game.session.token";

type SessionState = {
  token: string | null;
  account: SessionAccountDto | null;
  isReady: boolean;
  setSession: (input: { token: string; account?: SessionAccountDto | null }) => void;
  clearSession: () => void;
  refreshSession: () => Promise<boolean>;
};

const SessionContext = createContext<SessionState | null>(null);

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  return raw?.trim() ? raw : null;
}

function writeToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, token);
}

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<SessionAccountDto | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(() => {
    writeToken(null);
    setToken(null);
    setAccount(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const currentToken = readToken();
    if (!currentToken) {
      clearSession();
      return false;
    }

    const result = await getSession(currentToken);
    if (!result.ok) {
      clearSession();
      return false;
    }

    setToken(currentToken);
    setAccount(result.data);
    return true;
  }, [clearSession]);

  useEffect(() => {
    void (async () => {
      const currentToken = readToken();
      if (!currentToken) {
        setIsReady(true);
        return;
      }

      const result = await getSession(currentToken);
      if (!result.ok) {
        clearSession();
        setIsReady(true);
        return;
      }

      setToken(currentToken);
      setAccount(result.data);
      setIsReady(true);
    })();
  }, [clearSession]);

  const setSession = useCallback((input: { token: string; account?: SessionAccountDto | null }) => {
    writeToken(input.token);
    setToken(input.token);
    setAccount(input.account ?? null);
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      token,
      account,
      isReady,
      setSession,
      clearSession,
      refreshSession,
    }),
    [account, clearSession, isReady, refreshSession, setSession, token],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useGameSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useGameSession must be used inside GameSessionProvider.");
  }
  return value;
}

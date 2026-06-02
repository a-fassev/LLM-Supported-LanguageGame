"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBootstrap, type BootstrapDto } from "@/lib/api-client";
import { useGameSession } from "@/lib/game/session-context";
import { useMountedRef } from "@/lib/game/use-mounted-ref";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";

const FOCUS_RELOAD_MIN_MS = 5_000;

export type UseBootstrapResult = {
  /** True only while waiting for the first successful load (no cached data yet). */
  loading: boolean;
  /** True during background refresh when stale data is still shown. */
  refreshing: boolean;
  error: string | null;
  data: BootstrapDto | null;
  reload: () => Promise<void>;
};

export function useBootstrap(options?: { refreshOnFocus?: boolean }): UseBootstrapResult {
  const router = useRouter();
  const { token, clearSession } = useGameSession();
  const mountedRef = useMountedRef();
  const dataRef = useRef<BootstrapDto | null>(null);
  const lastReloadAtRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BootstrapDto | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const reload = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const isInitial = dataRef.current === null;
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    const result = await getBootstrap(token);
    lastReloadAtRef.current = Date.now();
    if (!mountedRef.current) return;

    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        setLoading(false);
        setRefreshing(false);
        router.replace("/login");
        return;
      }
      toastBlockingApiError(result);
      setError(result.error);
      if (isInitial) {
        setData(null);
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setData(result.data);
    setLoading(false);
    setRefreshing(false);
  }, [clearSession, mountedRef, router, token]);

  useEffect(() => {
    void (async () => {
      await reload();
    })();
  }, [reload]);

  useEffect(() => {
    if (!options?.refreshOnFocus) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const elapsed = Date.now() - lastReloadAtRef.current;
      if (elapsed < FOCUS_RELOAD_MIN_MS) return;
      void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [options?.refreshOnFocus, reload]);

  return { loading, refreshing, error, data, reload };
}

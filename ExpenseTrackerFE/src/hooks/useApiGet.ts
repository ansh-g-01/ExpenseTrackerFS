import { useEffect, useState } from "react";
import { api, errorMessage } from "../api/client";

interface State<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * GETs `path` and refetches when it or `version` changes. The previous data stays
 * available while a new request is in flight, so tables don't flash empty.
 * Pass `null` to skip fetching (e.g. while an input is incomplete).
 */
export function useApiGet<T>(path: string | null, version = 0) {
  const key = path === null ? null : `${version}:${path}`;
  const [state, setState] = useState<State<T>>({ key: "" });

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    const requestKey = `${version}:${path}`;
    api.get<T>(path, controller.signal).then(
      (data) => setState({ key: requestKey, data }),
      (err) => {
        if (!controller.signal.aborted) setState((s) => ({ key: requestKey, data: s.data, error: errorMessage(err) }));
      },
    );
    return () => controller.abort();
  }, [path, version]);

  return {
    data: state.data,
    error: key !== null && key === state.key ? state.error : undefined,
    loading: key !== null && key !== state.key,
  };
}

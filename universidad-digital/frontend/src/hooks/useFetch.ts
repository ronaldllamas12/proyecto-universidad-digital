import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/apiError";

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (requestId !== requestIdRef.current) {
        return;
      }
      setData(result);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, isLoading, reload: load };
}

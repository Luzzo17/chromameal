import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "../lib/api";

export function useApiResource<T>(
  fetcher: () => Promise<T>,
  dependencies: readonly unknown[],
  resource: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((value) => {
        if (active) {
          setData(value);
          setError("");
          setNeedsLogin(false);
        }
      })
      .catch((reason) => {
        if (!active) return;
        const result = apiErrorMessage(reason, resource);
        setError(result.message);
        setNeedsLogin(result.needsLogin);
      });

    return () => {
      active = false;
    };
    // Dependencies are supplied by callers to describe the resource identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, attempt]);

  return { data, setData, error, setError, needsLogin, setNeedsLogin, reload };
}

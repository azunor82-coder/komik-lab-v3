import { useEffect, useState } from 'react';

import { api, errorMessage } from './api';
import type { StatusResponseBody } from './types';

let cached: StatusResponseBody | null = null;

/** Which providers the server has keys for, and whether it runs in demo mode. */
export function useServerStatus() {
  const [status, setStatus] = useState<StatusResponseBody | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.status().then(
      (next) => {
        cached = next;
        if (!active) return;
        setStatus(next);
        setError(null);
      },
      (e: unknown) => {
        if (active) setError(errorMessage(e));
      }
    );
    return () => {
      active = false;
    };
  }, []);

  return { status, error };
}

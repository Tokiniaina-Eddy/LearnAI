import { useState, useCallback } from 'react';

/**
 * Generic async call hook.
 * Usage:  const { data, loading, error, execute } = useApi(someService.method);
 */
export function useApi(asyncFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await asyncFn(...args);
        setData(res.data);
        return res.data;
      } catch (err) {
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Une erreur est survenue';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

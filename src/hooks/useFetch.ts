import { useState, useEffect } from 'react';

interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string): FetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const candidateUrls = [url];
        if (url === '/content/livraria/index.json') {
          candidateUrls.push('/content/selah/index.json');
        }

        let lastError: Error | null = null;
        let loaded = false;
        for (const candidate of candidateUrls) {
          try {
            const response = await fetch(candidate);
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const result = await response.json();
            setData(result);
            setError(null);
            loaded = true;
            break;
          } catch (innerErr) {
            lastError = innerErr instanceof Error ? innerErr : new Error('Unknown error');
          }
        }

        if (!loaded && lastError) throw lastError;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

import { useEffect, useState, useRef } from 'react';

export function useRealTime<T>(
  url: string,
  initialData: T,
  refreshInterval: number = 5000
): [T, boolean, Error | null, () => void] {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${apiUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch');
      
      const responseData = await response.json();
      setData(responseData.data || responseData);
      setError(null);
    } catch (err) {
      console.error("[v0] Real-time fetch error:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [url, refreshInterval]);

  return [data, loading, error, fetchData];
}

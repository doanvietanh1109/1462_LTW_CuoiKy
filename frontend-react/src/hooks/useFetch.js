import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../api/apiClient";

// Custom Hook 3: useFetch (có cleanup AbortController trong useEffect)
export const useFetch = (endpoint, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (overrideEndpoint) => {
      const targetUrl = overrideEndpoint || endpoint;
      if (!targetUrl) return null;

      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest(targetUrl);
        setData(res.data);
        return res.data;
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (immediate && endpoint) {
      setLoading(true);
      apiRequest(endpoint, { signal: controller.signal })
        .then((res) => {
          if (isMounted) {
            setData(res.data);
            setError(null);
          }
        })
        .catch((err) => {
          if (isMounted && err.name !== "AbortError") {
            setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [endpoint, immediate]);

  return { data, loading, error, refetch: execute, setData };
};

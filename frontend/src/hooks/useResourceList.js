import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/apiError.js";

export function useResourceList(fetchFn, { errorFallback = "Failed to load" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFn();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, errorFallback));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, errorFallback]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload, setItems };
}

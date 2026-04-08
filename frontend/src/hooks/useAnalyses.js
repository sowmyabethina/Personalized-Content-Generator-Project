import { useCallback, useEffect, useState } from "react";
import { fetchAnalyses as fetchAnalysesService } from "../services/analysis/analysisService";

export const useAnalyses = (userId, options = {}) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(options.initialLoading ?? true);
  const [error, setError] = useState("");

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAnalysesService(userId);
      setAnalyses(data);
      return data;
    } catch (loadError) {
      setError(loadError.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (options.autoLoad === false) {
      return;
    }

    loadAnalyses();
  }, [loadAnalyses, options.autoLoad]);

  return {
    analyses,
    setAnalyses,
    loading,
    error,
    setError,
    loadAnalyses,
  };
};

export default useAnalyses;

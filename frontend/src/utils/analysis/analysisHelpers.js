export const getAnalysisScore = (analysis) => analysis?.technicalScore ?? analysis?.progress ?? analysis?.overallScore ?? 0;

export const normalizeTopic = (topic) => topic?.trim().toLowerCase() || "";

export const formatTopic = (topic) => {
  if (!topic) return "Unknown";
  const trimmed = topic.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const formatAnalysisDate = (dateValue) => {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const dedupeAnalysesByTopic = (analyses = []) =>
  analyses.reduce((uniqueAnalyses, currentAnalysis) => {
    const topic = normalizeTopic(currentAnalysis.topic);
    const existingIndex = uniqueAnalyses.findIndex((item) => normalizeTopic(item.topic) === topic);

    if (existingIndex === -1) {
      uniqueAnalyses.push(currentAnalysis);
      return uniqueAnalyses;
    }

    if (getAnalysisScore(currentAnalysis) > getAnalysisScore(uniqueAnalyses[existingIndex])) {
      uniqueAnalyses[existingIndex] = currentAnalysis;
    }

    return uniqueAnalyses;
  }, []);

export const sortAnalysesByNewest = (analyses = []) =>
  [...analyses].sort((left, right) => {
    const leftTime = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

export const calculateReadiness = (technicalScore = 0, learningScore = 0) =>
  (technicalScore * 0.6) + (learningScore * 0.4);

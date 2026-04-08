import { calculateReadiness, formatAnalysisDate, getAnalysisScore } from "./analysisHelpers";

export const formatCourseName = (name) => {
  if (!name) return "Unknown";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export const buildUniqueCourses = (analyses = []) => {
  const uniqueCoursesMap = new Map();

  analyses.forEach((item) => {
    const key = (item.topic || item.name)?.trim().toLowerCase();
    const displayName = item.topic || item.name || "Unknown";

    if (!uniqueCoursesMap.has(key)) {
      uniqueCoursesMap.set(key, {
        ...item,
        name: displayName,
        score: getAnalysisScore(item),
      });
    }
  });

  return Array.from(uniqueCoursesMap.values());
};

export const categorizeCourses = (courses = []) => {
  const needsAttention = [];
  const improving = [];
  const strong = [];

  courses.forEach((course) => {
    if (course.score < 40) needsAttention.push(course);
    else if (course.score < 70) improving.push(course);
    else strong.push(course);
  });

  needsAttention.sort((left, right) => left.score - right.score);
  improving.sort((left, right) => left.score - right.score);
  strong.sort((left, right) => right.score - left.score);

  return { needsAttention, improving, strong };
};

export const buildProgressChartData = (analyses = []) => {
  const recentAnalyses = analyses.slice(0, 10);
  const mapped = recentAnalyses
    .filter((analysis) => analysis.technicalScore > 0 || analysis.learningScore > 0)
    .map((analysis) => ({
      date: formatAnalysisDate(analysis.createdAt),
      technicalScore: analysis.technicalScore || analysis.overallScore || 0,
      learningScore: analysis.learningScore || 0,
      fullDate: analysis.createdAt,
    }));

  const dateMap = new Map();
  mapped.forEach((item) => {
    const existing = dateMap.get(item.date);
    if (!existing || new Date(item.fullDate) > new Date(existing.fullDate)) {
      dateMap.set(item.date, item);
    }
  });

  return Array.from(dateMap.values()).sort((left, right) => new Date(left.fullDate) - new Date(right.fullDate));
};

export const buildReadinessSummary = (latestAssessment) => {
  if (!latestAssessment) {
    return null;
  }

  const percentage = calculateReadiness(
    latestAssessment?.technicalScore || latestAssessment?.overallScore || 0,
    latestAssessment?.learningScore || 0
  );

  if (percentage >= 80) return { level: "Interview Ready", color: "#10b981", percentage };
  if (percentage >= 60) return { level: "Job Ready", color: "#f59e0b", percentage };
  if (percentage >= 40) return { level: "Developing", color: "#2563EB", percentage };
  return { level: "Beginner", color: "#ef4444", percentage };
};

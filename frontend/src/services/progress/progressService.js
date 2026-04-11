import ENDPOINTS from "../../config/api";
import { requestJson } from "../../utils/http";
import {
  buildProgressChartData,
  buildReadinessSummary,
  buildUniqueCourses,
  categorizeCourses,
} from "../../utils/analysis/progressDashboard";

export const processProgress = async (analyses = []) => {
  try {
    return await requestJson(
      ENDPOINTS.PROGRESS.PROCESS,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyses }),
      },
      "Failed to process progress."
    );
  } catch (error) {
    const uniqueCourses = buildUniqueCourses(analyses);
    return {
      uniqueCourses,
      categories: categorizeCourses(uniqueCourses),
      chartData: buildProgressChartData(analyses),
      readiness: buildReadinessSummary(analyses[0] || null),
      fallback: true,
      fallbackError: error.message,
    };
  }
};

export const shouldHideSectionHeading = (lessonTitle, heading) => {
  if (!lessonTitle || !heading) return false;
  return lessonTitle.toLowerCase().trim() === heading.toLowerCase().trim();
};

export const isLearningTipsLesson = (title) => {
  if (!title) return false;
  return title.toLowerCase().includes("tips") || title.toLowerCase().includes("tip");
};

export const formatLearningTips = (tips) => {
  if (!tips || !Array.isArray(tips)) return [];

  return tips
    .map((tip) => {
      if (!tip || typeof tip !== "string") return null;

      const parts = tip
        .split("**")
        .map((text) => text.trim())
        .filter((text) => text.length > 0);

      return parts.length > 0 ? parts.join(" ") : tip;
    })
    .filter(Boolean);
};

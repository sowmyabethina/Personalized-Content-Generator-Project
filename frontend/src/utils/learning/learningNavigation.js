export const buildLearningMaterialQuizState = (learningMaterial, topic) => ({
  topic: topic || "Learning Material Quiz",
  fromMaterial: true,
  materialTopic: topic || "Learning Material Quiz",
  extractedText:
    learningMaterial?.sections?.map((section) => section.content).join("\n\n") ||
    learningMaterial?.summary ||
    learningMaterial?.title ||
    "",
});

export const calculateTotalEstimatedTime = (lessons = []) =>
  lessons.reduce((total, lesson) => {
    const time = parseInt(lesson?.estimatedTime?.replace(/\D/g, "") || "0", 10);
    return total + time;
  }, 0);

export const getStoredScore = (key, fallbackValue = 0) => {
  const value = localStorage.getItem(key);
  return parseInt(value || String(fallbackValue), 10);
};

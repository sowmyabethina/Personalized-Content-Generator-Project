/**
 * Mirrors frontend/src/utils/quiz/psychometric.js for combined quiz + learning responses.
 */

export function getTechnicalLevel(score) {
  if (score >= 80) return "Advanced";
  if (score >= 60) return "Intermediate";
  return "Beginner";
}

export function analyzePsychometricProfile(answers = []) {
  const levels = {};
  const categories = [
    "technicalFamiliarity",
    "documentationSkill",
    "learningGoal",
    "applicationConfidence",
    "learningBehavior",
  ];

  answers.forEach((score, index) => {
    const category = categories[index];
    if (score === 0) levels[category] = "Beginner";
    else if (score === 1) levels[category] = "Intermediate";
    else levels[category] = "Advanced";
  });

  const totalScore = answers.reduce((total, value) => total + value, 0);
  const maxScore = answers.length * 2;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  let overallLevel = "Beginner";
  if (percentage >= 70) overallLevel = "Advanced";
  else if (percentage >= 35) overallLevel = "Intermediate";

  return { levels, overallLevel };
}

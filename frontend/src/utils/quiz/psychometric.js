export const getTechnicalLevel = (score) => {
  if (score >= 80) return "Advanced";
  if (score >= 60) return "Intermediate";
  return "Beginner";
};

export const getLearningStyle = (score) => {
  if (score >= 70) return "Hands-On Learner";
  if (score >= 35) return "Balanced Learner";
  return "Theory-First Learner";
};

export const analyzePsychometricProfile = (answers = []) => {
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
};

export const compareAnswer = (selectedAnswer, correctAnswer) => {
  if (!selectedAnswer || !correctAnswer) {
    return false;
  }

  return selectedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
};

export const calculateQuizScore = (answers = [], questions = []) => {
  const correct = answers.reduce((count, answer, index) => {
    return compareAnswer(answer, questions[index]?.answer) ? count + 1 : count;
  }, 0);

  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

  return { correct, score };
};

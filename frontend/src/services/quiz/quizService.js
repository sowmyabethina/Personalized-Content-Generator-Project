import ENDPOINTS from "../../config/api";
import { requestJson } from "../../utils/http";
import { extractQuestionsFromAgentPayload } from "../../utils/quiz/questionParser";
import {
  analyzePsychometricProfile,
  calculateQuizScore,
  getTechnicalLevel,
} from "../../utils/quiz/psychometric";

export const generateQuizFromContent = async ({ extractedText, topic, userId, sourceType }) => {
  const hasDocumentContent = Boolean(extractedText && extractedText.trim().length);
  const normalizedSourceType = sourceType || (hasDocumentContent ? "pdf" : "github");

  const payload = await requestJson(
    ENDPOINTS.AGENT.CHAT,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: hasDocumentContent
          ? "Generate quiz questions from the document"
          : `Generate quiz questions on topic: ${topic}`,
        userId,
        context: {
          pdfText: hasDocumentContent ? extractedText : "",
          quizType: hasDocumentContent ? "document" : "topic",
          sourceType: normalizedSourceType,
          topic,
        },
      }),
    },
    "Failed to generate quiz questions."
  );

  if (payload?.success === false) {
    const detail =
      (typeof payload.message === "string" && payload.message.trim()) ||
      (typeof payload.error === "string" && payload.error.trim()) ||
      "Quiz generation failed.";
    throw new Error(detail);
  }

  const questions = extractQuestionsFromAgentPayload(payload);

  if (!questions.length) {
    const detail =
      (typeof payload.message === "string" && payload.message.trim()) ||
      "The server returned no quiz questions. Try again with a longer document or check API configuration.";
    throw new Error(detail);
  }

  return {
    payload,
    questions,
  };
};

export const scoreQuiz = async (quizId, answers) =>
  requestJson(
    ENDPOINTS.QUIZ.SCORE,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, answers }),
    },
    "Failed to score quiz."
  );

export const submitQuiz = async ({
  quizId,
  answers = [],
  questions = [],
  learningAnswers = [],
  learningQuestions = [],
  topic = "",
}) => {
  try {
    return await requestJson(
      ENDPOINTS.QUIZ.PROCESS,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          answers,
          questions,
          learningAnswers,
          learningQuestions,
          topic,
        }),
      },
      "Failed to process quiz."
    );
  } catch (error) {
    const quizResult = calculateQuizScore(answers, questions);
    const learningScore = learningQuestions.length
      ? Math.round((learningAnswers.reduce((total, value) => total + value, 0) / (learningQuestions.length * 2)) * 100)
      : 0;
    const psychometricProfile = learningAnswers.length ? analyzePsychometricProfile(learningAnswers) : null;
    const technicalLevel = getTechnicalLevel(quizResult.score);

    return {
      correct: quizResult.correct,
      score: quizResult.score,
      learningScore,
      technicalLevel,
      psychometricProfile,
      combinedAnalysis: psychometricProfile
        ? `Technical: ${technicalLevel} level based on quiz score. Learning preference determined through assessment.`
        : null,
      fallback: true,
      fallbackError: error.message,
    };
  }
};

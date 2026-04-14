import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockStoreQuiz = jest.fn();
const mockGenerateQuizId = jest.fn();
const mockNormalizeQuizAnswer = jest.fn((value) => ({
  question: value.question,
  options: value.options,
  correctAnswer: value.ans,
}));
const mockGenerateQuestionsFromTopic = jest.fn();
const mockGenerateQuizFromMaterial = jest.fn();
const mockHandleError = jest.fn(() => ({ status: 500, error: "boom", message: "failed" }));
const mockLog = jest.fn();

jest.unstable_mockModule("../../services/quizService.js", () => ({
  storeQuiz: mockStoreQuiz,
  getQuiz: jest.fn(),
  storeQuizResult: jest.fn(),
  generateQuizId: mockGenerateQuizId,
  normalizeQuizAnswer: mockNormalizeQuizAnswer,
  scoreQuizAnswers: jest.fn(),
  scoreClientQuizAnswers: jest.fn(),
  cacheQuiz: jest.fn(),
}));

jest.unstable_mockModule("../../services/aiService.js", () => ({
  generateQuestionsFromTopic: mockGenerateQuestionsFromTopic,
  generateQuizFromMaterial: mockGenerateQuizFromMaterial,
}));

jest.unstable_mockModule("../../utils/errorHandler.js", () => ({
  handleError: mockHandleError,
}));

jest.unstable_mockModule("../../utils/logger.js", () => ({
  log: mockLog,
}));

const { generateQuiz, handleGenerateQuizFromMaterial } = await import("../../controllers/quizController.js");

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.setHeader = jest.fn();
  return res;
};

describe("quizController unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when both topic and docText are missing", async () => {
    const req = { body: {} };
    const res = createRes();

    await generateQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "docText or topic required" });
  });

  it("generates quiz successfully for valid topic", async () => {
    mockGenerateQuizId.mockReturnValue("quiz-123");
    mockGenerateQuestionsFromTopic.mockResolvedValue([
      { question: "Q1?", options: ["A", "B"], answer: "A", explanation: "e1" },
    ]);

    const req = { body: { topic: "Node.js", technicalLevel: "beginner" } };
    const res = createRes();

    await generateQuiz(req, res);

    expect(mockGenerateQuestionsFromTopic).toHaveBeenCalled();
    expect(mockStoreQuiz).toHaveBeenCalledWith("quiz-123", expect.any(Array), "Node.js");
    expect(res.setHeader).toHaveBeenCalledWith("X-Quiz-Id", "quiz-123");
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ question: "Q1?" })]),
    );
  });

  it("returns handled error when AI response is invalid", async () => {
    mockGenerateQuestionsFromTopic.mockResolvedValue("bad");
    const req = { body: { topic: "React" } };
    const res = createRes();

    await generateQuiz(req, res);

    expect(mockHandleError).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "boom", message: "failed" });
  });

  it("returns 400 for material quiz request with missing payload", async () => {
    const req = { body: { topic: "JS" } };
    const res = createRes();

    await handleGenerateQuizFromMaterial(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "topic and material required" });
  });
});

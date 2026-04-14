import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGenerateQuiz = jest.fn((req, res) => res.status(200).json({ ok: true, userId: req.userId }));
const mockScoreQuiz = jest.fn((req, res) => res.status(200).json({ score: 90 }));
const mockGenerateFromMaterial = jest.fn((req, res) => res.status(200).json({ generated: true }));

jest.unstable_mockModule("../../controllers/quizController.js", () => ({
  generateQuiz: mockGenerateQuiz,
  scoreQuiz: mockScoreQuiz,
  handleGenerateQuizFromMaterial: mockGenerateFromMaterial,
}));

const { default: quizRoutes } = await import("../../routes/quizRoutes.js");

describe("quizRoutes API tests", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/quiz", quizRoutes);
  });

  it("allows unauthenticated request and sets anonymous userId", async () => {
    const response = await request(app).post("/quiz/generate").send({ topic: "Node.js" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, userId: "anonymous" }));
    expect(mockGenerateQuiz).toHaveBeenCalled();
  });

  it("returns 401 for invalid authorization scheme", async () => {
    const response = await request(app)
      .post("/quiz/generate")
      .set("authorization", "Token abc")
      .send({ topic: "React" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(mockGenerateQuiz).not.toHaveBeenCalled();
  });

  it("accepts bearer token and forwards to score controller", async () => {
    const response = await request(app)
      .post("/quiz/score-quiz")
      .set("authorization", "Bearer token")
      .set("x-user-id", "u-1")
      .send({ quizId: "q1", answers: [] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ score: 90 });
    expect(mockScoreQuiz).toHaveBeenCalled();
  });
});

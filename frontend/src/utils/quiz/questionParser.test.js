import {
  extractQuestionsFromAgentPayload,
  normalizeQuestions,
  parseQuestionsFromText,
} from "./questionParser";

describe("questionParser utils", () => {
  it("parses questions from formatted plain text", () => {
    const text = `
      **Multiple-Choice Questions**
      1. What is JS?
      A. Language
      B. Animal
      C. Place
      D. Tool
      Correct Answer: A
    `;

    const result = parseQuestionsFromText(text);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        question: "What is JS?",
        answer: "Language",
      }),
    );
  });

  it("normalizes answer letters and numeric answer indexes", () => {
    const input = [
      { question: "Q1", options: ["A1", "B1"], answer: "B" },
      { question: "Q2", options: ["A2", "B2"], answer: 0 },
    ];

    const output = normalizeQuestions(input);

    expect(output[0].answer).toBe("B1");
    expect(output[1].answer).toBe("A2");
  });

  it("handles malformed payload safely", () => {
    expect(extractQuestionsFromAgentPayload(null)).toEqual([]);
    expect(extractQuestionsFromAgentPayload({ data: "bad-format" })).toEqual([]);
  });
});

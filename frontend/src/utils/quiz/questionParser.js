const MCQ_SECTION_PATTERN = /\*\*Multiple-Choice Questions\*\*|\*\*Multiple Choice Questions\*\*/i;

export const parseQuestionsFromText = (text) => {
  const questions = [];

  if (!text || typeof text !== "string") {
    return questions;
  }

  const sections = text.split(MCQ_SECTION_PATTERN);
  const mcqSection = sections.length > 1 ? sections[1] : text;
  const questionBlocks = mcqSection.split(/\n(?=\d+\.)/);

  questionBlocks.forEach((block) => {
    const lines = block.trim().split("\n").filter((line) => line.trim());

    if (lines.length < 4) {
      return;
    }

    let questionText = lines[0].replace(/^\d+\.\s*/, "").trim();
    questionText = questionText.replace(/http[s]?:\/\/\S+/g, "").trim();

    const options = [];
    let correctAnswerLetter = null;

    const questionLevelCorrectAnswer = lines[0].match(/Correct Answer:\s*([A-D])/i);
    if (questionLevelCorrectAnswer) {
      correctAnswerLetter = questionLevelCorrectAnswer[1];
    }

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index].trim();
      const correctAnswerMatch = line.match(/\*?Correct Answer:\*?\s*([A-D])/i);

      if (correctAnswerMatch) {
        correctAnswerLetter = correctAnswerMatch[1];
      }

      const optionMatch = line.match(/^([A-D])[.)]\s*(.+?)$/i);

      if (!optionMatch) {
        continue;
      }

      let optionText = optionMatch[2].trim();
      optionText = optionText.replace(/\*?Correct Answer:\*?\s*[A-D]?\s*/i, "").trim();

      if (optionText) {
        options.push(optionText);
      }
    }

    if (!questionText || options.length < 3) {
      return;
    }

    const normalizedOptions = options.slice(0, 4);
    let answerIndex = 0;

    if (correctAnswerLetter) {
      answerIndex = correctAnswerLetter.toUpperCase().charCodeAt(0) - 65;
      if (answerIndex < 0 || answerIndex >= normalizedOptions.length) {
        answerIndex = 0;
      }
    }

    questions.push({
      question: questionText,
      options: normalizedOptions,
      answer: normalizedOptions[answerIndex] || normalizedOptions[0],
    });
  });

  return questions;
};

export const normalizeQuestions = (questions = []) =>
  questions
    .map((question) => {
      const options = Array.isArray(question.options) ? question.options : [question.options].filter(Boolean);
      let answer = question.correctAnswer || question.answer || options[0];

      if (typeof answer === "string" && /^[A-D]$/i.test(answer)) {
        answer = options[answer.toUpperCase().charCodeAt(0) - 65];
      }

      if (typeof answer === "number") {
        answer = options[answer];
      }

      return {
        question: question.question,
        options,
        answer: typeof answer === "string" ? answer.trim() : answer,
        explanation: question.explanation || "",
        category: question.category || "",
      };
    })
    .filter((question) => question.question && question.options.length > 0 && question.answer);

export const extractQuestionsFromAgentPayload = (payload) => {
  const questionData = payload?.data?.questions || payload?.data || [];

  if (Array.isArray(questionData)) {
    return normalizeQuestions(questionData);
  }

  if (typeof questionData === "string") {
    try {
      const parsed = JSON.parse(questionData);
      if (Array.isArray(parsed)) {
        return normalizeQuestions(parsed);
      }
    } catch {
      return normalizeQuestions(parseQuestionsFromText(questionData));
    }
  }

  return [];
};

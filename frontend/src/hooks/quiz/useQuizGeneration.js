import { useCallback, useState } from "react";
import { generateQuizFromContent } from "../../services/quiz/quizService";

export const useQuizGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const generateQuestions = useCallback(async (params) => {
    setIsGenerating(true);
    setGenerationError("");

    try {
      const result = await generateQuizFromContent(params);

      if (!result.questions.length) {
        throw new Error("Could not parse questions from generated content.");
      }

      return result;
    } catch (error) {
      setGenerationError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generationError,
    setGenerationError,
    generateQuestions,
  };
};

export default useQuizGeneration;

/**
 * LearningAgent - Intelligent Router for Learning Platform
 * Provides helper functions for PDF processing.
 * Main routing logic is delegated to agentOrchestrator.
 */

import { routeMessage as orchestratorRouteMessage } from './core/agentOrchestrator.js';
import {
  generateQuestionsFromTopic,
  normalizeQuizQuestionsFromAi,
} from '../services/aiService.js';

console.log("LearningAgent loaded - routing delegated to agentOrchestrator");

function isPdfChat(message) {
  const lower = message.toLowerCase();
  return /explain\s+(pdf|document)/i.test(lower) || /summarize\s+(pdf|document)/i.test(lower);
}

function isQuizFromDocument(message) {
  const lower = message.toLowerCase();
  return /quiz.*from.*(document|pdf)/i.test(lower);
}

/**
 * Generate MCQs from extracted resume/PDF text (Groq via shared ai layer).
 */
async function generateQuizFromPdfWithGroq({ pdfText, topic }) {
  try {
    const text = (pdfText || '').trim();
    if (text.length < 200) {
      return {
        success: false,
        message: 'Document text is too short to build a quiz (need roughly 200+ characters of extractable text).',
      };
    }

    const raw = await generateQuestionsFromTopic(text);
    const questions = normalizeQuizQuestionsFromAi(Array.isArray(raw) ? raw : []);

    console.log(`[generateQuizFromPdfWithGroq] Normalized question count=${questions.length}`);

    if (questions.length === 0) {
      const rawPreview = Array.isArray(raw)
        ? `array length=${raw.length} first=${JSON.stringify(raw[0]).slice(0, 200)}`
        : String(raw).slice(0, 300);
      console.warn('[generateQuizFromPdfWithGroq] Normalized to 0 questions. Raw:', rawPreview);
      return {
        success: false,
        message: 'The model did not return any valid quiz questions. Try again or use a richer PDF.',
      };
    }

    return {
      success: true,
      tool: 'quiz',
      data: { questions, topic: topic || 'Document Quiz' },
      message: `Generated ${questions.length} questions from your document`,
    };
  } catch (err) {
    console.error('[generateQuizFromPdfWithGroq] Error:', err.message);
    return {
      success: false,
      message: err.message || 'Quiz generation failed',
    };
  }
}

/**
 * Last-resort response when document quiz cannot be produced.
 * Shape matches orchestrator /agent/chat contract (response + rawData).
 */
function getPdfQuizFallbackResponse(_pdfText = '', topic = 'Document Quiz') {
  return {
    success: false,
    tool: 'quiz',
    originalMessage: '',
    response:
      'Could not generate a quiz from this document. Confirm GROQ_API_KEY is set, the PDF has selectable text, and try again.',
    rawData: { questions: [], topic, error: 'document_quiz_fallback' },
  };
}

export async function routeMessage({ message, userId, sessionId, model = 'groq', context = {} }) {
  console.log("LearningAgent: delegating to agentOrchestrator");
  return await orchestratorRouteMessage({
    message, userId, sessionId, model, context,
    helpers: { isPdfChat, isQuizFromDocument, generateQuizFromPdfWithGroq, getPdfQuizFallbackResponse }
  });
}

export default { routeMessage };

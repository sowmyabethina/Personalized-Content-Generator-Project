/**
 * AI Service
 * Handles all AI (Groq/LLaMA) operations
 */

import { groq, getModel, generateCompletion, DEFAULT_MODEL, FALLBACK_MODEL } from "../config/ai.js";
import { parseJson } from "../utils/jsonParser.js";
import { logError } from "../utils/logger.js";

/**
 * Generate quiz questions from text or topic
 * @param {string} text - Document text or topic
 * @param {Object} options - Quiz generation options
 * @returns {Array} - Array of quiz questions
 */
async function generateQuizQuestions(text, options = {}) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const prompt = buildQuizPrompt(text, options);

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output');
    }
    return parseJson(rawText);
  } catch (error) {
    // Try fallback model
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output');
    }
    return parseJson(fallbackText);
  }
}

/**
 * Build prompt for quiz generation
 * @param {string} text - Document text or topic
 * @param {Object} options - Quiz options
 * @returns {string} - Formatted prompt
 */
function buildQuizPrompt(text, options = {}) {
  const { topic, difficulty = 'intermediate', technicalLevel } = options;
  
  // Check if text is a topic or actual content
  const isTopic = text.trim().length < 200;
  
  if (isTopic) {
    return `Generate comprehensive skill-testing quiz questions on topic: ${text}. 

Target difficulty level: ${technicalLevel || difficulty}.

The questions should test practical understanding and application of concepts related to ${text}. 
Include scenario-based questions, concept understanding, and problem-solving. 
Do not ask about specific names or details mentioned in documents - focus on testing skills and knowledge.

Generate questions that a ${technicalLevel || difficulty} level learner should know about ${text}.

Return ONLY valid JSON as an array of questions.`;
  }
  
  // Text is actual content - generate from it
  return `Convert this content into skill-testing multiple choice questions:

${text}

Generate 10 questions that test understanding and application, not just recall.

Return ONLY valid JSON as an array of questions.`;
}

const DEFAULT_LESSON_COUNT = 5;

function getLessonCount() {
  const n = Number(process.env.GROQ_LESSON_COUNT);
  if (Number.isFinite(n) && n >= 3 && n <= 12) return Math.floor(n);
  return DEFAULT_LESSON_COUNT;
}

function learningStepTokenBudgets() {
  const maxGlobal = Number(process.env.GROQ_LEARNING_MAX_TOKENS);
  const base =
    Number.isFinite(maxGlobal) && maxGlobal > 512 ? Math.min(maxGlobal, 8192) : 3200;
  const lessonTok = Number(process.env.GROQ_LESSON_MAX_TOKENS);
  const perLesson =
    Number.isFinite(lessonTok) && lessonTok > 512
      ? Math.min(lessonTok, 8192)
      : Math.min(3000, base);
  const outlineTok = Number(process.env.GROQ_OUTLINE_MAX_TOKENS);
  const outline =
    Number.isFinite(outlineTok) && outlineTok > 200 ? Math.min(outlineTok, 2000) : 900;
  return { perLesson, outline, supplement: base };
}

/**
 * One Groq call with primary then fallback (same pattern as legacy material generation).
 */
async function learningMaterialCompletion(prompt, maxTokens, temperature = 0.58) {
  const opts = { max_tokens: maxTokens, temperature };
  try {
    const text = await generateCompletion(prompt, { model: DEFAULT_MODEL, ...opts });
    if (text && text.trim()) return text;
  } catch (err) {
    console.log('Learning material step: primary model error:', err.message);
  }
  return generateCompletion(prompt, { model: FALLBACK_MODEL, ...opts });
}

function buildOutlinePrompt(topic, level, style, personalization, lessonCount) {
  return `You are a curriculum architect. Design a ${lessonCount}-lesson course outline ONLY for the topic below.

TOPIC: ${topic}
LEVEL: ${level}
STYLE: ${style}
${personalization}

Rules:
- EXACTLY ${lessonCount} lessons, logical progression, no overlap in scope.
- Titles are specific (not "Introduction" alone — include the angle, e.g. "Error budgets and SLO trade-offs").

Return ONE JSON object (no markdown):
{
  "courseTitle": "string (engaging course title)",
  "outline": [
    { "lesson": 1, "title": "string" },
    { "lesson": 2, "title": "string" }
  ]
}
The "outline" array MUST have exactly ${lessonCount} items with lesson numbers 1..${lessonCount}.`;
}

function parseOutlinePayload(rawText, topic, lessonCount) {
  const parsed = parseJson(rawText);
  let courseTitle = topic;
  let outline = [];

  if (Array.isArray(parsed)) {
    outline = parsed;
  } else if (parsed && typeof parsed === 'object') {
    courseTitle = parsed.courseTitle || parsed.title || topic;
    outline = parsed.outline || parsed.lessons || parsed.items || [];
  }

  if (!Array.isArray(outline) || outline.length === 0) {
    throw new Error('Outline response missing outline array');
  }

  const normalized = outline.map((row, idx) => {
    if (typeof row === 'string') {
      return { lesson: idx + 1, title: row };
    }
    const lessonNum = Number(row.lesson) || idx + 1;
    const title = String(row.title || row.name || `Lesson ${lessonNum}`).trim();
    return { lesson: lessonNum, title: title || `Lesson ${lessonNum}` };
  });

  while (normalized.length < lessonCount) {
    normalized.push({
      lesson: normalized.length + 1,
      title: `${topic} — Part ${normalized.length + 1}`,
    });
  }

  return {
    courseTitle: String(courseTitle).trim() || topic,
    outline: normalized.slice(0, lessonCount),
  };
}

function buildSingleLessonPrompt(ctx) {
  const {
    topic,
    level,
    style,
    personalization,
    styleGuidance,
    lessonIndex,
    lessonTotal,
    lessonTitle,
    previousLessonTitles,
  } = ctx;

  const prev = (previousLessonTitles || []).slice(-4).join(' | ') || '(none — this is the first lesson)';

  return `You are a senior engineer-educator. Write ONE complete lesson (one JSON object) for a multi-part course.

TOPIC: ${topic}
LEVEL: ${level}
LEARNING STYLE: ${style}
${personalization}
${styleGuidance}

CONTEXT:
- This is lesson ${lessonIndex} of ${lessonTotal}.
- Lesson title (use as "heading" or improve slightly but keep meaning): ${lessonTitle}
- Prior lesson titles (do not repeat their core content): ${prev}

ANTI-GENERIC: No textbook fluff. Concrete scenarios, trade-offs, checks.

THIS LESSON ONLY — return ONE JSON object (no markdown), keys:
- "heading": string (lesson title, may match given title)
- "conceptExplanation": 300–500 words; WHAT / WHY / HOW + one real-world analogy for ${topic}
- "explanation": 350–550 words; numbered steps; micro-checks after steps
- "realWorldExample": 120–200 words
- "codeExample": one STRING (synthesis snippet or checklist; complement the 3 examples below)
- "importance": 90–140 words
- "keyPoints": exactly 6 strings
- "useCases": exactly 4 strings (50–100 words each, specific domains)
- "practiceQuestions": exactly 4 strings (thinking / design / debug, not definitions)
- "examples": array of exactly 3 objects: { "title", "code" (string only), "output", "explanation" } with explanation 100–180 words line-by-line

"code" must never be an object.`;
}

function buildModuleSupplementPrompt(ctx) {
  const { topic, level, style, personalization, styleGuidance, lessonTitles } = ctx;
  const list = lessonTitles.map((t, i) => `${i + 1}. ${t}`).join('\n');

  return `You are a senior engineer-educator. Write MODULE-LEVEL material for a course (NOT individual lesson bodies).

TOPIC: ${topic}
LEVEL: ${level}
STYLE: ${style}
${personalization}
${styleGuidance}

LESSON TITLES (weave these into overview and key concepts; do not rewrite lesson bodies):
${list}

Return ONE JSON object (no markdown) with ONLY these keys:
- "overview": 500–800 words — hook, outcomes, prerequisites, how the lessons above fit together, study order, when to do mini-project
- "keyConcepts": array length 8 of { "point", "explanation" } — explanation 120–200 words each, mentor tone
- "applications": length 5 of { "title", "description" } — description 120–200 words
- "examples": length 4 of { "title", "code", "output", "explanation" } — capstone demos; code single string only; explanation 150–220 words
- "commonMistakes": 5 strings (60–100 words each)
- "bestPractices": 5 strings (60–100 words each)
- "miniProject": { "title", "steps": [5 strings, 70–140 words each with acceptance criteria] }
- "interviewQuestions": length 5 of { "question", "answer" } — answer 100–180 words

Do NOT include a "sections" key.`;
}

function normalizeOneSection(raw) {
  let obj = raw;
  if (obj && typeof obj === 'object' && obj.section && typeof obj.section === 'object') {
    obj = obj.section;
  }
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid lesson JSON');
  }
  const wrapped = normalizeLearningMaterialShape(
    sanitizeContentObject({ sections: [obj], examples: [] })
  );
  return wrapped.sections[0];
}

/**
 * Generate learning material for a topic (multi-step: outline → each lesson → module supplement → merge).
 * @param {string} topic - Learning topic
 * @param {string} technicalLevel - Technical level
 * @param {string} learningStyle - Learning style
 * @returns {Object} - Generated learning material
 */
async function generateLearningMaterial(topic, technicalLevel, learningStyle) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const level = (technicalLevel || 'intermediate').toLowerCase();
  const style = (learningStyle || 'reading').toLowerCase();
  const lessonCount = getLessonCount();
  const { perLesson, outline: outlineMax, supplement: supplementMax } = learningStepTokenBudgets();

  const personalization =
    level === 'beginner'
      ? 'Audience: beginner. Define terms on first use, intuition-first, short sub-steps, checkpoints.'
      : level === 'advanced'
        ? 'Audience: advanced. Trade-offs, failure modes, performance/security, alternatives.'
        : 'Audience: intermediate. Connect fundamentals to applied workflows.';

  const styleGuidance =
    style === 'visual'
      ? 'Learning style: visual — diagrams, flows, what to sketch.'
      : style === 'auditory'
        ? 'Learning style: auditory — narrative, analogies, dialogue tone.'
        : style === 'kinesthetic'
          ? 'Learning style: kinesthetic — labs, checklists, hands-on tasks.'
          : 'Learning style: reading/writing — structure, numbered steps, crisp prose.';

  const outlinePrompt = buildOutlinePrompt(topic, level, style, personalization, lessonCount);
  const outlineRaw = await learningMaterialCompletion(outlinePrompt, outlineMax, 0.55);
  if (!outlineRaw || !outlineRaw.trim()) {
    throw new Error('Empty outline from model');
  }

  const { courseTitle, outline } = parseOutlinePayload(outlineRaw, topic, lessonCount);
  const sections = [];
  const previousTitles = [];

  for (let i = 0; i < outline.length; i++) {
    const item = outline[i];
    const lessonTitle = item.title || `Lesson ${i + 1}`;
    const lessonPrompt = buildSingleLessonPrompt({
      topic,
      level,
      style,
      personalization,
      styleGuidance,
      lessonIndex: i + 1,
      lessonTotal: outline.length,
      lessonTitle,
      previousLessonTitles: [...previousTitles],
    });

    let section = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await learningMaterialCompletion(lessonPrompt, perLesson, 0.58);
        if (!raw || !raw.trim()) throw new Error('Empty lesson body');
        section = normalizeOneSection(parseJson(raw));
        break;
      } catch (e) {
        lastErr = e;
        console.log(`Lesson ${i + 1} generation attempt ${attempt + 1} failed:`, e.message);
      }
    }

    if (!section) {
      throw lastErr || new Error(`Failed to generate lesson ${i + 1}`);
    }

    section.heading = coerceDisplayString(section.heading || lessonTitle);
    sections.push(section);
    previousTitles.push(lessonTitle);
  }

  const supplementPrompt = buildModuleSupplementPrompt({
    topic,
    level,
    style,
    personalization,
    styleGuidance,
    lessonTitles: sections.map((s) => s.heading),
  });

  let supplement = {};
  try {
    const supRaw = await learningMaterialCompletion(supplementPrompt, supplementMax, 0.58);
    if (supRaw && supRaw.trim()) {
      supplement = parseJson(supRaw);
    }
  } catch (e) {
    console.log('Module supplement generation failed:', e.message);
  }

  if (!supplement || typeof supplement !== 'object') supplement = {};

  const merged = {
    title: courseTitle,
    overview: supplement.overview != null ? String(supplement.overview) : '',
    keyConcepts: Array.isArray(supplement.keyConcepts) ? supplement.keyConcepts : [],
    sections,
    applications: Array.isArray(supplement.applications) ? supplement.applications : [],
    examples: Array.isArray(supplement.examples) ? supplement.examples : [],
    commonMistakes: Array.isArray(supplement.commonMistakes) ? supplement.commonMistakes : [],
    bestPractices: Array.isArray(supplement.bestPractices) ? supplement.bestPractices : [],
    miniProject:
      supplement.miniProject && typeof supplement.miniProject === 'object'
        ? supplement.miniProject
        : { title: '', steps: [] },
    interviewQuestions: Array.isArray(supplement.interviewQuestions)
      ? supplement.interviewQuestions
      : [],
  };

  return normalizeLearningMaterialShape(sanitizeContentObject(merged));
}

/**
 * Sanitize content object to ensure all fields are proper strings
 * @param {Object} obj - Content object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeContentObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = '';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return sanitizeContentObject(item);
          }
          return String(item ?? '');
        });
      } else {
        // Preserve nested objects (e.g. miniProject) — stringify broke frontend structure
        sanitized[key] = sanitizeContentObject(value);
      }
    } else if (typeof value === 'function') {
      sanitized[key] = '';
    } else {
      sanitized[key] = String(value);
    }
  }
  
  return sanitized;
}

/**
 * Coerce any value to a display-safe string (fixes nested JSON in "code" fields).
 */
function coerceDisplayString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(coerceDisplayString).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') {
    if (typeof value.snippet === 'string') return value.snippet;
    if (typeof value.text === 'string') return value.text;
    if (typeof value.body === 'string') return value.body;
    if (typeof value.content === 'string') return value.content;
    if (typeof value.source === 'string') return value.source;
    if (typeof value.value === 'string') return value.value;
    if (value.code !== undefined && value.code !== value) {
      const inner = value.code;
      if (typeof inner === 'string') return inner;
      if (inner && typeof inner === 'object') {
        const nested = coerceDisplayString(inner);
        if (nested) return nested;
      }
    }
    if (typeof value.code === 'string') return value.code;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }
  return String(value);
}

function normalizeExampleItem(ex) {
  if (ex == null) return { title: 'Example', code: '', output: '', explanation: '' };
  if (typeof ex === 'string') {
    return { title: 'Example', code: '', output: '', explanation: coerceDisplayString(ex) };
  }
  if (typeof ex !== 'object') {
    return { title: 'Example', code: '', output: '', explanation: coerceDisplayString(ex) };
  }
  const title = coerceDisplayString(ex.title || ex.name || 'Example');
  const code = coerceDisplayString(ex.code ?? ex.codeExample ?? ex.snippet ?? '');
  const output = coerceDisplayString(ex.output ?? ex.expectedOutput ?? ex.stdout ?? ex.result ?? '');
  const explanation = coerceDisplayString(
    ex.explanation ?? ex.description ?? ex.details ?? ''
  );
  return { title, code, output, explanation, description: explanation };
}

/**
 * Coerce common model quirks so the frontend always gets usable arrays.
 */
function normalizeLearningMaterialShape(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };

  if (Array.isArray(out.sections)) {
    out.sections = out.sections.map((sec) => {
      if (!sec || typeof sec !== 'object') return sec;
      const s = { ...sec };
      if (!Array.isArray(s.keyPoints)) {
        if (s.keyPoints == null || s.keyPoints === '') s.keyPoints = [];
        else if (typeof s.keyPoints === 'string') s.keyPoints = [s.keyPoints];
        else if (typeof s.keyPoints === 'object') s.keyPoints = [coerceDisplayString(s.keyPoints)];
        else s.keyPoints = [];
      } else {
        s.keyPoints = s.keyPoints.map((kp) => {
          if (typeof kp === 'string') return kp;
          if (kp && typeof kp === 'object') {
            if (typeof kp.point === 'string' && typeof kp.detail === 'string') {
              return `${kp.point}: ${kp.detail}`;
            }
            if (typeof kp.text === 'string') return kp.text;
            return coerceDisplayString(kp);
          }
          return coerceDisplayString(kp);
        });
      }

      s.codeExample = coerceDisplayString(s.codeExample);

      if (Array.isArray(s.examples)) {
        s.examples = s.examples.map(normalizeExampleItem);
      }

      if (s.conceptExplanation != null) {
        s.conceptExplanation = coerceDisplayString(s.conceptExplanation);
      }
      if (Array.isArray(s.useCases)) {
        s.useCases = s.useCases.map(coerceDisplayString);
      }
      if (Array.isArray(s.practiceQuestions)) {
        s.practiceQuestions = s.practiceQuestions.map(coerceDisplayString);
      }

      return s;
    });
  }

  if (Array.isArray(out.examples)) {
    out.examples = out.examples.map(normalizeExampleItem);
  }

  if (Array.isArray(out.applications)) {
    out.applications = out.applications.map((app) => ({
      ...app,
      title: coerceDisplayString(app?.title),
      description: coerceDisplayString(app?.description),
    }));
  }

  if (Array.isArray(out.keyConcepts)) {
    out.keyConcepts = out.keyConcepts.map((kc) => ({
      point: coerceDisplayString(kc?.point),
      explanation: coerceDisplayString(kc?.explanation),
    }));
  }

  if (out.miniProject && typeof out.miniProject === 'object') {
    const mp = { ...out.miniProject };
    if (!Array.isArray(mp.steps)) {
      if (typeof mp.steps === 'string' && mp.steps.trim()) mp.steps = [mp.steps];
      else mp.steps = [];
    } else {
      mp.steps = mp.steps.map((st) => coerceDisplayString(st));
    }
    out.miniProject = mp;
  }

  if (Array.isArray(out.interviewQuestions)) {
    out.interviewQuestions = out.interviewQuestions.map((iq) => {
      if (!iq || typeof iq !== 'object') {
        return { question: coerceDisplayString(iq), answer: '' };
      }
      return {
        ...iq,
        question: coerceDisplayString(iq.question),
        answer: coerceDisplayString(iq.answer),
      };
    });
  }

  if (Array.isArray(out.commonMistakes)) {
    out.commonMistakes = out.commonMistakes.map((m) => coerceDisplayString(m));
  }
  if (Array.isArray(out.bestPractices)) {
    out.bestPractices = out.bestPractices.map((b) => coerceDisplayString(b));
  }

  out.overview = coerceDisplayString(out.overview);
  out.title = coerceDisplayString(out.title);

  return out;
}

/**
 * Generate quiz from learning material
 * @param {string} topic - Topic
 * @param {Object} material - Learning material
 * @param {string} technicalLevel - Technical level
 * @param {string} learningStyle - Learning style
 * @returns {Array} - Quiz questions
 */
async function generateQuizFromMaterial(topic, material, technicalLevel, learningStyle) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const materialSummary = material.sections
    ?.map((s) => {
      const head = s.title || s.heading || 'Section';
      const body = s.content || s.explanation || '';
      return `${head}: ${body}`;
    })
    .join('\n\n') || material.summary || '';

  const prompt = `Based on this learning material about ${topic}, generate 10 comprehensive multiple-choice questions that test SKILLS and APPLICATION of knowledge suitable for a ${technicalLevel || 'intermediate'} level learner:

Learning Material Content:
${materialSummary}

IMPORTANT: The questions should be tailored to ${technicalLevel || 'intermediate'} level knowledge.

GENERATE SKILL-BASED QUESTIONS, NOT EXTRACTIVE QUESTIONS:

❌ BAD (Extractive - just asks what was mentioned):
- "Which JavaScript library is mentioned in the document?"
- "What is the name of the project described?"

✅ GOOD (Skill-based - tests understanding and application):
- "When building a web application, which library would you choose for state management and why?"
- "Given a scenario where you need to handle async data fetching, which approach would be most appropriate?"

RULES:
1. Questions should test PROBLEM-SOLVING ability, not memory recall
2. Include practical SCENARIOS and USE CASES
3. Ask "what would you do if..." or "how would you..." type questions
4. Test understanding of WHEN to use different approaches
5. Include questions about TRADE-OFFS and DECISIONS

EXPLANATION RULES:
1. NEVER say "The correct answer is" or quote the answer text
2. ALWAYS explain the CONCEPT purely (what it is, how it works)
3. ALWAYS explain WHY the correct option works (the technical reasoning)
4. Keep to exactly 2 sentences

Return ONLY valid JSON in this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "[Explain the concept]. [Explain why this works]."
  }
]`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output for quiz');
    }
    try {
      return parseJson(rawText);
    } catch {
      return rawText;
    }
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output for quiz');
    }
    try {
      return parseJson(fallbackText);
    } catch {
      return fallbackText;
    }
  }
}

/**
 * Generate personalized content recommendations
 * @param {string} topic - Learning topic
 * @param {string} learningStyle - Learning style
 * @param {string} technicalLevel - Technical level
 * @returns {Object} - Personalized content
 */
async function generatePersonalizedContent(topic, learningStyle, technicalLevel) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  const prompt = `Generate personalized content recommendations for learning ${topic}.

User profile:
- Learning Style: ${learningStyle || 'reading'}
- Technical Level: ${technicalLevel || 'intermediate'}

Create a JSON response with:

{
  "topic": "${topic}",
  "resources": [
    { "type": "Resource Type", "title": "Specific title", "description": "Why this is good for this learner", "duration": "time estimate" }
  ],
  "suggestedPath": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "tips": ["Tip 1 specific to this learning style", "Tip 2", "Tip 3"]
}

Requirements:
- Resources should be specific to ${learningStyle || 'reading'} learners
- Include a mix of resource types (articles, tutorials, exercises, projects)
- The suggested path should be actionable
- Tips should be practical
- Return ONLY valid JSON.`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output for content');
    }
    return parseJson(rawText);
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output for content');
    }
    return parseJson(fallbackText);
  }
}

/**
 * Generate combined learning content
 * @param {string} topic - Learning topic
 * @param {string} technicalLevel - Technical level
 * @param {number} technicalScore - Technical score
 * @param {string} learningStyle - Learning style
 * @param {number} learningScore - Learning score
 * @param {string} combinedAnalysis - Combined analysis text
 * @returns {Object} - Combined learning content
 */
async function generateCombinedContent(topic, technicalLevel, technicalScore, learningStyle, learningScore, combinedAnalysis) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  const prompt = `Generate a highly personalized learning path for a user with the following profile:

- Topic: ${topic}
- Technical Level: ${technicalLevel || 'intermediate'}
- Technical Score: ${technicalScore || 50}%
- Learning Style: ${learningStyle || 'reading'}
- Learning Score: ${learningScore || 50}%

Create a JSON response with the following structure:

{
  "title": "Personalized ${topic} Learning Path",
  "overview": "A 2-3 sentence overview of what this learner will achieve",
  "learningPath": [
    "Step 1: [Specific action for this user profile]",
    "Step 2: [Specific action for this user profile]",
    "Step 3: [Specific action for this user profile]",
    "Step 4: [Specific action for this user profile]",
    "Step 5: [Specific action for this user profile]"
  ],
  "resources": [
    "Specific resource 1 tailored to ${learningStyle} learners at ${technicalLevel} level",
    "Specific resource 2 tailored to ${learningStyle} learners",
    "Specific resource 3"
  ],
  "tips": [
    "Tip 1 specific to ${learningStyle} learning style",
    "Tip 2 specific to ${learningStyle} learners",
    "Tip 3 for ${technicalLevel} level learners"
  ],
  "nextSteps": "Specific next action based on the user's scores (technical: ${technicalScore}%, learning: ${learningScore}%)",
  "combinedAnalysis": "Analysis of user: Technical ${technicalLevel} (${technicalScore}%), Learning style: ${learningStyle} (${learningScore}%)"
}

Requirements:
- Content must be genuinely personalized based on the user's scores and learning style
- ${learningStyle === 'visual' ? 'Include references to diagrams, videos, and visual content' : learningStyle === 'auditory' ? 'Include references to podcasts, videos, and audio content' : learningStyle === 'kinesthetic' ? 'Include hands-on exercises, projects, and practical activities' : 'Include reading materials, written tutorials, and text-based content'}
- ${technicalLevel === 'beginner' ? 'Use simple language, provide more guidance, break down into smaller steps' : technicalLevel === 'advanced' ? 'Use technical language, provide less guidance, focus on advanced concepts' : 'Balance between simple and technical language'}
- Return ONLY valid JSON, no additional text.`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output for combined content');
    }
    return parseJson(rawText);
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output for combined content');
    }
    return parseJson(fallbackText);
  }
}

/**
 * Generate learning style assessment questions
 * @param {Object} userProfile - User profile
 * @param {string} topic - Topic
 * @returns {Array} - Assessment questions
 */
async function generateFromPdf(userProfile, topic) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  const prompt = `Generate 5 learning style assessment questions based on this user profile:

User Profile:
${JSON.stringify(userProfile)}

Topic: ${topic || 'General Technology'}

Create questions that assess the user's learning preferences. Return JSON in this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Best answer for this user profile"
  }
]

Requirements:
- Questions should assess learning preferences (visual, auditory, reading, kinesthetic)
- Include practical scenarios
- Return ONLY valid JSON.`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (rawText) {
      return parseJson(rawText);
    }
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    try {
      const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
      if (fallbackText) {
        return parseJson(fallbackText);
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError.message);
    }
  }

  // Fallback to default questions
  return [
    { question: 'How do you prefer learning new tech?', options: ['Reading docs', 'Watching videos', 'Hands-on', 'Group discussion'], answer: 'Hands-on' },
    { question: 'Do you like step-by-step tutorials?', options: ['Yes', 'No', 'Sometimes', 'Never'], answer: 'Yes' },
    { question: 'Do you take notes while learning?', options: ['Yes', 'No', 'Sometimes', 'Never'], answer: 'Yes' },
    { question: 'Do you prefer online courses or offline?', options: ['Online', 'Offline', 'Hybrid', 'Doesn\'t matter'], answer: 'Online' },
    { question: 'Do you prefer small examples or full projects?', options: ['Small examples', 'Full projects', 'Both', 'Neither'], answer: 'Both' }
  ];
}

/**
 * Generate quiz questions from text or topic (wraps the pdf/questionGenerator)
 * @param {string} text - Document text or topic
 * @returns {Array} - Array of quiz questions
 */
async function generateQuestionsFromTopic(text) {
  // Check if text is a topic (short) or document content (long)
  if (text.length < 200) {
    // Use the built-in generateQuizQuestions for topic-based generation
    return generateQuizQuestions(text);
  }
  
  // For longer document content, use the external question generator
  // Dynamic import for the external question generator
  let questionGeneratorModule = null;
  async function getQuestionGenerator() {
    if (!questionGeneratorModule) {
      questionGeneratorModule = await import('../../pdf/questionGenerator.js');
    }
    return questionGeneratorModule;
  }
  
  const { generateQuestions: gen } = await getQuestionGenerator();
  return gen(text);
}

export {
  generateQuizQuestions,
  generateLearningMaterial,
  generateQuizFromMaterial,
  generatePersonalizedContent,
  generateCombinedContent,
  generateFromPdf,
  buildQuizPrompt,
  generateQuestionsFromTopic,
};
export default {
  generateQuizQuestions,
  generateLearningMaterial,
  generateQuizFromMaterial,
  generatePersonalizedContent,
  generateCombinedContent,
  generateFromPdf,
  buildQuizPrompt,
  generateQuestionsFromTopic,
};


// review trigger

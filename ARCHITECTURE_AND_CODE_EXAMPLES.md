# Project Architecture & Code Examples

## 📐 Detailed System Architecture

### **Complete System Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER - React Frontend (Port 3000)                      │
│                                                                                         │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────────────┐    │
│  │      PAGES (Full Views)         │  │      COMPONENTS (Reusable UI)            │    │
│  ├─────────────────────────────────┤  ├──────────────────────────────────────────┤    │
│  │ • HomePage                      │  │ • Layout / Navbar                        │    │
│  │   - GitHub analyzer             │  │ • UI Components (Button, Card, Input)    │    │
│  │   - Resume uploader             │  │ • Learning Material Sections             │    │
│  │                                 │  │   - Summary, KeyPoints, Examples, etc    │    │
│  │ • QuizPage                      │  │                                          │    │
│  │   - Question display            │  │                                          │    │
│  │   - Answer selection            │  │                                          │    │
│  │   - Score tracking              │  │                                          │    │
│  │                                 │  │                                          │    │
│  │ • ResultPage                    │  │                                          │    │
│  │   - Score display               │  │                                          │    │
│  │   - Content suggestions         │  │                                          │    │
│  │                                 │  │                                          │    │
│  │ • LearningMaterialPage          │  │                                          │    │
│  │   - Learning content display    │  │                                          │    │
│  │   - PDF export                  │  │                                          │    │
│  │                                 │  │                                          │    │
│  │ • LearningProgressPage          │  │                                          │    │
│  │   - Analytics & charts          │  │                                          │    │
│  │   - Progress tracking           │  │                                          │    │
│  │                                 │  │                                          │    │
│  │ • PdfChatPage                   │  │                                          │    │
│  │   - PDF upload/chat             │  │                                          │    │
│  │   - Mind map display            │  │                                          │    │
│  └─────────────────────────────────┘  └──────────────────────────────────────────┘    │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                    STATE MANAGEMENT & SERVICES                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                                 │   │
│  │  • React Hooks (useState, useEffect)                                            │   │
│  │  • Custom Hook: useLearningMaterial.js                                          │   │
│  │  • Service: learningService.js  (API calls)                                     │   │
│  │  • Config: api.js  (Endpoint configuration)                                     │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP REST API Calls (fetch/axios)
                          │
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER - Express.js (Port 5000)                              │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           MIDDLEWARE LAYER                                       │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ • CORS                  • JSON Parser               • Error Handler             │  │
│  │ • Logger                • Validation               • Not Found Handler          │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            ROUTE LAYER                                           │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                  │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐                 │  │
│  │  │  /quiz Routes   │  │ /learning Routes │  │ /pdf Routes    │ /analysis       │  │
│  │  ├─────────────────┤  ├──────────────────┤  ├────────────────┤                 │  │
│  │  │ POST /generate  │  │ POST /material   │  │ POST /upload   │ POST /save      │  │
│  │  │ POST /score     │  │ GET /progress    │  │ GET /text      │ GET /analyses   │  │
│  │  │ GET /:id        │  │ ...              │  │ ...            │ ...             │  │
│  │  └─────────────────┘  └──────────────────┘  └────────────────┘                 │  │
│  │                                                                                  │  │
│  │  ┌──────────────────────────────────────────┐                                  │  │
│  │  │      /agent Routes - AI Agent System     │                                  │  │
│  │  ├──────────────────────────────────────────┤                                  │  │
│  │  │ POST /agent/process - Route to tools     │                                  │  │
│  │  └──────────────────────────────────────────┘                                  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         CONTROLLER LAYER                                        │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                  │  │
│  │  quizController.js          learningController.js     analysisController.js      │  │
│  │  ├─ generateQuiz()          ├─ generateMaterial()     ├─ saveAnalysis()         │  │
│  │  ├─ scoreQuiz()             ├─ getProgress()         ├─ getAnalyses()          │  │
│  │  └─ getQuiz()               └─ ...                    └─ ...                    │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         SERVICE LAYER (Business Logic)                          │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                  │  │
│  │  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐   │  │
│  │  │   aiService.js     │  │  quizService.js  │  │ analysisService.js      │   │  │
│  │  ├────────────────────┤  ├──────────────────┤  ├─────────────────────────┤   │  │
│  │  │ • generateQuiz     │  │ • storeQuiz()    │  │ • saveUserAnalysis()    │   │  │
│  │  │ • generateMaterial │  │ • scoreAnswers() │  │ • getUserAnalyses()     │   │  │
│  │  │ • buildPrompt()    │  │ • normalizeAns() │  │ • updateAnalysis()      │   │  │
│  │  │ (Gemini API calls) │  │ • cacheQuiz()    │  │ • saveOngoingGoals()    │   │  │
│  │  └────────────────────┘  └──────────────────┘  └─────────────────────────┘   │  │
│  │                                                                                  │  │
│  │  ┌────────────────────┐  ┌──────────────────┐                                  │  │
│  │  │ learningService.js │  │  pdfService.js   │                                  │  │
│  │  ├────────────────────┤  ├──────────────────┤                                  │  │
│  │  │ • Business logic   │  │ • PDF handling   │                                  │  │
│  │  │   for learning     │  │ • Text extract   │                                  │  │
│  │  └────────────────────┘  └──────────────────┘                                  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      AGENT SYSTEM (AI-Powered Routing)                          │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                  │  │
│  │  LearningAgent.js - Analyzes user messages and routes to appropriate tools      │  │
│  │                                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                          AI Tools (Function Calling)                   │    │  │
│  │  ├────────────────────────────────────────────────────────────────────────┤    │  │
│  │  │                                                                        │    │  │
│  │  │  quizTool.js           ragTool.js          analyticsTool.js           │    │  │
│  │  │  ├─ generateQuiz()     ├─ chatWithPDF()    ├─ getProgress()          │    │  │
│  │  │  └─ quizToolSchema     └─ ragToolSchema    └─ analyticsToolSchema    │    │  │
│  │  │                                                                        │    │  │
│  │  │  contentTool.js        studyPlannerTool.js  validationTool.js        │    │  │
│  │  │  ├─ generateContent()  ├─ createPlan()     ├─ evaluateStyle()       │    │  │
│  │  │  └─ contentToolSchema  └─ plannerSchema    └─ validationSchema      │    │  │
│  │  │                                                                        │    │  │
│  │  └────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                       CONFIGURATION & UTILITIES                                 │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                  │  │
│  │  config/ai.js - Gemini API Client Setup                                         │  │
│  │  config/database.js - PostgreSQL Connection & Init                              │  │
│  │  utils/errorHandler.js - Error Handling Middleware                              │  │
│  │  utils/logger.js - Centralized Logging                                          │  │
│  │  utils/jsonParser.js - Safe JSON Parsing                                        │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                          │
                          ├─ Calls to Gemini API
                          ├─ Calls to RAG Service (Port 5001)
                          └─ Queries PostgreSQL
                          
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│              RAG/PDF SERVICE - Express.js (Port 5001)                                   │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                             Routes                                               │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ POST /upload     - Receive PDF and start ingestion                              │  │
│  │ POST /chat       - Chat with PDF (RAG)                                          │  │
│  │ POST /mindmap    - Generate mind map visualization                              │  │
│  │ GET /health      - Service health check                                         │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         RAG Pipeline                                             │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                  │  │
│  │  rag/ingestPdf.js                                                                │  │
│  │  ├─ Receive PDF file                                                            │  │
│  │  ├─ Extract text with pdf-parse                                                 │  │
│  │  ├─ Call pdfChunker.js                                                          │  │
│  │  ├─ Split into chunks (512-token chunks)                                        │  │
│  │  ├─ Call embeddings.js for each chunk                                           │  │
│  │  ├─ Generate vectors using OpenAI                                               │  │
│  │  └─ Store in vectorStore (PostgreSQL)                                           │  │
│  │                                                                                  │  │
│  │  rag/vectorStore.js                                                              │  │
│  │  ├─ similaritySearch() - Find relevant chunks                                   │  │
│  │  ├─ getAllChunkTexts() - Retrieve all chunks                                    │  │
│  │  ├─ getChunkCount() - Get total chunks                                          │  │
│  │  └─ Database: document_chunks table (embedding index)                           │  │
│  │                                                                                  │  │
│  │  rag/embeddings.js                                                               │  │
│  │  ├─ getEmbedding() - Call OpenAI to embed text                                  │  │
│  │  └─ Returns vector array                                                        │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                          │
                          └─ Calls OpenAI API for embeddings
                          
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER - PostgreSQL Database (Port 5432)                         │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ QUIZ TABLES                    ANALYTICS TABLES        RAG TABLES               │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                  │  │
│  │ • quizzes                    • user_analyses        • document_chunks          │  │
│  │   - id (PK)                    - id (PK)              - id (PK)                │  │
│  │   - topic                      - user_id              - pdf_id                 │  │
│  │   - source_type                - skills (JSONB)       - chunk_text             │  │
│  │   - created_at                 - weak_areas           - embedding (vector)     │  │
│  │   - expires_at                 - technical_level      - page_number            │  │
│  │                                - learning_style                                │  │
│  │ • quiz_questions             • onboarding_goals     • uploaded_pdfs           │  │
│  │   - id (PK)                    - id (PK)              - id (PK)                │  │
│  │   - quiz_id (FK)               - user_id              - file_name              │  │
│  │   - question                   - goals (JSONB)        - file_size              │  │
│  │   - options (JSONB)            - created_at           - status                 │  │
│  │   - correct_answer                                    - chunk_count            │  │
│  │   - explanation                                       - created_at             │  │
│  │                                                                                │  │
│  │ • quiz_results                                                                │  │
│  │   - id (PK)                                                                   │  │
│  │   - quiz_id (FK)                                                              │  │
│  │   - user_answers (JSONB)                                                      │  │
│  │   - score                                                                     │  │
│  │   - correct_count                                                             │  │
│  │   - completed_at                                                              │  │
│  │                                                                                │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ INDEXES (for performance)                                                       │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ • idx_quizzes_created_at - Sort quizzes by date                                │  │
│  │ • idx_quiz_questions_quiz_id - Find questions for quiz                         │  │
│  │ • idx_quiz_results_quiz_id - Find results for quiz                             │  │
│  │ • idx_document_chunks_pdf_id - Find chunks for PDF                             │  │
│  │ • idx_document_chunks_embedding - Vector similarity search (GIN index)         │  │
│  │                                                                                 │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                          │
                          └─ 4 External APIs
                          
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL APIs & Services                                      │
│                                                                                         │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐         │
│ │  Google Gemini API   │  │   OpenAI API         │  │   GitHub API         │         │
│ │  (Quiz & Content)    │  │   (Embeddings)       │  │   (Skill Extraction) │         │
│ ├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤         │
│ │ • generateContent()  │  │ • createEmbedding()  │  │ • getUserRepos()     │         │
│ │ • generateQuestions()│  │ • chat()             │  │ • getRepoLanguages() │         │
│ │ • Model: gemini-2.5  │  │ • Model: gpt-4       │  │                      │         │
│ │                      │  │         gpt-3.5      │  │                      │         │
│ │                      │  │                      │  │                      │         │
│ └──────────────────────┘  └──────────────────────┘  └──────────────────────┘         │
│                                                                                         │
│ ┌──────────────────────┐                                                              │
│ │  Clerk API           │                                                              │
│ │  (Authentication)    │                                                              │
│ ├──────────────────────┤                                                              │
│ │ • User Auth          │                                                              │
│ │ • Session Mgmt       │                                                              │
│ │ • User Data          │                                                              │
│ │                      │                                                              │
│ └──────────────────────┘                                                              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Code Examples

### **1. Frontend - HomePage Component Flow**

```javascript
// frontend/src/pages/HomePage.js

function HomePage() {
  const [githubProfileUrl, setGithubProfileUrl] = useState("");
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  // Extract GitHub username from URL
  const extractGithubUsername = (url) => {
    const githubProfileRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-_]+$/;
    if (!githubProfileRegex.test(url)) return null;
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  // Fetch repositories from GitHub API
  const fetchGithubRepos = async (username) => {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30`
    );
    if (!response.ok) throw new Error('Unable to fetch GitHub data');
    return response.json();
  };

  // Extract skills from repositories
  const extractSkillsFromRepos = (repos) => {
    const skillsSet = new Set();
    const languageKeywords = {
      'JavaScript': ['JS', 'React', 'Node', 'Express'],
      'Python': ['Django', 'Flask', 'FastAPI', 'ML'],
      'TypeScript': ['TS', 'Angular'],
      // ... more mappings
    };
    
    repos.forEach(repo => {
      if (repo.language) {
        skillsSet.add(repo.language);
        if (languageKeywords[repo.language]) {
          languageKeywords[repo.language].forEach(kw => skillsSet.add(kw));
        }
      }
    });
    
    return Array.from(skillsSet);
  };

  // Main handler for GitHub analysis
  const handleAnalyzeGithub = async () => {
    setLoading(true);
    try {
      const username = extractGithubUsername(githubProfileUrl);
      if (!username) {
        setError('Invalid GitHub URL');
        return;
      }
      
      const repos = await fetchGithubRepos(username);
      const skills = extractSkillsFromRepos(repos);
      setExtractedSkills(skills);
      
      // Save analysis to backend
      const response = await fetch('http://localhost:5000/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123',
          sourceType: 'github',
          sourceUrl: githubProfileUrl,
          skills: skills
        })
      });
      
      const result = await response.json();
      setSuccessMessage('Analysis saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h1>Personalized Learning Platform</h1>
      
      {/* GitHub Input Section */}
      <InputBox
        value={githubProfileUrl}
        onChange={e => setGithubProfileUrl(e.target.value)}
        placeholder="https://github.com/username"
      />
      <Button onClick={handleAnalyzeGithub} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze GitHub'}
      </Button>
      
      {/* Display extracted skills */}
      {extractedSkills.length > 0 && (
        <div className="skills-display">
          <h2>Extracted Skills</h2>
          <div className="skill-tags">
            {extractedSkills.map(skill => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Resume upload section */}
      <ResumeUploader />
      
      {/* Error/Success messages */}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
    </div>
  );
}
```

---

### **2. Backend - Quiz Generation Flow**

```javascript
// backend/controllers/quizController.js

async function generateQuiz(req, res) {
  try {
    const { docText, topic, difficulty, technicalLevel } = req.body;
    
    // Validation
    if (!docText?.trim() && !topic?.trim()) {
      return res.status(400).json({ error: 'docText or topic required' });
    }
    
    let text = docText?.trim().length > 100 ? docText : topic;
    
    // Call service to generate questions
    const questions = await generateQuestionsFromTopic(text);
    
    if (!Array.isArray(questions)) {
      throw new Error('Invalid Gemini response');
    }
    
    // Create quiz ID and normalize data
    const quizId = generateQuizId();
    const quizData = questions.map((q, idx) => ({
      originalIndex: idx,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      ans: q.answer,
      explanation: q.explanation || '',
      category: q.category || ''
    }));
    
    // Store in database
    await storeQuiz(quizId, quizData, topic || 'Document Quiz');
    
    // Cache for future requests
    cacheQuiz(topic, quizData);
    
    res.setHeader('X-Quiz-Id', quizId);
    return res.json(quizData);
    
  } catch (err) {
    const errorResponse = handleError(err, '/quiz/generate');
    return res.status(errorResponse.status).json({ 
      error: errorResponse.error, 
      message: errorResponse.message 
    });
  }
}
```

---

### **3. Service Layer - AI Generation**

```javascript
// backend/services/aiService.js

async function generateQuizQuestions(text, options = {}) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');
  const prompt = buildQuizPrompt(text, options);

  // Call Gemini API with JSON response
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output');
  }

  return parseJson(rawText);
}

function buildQuizPrompt(text, options = {}) {
  const { topic, difficulty = 'intermediate', technicalLevel } = options;
  
  // Check if text is a topic (short) or actual content (long)
  const isTopic = text.trim().length < 200;
  
  if (isTopic) {
    return `Generate comprehensive skill-testing quiz questions on topic: ${text}.
    
Target difficulty level: ${technicalLevel || difficulty}.

The questions should test practical understanding and application of concepts.
Include scenario-based questions, concept understanding, and problem-solving.

Generate 10 questions that a ${technicalLevel || difficulty} level learner should know.

Return as JSON array: [
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "A",
    "explanation": "...",
    "category": "..."
  }
]`;
  }
  
  return `Convert this content into skill-testing questions:

${text}

Generate 10 MCQ with detailed explanations. Return as JSON.`;
}

async function generateLearningMaterial(topic, technicalLevel, learningStyle) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');

  const prompt = `You are an expert technical educator. Generate learning material:

Topic: ${topic}
Technical Level: ${technicalLevel}
Learning Style: ${learningStyle}

Create JSON with structure:
{
  "title": "Complete ${topic} Learning Guide",
  "summary": "...",
  "sections": [
    {
      "title": "Section Title",
      "content": "2-3 paragraphs explaining with examples"
    }
  ],
  "keyPoints": ["Point 1", "Point 2", ...],
  "examples": [
    {
      "title": "Example Title",
      "code": "Code snippet",
      "explanation": "..."
    }
  ],
  "estimatedTime": "30 minutes",
  "estimatedDifficulty": "${technicalLevel}"
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseJson(rawText);
}
```

---

### **4. Agent System - Intelligent Routing**

```javascript
// backend/agents/LearningAgent.js

/**
 * Check if message is about PDF chat
 */
function isPdfChat(message) {
  const pdfChatPatterns = [
    /explain\s+(pdf|this|the)/i,
    /summarize\s+(pdf|document)/i,
    /tell\s+me\s+about\s+(this|the)\s*(pdf|document)/i,
    /what\s+is\s+in\s+(this|the)\s*(pdf|document)/i,
    /read\s+(this|my|the)\s*(pdf|document)/i,
    /chat\s+with\s+(this|my|the)\s*(pdf|document)/i
  ];
  
  return pdfChatPatterns.some(pattern => pattern.test(message.toLowerCase()));
}

/**
 * Check if message is about quiz
 */
function isQuizRequest(message) {
  const quizPatterns = [
    /quiz\s+.*/i,
    /test\s+my/i,
    /practice\s+.*/i,
    /generate.*quiz/i,
    /take.*quiz/i
  ];
  
  return quizPatterns.some(pattern => pattern.test(message.toLowerCase()));
}

/**
 * Process user message and route to appropriate tool
 */
export async function processMessage(message, conversationContext = {}) {
  console.log("🤖 LearningAgent processing:", message);

  // Build tools array based on available APIs
  const tools = [
    quizToolSchema,           // Quiz generation
    ragToolSchema,            // PDF chat
    analyticsToolSchema,      // Progress tracking
    contentToolSchema         // Learning content
  ];

  // Use OpenAI for function calling
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a learning assistant. Analyze the user message and call the appropriate tool.'
      },
      {
        role: 'user',
        content: message
      }
    ],
    tools: tools,
    tool_choice: 'auto'  // Let AI decide which tool to use
  });

  // Extract tool call if any
  const toolCall = response.choices[0].message.tool_calls?.[0];
  
  if (!toolCall) {
    return {
      success: false,
      message: 'Could not determine appropriate action'
    };
  }

  // Execute appropriate tool based on function call
  const args = JSON.parse(toolCall.arguments);
  
  switch (toolCall.function.name) {
    case 'quizTool':
      return await quizTool(args);
    case 'ragTool':
      return await ragTool(args);
    case 'analyticsTool':
      return await analyticsTool(args);
    case 'contentTool':
      return await contentTool(args);
    default:
      return { success: false, message: 'Unknown tool' };
  }
}
```

---

### **5. RAG Implementation - PDF Chat**

```javascript
// rag-pdf-service/server.js

// PDF Upload Endpoint
app.post("/upload", async (req, res) => {
  try {
    if (!req.files?.pdf) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfFile = req.files.pdf;
    const filePath = `./uploads/${pdfFile.name}`;
    
    // Save file
    await pdfFile.mv(filePath);
    
    // Ingest PDF (extract text, chunk, embed)
    const chunks = await ingestPdf(filePath);
    
    // Store in PostgreSQL
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.text);
      await storeChunk({
        pdfId: pdfFile.name,
        chunkText: chunk.text,
        embedding: embedding,
        pageNumber: chunk.pageNumber
      });
    }
    
    res.json({
      success: true,
      fileName: pdfFile.name,
      chunkCount: chunks.length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with PDF Endpoint (RAG)
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;
    
    // 1. Embed the user's question
    const queryEmbedding = await getEmbedding(message);
    
    // 2. Semantic search in vector database
    const relevantChunks = await similaritySearch(queryEmbedding, topK=5);
    
    // 3. Build context from relevant chunks
    const context = relevantChunks
      .map(chunk => chunk.text)
      .join('\n\n');
    
    // 4. Call OpenAI with context
    const answer = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Answer questions based on the provided document.'
        },
        {
          role: 'user',
          content: `Document context:\n${context}\n\nQuestion: ${message}`
        }
      ]
    });
    
    res.json({
      answer: answer.choices[0].message.content,
      sources: relevantChunks.map(c => ({
        page: c.page_number,
        excerpt: c.text.substring(0, 100) + '...'
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mind Map Generation
app.post("/mindmap", async (req, res) => {
  try {
    // Get all chunks from database
    const chunks = await getAllChunkTexts();
    
    // Use OpenAI to generate hierarchical structure
    const mindmapData = await openai.chat.completions.create({
      model: 'gpt-4',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Create a mind map structure (JSON) for this document:\n${chunks.join('\n')}\n\nReturn as: { nodes: [...], edges: [...] }`
        }
      ]
    });
    
    res.json(JSON.parse(mindmapData.choices[0].message.content));
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### **6. Database - Schema Example**

```sql
-- Quiz Tables
CREATE TABLE quizzes (
    id VARCHAR(100) PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,  -- Array of option strings
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

CREATE TABLE quiz_results (
    id SERIAL PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_answers JSONB NOT NULL,  -- User's selected answers
    score INTEGER,
    correct_count INTEGER,
    total_count INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Tables
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    pdf_id VARCHAR(100) NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding JSONB NOT NULL,  -- Vector array from OpenAI
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING GIN (embedding);
CREATE INDEX idx_document_chunks_pdf_id ON document_chunks(pdf_id);

-- Analysis Tables
CREATE TABLE user_analyses (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    source_type VARCHAR(50) NOT NULL,  -- 'resume' or 'github'
    source_url TEXT,
    extracted_text TEXT,
    skills JSONB,  -- Array of skill names
    strengths JSONB,
    weak_areas JSONB,
    technical_level VARCHAR(50),
    learning_style VARCHAR(50),
    overall_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔄 Complete Data Flow Example: Quiz Generation

```
┌─────────────────────────────────────────────────────────┐
│ USER INTERACTION                                        │
└─────────────────────────────────────────────────────────┘
User opens QuizPage.js component
User enters topic: "JavaScript"
User clicks "Generate Quiz" button

│ ↓

┌─────────────────────────────────────────────────────────┐
│ FRONTEND - React (frontend)                              │
└─────────────────────────────────────────────────────────┘
QuizPage.js triggers generateQuiz()
  ├─ Calls learningService.generateQuiz()
  │   └─ Makes HTTP POST to http://localhost:5000/quiz/generate
  │       ├─ Headers: { 'Content-Type': 'application/json' }
  │       └─ Body: { topic: "JavaScript", difficulty: "medium" }
  │
  └─ Sets loading state: setLoading(true)

│ ↓ (HTTP Request)

┌─────────────────────────────────────────────────────────┐
│ BACKEND - Express.js (backend)                          │
└─────────────────────────────────────────────────────────┘

1. Route Handler (routes/quizRoutes.js)
   └─ POST /quiz/generate → quizController.generateQuiz()

2. Controller (controllers/quizController.js)
   ├─ Extract request body: { topic, difficulty, technicalLevel }
   ├─ Validate input: topic required
   ├─ Build text variable with topic ("JavaScript")
   ├─ Call: generateQuestionsFromTopic(text)
   └─ Passes control to Service Layer

3. Service Layer (services/aiService.js)
   ├─ Function: generateQuestionsFromTopic(text)
   ├─ Build prompt:
   │   └─ Since text < 200 chars (it's a topic):
   │       Create prompt: "Generate 10 quiz questions on JavaScript..."
   │
   ├─ Call Gemini API:
   │   ├─ Model: gemini-2.5-flash
   │   ├─ Settings: responseMimeType: 'application/json'
   │   └─ Wait for response...
   │
   ├─ Parse response:
   │   └─ Extract JSON: 
   │       [
   │         {
   │           "question": "What is JavaScript?",
   │           "options": ["A: Language", "B: Framework", ...],
   │           "answer": "A: Language",
   │           "explanation": "JavaScript is a programming language...",
   │           "category": "Basics"
   │         },
   │         ... (9 more questions)
   │       ]
   │
   └─ Return questions array to Controller

4. Controller (continued)
   ├─ Receive questions array
   ├─ Validate: Array.isArray(questions) ✓
   ├─ Generate Quiz ID:
   │   └─ quizId = "quiz_1712102400000_abc123"
   │
   ├─ Normalize data:
   │   └─ Map each question to standard format
   │
   ├─ Store in Database:
   │   ├─ Call: storeQuiz(quizId, quizData, "JavaScript")
   │   │   ├─ Insert into quizzes table
   │   │   │   ├─ id: quizId
   │   │   │   ├─ topic: "JavaScript"
   │   │   │   ├─ source_type: "text"
   │   │   │   └─ created_at: NOW()
   │   │   │
   │   │   └─ Insert each question into quiz_questions table
   │   │       ├─ quiz_id: quizId
   │   │       ├─ question, options, correct_answer, explanation, category
   │   │       └─ created_at: NOW()
   │   │
   │   ├─ Database operations complete ✓
   │   └─ Return success
   │
   ├─ Set response header:
   │   └─ X-Quiz-Id: quizId
   │
   └─ Return HTTP 200 with questions array

│ ↓ (HTTP Response with questions)

┌─────────────────────────────────────────────────────────┐
│ FRONTEND - React (frontend)                              │
└─────────────────────────────────────────────────────────┘

QuizPage.js receives response
  ├─ Store state:
  │   ├─ setQuestions(questions)
  │   ├─ setQuizId(quizId) from header
  │   └─ setLoading(false)
  │
  └─ UI Re-render:
      ├─ Map through questions
      ├─ For each question:
      │   ├─ Display: "What is JavaScript?"
      │   ├─ Show options as radio buttons:
      │   │   ├─ A: Language
      │   │   ├─ B: Framework
      │   │   ├─ C: Library
      │   │   └─ D: Database
      │   ├─ User can select answer
      │   ├─ Show: "Question 1 of 10"
      │   ├─ Show: [Previous] [Next] buttons
      │   └─ Continue for remaining questions
      │
      └─ Visual: Quiz interface displayed with questions

│ ↓

┌─────────────────────────────────────────────────────────┐
│ USER INTERACTION - Taking Quiz                          │
└─────────────────────────────────────────────────────────┘

User answers all 10 questions
  ├─ Question 1: Selects "A: Language"
  ├─ Question 2: Selects "B: Framework"
  ├─ Question 3: Selects "A: Correct Answer"
  └─ ... (continue for remaining questions)

User clicks "Submit Quiz" button

│ ↓

┌─────────────────────────────────────────────────────────┐
│ FRONTEND - React (Submission)                           │
└─────────────────────────────────────────────────────────┘

QuizPage.js triggers submitQuiz()
  └─ Makes HTTP POST to http://localhost:5000/quiz/score-quiz
      ├─ Headers: { 'Content-Type': 'application/json' }
      └─ Body: 
          {
            "quizId": "quiz_1712102400000_abc123",
            "answers": ["A: Language", "B: Framework", "A", ...]
          }

│ ↓ (HTTP Request)

┌─────────────────────────────────────────────────────────┐
│ BACKEND - Express.js (Scoring)                          │
└─────────────────────────────────────────────────────────┘

1. Route Handler (routes/quizRoutes.js)
   └─ POST /quiz/score-quiz → quizController.scoreQuiz()

2. Controller (controllers/quizController.js)
   ├─ Extract: { quizId, answers }
   ├─ Call: scoreQuizAnswers(quizId, answers)
   └─ Passes to Service Layer

3. Service Layer (services/quizService.js)
   ├─ Function: scoreQuizAnswers(quizId, answers)
   ├─ Query database:
   │   ├─ SELECT * FROM quiz_questions WHERE quiz_id = '...'
   │   └─ Retrieve all correct answers
   │
   ├─ Compare user answers with correct answers:
   │   ├─ For each answer:
   │   │   ├─ User answered: "A: Language"
   │   │   ├─ Correct answer: "A: Language"
   │   │   ├─ Match? YES → increment correctCount
   │   │   └─ Continue for all questions
   │   │
   │   └─ Calculate:
   │       ├─ correctCount = 8
   │       ├─ totalCount = 10
   │       └─ score = (8 / 10) * 100 = 80%
   │
   ├─ Store result in database:
   │   └─ INSERT INTO quiz_results (quiz_id, user_answers, score, ...)
   │
   └─ Return scoring object:
       {
         "score": 80,
         "correct_count": 8,
         "total_count": 10,
         "percentage": 80,
         "results": [
           { "question": "...", "userAnswer": "...", "correct": true },
           ...
         ]
       }

│ ↓ (HTTP Response with score)

┌─────────────────────────────────────────────────────────┐
│ FRONTEND - React (Results Display)                      │
└─────────────────────────────────────────────────────────┘

QuizPage.js receives scoring response
  ├─ Store state:
  │   ├─ setScore(80)
  │   ├─ setResults(results)
  │   └─ setShowResults(true)
  │
  └─ UI Changes:
      ├─ Hide question display
      ├─ Show results screen:
      │   ├─ Display: "🎉 Score: 80/100"
      │   ├─ Show: "You got 8 out of 10 correct"
      │   ├─ Progress bar: 80%
      │   ├─ Display category breakdown
      │   │   ├─ Basics: 100%
      │   │   ├─ Advanced: 67%
      │   │   └─ Concepts: 75%
      │   │
      │   ├─ Show answers review:
      │   │   ├─ Question 1: ✓ Correct
      │   │   │   ├─ Your answer: "A: Language"
      │   │   │   └─ Explanation: "JavaScript is a programming language..."
      │   │   │
      │   │   ├─ Question 2: ✓ Correct
      │   │   │
      │   │   ├─ Question 3: ✗ Incorrect
      │   │   │   ├─ Your answer: "B: Framework"
      │   │   │   ├─ Correct: "A: Language"
      │   │   │   └─ Explanation: "..."
      │   │   │
      │   │   └─ Continue for all questions
      │   │
      │   └─ Action buttons:
      │       ├─ "Retake Quiz"
      │       ├─ "Learn More on JavaScript"
      │       └─ "Go to Dashboard"
      │
      └─ If score < target (e.g., < 70%):
          ├─ Show: "Let's improve your skills"
          ├─ Call: generateLearningMaterial("JavaScript", "Intermediate", "Reading")
          └─ Suggest viewing learning content

│ ↓

┌─────────────────────────────────────────────────────────┐
│ OPTIONAL - Learning Material Generation                  │
└─────────────────────────────────────────────────────────┘

User clicks "Learn More on JavaScript"
  ├─ Call: learningService.generateLearningMaterial()
  ├─ HTTP POST to http://localhost:5000/learning/material
  │   └─ Body: { topic: "JavaScript", technicalLevel: "Beginner", learningStyle: "Reading" }
  │
  └─ Backend processes:
      ├─ aiService.generateLearningMaterial()
      ├─ Calls Gemini API
      ├─ Returns structured content:
      │   {
      │     "title": "Complete JavaScript Learning Guide",
      │     "summary": "...",
      │     "sections": [
      │       {
      │         "title": "What is JavaScript?",
      │         "content": "JavaScript is a programming language..."
      │       },
      │       ...
      │     ],
      │     "keyPoints": ["Point 1", "Point 2", ...],
      │     "examples": [...]
      │   }
      │
      └─ Frontend navigates to LearningMaterialPage
          ├─ Display: Summary
          ├─ Display: Key Points
          ├─ Display: Detailed Sections
          ├─ Display: Code Examples
          └─ Button: "Export as PDF"

└─ COMPLETE FLOW ✓
```

---

**This documentation provides:**
- ✅ Complete system architecture with visual diagrams
- ✅ Code examples for each layer (Frontend, Backend, Services, Agents, RAG)
- ✅ Detailed data flow for core features
- ✅ Database schema examples
- ✅ API endpoint specifications
- ✅ Technology stack details
- ✅ File organization and purpose
- ✅ Complete user journey examples


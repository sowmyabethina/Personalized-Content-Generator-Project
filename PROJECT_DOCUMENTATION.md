# Personalized Content Generator Project - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Folder Structure & File Organization](#folder-structure--file-organization)
6. [Backend Architecture](#backend-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Database Design](#database-design)
9. [Key Components & Their Purposes](#key-components--their-purposes)
10. [Data Flow & Communication](#data-flow--communication)
11. [Agent System](#agent-system)
12. [Configuration & Environment](#configuration--environment)

---

## 🎯 Project Overview

**Project Name:** Personalized Content Generator  
**Description:** An AI-powered platform for personalized learning that analyzes user skills, generates customized quizzes, learning materials, and provides PDF chat functionality with mind map visualization.

**Purpose:** 
- Analyze developer profiles (GitHub/Resume) to extract skills and expertise levels
- Generate skill-appropriate quizzes and learning content
- Track learning progress with analytics
- Provide AI-powered document analysis and Q&A
- Create visual representations (mind maps) of document structures

**Target Users:** Developers, learners, students seeking personalized skill assessment and learning

---

## ✨ Core Features

### 1. **Profile Analysis**
- **GitHub Integration**: Fetch repositories and extract programming languages/frameworks
- **Resume Parsing**: Extract text from PDF resumes and identify skills
- **Automatic Skill Extraction**: AI-powered skill identification from profiles
- **Technical Level Assessment**: Determine beginner/intermediate/advanced levels
- **Learning Style Detection**: Identify preferred learning styles (Visual, Reading, Auditory, Kinesthetic)

### 2. **Quiz System**
- **Topic-Based Quiz Generation**: Create quizzes on any topic
- **PDF-Based Quiz Generation**: Generate questions from uploaded documents
- **Multiple Question Types**: Multiple choice with explanations
- **Dynamic Difficulty Levels**: Easy, Medium, Hard
- **Real-Time Scoring**: Calculate and display scores
- **Score Tracking**: Store quiz results for history/analytics

### 3. **Learning Materials Generation**
- **Personalized Content**: AI-generated learning materials based on skill level and learning style
- **Multiple Learning Styles**: 
  - Visual: Diagrams, infographics, structured visuals
  - Reading: Detailed text explanations
  - Auditory: Key points, summary formulations
  - Kinesthetic: Code examples, hands-on scenarios
- **Technical Levels**: Beginner, Intermediate, Advanced
- **Structured Sections**: 
  - Summary
  - Key Points
  - Important Concepts
  - Examples Section
  - Applications
  - Think Questions
  - Completion Screen

### 4. **Progress Tracking & Analytics**
- **Dashboard Analytics**: Visual progress tracking with charts
- **Score Trends**: Historical performance visualization
- **Readiness Assessment**: Job and interview readiness scoring
- **Weak Areas Identification**: Pinpoint improvement areas
- **Learning Metrics**: Track completion rates and improvements

### 5. **PDF Chat & RAG (Retrieval-Augmented Generation)**
- **Document Upload**: Accept PDF files for processing
- **Semantic Search**: Find relevant content using embeddings
- **Interactive Q&A**: Ask questions about document content
- **Mind Map Generation**: Visualize document structure
- **Source Citation**: Reference specific document sections
- **In-Memory Caching**: Cache responses for performance

### 6. **Authentication**
- **Clerk Integration**: User authentication and management
- **Session Management**: User sessions and onboarding tracking
- **User-Specific Data**: Personalized content and progress

---

## 💻 Technology Stack

### **Frontend** (React-based SPA)
```
Core:
- React 19.2.4 - UI framework
- React Router DOM 7.13.0 - Client-side routing
- React Scripts 5.0.1 - Build tooling (CRA)

Authentication:
- @clerk/clerk-react 5.60.0 - Authentication provider

Visualization & UI:
- @xyflow/react 12.10.0 - Flow diagrams (mind maps)
- recharts 3.7.0 - Charts and graphs
- lucide-react 0.575.0 - Icon library
- canvas-confetti 1.9.4 - Celebration effects
- dagre 0.8.5 - Graph layout algorithms

PDF & Document:
- jspdf 4.2.1 - PDF generation

Testing:
- @testing-library/react 16.3.2
- @testing-library/jest-dom 6.9.1
```

### **Backend** (Node.js - Multiple Services)

#### Main Backend (Express)
```
Core:
- express 5.2.1 - Web framework
- dotenv 17.2.4 - Environment variable management
- cors 2.8.6 - Cross-origin requests

AI/ML:
- @google/generative-ai 0.21.0 - Google Gemini API
- openai 6.25.0 - OpenAI API
- node-fetch 3.3.2 - HTTP client

Database:
- pg 8.18.0 - PostgreSQL driver

File Handling:
- multer 1.4.5 - File upload middleware
- pdf-parse 1.1.1 - PDF text extraction
- pdfkit 0.17.2 - PDF creation

Utilities:
- axios 1.13.5 - HTTP client
```

#### RAG PDF Service
```
- express
- cors
- multer
- openai (for OpenAI API calls)
- dotenv
```

### **Database**
- **PostgreSQL 15** - Primary database
  - Document chunks for RAG
  - Quiz data (questions, answers, results)
  - User analyses (GitHub/Resume data)
  - User progress and learning data
  - Uploaded PDF metadata

### **Infrastructure**
- **Docker & Docker Compose** - Containerization
- **Linux/Alpine** - Lightweight base image

---

## 🏗️ System Architecture

### **Overall Architecture Pattern**
```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React SPA)                       │
│  - Pages: Home, Quiz, Learning, Results, Progress      │
│  - Components: Layout, Navbar, UI components            │
│  - Services: learningService.js (API calls)            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─► HTTP REST API
                 │
┌────────────────┴──────────────────────────────────────┐
│         Backend (Express.js - Port 5000)              │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ Routes Layer                                   │   │
│  │ - /quiz - Quiz operations                      │   │
│  │ - /learning - Learning materials               │   │
│  │ - /pdf - PDF operations                        │   │
│  │ - /analysis - User analysis                    │   │
│  │ - /agent - Agent operations                    │   │
│  └─────────────┬──────────────────────────────────┘   │
│                │                                       │
│  ┌─────────────▼──────────────────────────────────┐   │
│  │ Controllers & Services Layer                   │   │
│  │ - quizController/quizService                   │   │
│  │ - learningController/learningService           │   │
│  │ - analysisController/analysisService           │   │
│  │ - pdfController/pdfService                     │   │
│  │ - aiService (Gemini API)                       │   │
│  │ - LearningAgent (AI routing)                   │   │
│  └─────────────┬──────────────────────────────────┘   │
│                │                                       │
│  ┌─────────────▼──────────────────────────────────┐   │
│  │ Agent Tools                                    │   │
│  │ - quizTool - Generate quizzes                  │   │
│  │ - ragTool - PDF chat/RAG operations            │   │
│  │ - analyticsTool - Learning analytics           │   │
│  │ - contentTool - Content generation             │   │
│  │ - validationTool - Validation tools            │   │
│  │ - studyPlannerTool - Study planning            │   │
│  └─────────────┬──────────────────────────────────┘   │
│                │                                       │
└────────────────┼───────────────────────────────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
┌───────▼──────┐  ┌────────▼────────────┐
│ PostgreSQL   │  │ External Services   │
│ Database     │  │ - Gemini API        │
│ - Quizzes    │  │ - OpenAI API        │
│ - Users      │  │ - GitHub API        │
│ - Analytics  │  └─────────────────────┘
│ - PDFs       │
└──────────────┘

┌────────────────────────────────────────────────────────┐
│    RAG PDF Service (Express.js - Port 5001)           │
│                                                        │
│  - /upload - PDF ingestion                            │
│  - /chat - Chat with documents (RAG)                  │
│  - /mindmap - Generate mind maps                      │
│  - /health - Service health                           │
│                                                        │
│  Components:                                           │
│  - ingestPdf - PDF processing                         │
│  - embeddings - Vector embeddings                     │
│  - vectorStore - Semantic search                      │
│  - pdfChunker - Text chunking                         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│    PDF Question Generator (Port variable)             │
│                                                        │
│  - /generate - Generate quiz from PDF text            │
│  - Gemini API integration                             │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure & File Organization

```
Personalized-Content-Generator-Project/
│
├── 📄 docker-compose.yml              # Docker services orchestration
├── 📄 QUIZ_FIX_SUMMARY.md             # Documentation of quiz fixes
│
├── 📂 backend/                         # Main Express.js backend
│   ├── 📄 index.js                    # App entry point, middleware setup
│   ├── 📄 package.json                # Dependencies: express, pg, @google/generative-ai
│   ├── 📄 setup-db.js                 # Database initialization script
│   │
│   ├── 📂 config/
│   │   ├── 📄 ai.js                   # Google Gemini API configuration
│   │   └── 📄 database.js             # PostgreSQL connection setup
│   │
│   ├── 📂 routes/                     # Express route handlers
│   │   ├── 📄 quizRoutes.js           # /quiz endpoints
│   │   ├── 📄 learningRoutes.js       # /learning endpoints
│   │   ├── 📄 pdfRoutes.js            # /pdf endpoints
│   │   └── 📄 analysisRoutes.js       # /analysis endpoints (GitHub/Resume)
│   │
│   ├── 📂 controllers/                # Route handlers (thin - just req/res)
│   │   ├── 📄 quizController.js       # Quiz logic - generate, score, retrieve
│   │   ├── 📄 learningController.js   # Learning material generation
│   │   ├── 📄 pdfController.js        # PDF upload and processing
│   │   └── 📄 analysisController.js   # GitHub/Resume analysis
│   │
│   ├── 📂 services/                   # Business logic (core functionality)
│   │   ├── 📄 aiService.js            # AI operations (Gemini)
│   │   ├── 📄 quizService.js          # Quiz operations (DB storage, scoring)
│   │   ├── 📄 learningService.js      # Learning material generation logic
│   │   ├── 📄 analysisService.js      # Profile analysis logic
│   │   └── 📄 pdfService.js           # PDF processing utilities
│   │
│   ├── 📂 agents/                     # AI Agent system for intelligent routing
│   │   ├── 📄 LearningAgent.js        # Main agent (analyzes requests, routes to tools)
│   │   ├── 📄 agentRouter.js          # Agent route setup
│   │   ├── 📄 agentService.js         # Agent service logic
│   │   ├── 📄 routes.js               # /agent endpoints
│   │   │
│   │   └── 📂 tools/                  # AI Agent tools (function calling)
│   │       ├── 📄 quizTool.js         # Quiz generation tool
│   │       ├── 📄 ragTool.js          # RAG/PDF chat tool (calls RAG service)
│   │       ├── 📄 analyticsTool.js    # Learning analytics tool
│   │       ├── 📄 contentTool.js      # Content generation tool
│   │       ├── 📄 studyPlannerTool.js # Study planning tool
│   │       └── 📄 validationTool.js   # Content validation tools
│   │
│   ├── 📂 utils/                      # Utility functions
│   │   ├── 📄 errorHandler.js         # Error handling middleware
│   │   ├── 📄 logger.js               # Logging utility
│   │   └── 📄 jsonParser.js           # JSON parsing with error handling
│   │
│   └── 📂 uploads/                    # PDF upload directory
│
├── 📂 db/                              # Database files
│   ├── 📄 db.js                       # Database initialization
│   ├── 📄 postgres.js                 # PostgreSQL specific code
│   └── 📄 schema.sql                  # Database schema (tables, indexes)
│
├── 📂 mcq-app/                         # React Frontend (Main Application)
│   ├── 📄 package.json                # React dependencies & scripts
│   ├── 📄 README.md                   # CRA readme
│   ├── 📄 ANALYSIS.md                 # Detailed component analysis
│   │
│   ├── 📂 public/
│   │   ├── 📄 index.html              # HTML entry point
│   │   ├── 📄 manifest.json           # PWA manifest
│   │   └── 📄 robots.txt              # SEO robots file
│   │
│   └── 📂 src/
│       ├── 📄 index.js                # React entry point (ReactDOM.render)
│       ├── 📄 index.css               # Global base styles
│       ├── 📄 App.js                  # Main App component (routing)
│       ├── 📄 App.css                 # App global styles
│       │
│       ├── 📂 config/
│       │   └── 📄 api.js              # API endpoint configuration
│       │
│       ├── 📂 constants/
│       │   └── 📄 learningConstants.js # Learning-related constants, learning styles
│       │
│       ├── 📂 components/             # Reusable components
│       │   ├── 📄 Layout.js           # Main layout wrapper
│       │   ├── 📄 Navbar.js           # Navigation bar
│       │   │
│       │   └── 📂 ui/                 # UI component library
│       │       └── 📄 index.jsx       # Button, Card, Input, Badge, etc.
│       │
│       ├── 📂 hooks/                  # Custom React hooks
│       │   └── 📄 useLearningMaterial.js  # Hook for learning state management
│       │
│       ├── 📂 pages/                  # Page components (full-page views)
│       │   ├── 📄 HomePage.js         # Profile analysis (GitHub/Resume)
│       │   ├── 📄 QuizPage.js         # Take quiz interface
│       │   ├── 📄 ResultPage.js       # Quiz results & personalized content
│       │   ├── 📄 LearningMaterialPage.js  # Display learning materials
│       │   ├── 📄 LearningProgressPage.js  # Progress dashboard & analytics
│       │   ├── 📄 PdfChatPage.js      # PDF upload and chat interface
│       │   ├── 📄 SuccessResultPage.js    # Success celebration page
│       │   ├── 📄 About.jsx           # About page
│       │   ├── 📄 Help.jsx            # Help documentation
│       │   │
│       │   └── 📂 LearningMaterialPage/
│       │       ├── 📂 components/     # Page-specific components
│       │       │   ├── 📄 LessonContent.js
│       │       │   ├── 📄 SummarySection.js
│       │       │   ├── 📄 KeyPointsSection.js
│       │       │   ├── 📄 ImportantConceptSection.js
│       │       │   ├── 📄 ExamplesSection.js
│       │       │   ├── 📄 ApplicationsSection.js
│       │       │   ├── 📄 ThinkQuestionSection.js
│       │       │   ├── 📄 CompletionScreen.js
│       │       │   ├── 📄 EstimatedTime.js
│       │       │   ├── 📄 CopyButton.js
│       │       │   └── 📄 index.js    # Main entry component
│       │       ├── 📂 constants/
│       │       │   └── 📄 learningConstants.js
│       │       └── 📂 utils/
│       │           └── 📄 learningHelpers.js
│       │
│       ├── 📂 services/               # API service layer
│       │   └── 📄 learningService.js  # API calls for learning endpoints
│       │
│       ├── 📂 styles/                 # Stylesheets
│       │   ├── 📄 design-system.css   # Global design system & variables
│       │   └── 📄 PdfChatPage.css     # PDF chat specific styles
│       │
│       └── 📂 utils/                  # Utility functions
│           └── 📄 learningUtils.js    # Helper functions for learning
│
├── 📂 pdf/                             # PDF Question Generator Service
│   ├── 📄 package.json
│   ├── 📄 server.js                   # Express server
│   └── 📄 questionGenerator.js        # Gemini-based question generation
│
├── 📂 rag-pdf-service/                 # RAG/Vector Search Service
│   ├── 📄 package.json
│   ├── 📄 server.js                   # Express server (Port 5001)
│   ├── 📄 agentMonitor.js             # Monitor agent events
│   │
│   └── 📂 rag/                        # RAG implementation
│       ├── 📄 ingestPdf.js            # PDF ingestion pipeline
│       ├── 📄 embeddings.js           # Embedding generation (OpenAI)
│       ├── 📄 vectorStore.js          # Vector database operations (PostgreSQL)
│       ├── 📄 pdfChunker.js           # Text chunking for RAG
│       └── 📄 uploads/                # PDF storage
│
└── 📂 uploads/                         # Root-level upload storage (shared)
```

---

## 🔙 Backend Architecture

### **Layer-Based Architecture**

#### 1. **Route Layer** (`routes/`)
- **Purpose**: Define HTTP endpoints and map to controllers
- **Pattern**: Express Router
- **Examples**:
  - `quizRoutes.js`: POST /quiz/generate, POST /quiz/score-quiz, GET /quiz/:id
  - `learningRoutes.js`: POST /learning/material, GET /learning/progress
  - `analysisRoutes.js`: POST /save-analysis, GET /analyses

#### 2. **Controller Layer** (`controllers/`)
- **Purpose**: Handle HTTP requests/responses (thin layer)
- **Responsibility**: 
  - Validate input
  - Call services
  - Format responses
  - Return HTTP status codes
- **Example Code**:
```javascript
// quizController.js - Thin controller
async function generateQuiz(req, res) {
  const { docText, topic, difficulty } = req.body;
  const questions = await generateQuestionsFromTopic(text);
  const quizId = generateQuizId();
  await storeQuiz(quizId, questions, topic);
  res.json(questions);
}
```

#### 3. **Service Layer** (`services/`)
- **Purpose**: Implement business logic and domain operations
- **Services**:
  - `aiService.js`: 
    - `generateQuizQuestions()` - Generate quiz via Gemini
    - `generateLearningMaterial()` - Generate learning content
    - `buildQuizPrompt()` - Create prompts for AI
  - `quizService.js`:
    - `storeQuiz()` - Store in database
    - `scoreQuizAnswers()` - Calculate scores
    - `normalizeQuizAnswer()` - Data normalization
  - `analysisService.js`:
    - `saveUserAnalysis()` - Store profile analysis
    - `getUserAnalyses()` - Retrieve analyses
  - `learningService.js`:
    - Learning material persistence logic

#### 4. **AI Agent System** (`agents/`)
- **Purpose**: Intelligent request routing and tool orchestration
- **Components**:
  - `LearningAgent.js`: Main agent that analyzes user messages
  - `agentService.js`: Agent service logic
  - `tools/`: Function definitions for agent calls

#### 5. **Configuration Layer** (`config/`)
- **ai.js**: Google Gemini API client setup
- **database.js**: PostgreSQL connection and initialization

#### 6. **Utils Layer** (`utils/`)
- `errorHandler.js`: Centralized error handling
- `logger.js`: Logging functionality
- `jsonParser.js`: JSON parsing with error handling

---

## 🎨 Frontend Architecture

### **Page-Based Structure**
```
HomePage
  ├── GitHub Profile Analyzer
  │   ├── Fetch repos via GitHub API
  │   ├── Extract skills from languages/frameworks
  │   └── Display extracted skills
  └── Resume Parser
      ├── PDF text extraction
      └── Skill identification

QuizPage
  ├── Display questions
  ├── Handle answer selection
  └── Submit for scoring

ResultPage
  ├── Show quiz score
  ├── Display analytics
  └── Suggest learning content

LearningMaterialPage
  ├── Display structured learning content
  │   ├── Summary
  │   ├── Key Points
  │   ├── Important Concepts
  │   ├── Examples
  │   ├── Applications
  │   ├── Think Questions
  │   └── Completion Screen
  └── PDF Export

LearningProgressPage
  ├── Progress Dashboard
  ├── Score Trends (Charts)
  ├── Readiness Scores
  └── Analytics

PdfChatPage
  ├── PDF Upload
  ├── Chat Interface
  ├── Mind Map Display
  └── Source Citations

About & Help Pages
  └── Information pages
```

### **Component Hierarchy**
```
App
├── Authentication (Clerk)
├── Navigation (Navbar & Layout)
└── Routes
    ├── HomePage
    ├── QuizPage
    ├── ResultPage
    ├── LearningMaterialPage
    │   └── LearningMaterialPage Components
    ├── LearningProgressPage
    ├── PdfChatPage
    ├── SuccessResultPage
    ├── About
    └── Help
```

### **State Management**
- **Local Component State**: `useState()` for component-level state
- **Custom Hook**: `useLearningMaterial()` for learning state management
- **URL State**: React Router for page state
- **Context**: Could be added for global state (authentication is via Clerk)

---

## 🗄️ Database Design

### **Database: PostgreSQL 15**

#### **Table 1: quizzes**
```sql
CREATE TABLE quizzes (
    id VARCHAR(100) PRIMARY KEY,
    topic VARCHAR(255),
    source_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);
```
**Purpose**: Store quiz metadata  
**Indexes**: created_at (for sorting), id (primary)

#### **Table 2: quiz_questions**
```sql
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id),
    question_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP
);
```
**Purpose**: Store quiz questions and answers  
**Examples**:
- options: `["Option A: JWT", "Option B: Session", "Option C: OAuth", "Option D: SAML"]`
- correct_answer: `"Option A: JWT"`

#### **Table 3: quiz_results**
```sql
CREATE TABLE quiz_results (
    id SERIAL PRIMARY KEY,
    quiz_id VARCHAR(100) REFERENCES quizzes(id),
    user_answers JSONB NOT NULL,
    score INTEGER,
    correct_count INTEGER,
    total_count INTEGER,
    completed_at TIMESTAMP
);
```
**Purpose**: Store user quiz submissions and scores

#### **Table 4: document_chunks**
```sql
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    pdf_id VARCHAR(100) NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding JSONB NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP
);
```
**Purpose**: Store PDF text chunks with vector embeddings for RAG  
**Index**: pdf_id (for lookup), embedding (JSONB GIN index for similarity search)

#### **Table 5: uploaded_pdfs**
```sql
CREATE TABLE uploaded_pdfs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    file_size BIGINT,
    upload_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processed',
    chunk_count INTEGER
);
```
**Purpose**: Track uploaded PDF metadata

#### **Table 6: user_analyses**
```sql
CREATE TABLE user_analyses (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    source_type VARCHAR(50),  -- 'resume' or 'github'
    source_url TEXT,
    extracted_text TEXT,
    skills JSONB,              -- Array of skills
    strengths JSONB,
    weak_areas JSONB,
    technical_level VARCHAR(50),
    learning_style VARCHAR(50),
    overall_score INTEGER,
    created_at TIMESTAMP
);
```
**Purpose**: Store user profile analyses from GitHub/Resume

### **Data Relationships**
```
user_analyses
    ↓ (identifies topics/skills)
    ↓
quizzes
    ├── quiz_questions (1:N)
    │   └── Display options & scoring
    └── quiz_results (1:N)
        └── User submissions & scores

uploaded_pdfs
    ↓
document_chunks (1:N)
    └── Vector embeddings for semantic search
```

---

## 🧩 Key Components & Their Purposes

### **Frontend Components**

#### **Pages**

| Page | Purpose | Key Features |
|------|---------|--------------|
| HomePage | Profile analysis | GitHub API fetch, resume upload, skill extraction |
| QuizPage | Quiz taking | Question display, answer selection, submission |
| ResultPage | Results display | Score, analytics, content suggestions |
| LearningMaterialPage | Learning content | Structured sections, progress tracking |
| LearningProgressPage | Progress analytics | Charts, trends, readiness scores |
| PdfChatPage | PDF interaction | Upload, chat, mind maps |
| SuccessResultPage | Celebration | Confetti, score display |
| About | Information | Project info |
| Help | Documentation | Usage guide |

#### **Components**

| Component | Purpose | Location |
|-----------|---------|----------|
| Layout | Main layout wrapper | `components/Layout.js` |
| Navbar | Navigation bar | `components/Navbar.js` |
| UI Components | Buttons, cards, inputs | `components/ui/index.jsx` |
| LessonContent | Content display | `pages/LearningMaterialPage/components/` |
| SummarySection | Summary display | `pages/LearningMaterialPage/components/` |
| KeyPointsSection | Key points | `pages/LearningMaterialPage/components/` |
| ExamplesSection | Code examples | `pages/LearningMaterialPage/components/` |
| ApplicationsSection | Real-world uses | `pages/LearningMaterialPage/components/` |

### **Backend Services**

#### **aiService.js**
```javascript
generateQuizQuestions(text, options)
  - Input: Document text or topic, options (difficulty, technical level)
  - Calls: Gemini API with formatted prompt
  - Output: Array of quiz questions with options and explanations
  - Error: Throws if Gemini API key not configured

generateLearningMaterial(topic, technicalLevel, learningStyle)
  - Generates structured learning content
  - Sections: Summary, Key Points, Concepts, Examples, Applications, Questions
  - Output: JSON with complete learning material

buildQuizPrompt(text, options)
  - Creates AI prompt for quiz generation
  - Distinguishes between topics (<200 chars) and full content
```

#### **quizService.js**
```javascript
storeQuiz(quizId, questions, topic)
  - Stores quiz in database
  - Saves metadata and questions

scoreQuizAnswers(quizId, userAnswers)
  - Compares user answers with correct answers
  - Calculates score and correct count
  - Stores result in database

normalizeQuizAnswer(data)
  - Ensures consistent data format
  - Validates options array
```

#### **analysisService.js**
```javascript
saveUserAnalysis(analysisData)
  - Stores profile analysis in database
  - Data: skills, strengths, weak areas, recommendations

getUserAnalyses(userId)
  - Retrieves all analyses for a user
  - Returns array of analysis objects
```

### **Backend Agent Tools**

#### **quizTool.js**
- **Purpose**: Quiz generation integration
- **Function**: `quizTool({ topic, difficulty, questionCount })`
- **Output**: Quiz questions via POST /quiz/generate

#### **ragTool.js**
- **Purpose**: PDF chat and RAG operations
- **Function**: `ragTool({ message, sessionId, userId })`
- **Features**: 
  - Calls RAG service on port 5001
  - Implements response caching
  - Returns RAG service responses

#### **analyticsTool.js**
- **Purpose**: Learning analytics
- **Functions**: Get progress, scores, trends

#### **contentTool.js**
- **Purpose**: Generate learning content
- **Functions**: 
  - `contentTool()` - General content
  - `personalizedContentTool()` - Personalized content
  - `quizFromTextTool()` - Quiz from text

#### **validationTool.js**
- **Purpose**: Validation of content and answers
- **Functions**:
  - `evaluateLearningStyleTool()` - Assess learning style
  - `evaluateAnswerTool()` - Validate answers
  - `validateContentTool()` - Content validation

---

## 🔄 Data Flow & Communication

### **Quiz Generation Flow**
```
User (Frontend)
  ↓ POST /quiz/generate with topic
Backend (quizController)
  ↓ Calls generateQuestionsFromTopic()
aiService.js
  ↓ Calls Gemini API with prompt
Google Gemini API
  ↓ Returns JSON with questions
aiService.js
  ↓ Parses and returns questions
quizController
  ↓ Stores in database via quizService
Database (PostgreSQL)
  ↓ Stores quizzes, quiz_questions
quizController
  ↓ Returns quiz with ID
Frontend
  ↓ Displays questions
User
  ↓ Submits answers
Backend (/quiz/score-quiz)
  ↓ Scores answers via quizService
Database
  ↓ Stores quiz_results
Frontend
  ↓ Displays score and results
```

### **Profile Analysis Flow**
```
User (Frontend)
  ├─ GitHub URL
  │   ├─ Extract username
  │   ├─ Fetch repos (GitHub API)
  │   ├─ Extract skills from languages
  │   └─ Display skills
  │
  └─ Resume PDF
      ├─ Upload file
      ├─ Extract text (pdf-parse)
      ├─ Send to backend
      └─ AI analyzes skills (Gemini)

Backend
  ├─ analysisController receives data
  ├─ analysisService.saveUserAnalysis()
  └─ Database stores in user_analyses table

Frontend
  ├─ Display extracted skills
  ├─ Show technical level assessment
  ├─ Show learning style
  └─ Suggest quiz and learning materials
```

### **PDF Chat (RAG) Flow**
```
User (Frontend - PdfChatPage)
  ↓ Uploads PDF
Backend (/pdf/upload)
  ↓ Stores file, calls RAG service
RAG Service (Port 5001) /upload
  ↓ ingestPdf.js processes PDF
  ├─ Extract text with pdf-parse
  ├─ Split into chunks (pdfChunker.js)
  ├─ Generate embeddings (OpenAI API)
  └─ Store with embeddings in PostgreSQL
RAG Service
  ↓ Returns confirmation
Frontend
  ↓ User asks question
Backend (/agent or direct to RAG) /chat
  ↓ Calls RAG service
RAG Service
  ├─ Get embedding for question (OpenAI)
  ├─ Similarity search in vector DB
  ├─ Retrieve relevant chunks
  ├─ Send to OpenAI with context
  └─ Return answer
Backend
  ↓ Returns to frontend
Frontend
  ↓ Display answer + sources
```

### **Learning Material Generation Flow**
```
After Quiz
  ↓ User views result
resultPage.js
  ↓ Extracts weak areas and topic
learningService.generateLearningMaterial()
  ↓ POST /learning/material
learningController
  ↓ Calls learningService
learningService
  ├─ Calls aiService.generateLearningMaterial()
  ├─ Gemini generates structured content
  └─ Stores in cache/returns
learningController
  ↓ Returns JSON with sections
Frontend
  ↓ LearningMaterialPage displays
  ├─ Summary
  ├─ Key Points
  ├─ Important Concepts
  ├─ Examples
  ├─ Applications
  ├─ Think Questions
  └─ Option to PDF export
```

---

## 🤖 Agent System

### **LearningAgent.js - Intelligent Router**

**Purpose**: Analyzes user messages and automatically routes to appropriate tools

**Architecture**:
```
User Message
  ↓ LearningAgent.process()
  ├─ Check if isPdfChat() → Calls ragTool
  ├─ Check if isQuizFromDocument() → Calls quizFromDocumentTool
  ├─ Check if mentions quiz → Calls quizTool
  ├─ Check if mentions learning → Calls contentTool
  └─ Check if mentions analytics → Calls analyticsTool

Uses Function Calling:
  - OpenAI api.chat.completions.create(tools=[...])
  - OR Gemini generateContent(tools=[...])
```

**Tool Definitions**:
```javascript
// Each tool has:
{
  name: 'quizTool',
  description: 'Generate a quiz on any topic',
  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string' },
      difficulty: { enum: ['easy', 'medium', 'hard'] },
      questionCount: { type: 'number' }
    },
    required: ['topic']
  }
}
```

**Agent Workflow**:
1. Receive user message
2. Check message patterns (isPdfChat, isQuizFromDocument, etc.)
3. Build tools array based on available APIs
4. Call LLM with message + tools
5. LLM returns function call
6. Execute tool (quizTool, ragTool, etc.)
7. Return result to user

---

## ⚙️ Configuration & Environment

### **Environment Variables**

#### **Backend (.env)**
```env
# Database
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=postgres
DB_PORT=5432
DB_NAME=rag_pdf_db
DATABASE_URL=postgresql://user:password@host:5432/db

# AI APIs
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Server
PORT=5000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

# Services
RAG_SERVICE_URL=http://localhost:5001
BACKEND_URL=http://localhost:5000
```

#### **RAG Service (.env)**
```env
OPENAI_API_KEY=your_openai_key
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

#### **PDF Service (.env)**
```env
GEMINI_API_KEY=your_gemini_key
PORT=variable
```

### **Docker Compose Setup**

**Services**:
1. **PostgreSQL** (Port 5432)
   - Database for all applications
   - Volume: postgres_data
   - Initialization: schema.sql

2. **PgAdmin** (Port 5050)
   - PostgreSQL management interface
   - Credentials in docker-compose.yml

3. **Backend** (Port 5000)
   - Main Express server
   - Depends on PostgreSQL
   - Builds from backend/

4. **RAG Service** (Port 5001)
   - Vector search service
   - Depends on PostgreSQL
   - Builds from rag-pdf-service/

5. **Frontend** (Port 3000)
   - React development server
   - Displays UI

---

## 🔄 API Endpoints Reference

### **Quiz Endpoints** (`/quiz`)
```
POST /quiz/generate
  Body: { docText?, topic, difficulty?, technicalLevel? }
  Returns: Array of quiz questions
  Header: X-Quiz-Id

POST /quiz/score-quiz
  Body: { quizId, answers: [] }
  Returns: { score, correct_count, total_count, results }

GET /quiz/:id
  Returns: Quiz questions and metadata
```

### **Learning Endpoints** (`/learning`)
```
POST /learning/material
  Body: { topic, technicalLevel, learningStyle }
  Returns: { title, summary, sections[], ... }

POST /learning/personalized-content
  Body: { topic, styleId, technicalLevel }
  Returns: Personalized content JSON

POST /learning/combined-content
  Body: { topic, technicalLevel, technicalScore, learningStyle, learningScore }
  Returns: Combined content JSON

GET /learning/progress
  Returns: User learning progress
```

### **Analysis Endpoints**
```
POST /save-analysis
  Body: { userId, sourceType, sourceUrl, skills[], ... }
  Returns: { analysisId, message }

GET /analyses?userId=...
  Returns: Array of user analyses

GET /analysis/:id
  Returns: Specific analysis details
```

### **PDF Endpoints** (`/pdf`)
```
POST /pdf/upload
  Body: FormData with PDF file
  Returns: { success, fileId, fileName }

GET /pdf/:id/text
  Returns: Extracted PDF text
```

### **Agent Endpoints** (`/agent`)
```
POST /agent/process
  Body: { message, conversationContext?, userId? }
  Returns: { success, tool, data, message }
```

### **RAG Service Endpoints** (Port 5001)
```
POST /upload
  Body: FormData with PDF
  Returns: { success, chunkCount }

POST /chat
  Body: { message, sessionId, userId? }
  Returns: { answer, sources, cached? }

POST /mindmap
  Returns: Hierarchical mind map JSON

GET /health
  Returns: { status, pdfLoaded, chunkCount }
```

---

## 🚀 Running the Project

### **Prerequisites**
- Node.js 16+
- PostgreSQL 12+
- Docker & Docker Compose (optional)

### **Local Setup**
```bash
# Install dependencies for all services
cd backend && npm install
cd ../mcq-app && npm install
cd ../rag-pdf-service && npm install
cd ../pdf && npm install

# Set up .env files (see Configuration section)

# Start backend
cd backend && node index.js

# Start frontend (in another terminal)
cd mcq-app && npm start

# Start RAG service (in another terminal)
cd rag-pdf-service && node server.js

# Start PDF service (in another terminal)
cd pdf && node server.js
```

### **Docker Setup**
```bash
docker-compose up -d
```

---

## 📊 Key Features Summary

| Feature | Technology | Location |
|---------|-----------|----------|
| Quiz Generation | Gemini API | backend/services/aiService.js |
| Learning Materials | Gemini API | backend/services/aiService.js |
| PDF Chat (RAG) | OpenAI, Vector DB | rag-pdf-service/ |
| Mind Maps | OpenAI, @xyflow | rag-pdf-service/, mcq-app/ |
| GitHub Analysis | GitHub API | mcq-app/pages/HomePage.js |
| Resume Analysis | pdf-parse, Gemini | backend/controllers/analysisController.js |
| Progress Tracking | PostgreSQL, Recharts | mcq-app/pages/LearningProgressPage.js |
| Authentication | Clerk | mcq-app/App.js |
| Charts/Analytics | Recharts | mcq-app/ |
| PDF Generation | jsPDF | mcq-app/ |

---

## 🎓 Learning Resources Generated

### **Learning Material Structure**
```
{
  "title": "Complete Topic Learning Guide",
  "summary": "Overview...",
  "sections": [
    {
      "title": "Key Concept",
      "content": "Detailed explanation...",
      "subsections": [
        {
          "title": "Subsection",
          "content": "..."
        }
      ]
    },
    ... more sections
  ],
  "keyPoints": ["Point 1", "Point 2", ...],
  "practicalExamples": [
    {
      "title": "Example Title",
      "code": "Code snippet",
      "explanation": "..."
    }
  ],
  "estimatedTime": "30 minutes",
  "difficulty": "Intermediate"
}
```

---

## 📈 Future Enhancement Opportunities

1. **Multi-Language Support**: Add support for multiple languages
2. **Real-time Collaboration**: Enable group learning sessions
3. **Mobile App**: React Native or Flutter version
4. **Advanced Analytics**: Machine learning-based recommendations
5. **Gamification**: Points, badges, leaderboards
6. **Video Integration**: Embed video tutorials
7. **Live Tutoring**: Integration with expert tutors
8. **Offline Mode**: Enable offline learning access
9. **Export Options**: More export formats (DOCX, EPUB)
10. **Personalized Recommendations**: Predictive learning path suggestions

---

## 🔐 Security Considerations

1. **Environment Variables**: All API keys in .env files (not in code)
2. **CORS Configuration**: Restricted to specific origins
3. **Database**: PostgreSQL with proper user permissions
4. **Authentication**: Clerk handles user authentication
5. **Input Validation**: Validated in controllers
6. **Error Handling**: Sanitized error messages

---

## 📝 Code Quality Standards

### **Architecture Patterns**
- ✅ Separation of concerns (Routes → Controllers → Services)
- ✅ Reusable components in React
- ✅ Custom hooks for state logic
- ✅ Centralized API configuration
- ✅ Error handling middleware

### **Best Practices**
- ✅ async/await for promises
- ✅ Try-catch for error handling
- ✅ Logging for debugging
- ✅ Comment documentation
- ✅ Modular file structure

---

**Last Updated**: April 3, 2026  
**Version**: 1.0  
**Maintained By**: Development Team

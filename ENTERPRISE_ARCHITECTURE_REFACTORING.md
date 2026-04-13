# Enterprise Architecture Refactoring Plan
**Personalized Content Generator - Production-Grade Restructuring**

---

## EXECUTIVE SUMMARY

### Current State Assessment
Your project has a **functional foundation** with proper separation of concerns at a basic level. However, it has several architectural issues that will hinder scalability:

**Issues Identified:**
- ❌ Agent system is loosely coupled (mixed routes, services, tools)
- ❌ Controllers and services not consistently organized
- ❌ Frontend has scattered hooks and service files
- ❌ Database layer lacks abstraction
- ❌ Middleware organization could be improved
- ❌ Multiple root-level services (RAG, PDF, RPC) without common structure
- ❌ Configuration files scattered across multiple locations
- ❌ Missing dependency injection / service locator pattern
- ❌ Error handling inconsistent across modules

**Opportunities:**
- ✅ Good separation of routes/controllers/services foundation
- ✅ Uses constants files (recent improvement)
- ✅ Has utils and error handling
- ✅ Clear frontend/backend separation (multi-service architecture)

---

## PART 1: ENTERPRISE-GRADE FOLDER STRUCTURE

### Backend Structure (NEW)

```
backend/
│
├── src/                                      # All source code (new container)
│   ├── core/                                 # Core application setup
│   │   ├── app.js                           # Express app factory
│   │   ├── bootstrap.js                     # Server startup & initialization
│   │   └── middleware/                      # Global middleware
│   │       ├── errorHandler.js              # Error handling middleware
│   │       ├── corsMiddleware.js            # CORS configuration
│   │       ├── requestLogger.js             # Request logging middleware
│   │       ├── validationMiddleware.js      # Input validation
│   │       └── index.js                     # Middleware barrel export
│   │
│   ├── config/                              # Configuration management
│   │   ├── environment.js                   # Environment validation
│   │   ├── database.js                      # Database config
│   │   ├── service-urls.js                  # Service endpoint configuration
│   │   └── index.js                         # Config barrel export
│   │
│   ├── constants/                           # Constants (UNCHANGED - already good)
│   │   ├── ai.constants.js
│   │   ├── config.constants.js
│   │   ├── errors.constants.js
│   │   ├── scoring.constants.js
│   │   └── index.js
│   │
│   ├── modules/                             # Feature modules (by domain)
│   │   │
│   │   ├── quiz/                            # Quiz domain
│   │   │   ├── quiz.routes.js              # Routes
│   │   │   ├── quiz.controller.js          # Request handlers
│   │   │   ├── quiz.service.js             # Business logic
│   │   │   ├── quiz.repository.js          # Database access
│   │   │   ├── quiz.validator.js           # Input validation
│   │   │   ├── quiz.schema.js              # Data models/schemas
│   │   │   └── index.js                    # Module barrel
│   │   │
│   │   ├── learning/                        # Learning domain
│   │   │   ├── learning.routes.js
│   │   │   ├── learning.controller.js
│   │   │   ├── learning.service.js
│   │   │   ├── learning.repository.js
│   │   │   └── index.js
│   │   │
│   │   ├── pdf/                             # PDF processing domain
│   │   │   ├── pdf.routes.js
│   │   │   ├── pdf.controller.js
│   │   │   ├── pdf.service.js
│   │   │   ├── pdf.repository.js
│   │   │   ├── pdf.extractor.js            # PDF parsing logic
│   │   │   └── index.js
│   │   │
│   │   ├── github/                          # GitHub integration domain
│   │   │   ├── github.routes.js
│   │   │   ├── github.controller.js
│   │   │   ├── github.service.js
│   │   │   ├── github.client.js            # GitHub API client
│   │   │   └── index.js
│   │   │
│   │   ├── analysis/                        # Analysis domain
│   │   │   ├── analysis.routes.js
│   │   │   ├── analysis.controller.js
│   │   │   ├── analysis.service.js
│   │   │   ├── analysis.repository.js
│   │   │   └── index.js
│   │   │
│   │   └── agent/                           # AI Agent domain (RESTRUCTURED)
│   │       ├── agent.routes.js             # Express routes
│   │       ├── agent.controller.js         # Request handling
│   │       ├── agent.service.js            # Agent coordination
│   │       ├── agent.repository.js         # Agent conversation storage
│   │       ├── agents/                     # Individual agent implementations
│   │       │   ├── learning.agent.js       # Learning agent
│   │       │   ├── content-validation.agent.js
│   │       │   ├── skill-evaluation.agent.js
│   │       │   └── index.js
│   │       ├── tools/                      # Agent tools
│   │       │   ├── analytics.tool.js
│   │       │   ├── content.tool.js
│   │       │   ├── quiz.tool.js
│   │       │   ├── rag.tool.js
│   │       │   ├── study-planner.tool.js
│   │       │   ├── validation.tool.js
│   │       │   └── index.js
│   │       └── index.js
│   │
│   ├── shared/                              # Shared across modules
│   │   ├── utils/                          # Utility functions
│   │   │   ├── logger.js
│   │   │   ├── error-handler.js
│   │   │   ├── json-parser.js
│   │   │   ├── psychometric-quiz.js
│   │   │   ├── scoring-utils.js
│   │   │   └── index.js
│   │   │
│   │   ├── database/                       # Database layer abstraction
│   │   │   ├── db-client.js                # Database connection pool
│   │   │   ├── repository.base.js          # Base repository class
│   │   │   ├── transaction.manager.js      # Transaction handling
│   │   │   └── index.js
│   │   │
│   │   ├── services/                       # Cross-cutting services
│   │   │   ├── ai.service.js               # AI/LLM integration
│   │   │   ├── external-api.service.js     # External API calls
│   │   │   └── cache.service.js            # Caching layer
│   │   │
│   │   ├── validators/                     # Shared validation logic
│   │   │   ├── common.validators.js
│   │   │   └── index.js
│   │   │
│   │   └── types/                          # TypeScript or JSDoc types
│   │       ├── user.types.js
│   │       ├── quiz.types.js
│   │       └── index.js
│   │
│   ├── drivers/                             # External integrations
│   │   ├── database/                        # Database drivers setup
│   │   │   ├── postgres.driver.js
│   │   │   └── index.js
│   │   │
│   │   ├── cache/                           # Cache drivers
│   │   │   └── redis.driver.js
│   │   │
│   │   └── ai/                              # AI service drivers
│   │       ├── groq.driver.js
│   │       ├── openai.driver.js
│   │       └── index.js
│   │
│   └── index.js                             # Application entry point
│
├── .env                                      # Environment variables
├── .env.example                              # Example environment file
├── index.js                                  # Server bootstrap (thin wrapper to src/index.js)
└── package.json

```

### Frontend Structure (NEW)

```
frontend/src/
│
├── core/                                    # Core application setup
│   ├── App.jsx                              # Root app component
│   ├── index.jsx                            # React entry point
│   ├── router.jsx                           # Route configuration
│   └── providers.jsx                        # Context providers setup
│
├── modules/                                 # Feature modules (by domain)
│   │
│   ├── auth/                                # Authentication
│   │   ├── pages/
│   │   │   └── LoginPage.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useAuthGuard.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   └── auth.service.js
│   │   └── index.js
│   │
│   ├── quiz/                                # Quiz feature
│   │   ├── pages/
│   │   │   ├── QuizPage.jsx
│   │   │   └── ResultPage.jsx
│   │   ├── components/
│   │   │   ├── QuizForm.jsx
│   │   │   ├── QuestionCard.jsx
│   │   │   ├── ScoreDisplay.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── useQuiz.js
│   │   │   ├── useQuizState.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── quiz.api.service.js
│   │   │   ├── quiz.scoring.service.js
│   │   │   └── index.js
│   │   ├── utils/
│   │   │   ├── psychometric.utils.js
│   │   │   ├── scoring.utils.js
│   │   │   └── index.js
│   │   ├── constants/
│   │   │   └── quiz.constants.js
│   │   └── index.js
│   │
│   ├── learning/                            # Learning materials
│   │   ├── pages/
│   │   │   ├── LearningMaterialPage.jsx
│   │   │   └── LearningProgressPage.jsx
│   │   ├── components/
│   │   │   ├── LearningContent.jsx
│   │   │   ├── ProgressChart.jsx
│   │   │   ├── Roadmap.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── useLearning.js
│   │   │   ├── useLearningMaterial.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── learning.api.service.js
│   │   │   └── index.js
│   │   ├── utils/
│   │   │   └── learning.utils.js
│   │   └── index.js
│   │
│   ├── pdf/                                 # PDF chat feature
│   │   ├── pages/
│   │   │   └── PdfChatPage.jsx
│   │   ├── components/
│   │   │   ├── PdfUpload.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── usePdfChat.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── pdf.api.service.js
│   │   │   └── index.js
│   │   └── index.js
│   │
│   ├── analysis/                            # Analysis and insights
│   │   ├── pages/
│   │   │   └── AnalysisPage.jsx
│   │   ├── components/
│   │   │   ├── AnalysisReport.jsx
│   │   │   ├── SkillsVisualization.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── useAnalysis.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── analysis.api.service.js
│   │   │   └── index.js
│   │   └── index.js
│   │
│   └── home/                                # Home/dashboard feature
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── AboutPage.jsx
│       │   └── HelpPage.jsx
│       ├── components/
│       │   ├── HeroSection.jsx
│       │   ├── FeatureCards.jsx
│       │   └── index.js
│       ├── hooks/
│       │   └── useGitHubProfile.js
│       └── index.js
│
├── shared/                                  # Shared across all modules
│   │
│   ├── components/                          # Reusable UI components
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── ui/                             # Primitive UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── OfflineIndicator.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── feedback/                        # User feedback components
│   │   │   ├── Toast.jsx
│   │   │   ├── Alert.jsx
│   │   │   └── index.js
│   │   │
│   │   └── index.js                        # Components barrel export
│   │
│   ├── hooks/                               # Shared custom hooks
│   │   ├── useLocalStorage.js
│   │   ├── useOnline.js
│   │   ├── useFetch.js
│   │   ├── useDebounce.js
│   │   └── index.js
│   │
│   ├── services/                            # Shared API services
│   │   ├── api/
│   │   │   ├── api.client.js               # Axios/fetch wrapper
│   │   │   ├── api.endpoints.js            # API endpoint definitions
│   │   │   └── index.js
│   │   │
│   │   ├── storage/
│   │   │   ├── localStorage.service.js
│   │   │   ├── indexedDB.service.js
│   │   │   └── index.js
│   │   │
│   │   └── index.js
│   │
│   ├── utils/                               # Shared utility functions
│   │   ├── formatters.js                   # Date, number formatting
│   │   ├── validators.js                   # Form validation
│   │   ├── coerce.js
│   │   ├── localStorage.js
│   │   └── index.js
│   │
│   ├── constants/                           # Shared constants
│   │   ├── app.constants.js                # App-wide constants
│   │   ├── api.constants.js                # API endpoints
│   │   ├── theme.constants.js              # Colors, spacing
│   │   └── index.js
│   │
│   ├── contexts/                            # Shared React contexts
│   │   ├── NotificationContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── index.js
│   │
│   ├── styles/                              # Global and shared styles
│   │   ├── design-system.css               # Design tokens
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── animations.css
│   │
│   └── types/                               # JSDoc type definitions
│       ├── user.types.js
│       ├── quiz.types.js
│       └── index.js
│
├── config/                                  # Frontend configuration
│   ├── environment.js
│   └── api.js
│
├── App.css                                  # Root app styles (can be moved to shared/styles)
├── index.css                                # Global styles (can be moved to shared/styles)
└── index.js                                 # Entry point (can be removed, use core/index.jsx)

```

### Multi-Service Architecture

```
microservices/
│
├── rag-pdf-service/
│   ├── src/
│   │   ├── core/
│   │   │   ├── app.js
│   │   │   ├── bootstrap.js
│   │   │   └── middleware/
│   │   │
│   │   ├── config/
│   │   │   ├── environment.js
│   │   │   └── vectorstore.js
│   │   │
│   │   ├── modules/
│   │   │   ├── rag/
│   │   │   │   ├── rag.routes.js
│   │   │   │   ├── rag.controller.js
│   │   │   │   ├── rag.service.js
│   │   │   │   ├── ingest/
│   │   │   │   │   ├── pdf.ingestor.js
│   │   │   │   │   └── chunker.js
│   │   │   │   ├── embeddings/
│   │   │   │   │   └── embedding.service.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   └── health/
│   │   │       ├── health.routes.js
│   │   │       └── health.controller.js
│   │   │
│   │   ├── shared/
│   │   │   ├── utils/
│   │   │   ├── database/
│   │   │   └── services/
│   │   │
│   │   └── drivers/
│   │       └── vectorstore/
│   │
│   ├── .env
│   ├── package.json
│   └── index.js
│
├── pdf-question-service/
│   ├── src/
│   │   ├── core/
│   │   ├── config/
│   │   ├── modules/
│   │   │   └── question-generation/
│   │   │       ├── question.routes.js
│   │   │       ├── question.controller.js
│   │   │       ├── question.service.js
│   │   │       ├── generator.js
│   │   │       └── index.js
│   │   │
│   │   └── shared/
│   │
│   ├── .env
│   ├── package.json
│   └── index.js
│
└── shared-services/                        # Common code for all microservices
    ├── logging/
    ├── error-handling/
    ├── config-management/
    └── health-checks/

```

---

## PART 2: DETAILED FILE MOVEMENT & IMPORT MAPPING

### Backend Detailed Moves

#### A. Core Application Setup

| OLD PATH | NEW PATH | Change Type | Notes |
|----------|----------|-------------|-------|
| `backend/index.js` | `backend/src/core/app.js` | Move + Refactor | Remove server startup, keep app config |
| NEW | `backend/src/core/bootstrap.js` | Create | Server startup & initialization |
| `backend/utils/errorHandler.js` | `backend/src/core/middleware/errorHandler.js` | Move | Global error middleware |
| NEW | `backend/src/core/middleware/corsMiddleware.js` | Create | CORS setup extracted from app.js |
| NEW | `backend/src/core/middleware/requestLogger.js` | Create | Request logging (from logger.js) |
| NEW | `backend/src/core/middleware/index.js` | Create | Barrel export |
| `backend/config/app.config.js` | `backend/src/config/app.config.js` | Move | No logic change |
| `backend/config/database.js` | `backend/src/config/database.js` | Move | No logic change |
| NEW | `backend/src/config/service-urls.js` | Create | Extract URLs into service layer |
| `backend/config/index.js` | `backend/src/config/index.js` | Move | Maintains current exports |

#### B. Module Reorganization (Quiz as Example)

| OLD PATH | NEW PATH | Change Type |
|----------|----------|-------------|
| `backend/routes/quizRoutes.js` | `backend/src/modules/quiz/quiz.routes.js` | Move |
| `backend/controllers/quizController.js` | `backend/src/modules/quiz/quiz.controller.js` | Move |
| `backend/services/quizService.js` | `backend/src/modules/quiz/quiz.service.js` | Move |
| NEW | `backend/src/modules/quiz/quiz.repository.js` | Create | Extract DB queries |
| NEW | `backend/src/modules/quiz/quiz.validator.js` | Create | Extract validation logic |
| NEW | `backend/src/modules/quiz/quiz.schema.js` | Create | Data models/types |
| NEW | `backend/src/modules/quiz/index.js` | Create | Barrel export |

**APPLY SAME PATTERN TO:** learning, pdf, github, analysis

#### C. Agent Module Reorganization (Complex)

| OLD PATH | NEW PATH | Change Type |
|----------|----------|-------------|
| `backend/agents/agentRouter.js` | `backend/src/modules/agent/agent.routes.js` | Move |
| `backend/agents/agentService.js` | `backend/src/modules/agent/agent.service.js` | Move |
| NEW | `backend/src/modules/agent/agent.controller.js` | Create |
| NEW | `backend/src/modules/agent/agent.repository.js` | Create |
| `backend/agents/contentValidationAgent.js` | `backend/src/modules/agent/agents/content-validation.agent.js` | Move |
| `backend/agents/LearningAgent.js` | `backend/src/modules/agent/agents/learning.agent.js` | Move |
| `backend/agents/skillEvaluationAgent.js` | `backend/src/modules/agent/agents/skill-evaluation.agent.js` | Move |
| NEW | `backend/src/modules/agent/agents/index.js` | Create | Barrel export |
| `backend/agents/tools/analyticsTool.js` | `backend/src/modules/agent/tools/analytics.tool.js` | Move |
| `backend/agents/tools/contentTool.js` | `backend/src/modules/agent/tools/content.tool.js` | Move |
| `backend/agents/tools/quizTool.js` | `backend/src/modules/agent/tools/quiz.tool.js` | Move |
| `backend/agents/tools/ragTool.js` | `backend/src/modules/agent/tools/rag.tool.js` | Move |
| `backend/agents/tools/studyPlannerTool.js` | `backend/src/modules/agent/tools/study-planner.tool.js` | Move |
| `backend/agents/tools/validationTool.js` | `backend/src/modules/agent/tools/validation.tool.js` | Move |
| NEW | `backend/src/modules/agent/tools/index.js` | Create | Barrel export |

#### D. Shared Layer

| OLD PATH | NEW PATH | Change Type |
|----------|----------|-------------|
| `backend/utils/logger.js` | `backend/src/shared/utils/logger.js` | Move |
| `backend/utils/errorHandler.js` | `backend/src/shared/utils/error-handler.js` | Move (copy) |
| `backend/utils/jsonParser.js` | `backend/src/shared/utils/json-parser.js` | Move |
| `backend/utils/psychometricQuiz.js` | `backend/src/shared/utils/psychometric-quiz.js` | Move |
| `backend/utils/scoringUtils.js` | `backend/src/shared/utils/scoring-utils.js` | Move |
| NEW | `backend/src/shared/utils/index.js` | Create | Barrel export |
| `backend/constants/*` | `backend/src/constants/*` | Move | No logic change |
| NEW | `backend/src/shared/database/db-client.js` | Create | DB pool management |
| NEW | `backend/src/shared/database/repository.base.js` | Create | Base class for repositories |
| NEW | `backend/src/shared/database/transaction.manager.js` | Create | Transaction handling |
| NEW | `backend/src/shared/services/ai.service.js` | Create | Factor out from aiService |
| NEW | `backend/src/shared/validators/common.validators.js` | Create | Extract shared validation |

#### E. Drivers Layer

| OLD PATH | NEW PATH | Change Type |
|----------|----------|-------------|
| `backend/config/database.js` (connection part) | `backend/src/drivers/database/postgres.driver.js` | Refactor | Extract connection logic |
| NEW | `backend/src/drivers/ai/groq.driver.js` | Create | Groq SDK wrapper |
| NEW | `backend/src/drivers/ai/openai.driver.js` | Create | OpenAI SDK wrapper |

---

### Frontend Detailed Moves

| OLD PATH | NEW PATH | Change Type | Notes |
|----------|----------|-------------|-------|
| `frontend/src/App.js` | `frontend/src/core/App.jsx` | Move | Rename to .jsx |
| `frontend/src/index.js` | `frontend/src/core/index.jsx` | Move | Rename to .jsx |
| NEW | `frontend/src/core/router.jsx` | Create | Route definitions |
| NEW | `frontend/src/core/providers.jsx` | Create | Context/provider setup |
| `frontend/src/pages/QuizPage.js` | `frontend/src/modules/quiz/pages/QuizPage.jsx` | Move |
| `frontend/src/pages/ResultPage.js` | `frontend/src/modules/quiz/pages/ResultPage.jsx` | Move |
| NEW | `frontend/src/modules/quiz/components/` | Create | Extract UI components |
| NEW | `frontend/src/modules/quiz/hooks/` | Create | Extract quiz-specific hooks |
| NEW | `frontend/src/modules/quiz/services/` | Create | Extract API calls |
| NEW | `frontend/src/modules/quiz/utils/` | Create | Extract quiz utils |
| `frontend/src/pages/LearningMaterialPage.js` | `frontend/src/modules/learning/pages/LearningMaterialPage.jsx` | Move |
| `frontend/src/pages/LearningProgressPage.js` | `frontend/src/modules/learning/pages/LearningProgressPage.jsx` | Move |
| `frontend/src/pages/PdfChatPage.js` | `frontend/src/modules/pdf/pages/PdfChatPage.jsx` | Move |
| `frontend/src/pages/HomePage.js` | `frontend/src/modules/home/pages/HomePage.jsx` | Move |
| `frontend/src/pages/About.jsx` | `frontend/src/modules/home/pages/AboutPage.jsx` | Move |
| `frontend/src/pages/Help.jsx` | `frontend/src/modules/home/pages/HelpPage.jsx` | Move |
| `frontend/src/components/Layout.js` | `frontend/src/shared/components/layout/Layout.jsx` | Move |
| `frontend/src/components/Navbar.js` | `frontend/src/shared/components/layout/Navbar.jsx` | Move |
| `frontend/src/components/ui/OfflineIndicator.jsx` | `frontend/src/shared/components/ui/OfflineIndicator.jsx` | Move |
| NEW | `frontend/src/shared/components/ui/` | Create | Organize UI components |
| `frontend/src/hooks/*` | `frontend/src/modules/[module]/hooks/` or `frontend/src/shared/hooks/` | Move | Organize by domain or shared |
| `frontend/src/services/*` | `frontend/src/modules/[module]/services/` or `frontend/src/shared/services/` | Move | Organize by domain or shared |
| `frontend/src/utils/*` | `frontend/src/shared/utils/` | Move | All shared utils |
| `frontend/src/constants/*` | `frontend/src/shared/constants/` or `frontend/src/modules/[module]/constants/` | Move | Organize by domain or shared |

---

## PART 3: IMPORT PATH CHANGES

### Overview Table

| Context | OLD Import | NEW Import |
|---------|-----------|-----------|
| **Backend Routes** | `import controller from './controllers/quizController.js'` | `import { quizController } from '../modules/quiz'` |
| **Backend Services** | `import { db } from './config/database.js'` | `import { getDbClient } from '../../shared/database'` |
| **Backend Middleware** | `import { errorMiddleware } from './utils/errorHandler.js'` | `import { errorMiddleware } from '../../core/middleware'` |
| **Frontend Pages** | `import QuizPage from './pages/QuizPage.js'` | `import QuizPage from './modules/quiz/pages'` |
| **Frontend Hooks** | `import useQuiz from './hooks/useQuiz.js'` | `import { useQuiz } from './modules/quiz/hooks'` |
| **Frontend Services** | `import { getQuiz } from './services/quiz'` | `import { getQuiz } from '../services'` |

### Detailed Examples

#### Example 1: Backend Route Import Update

```javascript
// ❌ OLD (backend/routes/quizRoutes.js)
import express from 'express';
import { generateQuiz, submitQuiz } from '../controllers/quizController.js';
import { db } from '../config/database.js';

// ✅ NEW (backend/src/modules/quiz/quiz.routes.js)
import express from 'express';
import { quizController } from './quiz.controller.js';
import { quizService } from './quiz.service.js';

const router = express.Router();

router.post('/generate', (req, res) => 
  quizController.generateQuiz(req, res)
);

export { router as quizRouter };
```

#### Example 2: Backend Service Import Update

```javascript
// ❌ OLD (backend/services/quizService.js)
import { db } from '../config/database.js';
import { log, logError } from '../utils/logger.js';
import { classifyBaseLevel } from '../utils/scoringUtils.js';
import { SCORE_THRESHOLDS } from '../constants/scoring.constants.js';

// ✅ NEW (backend/src/modules/quiz/quiz.service.js)
import { getDbClient } from '../../shared/database';
import { logger } from '../../shared/utils';
import { scoringUtils } from '../../shared/utils';
import { SCORE_THRESHOLDS } from '../../constants';

export class QuizService {
  constructor(database, logger) {
    this.db = database;
    this.logger = logger;
  }

  async generateQuiz(topic) {
    // implementation
  }
}
```

#### Example 3: Frontend Component Import Update

```javascript
// ❌ OLD (frontend/src/pages/QuizPage.js)
import { useState } from 'react';
import { useQuiz } from '../hooks/app/useQuiz.js';
import { processResult } from '../services/quiz/quizService.js';

// ✅ NEW (frontend/src/modules/quiz/pages/QuizPage.jsx)
import { useState } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { quizService } from '../services';

function QuizPage() {
  // implementation
}

export default QuizPage;
```

#### Example 4: Backend App Bootstrap

```javascript
// ❌ OLD (backend/index.js)
import express from 'express';
import quizRoutes from './routes/quizRoutes.js';
// ... 50+ imports ...
const app = express();
// ... setup ...
app.listen(5000);

// ✅ NEW (backend/index.js - thin wrapper)
import { createApp } from './src/core/app.js';
import { bootstrap } from './src/core/bootstrap.js';

bootstrap(createApp);

// ✅ NEW (backend/src/index.js - indirect approach)
// Not needed, bootstrap handles everything

// ✅ NEW (backend/src/core/app.js)
import express from 'express';
import { quizRouter } from '../modules/quiz';
import { learningRouter } from '../modules/learning';
// ... etc ...

export function createApp() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/quiz', quizRouter);
  app.use('/learning', learningRouter);
  
  return app;
}

// ✅ NEW (backend/src/core/bootstrap.js)
import { createApp } from './app.js';
import { config } from '../config';

export async function bootstrap(appFactory = createApp) {
  const app = appFactory();
  const PORT = config.port;
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

---

## PART 4: ARCHITECTURAL PATTERNS & IMPROVEMENTS

### 1. Dependency Injection Pattern

```javascript
// ✅ NEW (backend/src/shared/container.js)
export class ServiceContainer {
  constructor() {
    this.services = new Map();
  }

  register(name, factory) {
    this.services.set(name, factory);
  }

  get(name) {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service ${name} not registered`);
    return factory();
  }
}

// Usage in module
const container = new ServiceContainer();
container.register('quizService', () => new QuizService(db, logger));
const quizService = container.get('quizService');
```

### 2. Repository Pattern

```javascript
// ✅ NEW (backend/src/shared/database/repository.base.js)
export class BaseRepository {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id) {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  async save(data) {
    // generic save implementation
  }
}

// ✅ NEW (backend/src/modules/quiz/quiz.repository.js)
import { BaseRepository } from '../../shared/database';

export class QuizRepository extends BaseRepository {
  constructor(db) {
    super(db, 'quizzes');
  }

  async findByTopic(topic) {
    // quiz-specific queries
  }
}
```

### 3. Service Layer Pattern

```javascript
// ✅ NEW (backend/src/modules/quiz/quiz.service.js)
export class QuizService {
  constructor(quizRepository, aiService, logger) {
    this.repo = quizRepository;
    this.ai = aiService;
    this.logger = logger;
  }

  async generateQuiz(topic, difficulty) {
    try {
      // Validate input
      // Call repository
      // Call AI service
      // Process result
      // Return formatted response
    } catch (error) {
      this.logger.error('Quiz generation failed', error);
      throw error;
    }
  }
}
```

### 4. Controller Pattern (Thin)

```javascript
// ✅ NEW (backend/src/modules/quiz/quiz.controller.js)
export class QuizController {
  constructor(quizService) {
    this.service = quizService;
  }

  async generateQuiz(req, res, next) {
    try {
      const { topic, difficulty } = req.body;
      
      // Validation handled by validator middleware
      
      const quiz = await this.service.generateQuiz(topic, difficulty);
      
      res.json({ success: true, data: quiz });
    } catch (error) {
      next(error); // Pass to error middleware
    }
  }
}
```

### 5. Frontend Module Pattern

```javascript
// ✅ NEW (frontend/src/modules/quiz/index.js - barrel export)
export { QuizPage } from './pages';
export { ResultPage } from './pages';
export { useQuiz, useQuizState } from './hooks';
export { quizService } from './services';
export * as quizConstants from './constants';

// Usage in Router
import { QuizPage, ResultPage } from './modules/quiz';
```

---

## PART 5: EXECUTION PLAN & SAFETY CONSIDERATIONS

### Phase 1: Backend Restructuring (Days 1-2)

#### Step 1.1: Create New Directory Structure
```bash
cd backend
mkdir -p src/core/middleware
mkdir -p src/config
mkdir -p src/modules/{quiz,learning,pdf,github,analysis,agent/{agents,tools}}
mkdir -p src/shared/{utils,database,services,validators,types}
mkdir -p src/drivers/{database,ai,cache}
```

#### Step 1.2: Move Core Files (No Logic Changes)
```bash
cp index.js src/core/app.js
cp config/*.js src/config/
cp constants/ src/
```

#### Step 1.3: Move Module Files (Sequential)
1. Quiz module (safest, smallest)
2. Learning module
3. PDF module
4. GitHub module
5. Analysis module
6. Agent module (most complex, last)

#### Step 1.4: Create New Layer Files
- Create base repository class
- Create service container
- Create driver wrappers
- Create barrel exports

#### Step 1.5: Update All Imports (Critical)
- Import updates in routes
- Import updates in controllers/services
- Import updates in shared utilities

### Phase 2: Frontend Restructuring (Days 3-4)

#### Step 2.1: Create New Directory Structure
```bash
cd frontend/src
mkdir -p core
mkdir -p modules/{quiz,learning,pdf,analysis,home}
mkdir -p shared/{components/{layout,ui,feedback},hooks,services,utils,constants,contexts,styles}
```

#### Step 2.2: Move Files Sequentially
- Move components by feature
- Move hooks by feature
- Move services by feature
- Move constants

#### Step 2.3: Create Barrel Exports
- `index.js` for each module
- `index.js` for shared subdirectories

#### Step 2.4: Update Router Configuration
- Create `core/router.jsx`
- Update route imports

### Phase 3: Service Restructuring (Day 5)

Apply same patterns to:
- `rag-pdf-service/`
- `pdf/` (question generation service)

### Phase 4: Testing & Validation (Days 6-7)

1. **Unit Tests**
   - Test imports work correctly
   - Test individual modules in isolation

2. **Integration Tests**
   - Test cross-module dependencies
   - Test API endpoints

3. **Manual Testing**
   - Quiz flow (generate → submit)
   - Learning materials generation
   - PDF upload & chat
   - Analysis generation
   - Agent chat

4. **Load Testing**
   - Concurrent requests
   - Database connection pool

---

## PART 6: RISKS & MITIGATION

### Risk 1: Import Path Failures

**Severity:** 🔴 CRITICAL  
**Mitigation:**
- Create import mapping spreadsheet before starting
- Use IDE's "Find & Replace" with "Match Case" enabled
- Test each module after imports updated
- Keep old structure in git branch

### Risk 2: Database Query Breakage

**Severity:** 🔴 CRITICAL  
**Mitigation:**
- Do NOT change database connection logic
- Only extract into separate files
- Keep database.js functional identity
- Test DB connections before & after

### Risk 3: Environment Variable Loading

**Severity:** 🟠 HIGH  
**Mitigation:**
- Load dotenv at application bootstrap only
- Ensure config files are loaded before anything else
- Define all required env vars
- Add validation middleware

### Risk 4: Circular Dependencies

**Severity:** 🟠 HIGH  
**Mitigation:**
- Use barrel exports cautiously
- Import from specific files, not barrels, when in doubt
- Consider using weakMap for service container
- Use linting rules to detect circular deps

### Risk 5: Breaking API Behavior

**Severity:** 🟠 HIGH  
**Mitigation:**
- Keep endpoint signatures identical
- Do NOT rename route parameters
- Do NOT change response formats
- Create integration tests before refactoring

### Risk 6: File Path Conflicts

**Severity:** 🟡 MEDIUM  
**Mitigation:**
- Use clear naming conventions
- Avoid similar names in different modules
- Use TypeScript or JSDoc for clarity
- Use npm scripts for building

---

## PART 7: BENEFITS OF NEW ARCHITECTURE

### Short-term Benefits
✅ **Clarity** - Clear module boundaries  
✅ **Maintainability** - Easy to find code  
✅ **Scalability** - Add new modules without changing core  
✅ **Testability** - Mock dependencies easier  

### Medium-term Benefits  
✅ **Onboarding** - New developers understand structure quickly  
✅ **Refactoring** - Safe to improve code isolated to modules  
✅ **Performance** - Lazy load modules dynamically  
✅ **Monitoring** - Clear entry/exit points for observability  

### Long-term Benefits
✅ **Microservices** - Easy to extract modules to separate services  
✅ **Polyglot** - Easier to use different tech in different modules  
✅ **Compliance** - Clear responsibility boundaries for auditing  
✅ **Enterprise** - Ready for 10,000+ users  

---

## PART 8: FILE MODIFICATIONS CHECKLIST

### Before Starting
- [ ] Backup entire project (`git commit`)
- [ ] Create feature branch (`git checkout -b refactor/enterprise-architecture`)
- [ ] Review entire document with team
- [ ] Identify champion per phase

### Backend Phase 1 (Core)
- [ ] Create src/ directory structure
- [ ] Move `index.js` → `src/core/app.js`
- [ ] Create `src/core/bootstrap.js`
- [ ] Create `src/core/middleware/` directory
- [ ] Extract error handling → middleware
- [ ] Update `index.js` (thin wrapper)
- [ ] Update package.json scripts

### Backend Phase 2 (Modules)
- [ ] Move Quiz module
  - [ ] Move routes
  - [ ] Move controllers
  - [ ] Move services
  - [ ] Create repository
  - [ ] Create validator
  - [ ] Update imports (3-5 files)
  - [ ] Test: `npm test quiz`
- [ ] Repeat for Learning, PDF, GitHub, Analysis modules

### Backend Phase 3 (Agent)
- [ ] Move agent.js → modules/agent/agent.service.js
- [ ] Move agents/ → modules/agent/agents/
- [ ] Move tools/ → modules/agent/tools/
- [ ] Create agent.controller.js
- [ ] Create agent.repository.js
- [ ] Update imports (8-10 files)
- [ ] Test: agent chat endpoints

### Backend Phase 4 (Shared)
- [ ] Move utils/ → shared/utils/
- [ ] Move constants/ → src/constants/
- [ ] Create database/ layer
- [ ] Create services/ layer
- [ ] Create drivers/ layer
- [ ] Create validators/ layer

### Frontend Phase 1 (Core)
- [ ] Create src/core/, modules/, shared/ structures
- [ ] Move App.js → core/App.jsx
- [ ] Create core/router.jsx
- [ ] Create core/providers.jsx
- [ ] Update index.js

### Frontend Phase 2 (Modules)
- [ ] Move Quiz module
- [ ] Move Learning module
- [ ] Move PDF module
- [ ] Move Analysis module (create from Home?)
- [ ] Move Home module

### Frontend Phase 3 (Shared)
- [ ] Organize components/
- [ ] Organize hooks/
- [ ] Organize services/
- [ ] Organize utils/
- [ ] Organize constants/
- [ ] Organize styles/

### Validation
- [ ] All imports resolve (no red lines in IDE)
- [ ] No console errors on startup
- [ ] npm start (backend)
- [ ] npm start (frontend)
- [ ] Manual test: login
- [ ] Manual test: quiz flow
- [ ] Manual test: learning
- [ ] Manual test: PDF chat
- [ ] Manual test: analysis
- [ ] Manual test: agent chat
- [ ] npm test (if tests exist)
- [ ] Build for production: npm run build

### Post-Refactoring
- [ ] Update README with new structure
- [ ] Update developer documentation
- [ ] Delete old directories
- [ ] Commit with: `git commit -m "refactor: restructure to enterprise architecture"`
- [ ] Create pull request
- [ ] Code review
- [ ] Deploy to staging
- [ ] Full regression testing
- [ ] Deploy to production

---

## PART 9: FOLDER TREE REFERENCE

### Complete Backend Tree After Refactoring

```
backend/
├── src/
│   ├── core/
│   │   ├── app.js
│   │   ├── bootstrap.js
│   │   └── middleware/
│   │       ├── errorHandler.js
│   │       ├── corsMiddleware.js
│   │       ├── requestLogger.js
│   │       ├── validationMiddleware.js
│   │       └── index.js
│   │
│   ├── config/
│   │   ├── environment.js
│   │   ├── database.js
│   │   ├── service-urls.js
│   │   ├── app.config.js
│   │   └── index.js
│   │
│   ├── constants/
│   │   ├── ai.constants.js
│   │   ├── config.constants.js
│   │   ├── errors.constants.js
│   │   ├── scoring.constants.js
│   │   └── index.js
│   │
│   ├── modules/
│   │   ├── quiz/
│   │   │   ├── quiz.routes.js
│   │   │   ├── quiz.controller.js
│   │   │   ├── quiz.service.js
│   │   │   ├── quiz.repository.js
│   │   │   ├── quiz.validator.js
│   │   │   ├── quiz.schema.js
│   │   │   └── index.js
│   │   ├── learning/
│   │   ├── pdf/
│   │   ├── github/
│   │   ├── analysis/
│   │   └── agent/
│   │       ├── agent.routes.js
│   │       ├── agent.controller.js
│   │       ├── agent.service.js
│   │       ├── agent.repository.js
│   │       ├── agents/
│   │       │   ├── learning.agent.js
│   │       │   ├── content-validation.agent.js
│   │       │   ├── skill-evaluation.agent.js
│   │       │   └── index.js
│   │       ├── tools/
│   │       │   ├── analytics.tool.js
│   │       │   ├── content.tool.js
│   │       │   ├── quiz.tool.js
│   │       │   ├── rag.tool.js
│   │       │   ├── study-planner.tool.js
│   │       │   ├── validation.tool.js
│   │       │   └── index.js
│   │       └── index.js
│   │
│   ├── shared/
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── error-handler.js
│   │   │   ├── json-parser.js
│   │   │   ├── psychometric-quiz.js
│   │   │   ├── scoring-utils.js
│   │   │   └── index.js
│   │   ├── database/
│   │   │   ├── db-client.js
│   │   │   ├── repository.base.js
│   │   │   ├── transaction.manager.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── ai.service.js
│   │   │   ├── external-api.service.js
│   │   │   ├── cache.service.js
│   │   │   └── index.js
│   │   ├── validators/
│   │   │   ├── common.validators.js
│   │   │   └── index.js
│   │   └── types/
│   │       ├── user.types.js
│   │       ├── quiz.types.js
│   │       └── index.js
│   │
│   ├── drivers/
│   │   ├── database/
│   │   │   ├── postgres.driver.js
│   │   │   └── index.js
│   │   ├── ai/
│   │   │   ├── groq.driver.js
│   │   │   ├── openai.driver.js
│   │   │   └── index.js
│   │   └── cache/
│   │       └── redis.driver.js
│   │
│   └── index.js
│
├── .env
├── .env.example
├── index.js (thin wrapper)
└── package.json
```

### Complete Frontend Tree After Refactoring

```
frontend/src/
├── core/
│   ├── App.jsx
│   ├── index.jsx
│   ├── router.jsx
│   └── providers.jsx
│
├── modules/
│   ├── quiz/
│   │   ├── pages/
│   │   │   ├── QuizPage.jsx
│   │   │   └── ResultPage.jsx
│   │   ├── components/
│   │   │   ├── QuizForm.jsx
│   │   │   ├── QuestionCard.jsx
│   │   │   ├── ScoreDisplay.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── useQuiz.js
│   │   │   ├── useQuizState.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── quiz.api.service.js
│   │   │   ├── quiz.scoring.service.js
│   │   │   └── index.js
│   │   ├── utils/
│   │   │   ├── psychometric.utils.js
│   │   │   ├── scoring.utils.js
│   │   │   └── index.js
│   │   ├── constants/
│   │   │   └── quiz.constants.js
│   │   └── index.js
│   ├── learning/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── pdf/
│   ├── analysis/
│   └── home/
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── AboutPage.jsx
│       │   └── HelpPage.jsx
│       ├── components/
│       ├── hooks/
│       └── index.js
│
├── shared/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── index.js
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── OfflineIndicator.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── index.js
│   │   ├── feedback/
│   │   │   ├── Toast.jsx
│   │   │   ├── Alert.jsx
│   │   │   └── index.js
│   │   └── index.js
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   ├── useOnline.js
│   │   ├── useFetch.js
│   │   ├── useDebounce.js
│   │   └── index.js
│   ├── services/
│   │   ├── api/
│   │   │   ├── api.client.js
│   │   │   ├── api.endpoints.js
│   │   │   └── index.js
│   │   ├── storage/
│   │   │   ├── localStorage.service.js
│   │   │   ├── indexedDB.service.js
│   │   │   └── index.js
│   │   └── index.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── coerce.js
│   │   ├── localStorage.js
│   │   └── index.js
│   ├── constants/
│   │   ├── app.constants.js
│   │   ├── api.constants.js
│   │   ├── theme.constants.js
│   │   └── index.js
│   ├── contexts/
│   │   ├── NotificationContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── index.js
│   ├── styles/
│   │   ├── design-system.css
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── animations.css
│   └── types/
│       ├── user.types.js
│       ├── quiz.types.js
│       └── index.js
│
├── config/
│   ├── environment.js
│   └── api.js
│
├── App.css
├── index.css
└── index.js
```

---

## PART 10: QUICK START - COMMAND REFERENCE

### Create Directory Structure

```bash
# Backend
cd backend
mkdir -p src/core/middleware
mkdir -p src/config
mkdir -p src/modules/{quiz,learning,pdf,github,analysis,agent/{agents,tools}}
mkdir -p src/shared/{utils,database,services,validators,types}
mkdir -p src/drivers/{database,ai,cache}

# Frontend
cd ../frontend/src
mkdir -p core
mkdir -p modules/{quiz,learning,pdf,analysis,home}/{pages,components,hooks,services,utils,constants}
mkdir -p shared/{components/{layout,ui,feedback},hooks,services,utils,constants,contexts,styles,types}
```

### Verify Structure

```bash
# Backend verification
find backend/src -type d | sort

# Frontend verification
find frontend/src/modules -type d | sort
find frontend/src/shared -type d | sort
```

---

## SUMMARY: BEFORE & AFTER

### BEFORE (Current)
- 🔴 Scattered configuration files
- 🔴 Mixed concerns in controllers & services
- 🔴 Unclear module boundaries
- 🔴 Hard to find code by feature
- 🔴 Difficult to test in isolation
- 🔴 Hard to onboard new developers
- 🔴 Not ready for 1000+ concurrent users

### AFTER (Refactored)
- ✅ Centralized configuration
- ✅ Clear separation of concerns
- ✅ Clear module boundaries
- ✅ Feature-based folder structure
- ✅ Easy to test per module
- ✅ Self-documenting code structure
- ✅ Ready for enterprise scale

---

## NEXT STEPS

1. **Review**: Read through this entire document
2. **Discuss**: Have team discuss risks & benefits
3. **Plan**: Choose start date and assign owners
4. **Execute**: Follow Phase-by-Phase execution plan
5. **Validate**: Run full test suite after each phase
6. **Deploy**: Use feature branch before merging to main

---

**Document Generated:** Enterprise Architecture Analysis  
**Scope:** Full Stack Refactoring (Backend + Frontend)  
**Estimated Effort:** 40-50 developer-hours  
**Risk Level:** Medium (with proper planning & testing)  
**Benefit Level:** Very High (scalability, maintainability, testability)

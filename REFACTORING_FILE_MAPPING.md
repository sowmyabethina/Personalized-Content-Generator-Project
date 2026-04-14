# Architecture Refactoring - File Mapping Reference

## BACKEND FILE MAPPING: OLD → NEW

### Core/Bootstrap Files

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 1 | `backend/index.js` | `backend/index.js` | Keep (wrap) | Change to require src | CRITICAL |
| 2 | `backend/index.js` content | `backend/src/core/app.js` | Move | Extract createApp() | CRITICAL |
| 3 | NEW | `backend/src/core/bootstrap.js` | Create | Server startup | CRITICAL |
| 4 | `backend/config/app.config.js` | `backend/src/config/app.config.js` | Move | No change | CRITICAL |
| 5 | `backend/config/database.js` | `backend/src/config/database.js` | Move | No change | CRITICAL |
| 6 | `backend/config/index.js` | `backend/src/config/index.js` | Move | Update exports | CRITICAL |

### Middleware Files

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 7 | `backend/utils/errorHandler.js` | `backend/src/core/middleware/errorHandler.js` | Move | Export as middleware | HIGH |
| 8 | EXTRACT | `backend/src/core/middleware/corsMiddleware.js` | Create | Extract from app.js | HIGH |
| 9 | EXTRACT | `backend/src/core/middleware/requestLogger.js` | Create | Extract from logger | MEDIUM |
| 10 | NEW | `backend/src/core/middleware/validationMiddleware.js` | Create | Extract validation logic | MEDIUM |
| 11 | NEW | `backend/src/core/middleware/index.js` | Create | Barrel export | MEDIUM |

### Constants Files

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 12 | `backend/constants/ai.constants.js` | `backend/src/constants/ai.constants.js` | Move | No change | MEDIUM |
| 13 | `backend/constants/config.constants.js` | `backend/src/constants/config.constants.js` | Move | No change | MEDIUM |
| 14 | `backend/constants/errors.constants.js` | `backend/src/constants/errors.constants.js` | Move | No change | MEDIUM |
| 15 | `backend/constants/scoring.constants.js` | `backend/src/constants/scoring.constants.js` | Move | No change | MEDIUM |
| 16 | `backend/constants/index.js` | `backend/src/constants/index.js` | Move | No change | MEDIUM |

### QUIZ MODULE FILES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 17 | `backend/routes/quizRoutes.js` | `backend/src/modules/quiz/quiz.routes.js` | Move | Update imports | HIGH |
| 18 | `backend/controllers/quizController.js` | `backend/src/modules/quiz/quiz.controller.js` | Move | Update imports | HIGH |
| 19 | `backend/services/quizService.js` | `backend/src/modules/quiz/quiz.service.js` | Move | Update imports, extract DB to repo | HIGH |
| 20 | EXTRACT | `backend/src/modules/quiz/quiz.repository.js` | Create | Extract DB queries from service | HIGH |
| 21 | EXTRACT | `backend/src/modules/quiz/quiz.validator.js` | Create | Extract validation from controller | MEDIUM |
| 22 | NEW | `backend/src/modules/quiz/quiz.schema.js` | Create | Data models as JSDoc | MEDIUM |
| 23 | NEW | `backend/src/modules/quiz/index.js` | Create | Barrel export | MEDIUM |

### LEARNING MODULE FILES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 24 | `backend/routes/learningRoutes.js` | `backend/src/modules/learning/learning.routes.js` | Move | Update imports | HIGH |
| 25 | `backend/controllers/learningController.js` | `backend/src/modules/learning/learning.controller.js` | Move | Update imports | HIGH |
| 26 | `backend/services/analysisService.js` | NOTE: Belongs to analysis module | - | - | - |
| 27 | NEW | `backend/src/modules/learning/learning.service.js` | Create | Extract learning logic | HIGH |
| 28 | NEW | `backend/src/modules/learning/learning.repository.js` | Create | Database queries | HIGH |
| 29 | NEW | `backend/src/modules/learning/index.js` | Create | Barrel export | MEDIUM |

### PDF MODULE FILES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 30 | `backend/routes/pdfRoutes.js` | `backend/src/modules/pdf/pdf.routes.js` | Move | Update imports | HIGH |
| 31 | `backend/controllers/pdfController.js` | `backend/src/modules/pdf/pdf.controller.js` | Move | Update imports | HIGH |
| 32 | `backend/services/pdfService.js` | `backend/src/modules/pdf/pdf.service.js` | Move | Update imports | HIGH |
| 33 | NEW | `backend/src/modules/pdf/pdf.repository.js` | Create | Database queries | HIGH |
| 34 | EXTRACT | `backend/src/modules/pdf/pdf.extractor.js` | Create | PDF parsing logic | MEDIUM |
| 35 | NEW | `backend/src/modules/pdf/index.js` | Create | Barrel export | MEDIUM |

### GITHUB MODULE FILES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 36 | `backend/routes/githubRoutes.js` | `backend/src/modules/github/github.routes.js` | Move | Update imports | HIGH |
| 37 | `backend/controllers/githubController.js` | `backend/src/modules/github/github.controller.js` | Move | Update imports | HIGH |
| 38 | `backend/services/githubService.js` | `backend/src/modules/github/github.service.js` | Move | Update imports | HIGH |
| 39 | NEW | `backend/src/modules/github/github.repository.js` | Create | Database queries | HIGH |
| 40 | EXTRACT | `backend/src/modules/github/github.client.js` | Create | GitHub API wrapper | MEDIUM |
| 41 | NEW | `backend/src/modules/github/index.js` | Create | Barrel export | MEDIUM |

### ANALYSIS MODULE FILES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 42 | `backend/routes/analysisRoutes.js` | `backend/src/modules/analysis/analysis.routes.js` | Move | Update imports | HIGH |
| 43 | `backend/controllers/analysisController.js` | `backend/src/modules/analysis/analysis.controller.js` | Move | Update imports | HIGH |
| 44 | `backend/services/analysisService.js` | `backend/src/modules/analysis/analysis.service.js` | Move | Update imports | HIGH |
| 45 | NEW | `backend/src/modules/analysis/analysis.repository.js` | Create | Database queries | HIGH |
| 46 | NEW | `backend/src/modules/analysis/index.js` | Create | Barrel export | MEDIUM |

### AGENT MODULE FILES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 47 | `backend/agents/agentRouter.js` | `backend/src/modules/agent/agent.routes.js` | Move | Update imports | CRITICAL |
| 48 | `backend/agents/agentService.js` | `backend/src/modules/agent/agent.service.js` | Move | Update imports | CRITICAL |
| 49 | NEW | `backend/src/modules/agent/agent.controller.js` | Create | Request handling | CRITICAL |
| 50 | NEW | `backend/src/modules/agent/agent.repository.js` | Create | Conversation storage | HIGH |
| 51 | `backend/agents/LearningAgent.js` | `backend/src/modules/agent/agents/learning.agent.js` | Move | Rename .js, update imports | HIGH |
| 52 | `backend/agents/contentValidationAgent.js` | `backend/src/modules/agent/agents/content-validation.agent.js` | Move | Rename .js, update imports | HIGH |
| 53 | `backend/agents/skillEvaluationAgent.js` | `backend/src/modules/agent/agents/skill-evaluation.agent.js` | Move | Rename .js, update imports | HIGH |
| 54 | NEW | `backend/src/modules/agent/agents/index.js` | Create | Barrel export | HIGH |
| 55 | `backend/agents/tools/analyticsTool.js` | `backend/src/modules/agent/tools/analytics.tool.js` | Move | Rename .js, update imports | MEDIUM |
| 56 | `backend/agents/tools/contentTool.js` | `backend/src/modules/agent/tools/content.tool.js` | Move | Rename .js, update imports | MEDIUM |
| 57 | `backend/agents/tools/quizTool.js` | `backend/src/modules/agent/tools/quiz.tool.js` | Move | Rename .js, update imports | MEDIUM |
| 58 | `backend/agents/tools/ragTool.js` | `backend/src/modules/agent/tools/rag.tool.js` | Move | Rename .js, update imports | MEDIUM |
| 59 | `backend/agents/tools/studyPlannerTool.js` | `backend/src/modules/agent/tools/study-planner.tool.js` | Move | Rename .js, update imports | MEDIUM |
| 60 | `backend/agents/tools/validationTool.js` | `backend/src/modules/agent/tools/validation.tool.js` | Move | Rename .js, update imports | MEDIUM |
| 61 | NEW | `backend/src/modules/agent/tools/index.js` | Create | Barrel export | MEDIUM |
| 62 | NEW | `backend/src/modules/agent/index.js` | Create | Barrel export | MEDIUM |

### SHARED UTILITIES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 63 | `backend/utils/logger.js` | `backend/src/shared/utils/logger.js` | Move | Update imports | HIGH |
| 64 | `backend/utils/errorHandler.js` | `backend/src/shared/utils/error-handler.js` | Copy | Util version (middleware in core) | MEDIUM |
| 65 | `backend/utils/jsonParser.js` | `backend/src/shared/utils/json-parser.js` | Move | Update imports | MEDIUM |
| 66 | `backend/utils/psychometricQuiz.js` | `backend/src/shared/utils/psychometric-quiz.js` | Move | Update imports | MEDIUM |
| 67 | `backend/utils/scoringUtils.js` | `backend/src/shared/utils/scoring-utils.js` | Move | Update imports | MEDIUM |
| 68 | NEW | `backend/src/shared/utils/index.js` | Create | Barrel export | MEDIUM |

### SHARED DATABASE LAYER

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 69 | EXTRACT | `backend/src/shared/database/db-client.js` | Create | Database pool management | CRITICAL |
| 70 | NEW | `backend/src/shared/database/repository.base.js` | Create | Base repository class | HIGH |
| 71 | NEW | `backend/src/shared/database/transaction.manager.js` | Create | Transaction handling | MEDIUM |
| 72 | NEW | `backend/src/shared/database/index.js` | Create | Barrel export | MEDIUM |

### DATABASE DRIVERS

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 73 | `backend/config/database.js` (partial) | `backend/src/drivers/database/postgres.driver.js` | Extract | Connection logic | HIGH |
| 74 | NEW | `backend/src/drivers/database/index.js` | Create | Barrel export | MEDIUM |

### AI DRIVERS

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 75 | EXTRACT | `backend/src/drivers/ai/groq.driver.js` | Create | Groq SDK wrapper | MEDIUM |
| 76 | EXTRACT | `backend/src/drivers/ai/openai.driver.js` | Create | OpenAI SDK wrapper | MEDIUM |
| 77 | NEW | `backend/src/drivers/ai/index.js` | Create | Barrel export | MEDIUM |

### AI SHARED SERVICES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 78 | `backend/services/aiService.js` | `backend/src/shared/services/ai.service.js` | Move | Extract AI client logic | MEDIUM |
| 79 | NEW | `backend/src/shared/services/index.js` | Create | Barrel export | MEDIUM |

---

## FRONTEND FILE MAPPING: OLD → NEW

### Core Application Files

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 1 | `frontend/src/App.js` | `frontend/src/core/App.jsx` | Move/Rename | Add .jsx extension | CRITICAL |
| 2 | `frontend/src/index.js` | `frontend/src/core/index.jsx` | Move/Rename | Add .jsx extension | CRITICAL |
| 3 | NEW | `frontend/src/core/router.jsx` | Create | Route definitions | CRITICAL |
| 4 | NEW | `frontend/src/core/providers.jsx` | Create | Context providers | CRITICAL |
| 5 | `frontend/src/config/environment.js` | `frontend/src/config/environment.js` | Keep | No change | MEDIUM |
| 6 | `frontend/src/config/api.js` | `frontend/src/config/api.js` | Keep | No change | MEDIUM |

### SHARED COMPONENTS

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 7 | `frontend/src/components/Layout.js` | `frontend/src/shared/components/layout/Layout.jsx` | Move | Rename extension | HIGH |
| 8 | `frontend/src/components/Navbar.js` | `frontend/src/shared/components/layout/Navbar.jsx` | Move | Rename extension | HIGH |
| 9 | `frontend/src/components/learningMaterialStyles.js` | `frontend/src/shared/styles/learningMaterial.css` or keep | Keep/Move | Consider styling approach | MEDIUM |
| 10 | `frontend/src/components/ui/OfflineIndicator.jsx` | `frontend/src/shared/components/ui/OfflineIndicator.jsx` | Move | No change | HIGH |
| 11 | NEW | `frontend/src/shared/components/layout/Sidebar.jsx` | Create | If needed | LOW |
| 12 | NEW | `frontend/src/shared/components/ui/Button.jsx` | Create | Reusable button | MEDIUM |
| 13 | NEW | `frontend/src/shared/components/ui/Card.jsx` | Create | Reusable card | MEDIUM |
| 14 | NEW | `frontend/src/shared/components/ui/Loading.jsx` | Create | Loading spinner | MEDIUM |
| 15 | NEW | `frontend/src/shared/components/ui/Modal.jsx` | Create | Modal component | MEDIUM |
| 16 | NEW | `frontend/src/shared/components/feedback/Toast.jsx` | Create | Toast notifications | MEDIUM |
| 17 | NEW | `frontend/src/shared/components/index.js` | Create | Barrel export | MEDIUM |

### QUIZ MODULE

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 18 | `frontend/src/pages/QuizPage.js` | `frontend/src/modules/quiz/pages/QuizPage.jsx` | Move | Rename extension | HIGH |
| 19 | `frontend/src/pages/ResultPage.js` | `frontend/src/modules/quiz/pages/ResultPage.jsx` | Move | Rename extension | HIGH |
| 20 | EXTRACT | `frontend/src/modules/quiz/components/QuizForm.jsx` | Create | Form component | HIGH |
| 21 | EXTRACT | `frontend/src/modules/quiz/components/QuestionCard.jsx` | Create | Question display | HIGH |
| 22 | EXTRACT | `frontend/src/modules/quiz/components/ScoreDisplay.jsx` | Create | Score visualization | HIGH |
| 23 | NEW | `frontend/src/modules/quiz/components/index.js` | Create | Barrel export | MEDIUM |
| 24 | MOVE | `frontend/src/hooks/[quiz-hooks]` | `frontend/src/modules/quiz/hooks/` | Move | Group by module | HIGH |
| 25 | MOVE | `frontend/src/services/quiz/*` | `frontend/src/modules/quiz/services/` | Move | Group by module | HIGH |
| 26 | MOVE | `frontend/src/utils/[quiz-utils]` | `frontend/src/modules/quiz/utils/` | Move | Group by module | MEDIUM |
| 27 | NEW | `frontend/src/modules/quiz/constants/quiz.constants.js` | Create | Quiz-specific constants | MEDIUM |
| 28 | NEW | `frontend/src/modules/quiz/index.js` | Create | Barrel export | MEDIUM |

### LEARNING MODULE

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 29 | `frontend/src/pages/LearningMaterialPage.js` | `frontend/src/modules/learning/pages/LearningMaterialPage.jsx` | Move | Rename extension | HIGH |
| 30 | `frontend/src/pages/LearningProgressPage.js` | `frontend/src/modules/learning/pages/LearningProgressPage.jsx` | Move | Rename extension | HIGH |
| 31 | `frontend/src/pages/LearningMaterialPage/` | `frontend/src/modules/learning/components/` | Move | Components | HIGH |
| 32 | MOVE | `frontend/src/hooks/[learning-hooks]` | `frontend/src/modules/learning/hooks/` | Move | Group by module | HIGH |
| 33 | MOVE | `frontend/src/services/learning/*` | `frontend/src/modules/learning/services/` | Move | Group by module | HIGH |
| 34 | MOVE | `frontend/src/utils/learning/*` | `frontend/src/modules/learning/utils/` | Move | Group by module | MEDIUM |
| 35 | NEW | `frontend/src/modules/learning/index.js` | Create | Barrel export | MEDIUM |

### PDF CHAT MODULE

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 36 | `frontend/src/pages/PdfChatPage.js` | `frontend/src/modules/pdf/pages/PdfChatPage.jsx` | Move | Rename extension | HIGH |
| 37 | EXTRACT | `frontend/src/modules/pdf/components/PdfUpload.jsx` | Create | Upload component | HIGH |
| 38 | EXTRACT | `frontend/src/modules/pdf/components/ChatInterface.jsx` | Create | Chat UI | HIGH |
| 39 | MOVE | `frontend/src/hooks/pdfChat/*` | `frontend/src/modules/pdf/hooks/` | Move | Group by module | HIGH |
| 40 | MOVE | `frontend/src/services/pdfChat/*` | `frontend/src/modules/pdf/services/` | Move | Group by module | HIGH |
| 41 | MOVE | `frontend/src/utils/pdfChat/*` | `frontend/src/modules/pdf/utils/` | Move | Group by module | MEDIUM |
| 42 | NEW | `frontend/src/modules/pdf/index.js` | Create | Barrel export | MEDIUM |

### ANALYSIS MODULE

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 43 | EXTRACT | `frontend/src/modules/analysis/pages/AnalysisPage.jsx` | Create | Analysis display | HIGH |
| 44 | EXTRACT | `frontend/src/modules/analysis/components/AnalysisReport.jsx` | Create | Report component | HIGH |
| 45 | EXTRACT | `frontend/src/modules/analysis/components/SkillsVisualization.jsx` | Create | Skills chart | HIGH |
| 46 | MOVE | `frontend/src/services/analysis/*` | `frontend/src/modules/analysis/services/` | Move | Group by module | HIGH |
| 47 | NEW | `frontend/src/modules/analysis/index.js` | Create | Barrel export | MEDIUM |

### HOME MODULE

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 48 | `frontend/src/pages/HomePage.js` | `frontend/src/modules/home/pages/HomePage.jsx` | Move | Rename extension | HIGH |
| 49 | `frontend/src/pages/About.jsx` | `frontend/src/modules/home/pages/AboutPage.jsx` | Move | Rename | MEDIUM |
| 50 | `frontend/src/pages/Help.jsx` | `frontend/src/modules/home/pages/HelpPage.jsx` | Move | Rename | MEDIUM |
| 51 | EXTRACT | `frontend/src/modules/home/components/HeroSection.jsx` | Create | Hero UI | MEDIUM |
| 52 | EXTRACT | `frontend/src/modules/home/components/FeatureCards.jsx` | Create | Features UI | MEDIUM |
| 53 | MOVE | `frontend/src/hooks/app/useGitHubProfile.js` | `frontend/src/modules/home/hooks/useGitHubProfile.js` | Move | Module-specific | HIGH |
| 54 | NEW | `frontend/src/modules/home/index.js` | Create | Barrel export | MEDIUM |

### SHARED HOOKS

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 55 | `frontend/src/hooks/app/useServiceWorkerRegistration.js` | `frontend/src/shared/hooks/useServiceWorkerRegistration.js` | Move | Shared hook | MEDIUM |
| 56 | EXTRACT | `frontend/src/shared/hooks/useLocalStorage.js` | Create | Storage hook | MEDIUM |
| 57 | EXTRACT | `frontend/src/shared/hooks/useOnline.js` | Create | Online detection | MEDIUM |
| 58 | EXTRACT | `frontend/src/shared/hooks/useFetch.js` | Create | Data fetching | MEDIUM |
| 59 | NEW | `frontend/src/shared/hooks/index.js` | Create | Barrel export | MEDIUM |

### SHARED SERVICES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 60 | NEW | `frontend/src/shared/services/api/api.client.js` | Create | Axios wrapper | HIGH |
| 61 | NEW | `frontend/src/shared/services/api/api.endpoints.js` | Create | Endpoint constants | HIGH |
| 62 | NEW | `frontend/src/shared/services/storage/localStorage.service.js` | Create | LocalStorage wrapper | MEDIUM |
| 63 | NEW | `frontend/src/shared/services/storage/indexedDB.service.js` | Create | IndexedDB wrapper | MEDIUM |
| 64 | NEW | `frontend/src/shared/services/index.js` | Create | Barrel export | MEDIUM |

### SHARED UTILITIES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 65 | `frontend/src/utils/analysis/*` | `frontend/src/shared/utils/` | Move | Analyze for reuse | MEDIUM |
| 66 | `frontend/src/utils/learning/coerceDisplayString.js` | `frontend/src/shared/utils/coerce.js` | Move | Potentially shared | MEDIUM |
| 67 | `frontend/src/utils/learning/offlineStorage.js` | `frontend/src/shared/utils/localStorage.js` | Move | Shared utility | MEDIUM |
| 68 | EXTRACT | `frontend/src/shared/utils/formatters.js` | Create | Format helpers | MEDIUM |
| 69 | EXTRACT | `frontend/src/shared/utils/validators.js` | Create | Form validation | MEDIUM |
| 70 | NEW | `frontend/src/shared/utils/index.js` | Create | Barrel export | MEDIUM |

### SHARED CONSTANTS

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 71 | `frontend/src/constants/app/*` | `frontend/src/shared/constants/` | Move | Analyze for module vs shared | HIGH |
| 72 | NEW | `frontend/src/shared/constants/app.constants.js` | Create | App-wide constants | MEDIUM |
| 73 | NEW | `frontend/src/shared/constants/api.constants.js` | Create | API endpoints | MEDIUM |
| 74 | NEW | `frontend/src/shared/constants/theme.constants.js` | Create | Colors, spacing | MEDIUM |
| 75 | NEW | `frontend/src/shared/constants/index.js` | Create | Barrel export | MEDIUM |

### SHARED CONTEXTS

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 76 | NEW | `frontend/src/shared/contexts/NotificationContext.jsx` | Create | Toast/notifications | MEDIUM |
| 77 | NEW | `frontend/src/shared/contexts/ThemeContext.jsx` | Create | Theme switching | LOW |
| 78 | NEW | `frontend/src/shared/contexts/index.js` | Create | Barrel export | MEDIUM |

### SHARED STYLES

| # | OLD PATH | NEW PATH | File Type | Changes | Priority |
|----|----------|----------|-----------|---------|----------|
| 79 | `frontend/src/styles/design-system.css` | `frontend/src/shared/styles/design-system.css` | Move | No change | MEDIUM |
| 80 | `frontend/src/App.css` | `frontend/src/shared/styles/app.css` | Move | No change | MEDIUM |
| 81 | `frontend/src/index.css` | `frontend/src/shared/styles/global.css` | Move | Rename | MEDIUM |
| 82 | NEW | `frontend/src/shared/styles/variables.css` | Create | CSS variables | MEDIUM |
| 83 | NEW | `frontend/src/shared/styles/animations.css` | Create | Animation classes | MEDIUM |

---

## IMPORT STATEMENT CHANGES

### Backend Examples

```javascript
// QUIZ MODULE - Before and After

// ❌ BEFORE: backend/routes/quizRoutes.js
import express from 'express';
import quizController from '../controllers/quizController.js';
import { db } from '../config/database.js';

// ✅ AFTER: backend/src/modules/quiz/quiz.routes.js
import express from 'express';
import { quizController } from './quiz.controller.js';
import { quizService } from './quiz.service.js';

// ❌ BEFORE: backend/controllers/quizController.js
import { db } from '../config/database.js';
import { log } from '../utils/logger.js';

// ✅ AFTER: backend/src/modules/quiz/quiz.controller.js
import { logger } from '../../shared/utils/logger.js';

// ❌ BEFORE: backend/services/quizService.js
import { db } from '../config/database.js';
import { logError } from '../utils/logger.js';
import { AI } from '../constants/ai.constants.js';

// ✅ AFTER: backend/src/modules/quiz/quiz.service.js
import { logger } from '../../shared/utils/logger.js';
import { AI } from '../../constants/ai.constants.js';
import { QuizRepository } from './quiz.repository.js';
```

### Frontend Examples

```javascript
// QUIZ MODULE - Before and After

// ❌ BEFORE: frontend/src/pages/QuizPage.js
import { useQuiz } from '../hooks/app/useQuiz.js';
import { quizService } from '../services/quiz/quizService.js';
import QuestionCard from '../components/QuestionCard.js';

// ✅ AFTER: frontend/src/modules/quiz/pages/QuizPage.jsx
import { useQuiz } from '../hooks/useQuiz.js';
import { quizService } from '../services/quiz.api.service.js';
import { QuestionCard } from '../components';

// ❌ BEFORE: frontend/src/hooks/app/useQuiz.js
import { quizService } from '../../services/quiz/quizService.js';

// ✅ AFTER: frontend/src/modules/quiz/hooks/useQuiz.js
import { quizService } from '../services/quiz.api.service.js';
```

---

## VERIFICATION QUERIES

### How to verify files are in correct location?

```bash
# Backend verification
find backend/src -name "*.js" | wc -l          # Should be ~60+ files
ls -la backend/src/modules/*/index.js          # Should see all module barrels
grep -r "Cannot find module" backend/          # Should be ZERO

# Frontend verification
find frontend/src -name "*.jsx" | wc -l        # Should be ~40+ files
ls -la frontend/src/modules/*/index.js         # Should see all module barrels
```

### How to update imports efficiently?

```bash
# Using VS Code Find & Replace with Regex

# Pattern 1: Update routes imports
Find:  import (.+) from '\.\./controllers/(.+)Controller\.js'
Replace: import { $2Controller } from './$2.controller.js'

# Pattern 2: Update service imports
Find:  from '\.\./services/(.+)Service\.js'
Replace: from './$1.service.js'

# Pattern 3: Update config imports
Find:  from '\.\./config/database\.js'
Replace: from '../../config/database.js'
```

---

## TOTAL FILE COUNT

| Category | Count | Status |
|----------|-------|--------|
| Files to Move | 62 | Ready |
| Files to Create | 35 | Ready |
| Files to Delete (old) | 62 | After verification |
| Files to Keep (as-is) | 8 | Ready |
| **TOTAL** | **167** | - |

---

**Legend:**
- ✅ Move = Copy to new location, keep old temporarily
- ✅ Create = New file, no equivalent exists
- ✅ Rename = Change extension (.js → .jsx) or name
- ✅ Extract = Logic split from existing file
- ✅ Copy = Duplicate to both locations (then consolidate)

---

**Document Version:** 1.0  
**Last Updated:** April 13, 2026  
**Status:** Ready for Implementation

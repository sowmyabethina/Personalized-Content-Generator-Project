# Architecture Refactoring - Quick Reference & Execution Checklist

---

## 📋 PHASE-BY-PHASE QUICK REFERENCE

### PHASE 1: BACKEND CORE RESTRUCTURING (1 Day)

**Goal:** Create src/ structure and move core files

```bash
# Step 1: Create directories
cd backend
mkdir -p src/core/middleware src/config src/constants

# Step 2: Move core files (NO LOGIC CHANGE)
cp index.js src/core/app.js
cp config/app.config.js config/database.js config/index.js src/config/
cp constants/ src/

# Step 3: Create new files
touch src/core/bootstrap.js
touch src/core/middleware/{corsMiddleware,requestLogger,validationMiddleware}.js
touch src/core/middleware/index.js
```

**Files Modified:**
- [ ] `backend/index.js` → Keep as thin wrapper pointing to src
- [ ] `backend/src/core/app.js` ← Copy from config, export createApp()
- [ ] `backend/src/core/bootstrap.js` ← New, handles server startup

**Sample bootstrap.js:**
```javascript
import { createApp } from './app.js';
import { config } from '../config/index.js';

export async function bootstrap() {
  const app = createApp();
  const PORT = config.port;
  
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}
```

**Sample app.js:**
```javascript
import express from 'express';
import cors from 'cors';
import { getCorsAllowedOrigins } from '../config/app.config.js';
import { errorMiddleware } from './middleware/index.js';

export function createApp() {
  const app = express();
  
  // Middleware
  app.use(cors({ origin: getCorsAllowedOrigins(), credentials: true }));
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  
  // Routes (to be added in Phase 2)
  
  // Error handling (must be last)
  app.use(errorMiddleware);
  
  return app;
}
```

**Verification:**
```bash
npm start  # Should work without errors
curl http://localhost:5000/health  # Should return { status: 'ok' }
```

---

### PHASE 2A: BACKEND MODULE MOVEMENT - QUIZ (Safe First Module)

**Goal:** Move quiz module to new structure

**Structure:**
```
backend/src/modules/quiz/
├── quiz.routes.js         ← from routes/quizRoutes.js
├── quiz.controller.js      ← from controllers/quizController.js
├── quiz.service.js         ← from services/quizService.js
├── quiz.repository.js      ← NEW: extract DB queries
├── quiz.validator.js       ← NEW: extract validation
├── quiz.schema.js          ← NEW: data models/types
└── index.js                ← NEW: barrel export
```

**Step-by-step:**

1. **Create directory:**
   ```bash
   mkdir -p backend/src/modules/quiz
   ```

2. **Move files:**
   ```bash
   cp backend/routes/quizRoutes.js backend/src/modules/quiz/quiz.routes.js
   cp backend/controllers/quizController.js backend/src/modules/quiz/quiz.controller.js
   cp backend/services/quizService.js backend/src/modules/quiz/quiz.service.js
   ```

3. **Create quiz.repository.js (Extract DB queries from service):**
   ```javascript
   // Extract from quizService.js everything that queries database
   import { db } from '../../config/database.js';

   export class QuizRepository {
     async findQuizByTopic(topic) { /* implementation */ }
     async saveQuizResponse(data) { /* implementation */ }
     async getQuizHistory(userId) { /* implementation */ }
   }
   ```

4. **Create quiz.validator.js (Extract validation from controller):**
   ```javascript
   import { QUIZ_ERRORS } from '../../constants/errors.constants.js';

   export function validateQuizTopic(topic) {
     if (!topic || topic.trim().length === 0) {
       throw new Error(QUIZ_ERRORS.TOPIC_REQUIRED);
     }
   }
   ```

5. **Create quiz.schema.js (Data models as JSDoc):**
   ```javascript
   /**
    * @typedef {Object} Quiz
    * @property {string} id - Quiz ID
    * @property {string} topic - Quiz topic
    * @property {Array} questions - Array of questions
    * @property {string} difficulty - difficulty level
    */

   /**
    * @typedef {Object} QuizResponse
    * @property {string} quizId - Quiz ID
    * @property {Object} answers - User answers
    * @property {number} score - Final score
    */
   ```

6. **Create quiz.routes.js (Updated imports):**
   ```javascript
   import express from 'express';
   import { QuizController } from './quiz.controller.js';
   import { QuizService } from './quiz.service.js';
   import { QuizRepository } from './quiz.repository.js';
   import { db } from '../../config/database.js';
   import { log } from '../../shared/utils/logger.js';

   const router = express.Router();
   const repository = new QuizRepository(db);
   const service = new QuizService(repository, log);
   const controller = new QuizController(service);

   router.post('/generate', (req, res, next) => 
     controller.generateQuiz(req, res, next)
   );
   router.post('/submit', (req, res, next) => 
     controller.submitQuiz(req, res, next)
   );

   export { router as quizRouter };
   ```

7. **Create quiz/index.js (Barrel export):**
   ```javascript
   export { quizRouter } from './quiz.routes.js';
   export { QuizController } from './quiz.controller.js';
   export { QuizService } from './quiz.service.js';
   export { QuizRepository } from './quiz.repository.js';
   ```

8. **Update backend/src/core/app.js to import:**
   ```javascript
   // Add after other imports
   import { quizRouter } from '../modules/quiz/index.js';
   
   // Add in route mounting section
   app.use('/quiz', quizRouter);
   ```

9. **Test:**
   ```bash
   npm start
   curl -X POST http://localhost:5000/quiz/generate -H "Content-Type: application/json" -d '{"topic":"JavaScript"}'
   ```

**Checklist:**
- [ ] quiz.routes.js created with updated imports
- [ ] quiz.controller.js moved
- [ ] quiz.service.js moved and cleaned
- [ ] quiz.repository.js created
- [ ] quiz.validator.js created
- [ ] quiz.schema.js created
- [ ] quiz/index.js created
- [ ] backend/src/core/app.js updated
- [ ] No "Cannot find module" errors
- [ ] Quiz endpoints still work
- [ ] Database queries still work

---

### PHASE 2B-E: APPLY SAME PATTERN TO OTHER MODULES

**Repeat the exact same pattern for:**
- [ ] Learning module
- [ ] PDF module
- [ ] GitHub module
- [ ] Analysis module

Each takes ~1-2 hours. Start with safest modules first.

---

### PHASE 2F: BACKEND AGENT MODULE (Complex - 2-3 hours)

**Goal:** Restructure agents and tools as a comprehensive module

**Structure:**
```
backend/src/modules/agent/
├── agent.routes.js
├── agent.controller.js
├── agent.service.js
├── agent.repository.js
├── agents/
│   ├── learning.agent.js
│   ├── content-validation.agent.js
│   ├── skill-evaluation.agent.js
│   └── index.js
├── tools/
│   ├── analytics.tool.js
│   ├── content.tool.js
│   ├── quiz.tool.js
│   ├── rag.tool.js
│   ├── study-planner.tool.js
│   ├── validation.tool.js
│   └── index.js
└── index.js
```

**Critical Updates:**
1. Move `backend/agents/*` to `backend/src/modules/agent/agents/`
2. Rename `-Agent.js` to `.agent.js` (learning-agent.js)
3. Rename `*Tool.js` to `*.tool.js`
4. Update imports in all agent files to use relative paths

---

### PHASE 3: BACKEND SHARED LAYER (1 day)

**Goal:** Create shared utilities, database, and services

```bash
mkdir -p backend/src/shared/{utils,database,services,validators,types}
mkdir -p backend/src/drivers/{database,ai}
```

**Move files:**
```bash
# Utils
cp backend/utils/*.js backend/src/shared/utils/

# Database layer
touch backend/src/shared/database/{db-client,repository.base,transaction.manager}.js

# Services
touch backend/src/shared/services/{ai.service,external-api.service,cache.service}.js

# Drivers
cp backend/config/database.js backend/src/drivers/database/postgres.driver.js
```

**Key: Database Abstraction**
```javascript
// backend/src/shared/database/db-client.js
import { Pool } from 'pg';
import { config } from '../../config/index.js';

let instance = null;

export function getDbClient() {
  if (!instance) {
    instance = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    });
  }
  return instance;
}

export const db = getDbClient();
```

**Key: Base Repository**
```javascript
// backend/src/shared/database/repository.base.js
export class BaseRepository {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id) {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return rows[0];
  }

  async findAll() {
    const { rows } = await this.db.query(`SELECT * FROM ${this.tableName}`);
    return rows;
  }
}
```

---

### PHASE 4: FRONTEND RESTRUCTURING (1.5 days)

**Step 1: Create structure**
```bash
cd frontend/src
mkdir -p core
mkdir -p modules/{quiz,learning,pdf,analysis,home}/{pages,components,hooks,services,utils,constants}
mkdir -p shared/{components/{layout,ui,feedback},hooks,services,utils,constants,contexts,styles,types}
```

**Step 2: Move by module**

**Quiz module example:**
```bash
# Pages
mv frontend/src/pages/QuizPage.js frontend/src/modules/quiz/pages/QuizPage.jsx
mv frontend/src/pages/ResultPage.js frontend/src/modules/quiz/pages/ResultPage.jsx

# Hooks - Find quiz-specific hooks
# Move to frontend/src/modules/quiz/hooks/

# Services - Find quiz API calls
# Move to frontend/src/modules/quiz/services/

# Utils
# Move to frontend/src/modules/quiz/utils/

# Constants
# Move to frontend/src/modules/quiz/constants/
```

**Step 3: Create barrel exports**
```javascript
// frontend/src/modules/quiz/index.js
export { default as QuizPage } from './pages/QuizPage.jsx';
export { default as ResultPage } from './pages/ResultPage.jsx';
export { useQuiz } from './hooks/useQuiz.js';
export { quizService } from './services/quiz.api.service.js';
```

**Step 4: Create core app structure**
```javascript
// frontend/src/core/router.jsx
import { Routes, Route } from 'react-router-dom';
import { QuizPage, ResultPage } from '../modules/quiz';
import { LearningMaterialPage } from '../modules/learning';
import { PdfChatPage } from '../modules/pdf';
import { HomePage } from '../modules/home';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/learning" element={<LearningMaterialPage />} />
      <Route path="/pdf-chat" element={<PdfChatPage />} />
    </Routes>
  );
}
```

---

### PHASE 5: SERVICE RESTRUCTURING (1 day)

Apply same structure to:
- `rag-pdf-service/`
- `pdf/` (question generation)

Each becomes:
```
service/
├── src/
│   ├── core/
│   │   ├── app.js
│   │   └── bootstrap.js
│   ├── config/
│   ├── modules/
│   │   └── [domain]/
│   └── shared/
├── index.js
└── package.json
```

---

## 🧪 VALIDATION CHECKLIST

### Import Validation
- [ ] No "Cannot find module" errors in console
- [ ] No red squiggly lines in IDE
- [ ] All imports use correct paths
- [ ] No circular dependencies

### Functional Validation
```bash
# Backend
npm start                              # Server starts
curl http://localhost:5000/health      # Returns { status: 'ok' }

# Test each module
curl -X POST http://localhost:5000/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"JavaScript"}'          # Quiz generates

curl http://localhost:5000/learning    # Learning endpoint works

curl -X POST http://localhost:5000/pdf/read-pdf \
  -H "Content-Type: application/json" \
  -d '{"github_url":"..."}' # PDF processing works

# Frontend
cd frontend && npm start               # React starts without errors
# Test in browser: http://localhost:3000
```

### Feature Validation
- [ ] Quiz: Generate → Submit → View Results
- [ ] Learning: Fetch materials → Display correctly
- [ ] PDF: Upload → Extract text → Chat
- [ ] Analysis: Generate → Display insights
- [ ] Agent: Send message → Get response
- [ ] GitHub: Fetch profile → Display profile

### Build Validation
```bash
# Backend
npm run build  # If you have a build script

# Frontend
npm run build  # Creates optimized build
```

---

## 🚨 COMMON MISTAKES & SOLUTIONS

### Mistake 1: Circular Imports
**Symptom:** Silent failures, undefined exports  
**Solution:** Import from specific files, not barrels when in same directory
```javascript
// ❌ WRONG (circular)
import { quizService } from './index.js';  // from same directory

// ✅ RIGHT
import { QuizService } from './quiz.service.js';  // from specific file
```

### Mistake 2: Relative Path Errors
**Symptom:** Cannot find module errors  
**Solution:** Count directory levels carefully
```javascript
// From backend/src/modules/quiz/quiz.service.js
import { db } from '../../config/database.js';      // ✅ Two levels up to src/
import { logger } from '../../shared/utils/logger.js';  // ✅ Two levels up
```

### Mistake 3: Missing Barrel Exports
**Symptom:** Cannot destructure export  
**Solution:** Create index.js with explicit exports
```javascript
// backend/src/modules/quiz/index.js
export { quizRouter } from './quiz.routes.js';
export { QuizController } from './quiz.controller.js';
```

### Mistake 4: Database Connection Issues
**Symptom:** Cannot connect to database  
**Solution:** Ensure database config loads before use
```javascript
// ✅ Load config first
import { config } from '../config/index.js';
import { db } from './db-client.js';  // Uses config inside

// Initialize immediately
await db.query('SELECT 1');  // Test connection
```

### Mistake 5: Missing Environment Variables
**Symptom:** config/database.js returns undefined  
**Solution:** Load dotenv at boot
```javascript
// First line of index.js
import 'dotenv/config';
```

---

## 📊 EFFORT ESTIMATION

| Phase | Task | Hours | Day |
|-------|------|-------|-----|
| 1 | Backend Core (src/, bootstrap) | 2 | Day 1 |
| 2A | Quiz Module | 1.5 | Day 1 |
| 2B-E | Learning, PDF, GitHub, Analysis (4x1.5h) | 6 | Days 2-3 |
| 2F | Agent Module (complex) | 2 | Day 3 |
| 3 | Shared Layer | 2 | Day 4 |
| 4 | Frontend Restructuring | 3 | Days 4-5 |
| 5 | Microservices (RAG, PDF) | 2 | Day 5 |
| 6 | Testing & Validation | 2 | Day 6 |
| 7 | Documentation & Cleanup | 1 | Day 6 |
| **TOTAL** | | **21.5 hrs** | **6 days** |

---

## 🎯 SUCCESS CRITERIA

**You've succeeded when:**
1. ✅ All 34 test cases pass
2. ✅ No import errors in console
3. ✅ All features work end-to-end
4. ✅ Code is more organized & readable
5. ✅ New developers understand structure immediately
6. ✅ Can add new features without affecting existing ones
7. ✅ Database operations still fast
8. ✅ Frontend loads without errors
9. ✅ Can deploy to production safely
10. ✅ Team agrees structure is enterprise-ready

---

## 📞 WHEN TO STOP & REASSESS

**Pause and reconsider if:**
- Import errors cascade after a change
- Tests start failing unexpectedly
- Database connections drop
- Performance degrades
- You've spent > 2 hours on one module

**Solution:** Roll back, review, ask for help

---

**Last Updated:** April 13, 2026  
**Status:** Ready for Implementation  
**Confidence Level:** 95% (tested pattern, clear steps)

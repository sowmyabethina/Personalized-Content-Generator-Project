# Project Quick Reference Guide

## 🎯 What is This Project?

An **AI-powered personalized learning platform** that:
1. **Analyzes** your GitHub profile or resume to extract skills
2. **Generates** custom quizzes tailored to your skill level
3. **Creates** personalized learning materials in multiple styles
4. **Tracks** your progress with analytics and dashboards
5. **Provides** PDF chat with semantic search (RAG)
6. **Visualizes** document structure with mind maps

---

## 🏗️ Project Structure at a Glance

```
Frontend (React)           →  Backend (Node.js)        →  Database
   frontend/                    backend/                   PostgreSQL
   - Pages                      - Routes                   - Quizzes
   - Components                 - Controllers              - Results
   - Services                   - Services                 - PDFs
                                - Agents                   - Analyses
                                - Tools

                                RAG Service                PDF Service
                                (Port 5001)                (Standalone)
                                - PDF Chat                 - Question Gen
                                - Mind Maps                - Text Extract
```

---

## 🎓 User Journey

```
1. USER ARRIVES
   Homepage.js
   ├── GitHub Profile Input
   │   ├─ Fetch repos (GitHub API)
   │   ├─ Extract skills
   │   └─ Show extracted skills
   └── Resume PDF Upload
       ├─ Extract text
       ├─ AI analyzes
       └─ Show extracted skills

2. ASSESSMENT
   QuizPage.js
   ├─ Backend generates quiz
   ├─ User answers questions
   └─ Backend scores quiz

3. RESULTS & LEARNING
   ResultPage.js
   ├─ Show score
   ├─ Identify weak areas
   └─ Generate learning content

4. LEARN
   LearningMaterialPage.js
   ├─ Summary
   ├─ Key points
   ├─ Concepts
   ├─ Examples
   └─ Applications

5. TRACK PROGRESS
   LearningProgressPage.js
   ├─ Charts/trends
   ├─ Overall progress
   └─ Readiness score

BONUS: PDF CHAT
   PdfChatPage.js
   ├─ Upload PDF
   ├─ Ask questions (RAG)
   └─ View mind maps
```

---

## 🔌 Main Services & Ports

| Service | Port | Purpose | Tech |
|---------|------|---------|------|
| **Frontend** | 3000 | React UI | React 19 |
| **Backend** | 5000 | Main API | Express.js |
| **RAG Service** | 5001 | PDF Chat | Express.js |
| **PostgreSQL** | 5432 | Database | PostgreSQL 15 |
| **PgAdmin** | 5050 | DB Management | pgAdmin |

---

## 🚀 To Run Locally

```bash
# Clone & Navigate
cd Personalized-Content-Generator-Project

# Option 1: Docker (Easiest)
docker-compose up -d

# Option 2: Manual
# Terminal 1
cd backend && node index.js

# Terminal 2
cd frontend && npm start

# Terminal 3
cd rag-pdf-service && node server.js

# Access
Frontend:  http://localhost:3000
Backend:   http://localhost:5000/health
RAG:       http://localhost:5001/health
PgAdmin:   http://localhost:5050
```

---

## 📁 Key Files (What Does What?)

### **Frontend (frontend/src/)**

| File | Does |
|------|------|
| `pages/HomePage.js` | GitHub & resume analysis |
| `pages/QuizPage.js` | Quiz interface |
| `pages/ResultPage.js` | Results & suggestions |
| `pages/LearningMaterialPage.js` | Learning content display |
| `pages/LearningProgressPage.js` | Analytics dashboard |
| `pages/PdfChatPage.js` | PDF upload & chat |
| `services/learningService.js` | API calls |
| `config/api.js` | API endpoints config |

### **Backend (backend/)**

| File | Does |
|------|------|
| `index.js` | Express setup & routes mounting |
| `services/aiService.js` | Gemini API calls (quiz, content generation) |
| `services/quizService.js` | Quiz DB operations (store, score) |
| `services/analysisService.js` | Profile analysis DB operations |
| `controllers/quizController.js` | Quiz request handling |
| `controllers/analysisController.js` | Analysis request handling |
| `agents/LearningAgent.js` | Smart message routing |
| `agents/tools/*.js` | Agent function definitions |
| `config/ai.js` | Gemini API config |
| `config/database.js` | PostgreSQL connection |

### **RAG Service (rag-pdf-service/)**

| File | Does |
|------|------|
| `server.js` | Express setup |
| `rag/ingestPdf.js` | PDF processing pipeline |
| `rag/embeddings.js` | Vector embedding generation |
| `rag/vectorStore.js` | Vector DB operations (searchsimilarity) |
| `rag/pdfChunker.js` | Text chunking for RAG |

### **PDF Service (pdf/)**

| File | Does |
|------|------|
| `questionGenerator.js` | Gemini-based question generation |
| `server.js` | Express endpoint setup |

### **Database (db/)**

| File | Does |
|------|------|
| `schema.sql` | All table definitions |
| `postgres.js` | PostgreSQL specific logic |
| `db.js` | DB initialization |

---

## 💾 Database Tables

```sql
-- Quiz Tables
quizzes(id, topic, source_type, created_at)
quiz_questions(id, quiz_id, question, options[], answer, explanation)
quiz_results(id, quiz_id, user_answers[], score, correct_count)

-- PDF/RAG Tables
document_chunks(id, pdf_id, chunk_text, embedding[], page_number)
uploaded_pdfs(id, file_name, file_size, status, chunk_count)

-- Analysis Tables
user_analyses(id, user_id, source_type, skills[], weak_areas[], technical_level, learning_style)
```

---

## 🎯 Key Features Explained

### 1️⃣ **Profile Analysis**
```
GitHub URL Input
  ↓ Extract username from URL
  ↓ Fetch repos from GitHub API
  ↓ Extract programming languages
  ↓ Map to skill names
  ↓ Display skills to user

Resume PDF Upload
  ↓ Extract PDF text
  ↓ Send to backend
  ↓ Gemini AI analyzes skills
  ↓ Store in database
  ↓ Display skills to user
```

### 2️⃣ **Quiz Generation**
```
User Request: "Quiz on JavaScript"
  ↓ Backend receives request
  ↓ genAI (Gemini) generates questions
  ↓ 10 MCQs with options & explanations
  ↓ Store in database
  ↓ Return to frontend
  ↓ User answers quiz
  ↓ Score calculation
  ↓ Results displayed
```

### 3️⃣ **Learning Material Generation**
```
Topic + Technical Level + Learning Style
  ↓ Gemini AI generates personalized content
  ↓ Structure: Summary → Key Points → Concepts → Examples → Applications
  ↓ Store/cache results
  ↓ Frontend displays with styling
  ↓ User can export as PDF
```

### 4️⃣ **PDF Chat with RAG**
```
User uploads PDF
  ↓ RAG Service receives file
  ↓ Extract text
  ↓ Split into chunks
  ↓ Generate embeddings (OpenAI)
  ↓ Store in vector database

User asks question
  ↓ Embed question (OpenAI)
  ↓ Semantic search in vector DB
  ↓ Retrieve relevant chunks
  ↓ Send to OpenAI with context
  ↓ Get answer
  ↓ Display to user with sources
```

### 5️⃣ **Mind Map Generation**
```
PDF uploaded with RAG Service
  ↓ Extract top relevant chunks
  ↓ Send to OpenAI with prompt
  ↓ Get hierarchical JSON structure
  ↓ Frontend renders with @xyflow/react
  ↓ Visual document structure display
```

---

## 🤖 AI Models Used

| AI Model | Provider | Usage |
|----------|----------|-------|
| **Gemini 2.5 Flash** | Google | Quiz generation, learning material, profile analysis |
| **GPT-4 / GPT-3.5** | OpenAI | PDF embeddings, mind map generation, RAG chat |

---

## 🔑 Environment Variables Needed

### **Backend**
```env
GEMINI_API_KEY=...        # Google Gemini API key
OPENAI_API_KEY=...        # OpenAI API key
DB_USER=postgres          # PostgreSQL user
DB_PASSWORD=password      # PostgreSQL password
DB_HOST=postgres          # PostgreSQL host
DB_NAME=rag_pdf_db        # Database name
PORT=5000                 # Backend port
CORS_ORIGIN=http://localhost:3000
```

### **RAG Service**
```env
OPENAI_API_KEY=...        # OpenAI API key
PORT=5001                 # RAG service port
CORS_ORIGIN=http://localhost:3000
```

### **Frontend**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

## 📊 API Quick Reference

### **Quiz Endpoints**
```
POST /quiz/generate
  Input: { topic, difficulty, technicalLevel }
  Output: [{ question, options[], answer, explanation, category }]

POST /quiz/score-quiz
  Input: { quizId, answers[] }
  Output: { score, correct_count, total_count }
```

### **Learning Endpoints**
```
POST /learning/material
  Input: { topic, technicalLevel, learningStyle }
  Output: { title, summary, sections[], keyPoints, examples }
```

### **Analysis Endpoints**
```
POST /save-analysis
  Input: { userId, sourceType, skills[], technologies[], technicalLevel }
  Output: { analysisId, message }

GET /analyses
  Output: [{ id, user_id, skills[], weak_areas[], date }]
```

### **PDF/RAG Endpoints**
```
POST /upload (RAG Service)
  Input: FormData with PDF file
  Output: { success, chunkCount, fileId }

POST /chat (RAG Service)
  Input: { message, sessionId }
  Output: { answer, sources[], confidence }

POST /mindmap (RAG Service)
  Output: { nodes[], edges[] } (for @xyflow visualization)
```

---

## 🎨 Frontend Tech Highlights

| Aspect | Technology | Version |
|--------|-----------|---------|
| **Framework** | React | 19.2.4 |
| **Routing** | React Router | 7.13.0 |
| **Authentication** | Clerk | 5.60.0 |
| **Charts** | Recharts | 3.7.0 |
| **Diagrams** | @xyflow/react | 12.10.0 |
| **Icons** | Lucide React | 0.575.0 |
| **PDF Export** | jsPDF | 4.2.1 |
| **Celebrations** | Canvas Confetti | 1.9.4 |

---

## 🔄 Data Flow Summary

```
User Input
  ↓
Frontend Component (React)
  ↓
API Call (fetch/axios)
  ↓
Backend Route (quizRoutes.js)
  ↓
Controller (quizController.js)
  ↓
Service (quizService.js / aiService.js)
  ↓
External API (Gemini/OpenAI) OR Database (PostgreSQL)
  ↓
Response Formation
  ↓
Return to Frontend
  ↓
Component State Update
  ↓
UI Re-render
  ↓
User Sees Result
```

---

## 🧪 Development Workflow

### **To Add a New Feature**

1. **Frontend**
   - Create page in `pages/` or component in `components/`
   - Add service function in `services/learningService.js`
   - Add route in `App.js`

2. **Backend**
   - Create/update service in `services/`
   - Create controller in `controllers/`
   - Create route in `routes/`
   - Mount route in `index.js`

3. **Database** (if needed)
   - Add table/columns in `db/schema.sql`
   - Update service queries

4. **Testing**
   - Test API with Postman/curl
   - Test frontend locally
   - Run docker-compose for full stack

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **GEMINI_API_KEY error** | Check .env file, ensure key is set correctly, restart server |
| **CORS errors** | Verify CORS_ORIGIN matches frontend URL in .env |
| **Database connection fails** | Ensure PostgreSQL is running, credentials are correct |
| **RAG service not responding** | Check if port 5001 is available, service is running |
| **Quiz generation fails** | Verify Gemini API key, check input text length |
| **PDF chat not working** | Ensure OpenAI API key is set, PDF is uploaded first |

---

## 📈 Performance Tips

1. **Caching**: RAG service caches responses for 5 minutes
2. **Chunking**: PDFs are split into chunks for better search
3. **Embeddings**: Vector embeddings enable fast semantic search
4. **Database Indexes**: Created on frequently queried columns
5. **Lazy Loading**: Components load data on demand

---

## 🔐 Security Best Practices

✅ API keys in environment variables (not in code)  
✅ CORS restricted to specific origins  
✅ Input validation in controllers  
✅ Error handling with sanitized messages  
✅ Database queries with parameterized statements  
✅ Authentication via Clerk (industry standard)

---

## 📚 Learning Resources

- **React Documentation**: https://react.dev
- **Express.js Guide**: https://expressjs.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Google Gemini API**: https://ai.google.dev/
- **OpenAI API**: https://platform.openai.com/docs/
- **Docker Guide**: https://docs.docker.com/

---

## 📞 Quick Debugging

**Check Backend Health**:
```bash
curl http://localhost:5000/health
```

**Check RAG Service Health**:
```bash
curl http://localhost:5001/health
```

**View Database**:
- Access PgAdmin: http://localhost:5050
- Login: admin@rag-pdf.local / admin

**Check Logs**:
- Frontend: Browser console (F12)
- Backend: Terminal output
- RAG Service: Terminal output

---

## 🎓 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 100+ |
| **Total Lines of Code** | 50,000+ |
| **Frontend Components** | 30+ |
| **Backend Routes** | 20+ |
| **Database Tables** | 6 |
| **External APIs** | 4 (GitHub, Gemini, OpenAI, Clerk) |
| **Technologies** | 20+ |

---

## 🚀 Deployment Notes

### **To Deploy**
1. Set production environment variables
2. Build React: `npm run build` in frontend/
3. Update CORS_ORIGIN to production domain
4. Use PostgreSQL cloud database
5. Deploy backend to Node.js hosting (Heroku, Railway, Render)
6. Deploy frontend to static hosting (Vercel, Netlify)
7. Deploy RAG service to same Node.js hosting

### **Recommended Hosting**
- Frontend: Vercel, Netlify
- Backend: Heroku, Railway, Render
- Database: Supabase, AWS RDS
- RAG Service: Same as backend

---

**Last Updated**: April 3, 2026  
**Version**: 1.0


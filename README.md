# SecureRAG AI — Enterprise Fullstack Application

**SecureRAG AI** is an enterprise AI knowledge assistant powered by Retrieval-Augmented Generation (RAG) with multi-tenant governance, Zero-Trust Role-Based Access Control (RBAC), Qdrant vector semantic search, Gemini AI answer generation, and immutable audit logging.

- **Phase 1**: Frontend SaaS dashboard, responsive layout, interactive chat, document previewers, and RBAC matrix.
- **Phase 2**: Full backend infrastructure with Node.js, Express, MongoDB (Mongoose), JWT authentication, multi-tenant organization isolation, document metadata CRUD, and server-side audit logs.
- **Phase 3**: Real RAG pipeline with PDF text extraction (`pdf-parse`), sliding-window chunking, vector embeddings (`text-embedding-004`), Qdrant vector database indexing, Gemini API (`gemini-2.5-flash`), permission-filtered retrieval, and ground-truth source citations.

---

## 🏗 Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React, Recharts, React Router DOM v7
- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: MongoDB with Mongoose (with automated in-memory MongoDB fallback for instant zero-dependency local runs)
- **Vector Database**: Qdrant client (`@qdrant/js-client-rest`) with built-in resilient in-memory vector engine fallback
- **AI Models**: Google GenAI SDK (`@google/genai`) with `gemini-2.5-flash` and `text-embedding-004`
- **PDF Extraction**: `pdf-parse` with page numbering, paragraph preservation, and `pdf-lib` test generators
- **Authentication**: JWT access tokens + HttpOnly session cookies
- **Password Security**: bcrypt password hashing (10 rounds)
- **Security**: Helmet, CORS with credentials, express-rate-limit, input validation
- **Testing**: Node.js native test runner (`node --test`) + Supertest (18 passing tests)

---

## 📁 Project Architecture

```
secureRAG/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection with zero-config memory server fallback
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     # Login, register, me, logout
│   │   │   ├── user.controller.js     # User management & privilege escalation guards
│   │   │   ├── organization.controller.js # Multi-tenant isolation & workspace CRUD
│   │   │   ├── document.controller.js # Real PDF upload, extraction, chunking, status, reindexing
│   │   │   ├── chat.controller.js     # RAG query, permission-aware retrieval, Gemini answer generation
│   │   │   ├── audit.controller.js    # Immutable audit logging & CSV stream export
│   │   │   └── dashboard.controller.js# Real MongoDB aggregated KPIs and activities
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT Bearer and cookie verification
│   │   │   ├── role.middleware.js     # authorizeRoles & enforceTenantIsolation
│   │   │   ├── upload.middleware.js   # Multer file upload with PDF signature verification
│   │   │   └── error.middleware.js    # Centralized error handler & 404 handler
│   │   ├── models/
│   │   │   ├── User.js                # User schema with bcrypt comparison & toSafeObject()
│   │   │   ├── Organization.js        # Multi-tenant workspace schema
│   │   │   ├── Document.js            # Document metadata & storage keys schema
│   │   │   ├── Conversation.js        # Chat history with grounded citations schema
│   │   │   └── AuditLog.js            # Server-generated audit trail schema
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── organization.routes.js
│   │   │   ├── document.routes.js     # Upload, status, reindex, delete
│   │   │   ├── chat.routes.js         # Ask question, conversation CRUD
│   │   │   ├── audit.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── services/
│   │   │   ├── pdf.service.js         # PDF text extraction and cleaning
│   │   │   ├── chunking.service.js    # Sliding window token chunking with page retention
│   │   │   ├── embedding.service.js   # text-embedding-004 & vector normalization
│   │   │   ├── qdrant.service.js      # Qdrant vector index with tenant filter
│   │   │   └── gemini.service.js      # Gemini answer generation with grounding system prompt
│   │   ├── utils/
│   │   │   ├── auditService.js        # Helper to generate tamper-proof audit records
│   │   │   └── seed.js                # Initial database bootstrapping & vector indexing
│   │   ├── app.js                     # Express app setup (Helmet, CORS, rate-limiting)
│   │   └── server.js                  # Server entry point
│   ├── tests/
│   │   └── api.test.js                # Automated test suite (18 passing tests)
│   ├── .env.example
│   └── package.json
├── src/                               # React frontend
│   ├── components/
│   │   ├── chat/                      # Grounded citation drawer & chat messages
│   │   └── documents/                 # PDF upload modal & document viewer
│   ├── context/
│   │   └── AppContext.jsx             # Synchronized with live Backend APIs & RAG chat
│   ├── pages/
│   │   ├── Chat.jsx                   # Live AI Document Assistant with Qdrant + Gemini
│   │   ├── Documents.jsx              # Real PDF upload, classification, and status
│   │   ├── Dashboard.jsx
│   │   └── Login.jsx
│   └── utils/
│       └── api.js                     # Reusable fullstack API client with FormData support
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)
- *(Optional)* Gemini API Key (`GEMINI_API_KEY`)
- *(Optional)* Local Qdrant instance or Qdrant Cloud URL (`QDRANT_URL`)

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:
```bash
PORT=5000
MONGODB_URI=
JWT_SECRET=securerag_jwt_super_secret_enterprise_token_key_2026_xyz!@#
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Vector & Embeddings Configuration
EMBEDDING_MODEL=text-embedding-004
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=securerag_chunks

# Storage & Retrieval Parameters
UPLOAD_DIR=storage/uploads
MAX_UPLOAD_SIZE_MB=10
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.20
```
*(Leave `MONGODB_URI` blank to run with the automatic in-memory MongoDB server. If `GEMINI_API_KEY` or `QDRANT_URL` are not provided, the system automatically uses its built-in resilient vector engine and grounded synthesis generator so the application operates seamlessly without external paid services).*

### 3. Running Backend and Frontend

In your terminal:
```bash
# Terminal 1: Start Backend (Port 5000)
cd backend
npm install
npm start
```

```bash
# Terminal 2: Start Frontend (Port 5173)
cd ..
npm install
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 👥 Default Bootstrapped Demo Accounts

The database is pre-seeded with 3 realistic enterprise personas:

| Name | Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Connor** | **Admin** | `admin@novacorp.com` | `SecurePass123!` | All Documents (Public, Internal, Confidential, Restricted), User & Org Administration |
| **David Vance** | **Manager** | `manager@novacorp.com` | `SecurePass123!` | Public, Internal, Confidential Documents |
| **Elena Rostova** | **Employee** | `elena@novacorp.com` | `SecurePass123!` | Public and Internal Documents only *(Restricted files trigger RBAC access denial)* |

---

## 🛡️ Implemented Phase 3 RAG APIs

### AI Document Chat (`/api/chat`)
- `POST /api/chat/ask`: Submits user query. Authenticates user, applies RBAC document clearance, generates question embedding, retrieves authorized passages from Qdrant, calls Gemini with grounded system instruction, returns answer with verified citations, and logs audit record.
- `GET /api/chat/conversations`: Returns list of user's active conversations.
- `GET /api/chat/conversations/:id`: Fetches conversation message history. Enforces strict user ownership checks.
- `DELETE /api/chat/conversations/:id`: Deletes conversation.

### Document Ingestion & Vector Management (`/api/documents`)
- `POST /api/documents/upload`: Multipart upload for PDFs. Validates file header (`%PDF-`), size limit, extracts text, chunks into sliding windows, computes embeddings, and indexes in Qdrant.
- `GET /api/documents/:id/status`: Inspects document processing and vectorization status.
- `POST /api/documents/:id/reindex`: Re-indexes document vectors.
- `DELETE /api/documents/:id`: Coordinated deletion across MongoDB, disk storage, and Qdrant vectors.

---

## 🧪 Automated Testing & Evaluation

### 1. Functional & Security Unit Tests (19 Passing Tests)
```bash
npm run backend:test
```
Covers:
- Health check endpoints
- Authentication & JWT cookie verification
- Role-based authorization & clearance enforcement
- Real PDF upload validation, corrupted PDF rejection (`%PDF-` signature check), and text chunking
- RAG semantic search and citation verification
- Prompt injection heuristic defenses (intercepted with 400 Security Notice)
- Cross-tenant data isolation (Organization A cannot access Organization B documents)
- Private chat conversation ownership isolation
- Tamper-evident audit logging with SHA-256 integrity hashing and RFC-4180 CSV export

### 2. RAG Quality & Security Benchmark Evaluation
Run the automated evaluation benchmark across the 8-case test dataset:
```bash
npm run backend:eval
```
**Benchmark Results**:
```
┌───────────────────────┬──────────┐
│ Metric                │ Score    │
├───────────────────────┼──────────┤
│ Total Test Cases      │ 8        │
│ Overall Pass Rate     │ 100.0%   │
│ Retrieval Precision@K │ 100.0%   │
│ Citation Correctness  │ 100.0%   │
│ Abstention Accuracy   │ 100.0%   │
│ Unauthorized Leaks    │ 0        │
│ Average Latency       │ 16 ms    │
└───────────────────────┴──────────┘
```

---

## 🔒 Security Model & Defenses

1. **Prompt Injection Hardening**: Questions are evaluated against heuristic pattern matchers (`ignore previous instructions`, `reveal system prompt`, etc.) and immediately rejected with audit logging before invoking retrieval or LLM execution.
2. **Context Grounding Boundary**: Chunks are treated as untrusted data wrapped in structured passage blocks. The system instruction strictly prohibits document text from acting as executive instructions.
3. **Zero-Trust Retrieval Scoping**: Organization and role clearance filters are injected directly into vector queries. Chunks from unauthorized documents are never presented to the LLM.
4. **Anti-Hallucination Citation Pruning**: If the model abstains or indicates insufficient evidence, citations are automatically pruned to prevent misleading source attribution.
5. **Tamper-Evident Audit Logging**: Each audit entry calculates a SHA-256 integrity hash across actor, organization, action, resource, IP address, and details. Requests carry correlated `X-Request-Id` headers.
6. **Rate Limiting Protection**: Dedicated rate limiters guard against brute-force attacks on `/api/auth/login` (20 req / 15 min), chat denial-of-service on `/api/chat/ask` (30 req / min), and upload flooding on `/api/documents/upload` (50 req / 15 min).


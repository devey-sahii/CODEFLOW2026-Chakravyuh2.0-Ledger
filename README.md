# SMART EXPENSE AUDITOR 🤖💰

> **AI-Powered Autonomous Expense Auditing Platform** — Detect fake invoices, automate GST compliance, and eliminate reimbursement fraud in real time.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)](https://redis.io)

---

## 🚀 Features

- **AI Receipt OCR** — Automatically extract vendor, GSTIN, invoice data from receipts
- **Real-time Fraud Detection** — Detect duplicate invoices, edited receipts, fake GSTINs, overbilling
- **GST Compliance** — Validate GSTINs, check ITC eligibility, track filing history
- **Risk Scoring Engine** — Composite risk scores for employees, vendors, and organizations
- **Enterprise Analytics** — Spending trends, department breakdowns, fraud patterns
- **Role-Based Access Control** — Employee, Finance Manager, Auditor, Admin roles
- **Audit Trail** — Immutable audit logs for all actions and AI decisions

---

## 📁 Project Structure

```
LEDGER/
├── frontend/          # Next.js 15 App (TypeScript + Tailwind)
├── backend/           # FastAPI Python App
│   ├── app/
│   │   ├── api/v1/    # REST API routes
│   │   ├── core/      # Config, security, database
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic
│   ├── prisma/        # Database schema
│   └── scripts/       # DB init + seed
└── docker-compose.yml
```

---

## 🛠 Prerequisites

- Node.js 20+
- Python 3.11+
- Docker + Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)

---

## ⚡ Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone <repo-url>
cd LEDGER

# Start all services
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/docs
# pgAdmin: http://localhost:5050
```

### Option 2: Local Development

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL and Redis credentials

# Run database migrations (make sure PostgreSQL is running)
python scripts/seed.py  # Seed with demo data

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Start development server
npm run dev
```

---

## 🔐 Demo Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techcorp.in | Demo@1234 |
| Finance Manager | finance@techcorp.in | Demo@1234 |
| Auditor | auditor@techcorp.in | Demo@1234 |
| Employee | employee@techcorp.in | Demo@1234 |

---

## 🌐 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Key Endpoints

```
POST   /api/v1/auth/register         Register new user + organization
POST   /api/v1/auth/login            Login and get JWT tokens
POST   /api/v1/expenses/upload       Upload receipt for OCR + AI analysis
GET    /api/v1/expenses              List all expenses with filters
GET    /api/v1/fraud/reports         List fraud reports
GET    /api/v1/gst/validate/{gstin}  Validate GSTIN
GET    /api/v1/analytics/overview    Full analytics dashboard data
GET    /api/v1/dashboard/stats       Dashboard KPI statistics
```

---

## 🏗 Tech Stack

### Frontend
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + custom design system
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Zustand** for state management
- **React Query** for server state
- **React Hook Form** + Zod for forms

### Backend
- **FastAPI** (Python 3.11)
- **SQLAlchemy 2.0** (async)
- **PostgreSQL 15** (primary database)
- **Redis 7** (caching + sessions)
- **JWT** authentication with refresh tokens
- **bcrypt** password hashing
- **AES-256** data encryption

### Infrastructure
- **Docker** + Docker Compose
- Kubernetes-ready architecture
- AWS S3 compatible file storage

---

## 🔒 Security

- JWT access + refresh token authentication
- bcrypt password hashing (cost factor 12)
- AES-256 encryption for sensitive data
- Role-Based Access Control (RBAC)
- Rate limiting (200 req/min default)
- Security headers (XSS, CSRF, clickjacking protection)
- SQL injection prevention via ORM
- Immutable audit trails

---

## 📊 Database Schema

See `backend/prisma/schema.prisma` for the complete database schema including:
- Organizations, Users, Employees
- Expense Claims, Receipts
- Vendors, Fraud Reports
- GST Validations, Audit Logs
- Notifications, API Keys, Expense Policies

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤️ for Indian enterprises</strong><br>
  <em>Smart Expense Auditor — Stop Fraud. Stay Compliant. Save Millions.</em>
</div>
# CODEFLOW2026-Chakravyuh2.0-Ledger

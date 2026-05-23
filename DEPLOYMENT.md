# Deployment Guide: Vercel Monorepo Setup

This guide walks you through deploying the SMART EXPENSE AUDITOR (Next.js Frontend + FastAPI Backend) to a single Vercel project domain.

## Project Architecture on Vercel

Vercel utilizes the explicit `vercel.json` builds property to build the frontend and backend simultaneously:

1. **Frontend**: Built using `@vercel/next` from `frontend/package.json`.
2. **Backend**: Built using `@vercel/python` from `backend/index.py`. Vercel automatically detects `backend/requirements.txt` to install Python dependencies.
3. **Routing**: All traffic starting with `/api/*` (as well as `/docs`, `/redoc`, and `/openapi.json`) is routed to the FastAPI app. All other traffic (`/*`) is routed to the Next.js app.

## Deployment Steps

1. **Push to GitHub**:
   Ensure all changes (including the `vercel.json` file and `backend/index.py`) are pushed to your GitHub repository.

2. **Import Project to Vercel**:
   - Go to your Vercel Dashboard.
   - Click **Add New...** -> **Project**.
   - Select your GitHub repository.

3. **Configure Project Details**:
   - **Framework Preset**: Leave as **Other** (Vercel will automatically use Next.js for the frontend because of our `vercel.json` config).
   - **Root Directory**: **LEAVE AS ROOT (`./`)**. Do *not* select `frontend/` or `backend/`. The `vercel.json` at the root handles the specific directories.
   - **Build Command**: Leave blank (Vercel uses defaults).
   - **Install Command**: Leave blank.
   - **Output Directory**: Leave blank.

4. **Set Environment Variables**:
   Open the **Environment Variables** tab and add all necessary keys for both frontend and backend. 

   *For the Backend (FastAPI):*
   - `DATABASE_URL` (Your PostgreSQL connection string)
   - `JWT_SECRET`
   - `JWT_ALGORITHM`
   - `OPENAI_API_KEY` (if applicable)

   *For the Frontend (Next.js):*
   - `NEXT_PUBLIC_API_URL` (Set this to `/api/v1` since both are on the same domain!)

5. **Deploy**:
   Click **Deploy**. Vercel will install npm dependencies for the frontend, pip dependencies for the backend, and deploy them together!

## Troubleshooting & Production Fixes

### 1. Database Connection Errors (Prisma / SQLAlchemy)
Vercel Serverless functions spin up and down rapidly, which can exhaust database connections. 
- Ensure you are using a connection pooler like **Supabase Pooling**, **Prisma Accelerate**, or **PgBouncer** in your database URL.

### 2. Large Python Lambda Size
Vercel has a 250MB limit (unzipped) for Serverless Functions. If your `requirements.txt` contains large libraries (like PyTorch, TensorFlow, or Pandas), your build will fail with `Max Lambda Size Exceeded`.
- **Fix**: Remove heavy ML libraries from `requirements.txt` and use external APIs (e.g., OpenAI API) instead of running heavy ML models directly inside the Vercel Lambda.

### 3. Missing Python Modules
If you see an error like `ModuleNotFoundError: No module named 'app'`, ensure that `backend/index.py` exists and is properly importing the FastAPI app from `app.main`. Vercel sets the current working directory to the folder containing `index.py`.

### 4. API 404 Errors
Ensure that your `NEXT_PUBLIC_API_URL` environment variable does NOT include the full domain name in production. Because they share the same domain, it should just be:
`NEXT_PUBLIC_API_URL=/api/v1`

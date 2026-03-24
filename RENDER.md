# Render Deployment Guide: StreetVendor BD

Since this project has a separate `frontend` and `backend`, you need to configure **two separate services** on Render to make it work correctly.

## 1. Deploy the Backend (API)
- **Service Type**: Web Service
- **Name**: `streetvendor-api`
- **Root Directory**: `backend`  <-- **CRITICAL STEP**
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `PORT`: `10000` (or leave default)
  - `SUPABASE_URL`: (Your Supabase URL)
  - `SUPABASE_KEY`: (Your Supabase Anon/Service Key)
  - `DATABASE_URL`: (Your Postgres Connection String)

## 2. Deploy the Frontend (Web App)
- **Service Type**: Static Site
- **Name**: `streetvendor-web`
- **Root Directory**: `frontend` <-- **CRITICAL STEP**
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: (The URL of your **deployed** Backend service)
  - `VITE_SUPABASE_URL`: (Your Supabase URL)
  - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)

---

### Why did the previous deploy fail?
Render was looking for a `package.json` in the root folder, but it's actually inside the `backend/` and `frontend/` folders. By setting the **Root Directory** in Render settings, you tell Render exactly where to look.

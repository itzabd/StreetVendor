# Render Deployment Guide: StreetVendor BD

Since this project has a separate `frontend` and `backend`, you need to configure **two separate services** on Render to make it work correctly.

## 1. Deploy the Backend (API)
- **Service Type**: Web Service
- **Name**: `streetvendor-api`
- **Root Directory**: `backend`  <-- **CRITICAL STEP**
- **Build Command**: `npm install` (Use `npm` to avoid conflicts with `package-lock.json`)
- **Start Command**: `node server.js` (or `npm start`)
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

---

### Why did I see a "package-lock.json" warning?
This warning happens because Render's default environment uses **Yarn**, but your project was originally built with **npm** (which created the `package-lock.json` files). 

**Mixing them is risky.** To fix it:
1. Always use **`npm install`** and **`npm start`** in your Render settings.
2. If Render still warns you, it's just a heads-up that it detected the npm lockfile while its own default is Yarn. As long as your Build/Start commands use `npm`, it will work perfectly.

### Why did the previous deploy fail?
Render was looking for a `package.json` in the root folder, but it's actually inside the `backend/` and `frontend/` folders. By setting the **Root Directory** in Render settings, you tell Render exactly where to look.

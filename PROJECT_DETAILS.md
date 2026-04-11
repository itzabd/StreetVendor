# StreetVendor BD Project Overview

StreetVendor is a comprehensive platform designed for managing and crowdsourcing street vendor locations in Bangladesh. It features an interactive map for public reporting, a vendor application system, and an administrative dashboard for zone management, spot assignment, and permit tracking.

## 🚀 Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **State Management**: React Context API
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Database Client**: [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction)
- **Styling**: Vanilla CSS (Global and Component-based)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database Client**: [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction)
- **Environment**: [dotenv](https://www.npmjs.com/package/dotenv)
- **Cross-Origin**: [CORS](https://www.npmjs.com/package/cors)

### Database
- **Provider**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Schema**: Defined in [schema.sql](file:///f:/StreetVendor/schema.sql)

---

## 🛠️ Local Setup Guide

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [NPM](https://www.npmjs.com/)
- Postman (for testing API endpoints)

### 2. Clone the Repository
```bash
git clone <repository-url>
cd StreetVendor
```

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Fill in your Supabase credentials in `.env`:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```
   *The server will run on [http://localhost:5000](http://localhost:5000)*

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Configure the API URL and Supabase credentials in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Start the frontend:
   ```bash
   npm run dev
   ```
   *The app will be available on [http://localhost:5173](http://localhost:5173)*

---

## 🖥️ Running in VS Code (No Terminal Needed)

If you prefer not to use the terminal/bash, follow these VS Code UI methods:

### Method 1: NPM Scripts View (Recommended)
1. On the left sidebar of VS Code, look for the **Explorer** tab.
2. At the bottom of the Explorer panel, you will see a section called **NPM SCRIPTS**.
3. Open the `backend` folder under NPM Scripts and click the **Run** icon next to `dev`.
4. Open the `frontend` folder under NPM Scripts and click the **Run** icon next to `dev`.
   *This will open two small internal terminals automatically.*

### Method 2: One-Click "Run and Debug" (F5)
1. Press `Ctrl + Shift + D` (or click the Play icon with a bug on the left sidebar).
2. At the top of the panel, click the dropdown menu and select **"Run Full Project"**.
3. Click the green **Play** button (or press `F5`).
   *This will launch both the backend and frontend simultaneously.*

---

## 📁 Project Structure Breakdown

### Backend (`/backend`)
- **[server.js](file:///f:/StreetVendor/backend/server.js)**: Entry point that initializes Express, registers middleware, and defines API route prefixes.
- **`/routes`**: Defines API endpoints for each module:
  - `auth`: User registration and login.
  - `vendors`: Vendor profile management.
  - `zones` / `blocks` / `spots`: Geographic location management.
  - `applications`: Vendor spot application workflow.
  - `assignments`: Mapping vendors to specific spots.
  - `compliant` / `rent`: Dispute handling and payment tracking.
- **`/controllers`**: Contains the business logic for each route, interacting directly with Supabase.
- **`/middleware`**: Handles authentication verification and request validation.

### Frontend (`/frontend/src`)
- **[App.jsx](file:///f:/StreetVendor/frontend/src/App.jsx)**: Main component handling routing, layout, and global context providers.
- **`/pages`**: Full-view components representing different routes:
  - `LandingPage.jsx`: Public home page with reporting features.
  - `VendorDashboard.jsx`: Dashboard for registered vendors.
  - `AdminDashboard.jsx`: Central control for administrators.
  - `Login.jsx` / `Register.jsx`: Authentication views.
- **`/components`**: Reusable UI parts:
  - `Navbar.jsx` / `Sidebar.jsx`: Navigation elements.
  - `ZoneMap.jsx`: Interactive map for visualization and reporting.
  - `ProtectedRoute.jsx`: Component to guard private routes.
- **`/context`**: Global state management:
  - `AuthContext.jsx`: Manages user sessions and permissions.
  - `ToastContext.jsx`: Handles global notification alerts.

### Root Files
- **[schema.sql](file:///f:/StreetVendor/schema.sql)**: SQL commands to replicate the database structure.
- **[RENDER.md](file:///f:/StreetVendor/RENDER.md)**: Steps specifically for deploying to Render.com.

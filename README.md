# CBT Master - Standalone Backend API

A production-ready Node.js, Express, TypeScript, and Prisma backend API for CBT Master.

---

## 🚀 Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   Create `.env` based on `.env.example`:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   SUPABASE_URL="https://..."
   SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."
   PAYSTACK_SECRET_KEY="..."
   PAYSTACK_PUBLIC_KEY="..."
   ```

3. **Generate Prisma Client & Seed Database:**
   ```bash
   npx prisma generate
   npm run seed
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```
   The API will start at `http://localhost:5000`. Test health: `http://localhost:5000/health`.

---

## 🌐 Deploying Live

You can host this backend completely independently from the Flutter client.

### Option A: Deploy on Render (Recommended, Free / Easy)

1. Go to [render.com](https://render.com) and create a **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In the **Environment Variables** tab, add:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Your Supabase connection pooler URL)*
   - `DIRECT_URL`: *(Your Supabase direct connection URL)*
   - `SUPABASE_URL`: *(Your Supabase URL)*
   - `SUPABASE_ANON_KEY`: *(Your Supabase Anon Key)*
   - `SUPABASE_SERVICE_ROLE_KEY`: *(Your Supabase Service Role Key)*
   - `PAYSTACK_SECRET_KEY`: *(Your Paystack Secret Key)*
   - `PAYSTACK_PUBLIC_KEY`: *(Your Paystack Public Key)*
5. Click **Deploy Web Service**.
6. Once deployed, copy your service URL (e.g., `https://cbt-master-api.onrender.com`).

---

### Option B: Deploy on Railway

1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo**.
3. Under Service **Settings** &rarr; **Root Directory**, set `/backend`.
4. Railway will automatically detect Node.js, run `npm install`, `npm run build`, and `npm start`.
5. Add your environment variables in the **Variables** tab.
6. Generate a domain under **Networking**.

---

### Option C: Deploy with Docker

A production multi-stage `Dockerfile` is included. To build and run:
```bash
docker build -t cbt-master-backend .
docker run -p 5000:5000 --env-file .env cbt-master-backend
```

---

## 📱 Connecting the Flutter App

Once your backend is live (for example at `https://cbt-master-api.onrender.com`):

Open `lib/data/services/api_service.dart` in the Flutter project and set:
```dart
static const String? liveBaseUrl = 'https://cbt-master-api.onrender.com';
```
When `liveBaseUrl` is set, the Flutter app will immediately route all requests to your cloud server.

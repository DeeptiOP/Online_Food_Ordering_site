# Momo Delights

The active app is a Next.js App Router application with React pages and server-side route handlers. It retains the existing storefront styles, colors, food photos, catalog, and shopping/account flows. The original Flask source remains under `momo/` as a migration reference; it is no longer the production entry point.

## Run locally

Requirements: Node.js 20.19 or newer and a MongoDB database (local or MongoDB Atlas).

```powershell
npm ci
Copy-Item .env.example .env.local
```

Set `SESSION_SECRET` to a random secret, set `MONGODB_URI` (and, optionally, `MONGODB_DB`), and set `ADMIN_EMAIL` to the email address of the registered account that should manage the catalog in `.env.local`, then start the app:

```powershell
npm run dev
```

Open `http://localhost:3000`. The app creates the MongoDB indexes for users and orders when a database-backed feature first connects. For a local MongoDB server, the example URI is `mongodb://127.0.0.1:27017/momo_delights`; for Atlas, use the connection string from your cluster and allow the app's network to connect.

The active Next.js app now stores users, orders, and contact submissions in MongoDB. It does not automatically copy records from the retired MySQL/Flask app under `momo/`; export and migrate any MySQL records you need before switching.

## Admin dashboard

Register a normal account using the email configured in `ADMIN_EMAIL`, then log in and open `/admin`. The dashboard supports adding, editing, and deleting products and categories. Admin permissions are checked against the account email in MongoDB on both dashboard requests and every admin API call. Products and categories are stored in the `products` and `categories` collections; the existing menu is seeded once on first use. A category cannot be deleted while products still use it.

## Deploy

Vercel is the simplest deployment target for Next.js:

1. Push this project to GitHub and import the repository into Vercel. Keep the project root set to the repository root.
2. Add `SESSION_SECRET` (at least 32 random characters), `MONGODB_URI`, `ADMIN_EMAIL`, and optionally `MONGODB_DB` in Vercel project settings.
3. Use MongoDB Atlas or another managed MongoDB provider and allow connections from the deployed app.
4. Deploy. Vercel detects the root `package.json` and builds the Next.js app automatically.
5. Test registration, sign-in, cart updates, checkout, profile history, and contact form against the production database.

Render is also configured via `render.yaml`; create a Blueprint from the repository and provide the database environment variables when prompted.

## Database setup

Indexes are created automatically when the app first connects. To explicitly verify connectivity and initialize indexes, set `INIT_DB=true` and a temporary `INIT_DB_TOKEN`, then send:

```powershell
Invoke-RestMethod -Method Post -Uri https://YOUR-HOST/api/init-db -Headers @{ Authorization = "Bearer YOUR_INIT_DB_TOKEN" }
```

Disable and remove both setup variables immediately afterward. Back up your MongoDB database before deploying data or index changes.

## Checks

```powershell
npm run typecheck
npm run build
```

`momo/` contains the retired Flask/MySQL version and its Python requirements. Use the root Node.js/MongoDB app for development and deployment.

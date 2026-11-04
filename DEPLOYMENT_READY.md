# Deployment checklist

The project has been migrated to Next.js. The root `package.json` and `render.yaml` are the active application/deployment configuration; the old Flask app under `momo/` is retained only as a reference.

Before deploying:

- Rotate any MySQL or Cloudinary credentials that were previously stored in environment example files or repository history. The example files are now placeholders, but that does not remove values from old commits.
- Provision a reachable MongoDB database and back it up before the first deployment.
- Configure `SESSION_SECRET` with at least 32 random characters, `MONGODB_URI`, `ADMIN_EMAIL`, and optionally `MONGODB_DB` in the hosting provider.
- Import the repository root as the Next.js project. Do not deploy the old static Netlify configuration or the Flask app in `momo/`.
- After deployment, smoke-test all public pages and database-backed registration, login, cart, checkout, profile, and contact flows.

Register and log in with the account matching `ADMIN_EMAIL` to smoke-test `/admin` product and category management. The Next.js build and type-check commands are `npm run build` and `npm run typecheck`. A successful build alone does not verify MongoDB connectivity.

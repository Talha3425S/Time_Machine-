# Portfolio deployment

This repository is prepared for a two-service portfolio deployment:

- **Vercel** hosts the Next.js app from `apps/web`.
- **Render** hosts the NestJS API, PostgreSQL, and Redis-compatible Key Value store through `render.yaml`.

Both hosts should be connected directly to the GitHub repository. A push to `main` then builds and deploys the corresponding service; GitHub Actions only verifies the API and web production builds.

## 1. Deploy the API on Render

1. In Render, choose **New > Blueprint** and select this GitHub repository.
2. Render reads `render.yaml` and creates the API, database, and cache.
3. During setup, provide the requested values. Do not commit them to Git:
   - `FRONTEND_URL`: the final Vercel URL, for example `https://software-time-machine.vercel.app`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_CALLBACK_URL`: `https://<your-render-api>.onrender.com/auth/github/callback`
4. Wait until the Render health check at `/health` reports healthy. Migrations run automatically on startup.

## 2. Configure GitHub OAuth

In the GitHub OAuth App settings, set the Authorization callback URL to the deployed API callback URL from step 1. The callback must match exactly, including `https` and no trailing slash.

## 3. Deploy the dashboard on Vercel

1. Import the same GitHub repository in Vercel.
2. Set the **Root Directory** to `apps/web`.
3. Add this production environment variable before deploying:

   ```text
   NEXT_PUBLIC_API_URL=https://<your-render-api>.onrender.com
   ```

4. Deploy, then copy the Vercel production URL into Render's `FRONTEND_URL` value and redeploy the API.

## 4. Portfolio-demo checks

1. Open the Vercel URL and sign in with GitHub.
2. Create a test organization and project.
3. Confirm the browser Network tab calls the Render API, never `localhost`.
4. Visit `https://<your-render-api>.onrender.com/health` and confirm it returns `{ "status": "ok" }`.

## Local-only features

The local agent and Docker Sandbox experiments require a developer machine with a repository checkout and `sbx` installed. They remain usable for your personal demonstration, but visitors to the public dashboard cannot run them against their own computers.

## Security note

This is suitable for a portfolio demo after the deployment configuration is completed. Do not use it for customer data until organization/project authorization checks, secure GitHub-token storage, rate limiting, audit logging, and a privacy policy have been completed.

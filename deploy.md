# Deployment Setup

## 1. Important

The Hugging Face access token that was shared in chat should be revoked and recreated immediately. Treat it as compromised.

## 2. Frontend on Vercel

Create a Vercel project with the root directory set to `frontend`.

Set this environment variable in Vercel:

- `VITE_API_BASE_URL=https://your-space-name.hf.space/api`

Build settings:

- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

## 3. Backend on Hugging Face Spaces

Create a new Docker Space and point Jenkins to the Space repository.

Set these Hugging Face Space secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`
- `VITE_APP_URL`
- `ALLOWED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `VITE_YOUTUBE_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Recommended production values:

- `VITE_APP_URL=https://your-vercel-domain.vercel.app`
- `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://your-custom-domain`

## 4. Jenkins Credentials

Create these credentials in Jenkins:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `HF_TOKEN`
- `HF_SPACE_REPO`

For `HF_SPACE_REPO`, use the value in the form `username/space-name`.

## 5. Jenkins Job

Create a Pipeline job pointed at this GitHub repository and enable GitHub webhook or polling.

Webhook flow:

- GitHub push to `main`
- Jenkins runs `Jenkinsfile`
- Jenkins deploys frontend to Vercel
- Jenkins syncs `backend/` to the Hugging Face Space repo
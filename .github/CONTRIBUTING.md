# Contributing / Deploy Setup

## CI

`ci.yml` runs on every push and PR to `main`:

- **web**: `npm ci`, lint, prettier check, build
- **functions**: same in `functions/`

No secrets needed.

## Deploy

`deploy.yml` runs on push to `main` and deploys Hosting + Functions + Firestore rules to `nwk-app-ba6f8`.

### One-time setup (required before first deploy)

1. **Create a Firebase service account** with deploy permissions
   - Open https://console.firebase.google.com/project/nwk-app-ba6f8/settings/serviceaccounts/adminsdk
   - Click **Generate new private key** → download the JSON
2. **Add the JSON to GitHub secrets**
   - GitHub repo → Settings → Secrets and variables → Actions → New repository secret
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: the entire JSON file contents (paste raw)
3. **Create the `production` GitHub environment** (optional but recommended)
   - GitHub repo → Settings → Environments → New environment → `production`
   - Add required reviewers if you want manual approval before deploy
4. **Enable required Google Cloud APIs** (usually auto-enabled by Firebase, but verify)
   - Cloud Functions API, Cloud Build API, Artifact Registry API
5. **Set runtime secrets** for Functions (server-side keys never go in env vars)
   ```
   firebase functions:secrets:set TOUR_API_KEY
   firebase functions:secrets:set KAKAO_REST_API_KEY
   ```

### Required Firebase plan

Functions deploy requires the **Blaze (pay-as-you-go)** plan. Free tier covers a lot — you generally won't be billed for early-stage usage.

# GitHub Pages deployment

The `main` branch automatically builds and deploys this Vite application to GitHub Pages. The workflow builds for the repository path (`/medframe-studio/`) and creates a `404.html` fallback so direct doctor URLs work after a refresh.

## One-time GitHub setup

1. Open the repository **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
2. The repository is private. GitHub Pages for private repositories requires a plan that includes private Pages hosting. On GitHub Free, Pages requires making this repository public; that exposes its source code. Do not change visibility unless that is intended.
3. After enabling Pages, open **Actions** and confirm **Build and deploy to GitHub Pages** completes. The published address will be `https://mmha42472-afk.github.io/medframe-studio/`.
4. In Firebase Authentication, add `mmha42472-afk.github.io` to **Authorized domains**.
5. Deploy `firestore.rules` to Firebase project `drwep-20c36`. Create the admin custom claim through the trusted procedure in [firebase-admin-bootstrap.md](firebase-admin-bootstrap.md).

The Firebase Web SDK settings in `.env.example` are public client configuration and are bundled into the static site by the workflow. Never add a Firebase Admin SDK service-account key to the repository or workflow.

Every push to `main` starts a new build and deployment. GitHub Pages hosts the static client; Firestore and Firebase Authentication remain hosted by Firebase.

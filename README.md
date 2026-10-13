# MedFrame Studio

**Your Expertise. Your Identity.**

A secure workspace for the MedFrame Studio team to manage doctors' public websites, content workflows, and reporting.

The app can deploy from GitHub Actions to GitHub Pages. See [GitHub Pages deployment](docs/github-pages.md) for the one-time setup and Firebase requirements.

## Product principles

- Preserve the existing Firebase project and records.
- Authenticate administrators with Firebase Authentication and verify an administrator custom claim.
- Expose only published doctor profiles publicly.
- Keep drafts private and make new profiles start unpublished.
- Use Vercel SPA rewrites for refresh-safe doctor URLs.
- Never represent local demo data or unconnected integrations as live production data.

## Development

The app uses React, TypeScript, Vite, Firebase, and Vercel. Copy `.env.example` to `.env.local` and supply the Firebase web app configuration in your local environment. Do not commit real values.

```sh
npm ci
npm run lint
npm run build
```

## Firebase administrator bootstrap

See [docs/firebase-admin-bootstrap.md](docs/firebase-admin-bootstrap.md). Do not deploy the Firestore rules until the intended administrator account has a trusted `admin: true` custom claim.

# Release and deployment checklist

## Vercel environment

Set the six Firebase client configuration values from `.env.example` in the Vercel project settings for Preview and Production. These values identify the Firebase web app; never put Firebase Admin SDK credentials, service-account JSON, or other private keys in `VITE_*` variables.

## Firebase access

1. Enable the intended sign-in provider in Firebase Authentication.
2. Grant the trusted administrator account the `admin: true` custom claim using the procedure in [firebase-admin-bootstrap.md](firebase-admin-bootstrap.md).
3. Deploy `firestore.rules` to the same Firebase project configured in Vercel.
4. Confirm public doctor profiles are published and that draft profiles are not publicly readable.

## Release check

- `npm ci`
- `npm run lint`
- `npm run build`
- Preview deployment: verify admin sign-in, doctor create/edit/delete, JSON import/export, and public published/draft routes.
- Production deployment: repeat smoke checks with production Firebase configuration and inspect browser console/network failures.

The app does not require a Gemini secret or a server-side `APP_URL` setting in its Vercel client build.

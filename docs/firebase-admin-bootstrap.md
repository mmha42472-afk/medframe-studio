# Firebase administrator bootstrap

Firestore authorization uses the server-verified Firebase Authentication custom claim `admin: true`. A signed-in account without this claim cannot read draft doctor records or modify any doctor record. Do not add a public sign-up flow or infer administrator access from a successful login.

## Grant the first administrator

1. Create the intended operator account through Firebase Console > Authentication > Users, or use the project's existing trusted account provisioning process.
2. From a trusted environment with Firebase Admin SDK access to the existing project, assign the custom claim to that account's UID. For example:

```js
await getAuth().setCustomUserClaims('<operator-uid>', { admin: true });
```

   The Admin SDK must use credentials provided through the environment or a managed identity. Never commit a service account key or run this code in the browser.
3. Sign the operator out and back in so Firebase issues a token containing the new claim.
4. Deploy `firestore.rules` to the same existing Firebase project.
5. Verify that an ordinary authenticated account cannot read drafts or write doctor records, while the claimed administrator can manage doctors and public clients can read published profiles only.

Removing the claim revokes administrator access after the user's ID token refreshes. Existing Firestore documents and Firebase users are not migrated or deleted by this change.

## Enable passwordless email-link login

1. In Firebase Console, open Authentication > Sign-in method and enable Email/Password, then enable the Email link (passwordless sign-in) option.
2. Under Authentication > Settings > Authorized domains, add `mmha42472-afk.github.io` for the GitHub Pages deployment.
3. Open the site and enter the email address of the pre-provisioned administrator. Open the one-time link from the same device and browser where you requested it.
4. The link authenticates the email, then the app checks the server-issued `admin: true` claim. A regular account is signed out and cannot access the dashboard.

Firebase email-link sign-in can create a regular Auth user if the address was not already registered. That does not grant administrator access: only a trusted Admin SDK claim does. Never assign the claim from the browser or make Firestore writes public. The current client-only/local demonstration mode is not an authorization boundary and must not be used for production data.

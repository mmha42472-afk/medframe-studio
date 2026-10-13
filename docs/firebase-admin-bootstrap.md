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

The app's login flow must only authenticate pre-provisioned accounts. It must not create the first administrator from a public sign-in screen. The current client-only/local demonstration mode is not an authorization boundary and must not be used for production data.

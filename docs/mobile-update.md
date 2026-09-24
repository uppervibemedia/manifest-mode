# ManifestMode mobile update

This branch adds a Today home screen and playable training games to the existing React/Base44 application. It is an app improvement and a reviewable browser preview, not a signed native iOS release.

## Included

- `/today`: current score, alignment points, check-in completion, daily training completion, next actions, and a vision shortcut. Each data request has error handling; no sample account data is used in the live route.
- `/train`: Focus Zone (30 seconds) and Memory Grid (five rounds), pause/resume, scoring, results, save retry, and recent history. Training XP is separate from the existing alignment points and Reality Match score. It has no monetary value or entitlement effect.
- Private `TrainingSession` entity with owner-only history and deletion. Save retries reuse a session ID and check for a previous save. This is best-effort deduplication, not a database uniqueness guarantee.
- Today/Train/Vision/Progress/Future Self navigation; Profile remains accessible from the header.
- RevenueCat status is fetched server-side for the authenticated account. Webhooks fail closed without a secret and reconcile current state rather than assuming a webhook contains active entitlements. Existing Stripe/manual memberships are preserved.
- Subscription fields in UserProfile are admin/service writable; clients rely on schema defaults when creating a free profile. UserProfile access is owner/admin scoped.
- The mock RevenueCat purchase bridge only loads in development.

## Review locally

```
npm ci
npm run preview:design
```

Open `/preview.html`. This separate entry uses shared Today/Train components, labeled sample account data, and browser-only game history. Other screens open a scope notice; they remain present in the connected app. It does not import the Base44 client, sign users in, or collect payments. The preview is not included in the normal app build.

```
npm run export:preview
```

Produces `artifacts/manifestmode-preview.html`, a standalone interactive file. Fonts fall back to the system font; scripts and styles are embedded.

## Connect and verify before publishing

1. Supply the existing `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` for the real app. No credentials are included here.
2. Deploy the `TrainingSession` entity, the updated `UserProfile` schema/access rules, and both RevenueCat functions (including `subscriptionState.js`) together. Verify local helper imports are included by the Base44 deployment bundle.
3. Set backend-only `REVENUECAT_SECRET_API_KEY` and `REVENUECAT_WEBHOOK_SECRET`. Configure the matching webhook authorization header in RevenueCat. Missing or failed verification returns an error without mutating paid access.
4. Use an isolated test backend/RevenueCat project with `REVENUECAT_ALLOW_SANDBOX=true` for TestFlight. It defaults to false. Do not enable sandbox access on the production entitlement database.
5. The existing bridge identity contract is `Purchases.logIn(authenticatedEmail)`. Before a public release, migrate this to a server-controlled stable account identifier and validate account switching, sign-out, restore and purchase transfers. There is still no native Swift project in this repository.
6. Verify Base44 field rules with a real non-admin user: clients cannot set subscription fields during creation or updates; normal onboarding still works; users cannot read another user's profile or training sessions. Check ownership-field mutation and all existing entity policies before release. These rules cannot be integration-tested without the app connection.
7. Configure the App Store product IDs, RevenueCat offerings and `plus`/`premium` entitlements; implement/sign the iOS bridge; test purchases, restores, cancellation, grace periods, refund, expiration, and cross-account behavior on a device.

## Known existing limits

- This environment has source-code access but no configured live Base44, RevenueCat, or App Store Connect session. No production data was changed and no purchase was made.
- Existing account deletion removes selected app records and logs out; it does not demonstrate deletion of the authentication identity or cancellation of subscriptions. This branch also removes training history, but the full deletion flow needs a server-side audit before App Store submission.
- Existing AI features, credits, reminders, account creation and other backend entities were not audited end-to-end in this update.
- Sessions are client-reported practice results. They are not suitable for prizes, paid entitlements or a trusted competitive leaderboard.

## Validation

- Production app build and isolated preview build.
- Focus/memory scoring and private-schema boundary checks; RevenueCat expiry, grace, sandbox, refund and external-membership preservation unit tests.
- Browser verification of both games, pause/resume, saved results, reload persistence, daily completion and responsive layouts.
- Targeted lint for changed screens and components.
- The repository already has TypeScript diagnostics. Baseline: 61 errors; this branch: 59, with no new diagnostic messages in the comparison.

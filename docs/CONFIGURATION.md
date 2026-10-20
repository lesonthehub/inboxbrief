# Local configuration

InboxBrief expects configuration from environment variables. Keep local values in an untracked `.env` file or your hosting platform’s secret manager. Never paste production credentials into an issue, pull request, documentation page, or committed file.

## Core runtime

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode, normally `development`, `test`, or `production` |
| `PORT` | Optional server port; defaults to `3000` |
| `APP_URL` | Public base URL used when constructing provider callback URLs |
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session-signing secret |
| `ENCRYPTION_KEY` | 32-byte key encoded as 64 hexadecimal characters for AES-256-GCM |

## Account runtime

| Variable | Purpose |
| --- | --- |
| `VITE_APP_ID` | Managed account-auth application identifier |
| `OAUTH_SERVER_URL` | Managed account-auth server URL |
| `OWNER_OPEN_ID` | Owner account identifier used by application policy |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Managed runtime integration values where applicable |

## Gmail and Google sign-in

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client used for Gmail inbox connections and optional Google account sign-in |
| `GOOGLE_REDIRECT_URI` | Gmail connection callback URL; defaults to `/api/oauth/gmail/callback` under `APP_URL` |
| `GOOGLE_LOGIN_REDIRECT_URI` | Optional Google account sign-in callback URL |

Gmail must be configured with only the requested read scopes: `gmail.readonly` and `userinfo.email`.

## Outlook and Microsoft sign-in

| Variable | Purpose |
| --- | --- |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth client used for Outlook connections and optional Microsoft account sign-in |
| `MICROSOFT_REDIRECT_URI` | Outlook callback URL; defaults to `/api/oauth/outlook/callback` under `APP_URL` |
| `MICROSOFT_LOGIN_REDIRECT_URI` | Optional Microsoft account sign-in callback URL |

## AI, messaging, billing, and email

| Integration | Variables |
| --- | --- |
| OpenRouter | `OPENROUTER_API_KEY` |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_SOLO`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_ENTERPRISE` |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `FROM_NAME` |

## Configuration checklist

For a minimal local run without exercising third-party workflows, configure the runtime, database, session, and encryption variables, then run `pnpm db:push` and `pnpm dev`. To test an external workflow, configure that provider’s entire group and register the local callback URL with the provider.

Use test-mode keys for Stripe and Twilio during development. Keep production and development OAuth clients separate, and rotate any credential that is ever committed or exposed.

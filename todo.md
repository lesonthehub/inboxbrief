# InboxBrief TODO

## Phase 1: Setup & Dependencies
- [x] Install Stripe, Twilio, googleapis dependencies
- [x] Set up Stripe feature via webdev_add_feature
- [x] Request secrets: STRIPE keys, TWILIO, OPENROUTER, GOOGLE/MICROSOFT OAuth, ENCRYPTION_KEY

## Phase 2: Database Schema
- [x] Extend users table with onboarding fields (businessType, emailVolume, primaryGoal, phone, onboardingComplete)
- [x] Extend users table with scheduling fields (scheduleType, scheduleTimes, timezone)
- [x] Extend users table with trial tracking fields (trialStartedAt, trialEndsAt, trialUsed)
- [x] Create subscriptions table (userId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd)
- [x] Create email_accounts table (userId, provider, encryptedAccessToken, encryptedRefreshToken, emailAddress, lastProcessedEmailId)
- [x] Create briefing_logs table (userId, emailsFetched, highPriorityCount, encryptedSummary, smsStatus, triggerType)
- [x] Push schema migrations

## Phase 3: Server Utilities
- [x] AES-256-GCM encryption utility (encrypt/decrypt/safeDecrypt functions)
- [x] Gmail OAuth token exchange and email fetching helper with incremental lastProcessedEmailId tracking
- [x] Outlook OAuth token exchange and email fetching helper
- [x] OpenRouter/Grok 3 email classification (high_priority / general / ignore) and summarization helper
- [x] Twilio SMS delivery helper with E.164 normalization
- [x] Email pipeline orchestrator (fetch → classify → summarize → encrypt → SMS → log)
- [x] Stripe products config (createCheckoutSession, createPortalSession, getPriceIdForPlan)
- [x] Plans config with tier limits (Starter: 50, Pro: 200, Business: unlimited)
- [x] OWNER_EMAIL constant set to lesterantoine@16starcollective.com

## Phase 4: tRPC Routers
- [x] Onboarding router (save lead qualifying answers, start 7-day Business trial)
- [x] Subscription router (createCheckout, createPortal, getStatus, getPlans)
- [x] Email accounts router (getGmailAuthUrl, getOutlookAuthUrl, list, disconnect)
- [x] Briefing router (trigger manual briefing, get briefing history)
- [x] Settings router (get/update phone, scheduleType, scheduleTimes, timezone)
- [x] Auth router (me, logout)

## Phase 5: Frontend Pages
- [x] Global theme: Deep Slate (#0f172a) + Electric Indigo (#4f46e5) palette in index.css
- [x] Google Fonts: Inter + Space Grotesk loaded in index.html
- [x] Landing page with hero, SMS preview mockup, features, testimonials, CTA
- [x] Onboarding flow: 3 lead qualifying questions (business type, email volume, primary goal) + phone number
- [x] Pricing page with 3 tiers (Starter $9, Pro $19, Business $39) + free trial banner
- [x] Seamless Stripe checkout integration (opens in new tab with toast notification)
- [x] Main dashboard with [ 💬 TEXT MY BRIEFING ] button
- [x] Dashboard: AES-256-GCM Protected badge
- [x] Dashboard: Connected email accounts panel (Gmail + Outlook connect buttons)
- [x] Dashboard: Briefing history log with status badges
- [x] Dashboard: Schedule picker (manual, daily morning/evening, twice daily, custom)
- [x] Settings page (phone number, timezone, subscription management, security info)
- [x] All routes registered in App.tsx

## Phase 6: Webhooks & Automation
- [x] Stripe webhook handler at /api/stripe/webhook (checkout.session.completed, subscription.updated/deleted, invoice.paid/failed)
- [x] Webhook registered BEFORE express.json() middleware (raw body required)
- [x] Test event passthrough (evt_test_ prefix)
- [x] Subscription status gating on briefing trigger (isActive check)
- [x] SMS cron scheduler (runs every minute, checks user schedules, triggers briefings at correct local time)
- [x] Scheduler started on server boot

## Phase 7: Testing & Polish
- [x] Vitest tests for AES-256-GCM encryption utility (9 tests)
- [x] Vitest tests for subscription plan logic (13 tests)
- [x] Vitest tests for auth.logout (2 tests)
- [x] Vitest tests for auth.me (2 tests)
- [x] Vitest tests for subscription.getPlans (2 tests)
- [x] All 33 tests passing
- [x] Fixed unicode escape sequences rendering as raw text in Home.tsx
- [x] Mobile-responsive design across all pages

## Owner Configuration
- [x] OWNER_EMAIL = lesterantoine@16starcollective.com stored in sms.ts
- [x] Owner email used as fallback in createCheckoutSession
- [x] Domain: 16starcollective.com

## Pending: Secrets Required (user must configure)
- [x] ENCRYPTION_KEY — 32-byte hex (64 chars) for AES-256-GCM ✅ auto-generated
- [ ] TWILIO_ACCOUNT_SID — Twilio account SID
- [ ] TWILIO_AUTH_TOKEN — Twilio auth token
- [ ] TWILIO_PHONE_NUMBER — Twilio phone number (E.164 format)
- [ ] OPENROUTER_API_KEY — OpenRouter API key for Grok 3 access
- [x] STRIPE_PRICE_STARTER — price_1T9UHRLnnUB5UAJfQkpXQwc7 ✅ auto-created
- [x] STRIPE_PRICE_PRO — price_1T9UHVLnnUB5UAJfQUecAdoW ✅ auto-created
- [x] STRIPE_PRICE_BUSINESS — price_1T9UHYLnnUB5UAJfOjXQ177H ✅ auto-created
- [ ] GOOGLE_CLIENT_ID — Google OAuth client ID for Gmail
- [ ] GOOGLE_CLIENT_SECRET — Google OAuth client secret
- [ ] MICROSOFT_CLIENT_ID — Microsoft OAuth client ID for Outlook
- [ ] MICROSOFT_CLIENT_SECRET — Microsoft OAuth client secret

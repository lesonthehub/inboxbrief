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
- [x] Create team_members table (ownerId, inviteEmail, userId, status, role)
- [x] Create referral_codes table (userId, code, usedCount, creditsEarned)
- [x] Create referral_uses table (referrerId, referredUserId, createdAt)
- [x] Create briefing_feedback table (briefingLogId, userId, rating, toneAdjustment, addKeywords, removeKeywords, freeformNote)
- [x] Push schema migrations

## Phase 3: Server Utilities
- [x] AES-256-GCM encryption utility (encrypt/decrypt/safeDecrypt functions)
- [x] Gmail OAuth token exchange and email fetching helper with incremental lastProcessedEmailId tracking
- [x] Outlook OAuth token exchange and email fetching helper
- [x] AI email classification (high_priority / general / ignore) and human-sounding summarization helper
- [x] Twilio SMS delivery helper with E.164 normalization
- [x] Email pipeline orchestrator (fetch → classify → summarize → encrypt → SMS → log)
- [x] Stripe products config (createCheckoutSession, createPortalSession, getPriceIdForPlan)
- [x] Plans config with market-researched tier limits (Solo 25, Pro 75, Business 150, Enterprise unlimited)
- [x] OWNER_EMAIL constant set to lesterantoine@16starcollective.com

## Phase 4: tRPC Routers
- [x] Onboarding router (save lead qualifying answers, start 7-day Enterprise trial)
- [x] Subscription router (createCheckout, createPortal, getStatus, getPlans)
- [x] Email accounts router (getGmailAuthUrl, getOutlookAuthUrl, list, disconnect)
- [x] Briefing router (trigger manual briefing, get briefing history, submitFeedback)
- [x] Settings router (get/update phone, scheduleType, scheduleTimes, timezone)
- [x] Referral router (getMyReferral, applyReferralCode)
- [x] Team router (getMembers, inviteMember, removeMember)
- [x] Auth router (me, logout)

## Phase 5: Frontend Pages
- [x] Global theme: Deep Slate (#0f172a) + Electric Indigo (#4f46e5) palette in index.css
- [x] Google Fonts: Inter + Space Grotesk loaded in index.html
- [x] Landing page with hero, SMS preview mockup (multi-language), features, testimonials, referral callout, CTA
- [x] Multi-language section on landing page (8 languages with flag icons)
- [x] Onboarding flow: 3 lead qualifying questions (role/team size/inbox challenge) + phone + language picker + referral code
- [x] Pricing page with 4 tiers (Solo $9, Pro $19, Business $39, Enterprise $79) + free trial banner
- [x] Seamless Stripe checkout integration (opens in new tab with toast notification)
- [x] Main dashboard with [ 💬 TEXT MY BRIEFING ] button
- [x] Dashboard: AES-256-GCM Protected badge
- [x] Dashboard: Connected email accounts panel (Gmail + Outlook connect buttons)
- [x] Dashboard: Briefing history log with status badges
- [x] Dashboard: Schedule picker (manual, daily morning/evening, twice daily, custom)
- [x] Dashboard: Briefing feedback panel (star rating, tone picker, keyword tuning)
- [x] Dashboard: Team tab (Business/Enterprise only — invite members, view status)
- [x] Dashboard: Referral tab (unique code, copy button, stats: referrals/credits earned/available)
- [x] Settings page (phone number, timezone, subscription management, security info)
- [x] All routes registered in App.tsx
- [x] No tool branding anywhere in frontend (no Grok, OpenRouter, Twilio mentions)

## Phase 6: Webhooks & Automation
- [x] Stripe webhook handler at /api/stripe/webhook (checkout.session.completed, subscription.updated/deleted, invoice.paid/failed)
- [x] Webhook registered BEFORE express.json() middleware (raw body required)
- [x] Test event passthrough (evt_test_ prefix)
- [x] Subscription status gating on briefing trigger (isActive check)
- [x] SMS cron scheduler (runs every minute, checks user schedules, triggers briefings at correct local time)
- [x] Scheduler started on server boot

## Phase 7: Testing & Polish
- [x] Vitest tests for AES-256-GCM encryption utility (9 tests)
- [x] Vitest tests for subscription plan logic (15 tests)
- [x] Vitest tests for auth.logout (2 tests)
- [x] Vitest tests for auth.me (2 tests)
- [x] Vitest tests for subscription.getPlans (2 tests)
- [x] All 42 tests passing
- [x] Mobile-responsive design across all pages (320px to 1440px+)
- [x] Human-sounding briefing prompts ("You have 3 applicants for [Title]...")
- [x] 1 free week of highest tier (Enterprise) for all new users

## Owner Configuration
- [x] OWNER_EMAIL = lesterantoine@16starcollective.com stored in sms.ts
- [x] Owner email used as fallback in createCheckoutSession
- [x] Domain: 16starcollective.com

## Pending: Secrets Required (user must configure)
- [x] ENCRYPTION_KEY — 32-byte hex (64 chars) for AES-256-GCM ✅ auto-generated
- [ ] TWILIO_ACCOUNT_SID — Twilio account SID
- [ ] TWILIO_AUTH_TOKEN — Twilio auth token
- [ ] TWILIO_PHONE_NUMBER — Twilio phone number (E.164 format)
- [ ] OPENROUTER_API_KEY — OpenRouter API key for AI summarization
- [x] STRIPE_PRICE_STARTER — price_1T9UHRLnnUB5UAJfQkpXQwc7 ✅ auto-created
- [x] STRIPE_PRICE_PRO — price_1T9UHVLnnUB5UAJfQUecAdoW ✅ auto-created
- [x] STRIPE_PRICE_BUSINESS — price_1T9UHYLnnUB5UAJfOjXQ177H ✅ auto-created
- [x] STRIPE_PRICE_ENTERPRISE — price_1TBzbvLnnUB5UAJfz7GTztbX ✅ auto-created
- [ ] GOOGLE_CLIENT_ID — Google OAuth client ID for Gmail
- [ ] GOOGLE_CLIENT_SECRET — Google OAuth client secret
- [ ] MICROSOFT_CLIENT_ID — Microsoft OAuth client ID for Outlook
- [ ] MICROSOFT_CLIENT_SECRET — Microsoft OAuth client secret

## Domain & Google Workspace (Manual Steps)
- [ ] Buy domain name (inboxbrief.com or 16starcollective.com) via Settings → Domains in Management UI
- [ ] Set up Google Workspace for InboxBrief (lesterantoine@16starcollective.com)
- [ ] Configure DNS records for custom domain in Manus Settings → Domains

## Round 3 Changes

### International SMS Pricing
- [x] Market research: Twilio international SMS costs vs US baseline (5-11x higher than US)
- [x] Add country selector to onboarding and settings (phone number country)
- [x] Add international SMS surcharge logic to subscription pricing (+$5/month)
- [x] Update Stripe checkout to add surcharge for non-US numbers
- [x] Show surcharge clearly in pricing UI and checkout

### Enterprise Tier Redesign
- [x] Remove price from Enterprise tier on pricing page
- [x] Replace Enterprise checkout button with "Contact Us" CTA
- [x] Build Enterprise contact form (name, company, team size, needs, email)
- [x] Wire contact form to owner notification (lesterantoine@16starcollective.com)
- [x] Add /enterprise route for contact form

### Legal Protection
- [x] Create Terms of Service page (/terms) with liability limitation, dispute resolution, no-warranty clauses
- [x] Create Privacy Policy page (/privacy)
- [x] Add pre-purchase agreement modal (must accept ToS before Stripe checkout opens)
- [x] Add ToS/Privacy links to footer and onboarding
- [x] Add "By subscribing you agree to our Terms of Service" to all checkout flows

### Team Invitation Email Flow
- [x] DB: team_members table with inviteToken, inviteTokenExpiresAt fields
- [x] tRPC: sendInvite mutation (generates token, sends notification email)
- [x] Build /invite/[token] accept page (shows team name, accept button, redirects to onboarding)
- [x] tRPC: acceptInvite mutation (validates token, creates team membership)
- [x] Show pending/accepted/expired status in team dashboard tab

### Referral Dashboard
- [x] Full referral tab in dashboard: unique code, copy button, share link
- [x] Show referral stats: total referrals, successful sign-ups, credits earned, credits available
- [x] tRPC: getReferralStats query (count uses, sum credits)
- [x] Apply referral credits to next billing cycle (Stripe coupon or balance)

### Briefing Feedback UI
- [x] Per-briefing star rating (1-5) in briefing history list
- [x] Tone preference picker (concise / balanced / detailed)
- [x] Keyword include/exclude fields
- [x] tRPC: submitFeedback, getMyPreferences, updatePreferences
- [x] Pipeline: incorporate preferences into next briefing AI prompt

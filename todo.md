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

## Round 4 Changes

### Phone OTP Verification
- [x] Phone OTP verification before first SMS and on number change
- [x] PhoneVerificationModal component (6-digit OTP, rate limiting, 10-min expiry)
- [x] Settings page: show verification status, trigger re-verify on number change
- [x] Dashboard: gate TEXT MY BRIEFING behind phone verification
- [x] OTP stored as bcrypt hash in DB (never plaintext)
- [x] Error-proof: resend button, clear expiry messaging, max 3 attempts

### Email OAuth (Gmail & Outlook)
- [x] Gmail OAuth callback route (/api/auth/gmail/callback)
- [x] Outlook OAuth callback route (/api/auth/outlook/callback)
- [x] Encrypted token storage (AES-256-GCM before DB write)
- [x] Incremental email fetching with lastProcessedEmailId tracking

### Enterprise-Grade Security Hardening
- [x] Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Rate limiting (100 req/15min general, 5 req/15min auth endpoints)
- [x] XSS input sanitization middleware on all POST/PUT/PATCH
- [x] Origin validation for OAuth callbacks
- [x] Audit logging for sensitive actions (briefing trigger, subscription change, phone verify)
- [x] SQL injection prevention via Drizzle ORM parameterized queries
- [x] CSRF protection via SameSite=None + HttpOnly cookies
- [x] Sensitive data wiped from memory after AI summarization

### Branding & Legal
- [x] Remove all "16 Star Collective" references from frontend
- [x] DisclaimerModal: coincidental likeness disclaimer, must accept before interacting
- [x] Wire DisclaimerModal into App.tsx (shown on first visit, stored in localStorage)
- [x] Updated Terms and Privacy pages with InboxBrief branding

### Trial Optimization & Limit Logic
- [x] Trial: 2 briefings/day cap during 7-day trial
- [x] Trial: end-of-trial SMS nudge on days 5 and 6 with upgrade link
- [x] Over-limit: first overage is free with "This one's on us" message
- [x] Over-limit: upgrade suggestion SMS with pricing link (never free again after first)
- [x] Upgrade suggestion banner in dashboard when approaching limit

## Round 5 Changes

### Domain & Email Updates
- [x] Replace all domain references: 16starcollective.com → inboxbrief.org
- [x] Replace service email: lesterantoine@16starcollective.com → lesterantoine@inboxbrief.org
- [x] Enterprise form routes to: sales@inboxbrief.org
- [x] Support links point to: support@inboxbrief.com

### Legal PDF Documents
- [x] Generate Terms of Service PDF (long-form, downloadable)
- [x] Generate Privacy Policy PDF (long-form, downloadable)
- [x] Upload PDFs to CDN via manus-upload-file --webdev
- [x] Link PDFs to checkbox at site entry

### Entry Disclaimer Redesign
- [x] Replace full-screen DisclaimerModal with compact checkbox banner at page entry
- [x] Checkbox links to ToS PDF and Privacy PDF
- [x] Stored in localStorage (once per visitor, never shown again)
- [x] Skip entirely when user is logged in
- [x] Must check box before accessing any page content

## Round 6 — Clickable Text Fit (Mobile + PC)
- [x] Home: hero CTAs responsive text sizing (text-sm on mobile, text-base/lg on larger screens)
- [x] Home: bottom CTA button responsive text sizing
- [x] Pricing: Free Trial Banner button — removed whitespace-nowrap, uses w-full on mobile
- [x] Pricing: Enterprise Contact Us button — removed whitespace-nowrap, uses w-full on mobile
- [x] Dashboard: Generate Invite Link button — shortened to "Generate Link" on mobile
- [x] Dashboard: Referral stats labels shortened (Total Referrals→Referrals, Credits Earned→Earned, Available Credits→Available)
- [x] Dashboard: View Team Plans button — removed whitespace-nowrap, uses flex-shrink-0
- [x] Settings: Subscription buttons (Upgrade Plan/Choose a Plan/Manage Billing) — stack vertically on mobile
- [x] DisclaimerBanner: w-full button, text wraps naturally — no overflow issues
- [x] TosAgreementModal: flex layout with flex-1 primary button — no overflow issues
- [x] Onboarding: option cards use full-width buttons with text wrapping — no overflow issues
- [x] Terms / Privacy: back navigation button — icon-only with short text, no overflow issues

## Round 7 Changes

### Pricing / Margin Recalculation
- [x] Research Twilio A2P 10DLC SMS cost: $0.0113/SMS (base + carrier surcharge)
- [x] Research GPT-4o-mini cost: $0.000045/email + $0.00012/briefing base
- [x] Calculate COGS per tier at 70% utilization
- [x] Solo: 25 emails → 50 emails (margin 91%), SMS/day stays at 2
- [x] Pro: 75 emails → 100 emails (margin 87%), SMS/day stays at 5
- [x] Business: 150 emails/10 SMS → 75 emails/2 SMS per seat (was 38% margin, now 89%)
- [x] Update plans.ts with new limits and margin documentation
- [x] Update Pricing.tsx with new email limits per tier

### Disclaimer & Legal Documents
- [x] Shorten DisclaimerBanner checkbox to: "I agree to the Terms of Service and Privacy Policy."
- [x] Remove verbose body paragraph from DisclaimerBanner
- [x] Shorten TosAgreementModal checkboxes to reference documents only
- [x] Write Terms of Service v2.0 (20 sections, ~10 pages, Google/Facebook style)
- [x] Write Privacy Policy v2.0 (16 sections, ~10 pages, Google/Facebook style)
- [x] Generate PDFs and upload to CDN
- [x] Update PDF URLs in DisclaimerModal.tsx (new v2 CDN links)
- [x] Update PDF URLs in TosAgreementModal.tsx (new v2 CDN links)
- [x] Update Terms.tsx: version 2.0, new date, Download PDF link
- [x] Update Privacy.tsx: version 2.0, new date, Download PDF link

## Round 8 Changes

### Admin Announcement Banner System
- [ ] DB: announcements table (id, message, type, expiresAt, createdBy, createdAt, isActive)
- [ ] tRPC: announcements router (admin: create, update, delete, list; public: getActive)
- [ ] Admin UI: /admin/announcements page (create/edit/delete banners with expiry datetime picker)
- [ ] Public banner: AnnouncementBanner component shown at top of all pages (dismissible per session)
- [ ] Banner types: info (blue), warning (yellow), success (green), promo (purple)
- [ ] Auto-hide when expiresAt is past
- [ ] Role-gate admin page to admin users only

### Landing Page — How It Works Section
- [ ] Add 3-step visual section between hero and features grid
- [ ] Step 1: Connect Gmail or Outlook (plug icon)
- [ ] Step 2: AI reads and filters your inbox (brain/filter icon)
- [ ] Step 3: Receive your SMS briefing (phone icon)
- [ ] Animated connectors between steps

### Pricing Page — Business Plan FAQ Entry
- [ ] Add FAQ entry: "How many SMS briefings does each Business member get?"
- [ ] Answer: "Each member gets 2 focused briefings daily — morning and evening — to keep the team aligned without inbox fatigue."

### API Credentials for Launch
- [ ] Request TWILIO_ACCOUNT_SID
- [ ] Request TWILIO_AUTH_TOKEN
- [ ] Request TWILIO_PHONE_NUMBER
- [ ] Request OPENROUTER_API_KEY
- [ ] Request GOOGLE_CLIENT_ID
- [ ] Request GOOGLE_CLIENT_SECRET
- [ ] Request MICROSOFT_CLIENT_ID
- [ ] Request MICROSOFT_CLIENT_SECRET
- [ ] Verify all secrets are wired to correct env vars in server code

## Round 8 Changes

### Admin Announcement Banner System
- [x] Create `announcements` table in DB (id, message, type, isActive, expiresAt, createdBy, createdAt, updatedAt)
- [x] Add `announcementsRouter` to server/routers.ts (getActive public, list/create/update/delete admin-only)
- [x] Create AnnouncementBanner component (shows active banners at top of all pages, dismissible per session)
- [x] Create AdminAnnouncements page at /admin/announcements (CRUD UI for admin users)
- [x] Register route in App.tsx and mount AnnouncementBanner above Router
- [x] Support 4 banner types: info (blue), warning (yellow), success (green), promo (purple)
- [x] Auto-expire banners at set date/time; banners with no expiry stay until manually deactivated

### How It Works Section (Landing Page)
- [x] Add 3-step visual section between SMS Preview and Features sections
- [x] Step 1: Connect Your Inbox (Plug icon, indigo gradient)
- [x] Step 2: AI Reads & Filters (BrainCircuit icon, purple gradient)
- [x] Step 3: Receive Your SMS Briefing (Smartphone icon, pink gradient)
- [x] Arrow connectors between steps (hidden on mobile, shown on md+)

### Business Plan FAQ Entry (Pricing Page)
- [x] Add FAQ: "How many SMS briefings does each Business plan member receive?"
- [x] Answer explains 2x daily (morning + evening) + on-demand manual briefings

### Launch API Credentials
- [x] TWILIO_ACCOUNT_SID — validated (starts with AC, 34 chars)
- [x] TWILIO_AUTH_TOKEN — validated (non-empty)
- [x] TWILIO_PHONE_NUMBER — validated (E.164 format)
- [x] GOOGLE_CLIENT_ID — validated (non-empty)
- [x] GOOGLE_CLIENT_SECRET — validated (non-empty)
- [x] MICROSOFT_CLIENT_ID — validated (non-empty)
- [x] MICROSOFT_CLIENT_SECRET — validated (non-empty)
- [x] All 49 tests passing (4 test files)

### Test Suite Updates
- [x] Update inboxbrief.test.ts plan assertions to match new repriced email limits (50/100/75)
- [x] Update SMS/day test: business plan = solo (2/day per seat, by design)
- [x] Add server/credentials.test.ts for launch credential validation (7 tests)

## Round 9 Changes

### Admin Promotion
- [ ] Promote lesterantoine@inboxbrief.org to admin role via SQL

### OpenRouter Integration
- [ ] Request OPENROUTER_API_KEY secret
- [ ] Replace invokeLLM (Manus built-in) with OpenRouter API calls in server/grok.ts
- [ ] Update server/_core/llm.ts or create server/openrouter.ts helper
- [ ] Verify AI briefing pipeline still works end-to-end

### 500-Character SMS Limit
- [ ] Add 500-char hard limit to SMS briefing output in grok.ts
- [ ] Add smart truncation: complete sentences, never cut mid-word
- [ ] Add character count to system prompt so LLM targets under 500 chars
- [ ] Add post-generation truncation safety net
- [ ] Update SMS delivery helper to enforce limit before send

### Google User Data Privacy Policy
- [ ] Write 10+ page Google User Data Privacy Policy (explicit Google OAuth data usage)
- [ ] Cover: data collected, how it's used, retention, deletion, sharing, security
- [ ] Model language after Google's own API Services User Data Policy
- [ ] Generate PDF and upload to CDN
- [ ] Add link to Privacy page, footer, and DisclaimerModal
- [ ] Add separate /privacy/google route or section

## Round 10 Changes

### Legal Documents — Third-Party Service Disclosures (+10 pages each)
- [ ] Research required legal disclosures: Google OAuth, Microsoft OAuth, Twilio, Stripe, OpenRouter
- [ ] Expand Terms of Service by 10+ pages (third-party integrations, DMCA, dispute resolution, indemnification, acceptable use)
- [ ] Expand Privacy Policy by 10+ pages (third-party processors, data transfers, CCPA/GDPR rights, cookies, Microsoft/Twilio/Stripe disclosures)
- [ ] Expand Google User Data Policy by 10+ pages (OAuth scopes, data flows, Limited Use compliance, audit rights, security)
- [ ] Generate new PDFs v3.0 and upload to CDN
- [ ] Update all PDF URL constants in DisclaimerModal.tsx, TosAgreementModal.tsx, Terms.tsx, Privacy.tsx

### Admin Customer Details Panel
- [ ] Add lastLoginAt column to users table via SQL
- [ ] Update lastLoginAt on every successful auth/me call
- [ ] Add tRPC admin procedure: getCustomers (paginated, with email, plan, status, lastLoginAt, createdAt, phone)
- [ ] Create AdminCustomers.tsx page with sortable/searchable table
- [ ] Add "Customers" nav link in admin area
- [ ] Register /admin/customers route in App.tsx

### Admin Route Security — Email Whitelist
- [ ] Define ADMIN_WHITELIST constant (lesterantoine@inboxbrief.org + other authorized accounts)
- [ ] Add whitelist check to server-side adminProcedure middleware
- [ ] Add frontend route guard: redirect non-whitelisted users away from /admin/*
- [ ] Update AdminAnnouncements.tsx to enforce whitelist on client side

## Round 11 Changes

### Admin Mod Actions
- [x] Add isActive/suspendedAt/suspendedReason/suspendedBy/adminNotes fields to users table via SQL + schema
- [x] Block suspended users from briefing pipeline (isActive gate before phone verification check)
- [x] Add admin tRPC procedures: suspend, unsuspend, updateNotes, softDelete, setRole
- [x] Rewrite AdminCustomers panel with full mod actions: Suspend/Unsuspend, Add/Edit Notes, Change Role, Delete Account
- [x] Stats bar (Total / Active / Suspended counts)
- [x] Confirmation modals with reason inputs and destructive warnings
- [x] Admin nav link in Dashboard nav (amber Crown badge, visible only to whitelisted emails, hidden on mobile)

## Round 12 Changes

### Login / Create Account Button
- [x] Add Log In button to Home.tsx nav (ghost style, visible on sm+ when not authenticated)
- [x] Add "Already have an account? Log in here" link below hero trust badges
- [x] Nav already shows Dashboard button when authenticated (verified)

### OpenRouter Model Switch
- [x] Switch OpenRouter default model from gemini-2.0-flash-001 to x-ai/grok-4.1-fast

### Admin Verification
- [x] Verified /admin/customers shows lastSignedIn dates (timeAgo + absolute date)
- [x] Verified both /admin/customers and /admin/announcements enforce ADMIN_EMAILS whitelist

## Round 13 Bug Fixes

### Bug: SMS Verification OTP Not Delivered
- [x] Root cause: announcements.getActive crashed with "db.select is not a function" (getDb() is async but was called without await in 9 places in routers.ts)
- [x] Fixed: replaced all `const db = getDb()` with `const db = await getDb()` in routers.ts (20 occurrences)
- [x] Twilio env vars confirmed present: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (+18337629011)
- [x] phoneVerification.ts and sms.ts logic verified correct
- [x] Note: phone field shows 0000000000 and phoneVerified=false — user needs to re-enter real phone number in Settings

### Bug: Admin Panel Not Visible After Login
- [x] Root cause: user logged in with lesantoineiii@gmail.com (Google OAuth) but whitelist only had lesterantoine@inboxbrief.org
- [x] Fixed: promoted lesantoineiii@gmail.com to role=admin in DB
- [x] Fixed: replaced hardcoded ADMIN_EMAILS whitelist with role-based check (user?.role === 'admin') in Dashboard.tsx, AdminAnnouncements.tsx, AdminCustomers.tsx
- [x] Admin Crown badge in Dashboard nav now shows for any role=admin account

## Round 14 Changes

### Email Verification
- [ ] Add emailVerified, emailVerificationCode, emailVerificationExpiry fields to users table
- [ ] Add sendEmailVerification and verifyEmail tRPC procedures
- [ ] Add email verification step to Onboarding flow (after phone verification)
- [ ] Add email verification UI to Settings page
- [ ] Block briefings if email not verified (alongside phone verification check)
- [ ] Send verification email via built-in notification or SMTP

### Outbound-Only SMS Disclosure
- [ ] Research: where and how to communicate outbound-only SMS number most effectively
- [ ] Add "Do not reply to this number" footer to every SMS message sent
- [ ] Add outbound-only notice in Onboarding phone step
- [ ] Add outbound-only notice in Settings phone section
- [ ] Add outbound-only notice in Dashboard briefing section
- [ ] Configure Twilio number to reject/auto-respond to inbound calls and messages

## Round 15 Changes

- [x] Center announcement banner text on PC and mobile (icon + text centered, dismiss button absolutely positioned right)
- [x] Replace single Admin button with dropdown menu (Crown + ChevronDown) showing Customer Accounts and Announcements links — visible on mobile and desktop for all role=admin users
- [x] Updated TWILIO_PHONE_NUMBER secret to +12816617555 — credentials test passing

## Round 16 Changes

- [x] Fix admin Crown dropdown: replaced CSS :hover with React click-toggle (adminMenuOpen state) + full-screen backdrop to close on outside click — works on mobile and desktop

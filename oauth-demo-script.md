# InboxBrief — Google OAuth Demo Video Script
### For Google OAuth Verification Submission
**Target length:** 3–4 minutes
**Account to use:** lesantoineiii@gmail.com
**Scopes demonstrated:** `gmail.readonly`, `userinfo.email`

---

## Before You Hit Record — Setup Checklist

- [ ] Open **https://inboxbrief.org** in Chrome, signed out
- [ ] Have **lesantoineiii@gmail.com** credentials ready
- [ ] Keep the URL bar visible at all times
- [ ] Screen resolution 1280×720 or higher
- [ ] Screen recorder running (OBS, Loom, or macOS `Cmd+Shift+5`)

---

## SECTION 1 — Introduction (0:00–0:20)

**[Show: https://inboxbrief.org landing page]**

> "This is InboxBrief — an AI-powered email briefing service. It connects to a user's Gmail inbox, reads their emails, summarizes the most important ones using AI, and delivers a concise SMS to their phone. I'll walk through exactly how the app uses the `gmail.readonly` and `userinfo.email` OAuth scopes."

---

## SECTION 2 — Sign In and `userinfo.email` (0:20–0:50)

**[Click "Start Free — 7 Days Full Access" and complete sign-in with lesantoineiii@gmail.com]**

> "When a user signs up or logs in, they authenticate through our identity provider. The `userinfo.email` scope gives us the user's email address, which we use as their account identifier."

**[Once on the Dashboard, navigate to Settings — show the email address displayed in the Account section]**

> "You can see the email address here in the Account section. That is the only data we retrieve from `userinfo.email` — we use it solely to identify the account and send transactional service notifications. We do not use it for advertising or share it with third parties."

---

## SECTION 3 — Connecting Gmail and the `gmail.readonly` Scope (0:50–2:00)

**[Return to the Dashboard, scroll to the "Connected Email Accounts" panel]**

> "Now I'll show how InboxBrief uses the `gmail.readonly` scope. The user connects their Gmail inbox by clicking 'Connect Gmail'."

**[Click "Connect Gmail" — the browser redirects to Google's OAuth consent screen]**

> "The app redirects to Google's standard OAuth consent screen. The permission shown is 'Read your email messages and settings' — that is the `gmail.readonly` scope. InboxBrief requests read-only access only. We never send, delete, modify, label, or move any emails."

**[Point to the permission on the consent screen, then click Allow]**

> "The user reviews the permission and clicks Allow. Google issues an access token. InboxBrief immediately encrypts that token using AES-256-GCM before writing it to our database. The plaintext token is never logged or stored anywhere."

**[Return to the Dashboard — Gmail account now shows as connected]**

> "Back on the dashboard, the Gmail account is now connected."

---

## SECTION 4 — How Gmail Data Is Used (2:00–2:45)

**[Click "Text My Briefing" or point to the briefing history panel]**

> "When a briefing is triggered — either manually or on a schedule — here is exactly what happens with the Gmail data:"

> "Step one: InboxBrief calls the Gmail API using the stored access token and fetches recent unread emails from the user's inbox. We read the sender name, subject line, and body text. We do not access drafts, sent mail, spam, or any folder other than the inbox."

> "Step two: that email content is passed to our AI model, which classifies each email as high-priority, general, or ignore, and writes a short plain-language summary."

> "Step three: the original email text is immediately wiped from memory after summarization. It is never stored in our database. Only the encrypted summary is saved."

**[Point to a briefing log entry in the history panel]**

> "The user sees a log of past briefings here. The full email content is never retained — only the AI-generated summary, stored encrypted."

> "Step four: the summary is sent as an SMS to the user's verified phone number. That is the complete data flow. Gmail data is used for one purpose only: generating the briefing the user requested."

---

## SECTION 5 — Disconnecting and Revoking Access (2:45–3:15)

**[Scroll to the Connected Email Accounts panel on the Dashboard]**

> "Users have full control over their connected accounts at all times. Clicking the disconnect icon next to the Gmail account removes it immediately."

**[Click the disconnect/trash icon — confirm the toast notification]**

> "When disconnected, InboxBrief deletes the stored access token from our database. No further Gmail API calls are made. Users can also revoke access directly from their Google Account at myaccount.google.com/permissions — we link to this in our Privacy Policy."

---

## SECTION 6 — Data Usage Page and Privacy Policy (3:15–3:50)

**[Navigate to https://inboxbrief.org/data-usage]**

> "InboxBrief publishes a public data usage page at inboxbrief.org/data-usage. It explains which Gmail API scopes we use, what data is accessed, how it is processed, and how long it is retained."

**[Scroll through the page slowly]**

> "Key points visible here: we access inbox emails only — not contacts, calendar, Drive, or any other Google service. Tokens are encrypted at rest. Email content is processed in memory and immediately discarded after summarization."

**[Navigate to https://inboxbrief.org/privacy and scroll to Section 10]**

> "Our Privacy Policy includes a dedicated section — Section 10 — covering Google API Limited Use. It states that InboxBrief's use of data obtained from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We do not use Gmail data for advertising, we do not sell it, and we do not use it for any purpose beyond the email briefing feature the user explicitly requested."

---

## SECTION 7 — Closing (3:50–4:00)

**[Return to the Dashboard]**

> "That is InboxBrief's complete use of the `gmail.readonly` and `userinfo.email` OAuth scopes. All access is minimal, purposeful, encrypted, and fully disclosed. Thank you for reviewing."

**[End recording]**

---

## Recording Tips

- **Speak slowly** — reviewers watch at 1x speed and are checking specific boxes.
- **Keep the URL bar visible** at all times so reviewers can confirm the domain is `inboxbrief.org`.
- **Do not skip the Google consent screen** — showing the actual OAuth permission dialog is required. If you see an "unverified app" warning first, click **Advanced → Go to InboxBrief (unsafe)** to proceed. That warning is expected during the verification process and is fine to leave in the video.
- **Pause 1–2 seconds** on each new screen before speaking.
- **Upload to YouTube as Unlisted** — not Private. Google reviewers must be able to watch without a Google account.
- Paste the YouTube URL into the Google OAuth verification form field labeled **"Demo video URL."**

---

## Pages Visited (in order)

| Step | URL |
|------|-----|
| Landing page | https://inboxbrief.org |
| Dashboard | https://inboxbrief.org/dashboard |
| Google OAuth consent | accounts.google.com (auto-redirect) |
| Settings (email display) | https://inboxbrief.org/settings |
| Data usage page | https://inboxbrief.org/data-usage |
| Privacy policy | https://inboxbrief.org/privacy |

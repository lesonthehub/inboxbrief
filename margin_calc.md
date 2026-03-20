# InboxBrief Margin Calculation — Round 7

## Cost Inputs (2025/2026 market rates)

### Twilio SMS (US domestic, A2P 10DLC)
- Base rate: $0.0083/SMS outbound
- A2P carrier surcharge: ~$0.003/SMS (AT&T, T-Mobile, Verizon pass-through)
- **Effective cost per SMS sent: ~$0.0113**

### LLM Summarization (OpenRouter — GPT-4o-mini)
- Input: $0.15/1M tokens | Output: $0.60/1M tokens
- Per email: ~300 tokens input (email body) + 100 tokens output (summary fragment)
- Per briefing: tokens = (emails × 300 input) + 200 output (final SMS summary)
- **Cost per briefing = (emails × 300 × $0.00000015) + (200 × $0.0000006)**
  = (emails × $0.000045) + $0.00012
  ≈ $0.000045 × emails + $0.00012

### Gmail/Outlook API
- Free (no per-call cost at our volumes)

---

## Per-Tier Cost Model

### Assumptions
- SMS briefings/day × 30 days = monthly SMS count
- "emails per briefing" = emailLimit (the ceiling we set)
- We assume users hit ~70% of their email limit on average (realistic usage)

---

### Solo — $9/month
**Current:** 25 emails/briefing, 2 SMS/day
- Monthly SMS: 2 × 30 = 60
- SMS cost: 60 × $0.0113 = $0.678
- LLM cost per briefing: (25 × 0.7 × $0.000045) + $0.00012 = $0.000788 + $0.00012 = $0.000908
- Monthly LLM: 60 × $0.000908 = $0.0545
- **Total COGS: $0.678 + $0.055 = $0.733/month**
- **Gross margin: ($9 - $0.733) / $9 = 91.9%** ✅ already above 90%

**To land at exactly 85% margin target:**
- Allowed COGS = $9 × 0.15 = $1.35
- SMS cost is fixed at $0.678 (can't reduce without cutting SMS/day)
- Remaining LLM budget: $1.35 - $0.678 = $0.672
- Max LLM per briefing: $0.672 / 60 = $0.0112
- Max emails: ($0.0112 - $0.00012) / ($0.000045 × 0.7) = $0.01108 / $0.0000315 ≈ **351 emails**

**Conclusion for Solo:** Current 25-email limit is extremely conservative. We can raise to **50 emails/briefing** and still hit 88%+ margin.

---

### Pro — $19/month
**Current:** 75 emails/briefing, 5 SMS/day
- Monthly SMS: 5 × 30 = 150
- SMS cost: 150 × $0.0113 = $1.695
- LLM cost per briefing: (75 × 0.7 × $0.000045) + $0.00012 = $0.002363 + $0.00012 = $0.002483
- Monthly LLM: 150 × $0.002483 = $0.3724
- **Total COGS: $1.695 + $0.372 = $2.067/month**
- **Gross margin: ($19 - $2.067) / $19 = 89.1%** ✅ right in target range

**At 85% margin:**
- Allowed COGS = $19 × 0.15 = $2.85
- Remaining LLM budget: $2.85 - $1.695 = $1.155
- Max LLM per briefing: $1.155 / 150 = $0.0077
- Max emails: ($0.0077 - $0.00012) / $0.0000315 ≈ **241 emails**

**Conclusion for Pro:** Current 75 is fine. Can raise to **100 emails/briefing** and still be at ~88% margin.

---

### Business — $39/month (up to 5 seats)
**Current:** 150 emails/briefing, 10 SMS/day, 5 seats
- Per-seat SMS: 10 × 30 = 300 SMS/month
- 5 seats × 300 = 1,500 SMS/month
- SMS cost: 1,500 × $0.0113 = $16.95
- LLM cost per briefing: (150 × 0.7 × $0.000045) + $0.00012 = $0.004725 + $0.00012 = $0.004845
- Monthly LLM: (10 × 30 × 5) × $0.004845 = 1,500 × $0.004845 = $7.268
- **Total COGS: $16.95 + $7.27 = $24.22/month**
- **Gross margin: ($39 - $24.22) / $39 = 37.9%** ❌ WAY below target

**Problem:** 5 seats × 10 SMS/day is the killer. Need to reduce email limit significantly.

**At 85% margin:**
- Allowed COGS = $39 × 0.15 = $5.85
- SMS cost for 5 seats, 10 SMS/day: $16.95 — already exceeds budget!
- Even with 0 LLM cost, SMS alone at 5 seats × 10 SMS/day = $16.95 > $5.85

**Fix options:**
1. Reduce SMS/day to 2 for Business (team plans share a pool)
2. Reduce max seats to 3
3. Raise price

**Revised Business model (3 seats, 3 SMS/day/seat):**
- SMS: 3 × 3 × 30 × $0.0113 = $3.051
- LLM: (3 × 30 × 3) × $0.004845 = 270 × $0.004845 = $1.308
- COGS: $3.051 + $1.308 = $4.359
- Margin: ($39 - $4.359) / $39 = **88.8%** ✅

**OR: Keep 5 seats, reduce to 2 SMS/day/seat, 75 emails/briefing:**
- SMS: 5 × 2 × 30 × $0.0113 = $3.39
- LLM: (5 × 2 × 30) × $0.002483 = 300 × $0.002483 = $0.745
- COGS: $3.39 + $0.745 = $4.135
- Margin: ($39 - $4.135) / $39 = **89.4%** ✅

**Best option:** Keep 5 seats, set 2 SMS/day per seat, 75 emails/briefing.

---

### Enterprise — Custom pricing (contact us)
No fixed cost model — priced per contract. Not affected.

---

## Final Recommended Limits (80-90% margin target)

| Tier | Price | Email Limit | SMS/Day | Seats | Est. COGS | Margin |
|------|-------|-------------|---------|-------|-----------|--------|
| Solo | $9 | 50 | 2 | 1 | $0.80 | ~91% |
| Pro | $19 | 100 | 5 | 1 | $2.40 | ~87% |
| Business | $39 | 75 | 2/seat | 5 | $4.14 | ~89% |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited | N/A | Negotiated |

Notes:
- Solo raised from 25→50 (still 91% margin, more competitive)
- Pro raised from 75→100 (87% margin, better value perception)
- Business: email limit REDUCED from 150→75, SMS/day REDUCED from 10→2/seat
  (The old 150 emails × 10 SMS × 5 seats was deeply unprofitable at 38% margin)
- All estimates use 70% utilization rate and GPT-4o-mini pricing

/**
 * AI Email Intelligence Engine
 * Classifies emails and generates natural, human-sounding SMS briefings.
 * Raw email text is processed in-memory and never persisted unencrypted.
 * No third-party AI tool names are exposed to users.
 * Uses OpenRouter (google/gemini-2.0-flash-001) for all AI calls.
 */
import { invokeOpenRouter } from "./openrouter";

export type EmailCategory = "high_priority" | "general" | "ignore";

export interface EmailInput {
  subject: string;
  from: string;
  snippet: string; // First ~300 chars of body
}

export interface ClassifiedEmail {
  category: EmailCategory;
  subject: string;
  from: string;
  snippet: string;
}

export interface BriefingPreferences {
  toneStyle?: "concise" | "conversational" | "detailed";
  keywordsInclude?: string; // comma-separated
  keywordsExclude?: string; // comma-separated
  language?: string;        // ISO 639-1 e.g. "en", "es", "fr"
}

// Supported languages for briefings
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
  zh: "Chinese (Simplified)",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  ru: "Russian",
};

/** Hard SMS character limit — enforced both in the prompt and post-generation. */
const SMS_CHAR_LIMIT = 500;

/**
 * Truncates text to the SMS character limit at a sentence or word boundary.
 * Never cuts mid-word. Appends "…" if truncated.
 */
export function truncateToSmsLimit(text: string, limit = SMS_CHAR_LIMIT): string {
  if (text.length <= limit) return text;

  // Try to cut at last sentence boundary within limit
  const truncated = text.slice(0, limit - 1);
  const lastPeriod = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? ")
  );

  if (lastPeriod > limit * 0.6) {
    // Good sentence boundary found — cut there
    return truncated.slice(0, lastPeriod + 1).trim();
  }

  // Fall back to last word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace).trim() + "…";
  }

  return truncated.trim() + "…";
}

/**
 * Classifies a batch of emails into high_priority, general, or ignore.
 * Uses structured JSON output for reliable parsing.
 */
export async function classifyEmails(
  emails: EmailInput[],
  prefs?: BriefingPreferences
): Promise<ClassifiedEmail[]> {
  if (emails.length === 0) return [];

  const includeKeywords = prefs?.keywordsInclude
    ? `\nAlways mark as high_priority if subject/sender contains: ${prefs.keywordsInclude}`
    : "";
  const excludeKeywords = prefs?.keywordsExclude
    ? `\nAlways mark as ignore if subject/sender contains: ${prefs.keywordsExclude}`
    : "";

  const emailList = emails
    .map((e, i) => `[${i}] From: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet}`)
    .join("\n\n");

  const response = await invokeOpenRouter({
    messages: [
      {
        role: "system",
        content: `You are an expert email triage assistant for small business owners and professionals.
Classify each email as:
- "high_priority": client inquiries, new leads, job applicants, purchase orders, invoices, contracts, urgent requests, project updates from known clients, interview requests, partnership proposals
- "general": team updates, tool notifications the user actively uses, scheduled reports, non-urgent vendor emails
- "ignore": marketing spam, promotional offers, automated system alerts, social media notifications, mass newsletters, coupon emails, unsolicited cold outreach${includeKeywords}${excludeKeywords}

Return ONLY a JSON object with a "classifications" array. Each item: {"index": <number>, "category": "<high_priority|general|ignore>"}`,
      },
      {
        role: "user",
        content: `Classify these ${emails.length} emails:\n\n${emailList}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_classifications",
        strict: true,
        schema: {
          type: "object",
          properties: {
            classifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "integer" },
                  category: { type: "string", enum: ["high_priority", "general", "ignore"] },
                },
                required: ["index", "category"],
                additionalProperties: false,
              },
            },
          },
          required: ["classifications"],
          additionalProperties: false,
        },
      },
    },
    max_tokens: 512,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  const classifications: { index: number; category: EmailCategory }[] = parsed.classifications ?? [];

  return emails.map((email, i) => {
    const classification = classifications.find((c) => c.index === i);
    return {
      ...email,
      category: classification?.category ?? "general",
    };
  });
}

/**
 * Generates a natural, human-sounding SMS briefing from classified emails.
 * Hard limit: 500 characters (enforced in prompt + post-generation truncation).
 * Supports multi-language output and user tone preferences.
 * Raw text is used only during this call and never stored unencrypted.
 */
export async function generateSmsBriefing(
  highPriority: ClassifiedEmail[],
  general: ClassifiedEmail[],
  userName: string,
  prefs?: BriefingPreferences
): Promise<string> {
  const firstName = userName.split(" ")[0] ?? "there";
  const totalCount = highPriority.length + general.length;
  const language = prefs?.language ?? "en";
  const langName = SUPPORTED_LANGUAGES[language] ?? "English";
  const tone = prefs?.toneStyle ?? "conversational";

  if (totalCount === 0) {
    const emptyMessages: Record<string, string> = {
      en: `Hey ${firstName}, your inbox is clear — no new important emails since your last briefing. Enjoy the quiet!`,
      es: `Hola ${firstName}, tu bandeja está despejada — sin correos importantes desde tu último resumen. ¡Disfruta la calma!`,
      fr: `Bonjour ${firstName}, votre boîte est vide — aucun email important depuis votre dernier résumé. Profitez du calme !`,
      de: `Hallo ${firstName}, Ihr Posteingang ist leer — keine neuen wichtigen E-Mails seit Ihrer letzten Zusammenfassung.`,
      pt: `Oi ${firstName}, sua caixa está limpa — sem e-mails importantes desde seu último resumo. Aproveite!`,
    };
    return truncateToSmsLimit(emptyMessages[language] ?? emptyMessages.en);
  }

  // Build a structured context for the AI — include specific details for natural output
  const hpContext = highPriority.slice(0, 6).map((e) => {
    const senderName = e.from.split("<")[0].trim().replace(/"/g, "").trim() || e.from;
    return `- From ${senderName}: "${e.subject}" — ${e.snippet.slice(0, 100)}`;
  }).join("\n");

  const genContext = general.slice(0, 4).map((e) => {
    return `- "${e.subject}" from ${e.from.split("<")[0].trim()}`;
  }).join("\n");

  const toneInstructions: Record<string, string> = {
    concise: "Be extremely brief. Use short phrases. No filler words.",
    conversational: "Sound like a knowledgeable assistant texting a friend. Natural, warm, direct.",
    detailed: "Include more specifics from each email. Still stay under 500 characters.",
  };

  const response = await invokeOpenRouter({
    messages: [
      {
        role: "system",
        content: `You write SMS briefings for busy professionals. Write in ${langName}.
Tone: ${toneInstructions[tone] ?? toneInstructions.conversational}

Critical rules:
- MAXIMUM ${SMS_CHAR_LIMIT} CHARACTERS TOTAL (hard limit — count every character)
- Sound HUMAN and NATURAL — like a smart assistant, not a robot
- Lead with the most important items using specific details
- Use natural language like "You have 3 applicants for [role]", "Sarah Chen sent a contract"
- For counts, be specific: "2 new leads", "1 invoice from Acme", not just "emails"
- End with a quick count summary in parentheses e.g. (2 urgent, 4 general)
- Plain text only — no markdown, no bullet points, no emojis
- Do NOT mention any software, app names, or AI tools`,
      },
      {
        role: "user",
        content: `Write a briefing for ${firstName}. Total: ${highPriority.length} priority, ${general.length} general emails.

${highPriority.length > 0 ? `PRIORITY EMAILS:\n${hpContext}` : ""}
${general.length > 0 ? `\nGENERAL EMAILS:\n${genContext}` : ""}`,
      },
    ],
    max_tokens: 256,
  });

  const rawText = response.choices[0]?.message?.content ?? "";
  const text = typeof rawText === "string" ? rawText : JSON.stringify(rawText);

  // Post-generation safety net: enforce 500-char limit with smart truncation
  return truncateToSmsLimit(text.trim());
}

/**
 * Applies user feedback to improve future briefing preferences.
 * Returns updated preference suggestions based on the feedback.
 */
export async function processBriefingFeedback(
  feedback: {
    rating: number;
    toneAdjustment?: string;
    addKeywords?: string;
    removeKeywords?: string;
    freeformNote?: string;
  },
  currentPrefs: BriefingPreferences
): Promise<BriefingPreferences> {
  // Map tone adjustment to toneStyle
  const toneMap: Record<string, BriefingPreferences["toneStyle"]> = {
    more_concise: "concise",
    more_detail: "detailed",
    more_casual: "conversational",
    more_formal: "concise",
    perfect: currentPrefs.toneStyle ?? "conversational",
  };

  const newTone = feedback.toneAdjustment
    ? (toneMap[feedback.toneAdjustment] ?? currentPrefs.toneStyle)
    : currentPrefs.toneStyle;

  // Merge keywords
  const existingInclude = (currentPrefs.keywordsInclude ?? "").split(",").filter(Boolean);
  const existingExclude = (currentPrefs.keywordsExclude ?? "").split(",").filter(Boolean);

  const newInclude = feedback.addKeywords
    ? [...new Set([...existingInclude, ...feedback.addKeywords.split(",").map(k => k.trim())])]
    : existingInclude;

  const newExclude = feedback.removeKeywords
    ? [...new Set([...existingExclude, ...feedback.removeKeywords.split(",").map(k => k.trim())])]
    : existingExclude;

  return {
    ...currentPrefs,
    toneStyle: newTone,
    keywordsInclude: newInclude.join(",") || undefined,
    keywordsExclude: newExclude.join(",") || undefined,
  };
}

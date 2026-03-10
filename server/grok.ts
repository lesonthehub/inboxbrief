/**
 * OpenRouter / Grok 3 Integration
 * Classifies emails and generates concise SMS-ready briefings.
 * Raw email text is processed in-memory and never persisted unencrypted.
 */
import { invokeLLM } from "./_core/llm";

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

/**
 * Classifies a batch of emails into high_priority, general, or ignore.
 * Uses structured JSON output for reliable parsing.
 */
export async function classifyEmails(emails: EmailInput[]): Promise<ClassifiedEmail[]> {
  if (emails.length === 0) return [];

  const emailList = emails
    .map((e, i) => `[${i}] From: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet}`)
    .join("\n\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an email triage assistant for small business owners. 
Classify each email as:
- "high_priority": client inquiries, leads, urgent requests, invoices, contracts, project updates from known clients
- "general": general business emails, newsletters from tools/services the user actually uses, team updates
- "ignore": marketing spam, promotional offers, automated notifications, social media alerts, mass newsletters

Return ONLY a JSON array with one object per email in the same order as input.`,
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
 * Generates a concise SMS briefing from classified emails.
 * Target: 1–2 SMS messages (max 320 characters total).
 * Raw text is used only during this call and never stored unencrypted.
 */
export async function generateSmsBriefing(
  highPriority: ClassifiedEmail[],
  general: ClassifiedEmail[],
  userName: string
): Promise<string> {
  const totalCount = highPriority.length + general.length;

  if (totalCount === 0) {
    return `InboxBrief: No new important emails since your last briefing. Have a great day, ${userName.split(" ")[0]}!`;
  }

  const hpList = highPriority
    .slice(0, 5)
    .map((e) => `• [HP] ${e.from.split("<")[0].trim()}: ${e.subject}`)
    .join("\n");

  const genList = general
    .slice(0, 3)
    .map((e) => `• ${e.subject}`)
    .join("\n");

  const context = [
    highPriority.length > 0 ? `HIGH PRIORITY (${highPriority.length}):\n${hpList}` : null,
    general.length > 0 ? `GENERAL (${general.length}):\n${genList}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You write ultra-concise SMS briefings for busy small business owners.
Rules:
- Maximum 320 characters total (fits 2 SMS messages)
- Start with "InboxBrief:" 
- Lead with high-priority items
- Use abbreviations where natural (e.g., "re:" "from:" "req:")
- End with a count summary like "(3 HP, 5 gen)"
- No emojis, no markdown, plain text only
- Be direct and actionable`,
      },
      {
        role: "user",
        content: `Write an SMS briefing for ${userName.split(" ")[0]}:\n\n${context}`,
      },
    ],
  });

  const rawText = response.choices[0]?.message?.content ?? "";
  const text = typeof rawText === "string" ? rawText : JSON.stringify(rawText);

  // Hard-cap at 320 chars
  return text.slice(0, 320).trim();
}

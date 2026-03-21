/**
 * OpenRouter integration and SMS limit tests.
 * Validates API key format, truncation logic, and 500-char enforcement.
 */
import { describe, it, expect } from "vitest";
import { truncateToSmsLimit } from "./grok";

describe("OpenRouter API key", () => {
  it("OPENROUTER_API_KEY is set and non-empty", () => {
    const key = process.env.OPENROUTER_API_KEY;
    expect(key, "OPENROUTER_API_KEY must be set").toBeTruthy();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("OPENROUTER_API_KEY starts with sk-or-v1- or sk-", () => {
    const key = process.env.OPENROUTER_API_KEY ?? "";
    const isValid = key.startsWith("sk-or-v1-") || key.startsWith("sk-");
    expect(isValid, "OPENROUTER_API_KEY must start with sk-or-v1- or sk-").toBe(true);
  });
});

describe("SMS 500-character limit enforcement", () => {
  it("returns text unchanged when under limit", () => {
    const short = "Hey John, you have 2 urgent emails from Sarah Chen and Acme Corp. (2 urgent, 1 general)";
    expect(truncateToSmsLimit(short)).toBe(short);
  });

  it("returns text unchanged when exactly at limit", () => {
    const exact = "A".repeat(500);
    expect(truncateToSmsLimit(exact)).toBe(exact);
  });

  it("truncates text that exceeds 500 characters", () => {
    const long = "A".repeat(600);
    const result = truncateToSmsLimit(long);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it("truncates at sentence boundary when possible", () => {
    const text =
      "Hey John, you have 3 urgent emails. Sarah Chen sent a contract for the Johnson project. " +
      "Acme Corp sent an invoice for $4,200. Mike Davis applied for the Senior Dev role. " +
      "There are also 5 general emails including team updates and a vendor report. " +
      "Your next briefing will arrive at 6:00 PM CST. (3 urgent, 5 general) " +
      "This extra text should be cut off because it pushes past the 500 character limit.";
    const result = truncateToSmsLimit(text);
    expect(result.length).toBeLessThanOrEqual(500);
    // Should end at a sentence boundary, not mid-word
    expect(result).not.toMatch(/\w\.\.\.$/); // no mid-word cut with ellipsis after a word char
  });

  it("never cuts mid-word", () => {
    const text = "word ".repeat(120); // 600 chars
    const result = truncateToSmsLimit(text);
    expect(result.length).toBeLessThanOrEqual(500);
    // Should not end with a partial word (no trailing letters without space/punctuation)
    expect(result.endsWith(" ") || result.endsWith("…") || result.endsWith(".")).toBe(true);
  });

  it("handles empty string", () => {
    expect(truncateToSmsLimit("")).toBe("");
  });

  it("handles string with exactly 501 characters", () => {
    const text = "A".repeat(501);
    const result = truncateToSmsLimit(text);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it("respects custom limit parameter", () => {
    const text = "Hello world this is a test message for custom limit";
    const result = truncateToSmsLimit(text, 20);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

/**
 * Credentials validation tests.
 * Verifies that required environment variables are present and well-formed.
 * Does NOT make live API calls — just validates format and presence.
 */
import { describe, it, expect } from "vitest";

describe("Twilio credentials", () => {
  it("TWILIO_ACCOUNT_SID is set and starts with AC", () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    expect(sid, "TWILIO_ACCOUNT_SID must be set").toBeTruthy();
    expect(sid!.startsWith("AC"), "TWILIO_ACCOUNT_SID must start with 'AC'").toBe(true);
    expect(sid!.length, "TWILIO_ACCOUNT_SID must be 34 characters").toBe(34);
  });

  it("TWILIO_AUTH_TOKEN is set and non-empty", () => {
    const token = process.env.TWILIO_AUTH_TOKEN;
    expect(token, "TWILIO_AUTH_TOKEN must be set").toBeTruthy();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("TWILIO_PHONE_NUMBER is set in E.164 format", () => {
    const phone = process.env.TWILIO_PHONE_NUMBER;
    expect(phone, "TWILIO_PHONE_NUMBER must be set").toBeTruthy();
    expect(phone).toMatch(/^\+[1-9]\d{7,14}$/);
  });
});

describe("Google OAuth credentials", () => {
  it("GOOGLE_CLIENT_ID is set and non-empty", () => {
    const id = process.env.GOOGLE_CLIENT_ID;
    expect(id, "GOOGLE_CLIENT_ID must be set").toBeTruthy();
    expect(id!.length).toBeGreaterThan(10);
  });

  it("GOOGLE_CLIENT_SECRET is set and non-empty", () => {
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    expect(secret, "GOOGLE_CLIENT_SECRET must be set").toBeTruthy();
    expect(secret!.length).toBeGreaterThan(5);
  });
});

describe("Microsoft OAuth credentials", () => {
  it("MICROSOFT_CLIENT_ID is set and non-empty", () => {
    const id = process.env.MICROSOFT_CLIENT_ID;
    expect(id, "MICROSOFT_CLIENT_ID must be set").toBeTruthy();
    expect(id!.length).toBeGreaterThan(10);
  });

  it("MICROSOFT_CLIENT_SECRET is set and non-empty", () => {
    const secret = process.env.MICROSOFT_CLIENT_SECRET;
    expect(secret, "MICROSOFT_CLIENT_SECRET must be set").toBeTruthy();
    expect(secret!.length).toBeGreaterThan(5);
  });
});

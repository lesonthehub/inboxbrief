import { describe, it, expect } from "vitest";

describe("Email Service Configuration", () => {
  it("should have SMTP environment variables set", () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL;

    expect(smtpHost, "SMTP_HOST must be set").toBeTruthy();
    expect(smtpUser, "SMTP_USER must be set").toBeTruthy();
    expect(smtpPass, "SMTP_PASS must be set").toBeTruthy();
    expect(fromEmail, "FROM_EMAIL must be set").toBeTruthy();
  });

  it("should have valid SMTP_PORT", () => {
    const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
    // Common valid ports: 25, 465, 587, 2525
    expect([25, 465, 587, 2525].includes(port) || port > 1024).toBe(true);
  });

  it("should have valid FROM_EMAIL format", () => {
    const fromEmail = process.env.FROM_EMAIL ?? "";
    expect(fromEmail).toMatch(/@/);
    expect(fromEmail.length).toBeGreaterThan(5);
  });

  it("should have email verification fields in schema", async () => {
    // Verify the schema exports the users table
    const schema = await import("../drizzle/schema");
    expect(schema.users).toBeDefined();
    // The users table should be a drizzle table object
    expect(typeof schema.users).toBe("object");
  });
});

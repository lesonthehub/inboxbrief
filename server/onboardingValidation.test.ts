import { describe, expect, it } from "vitest";
import { getOnboardingSubmissionError } from "../client/src/lib/onboardingValidation";

const complete = {
  businessType: "Consulting",
  userRole: "solo_owner",
  teamSize: "just_me",
  inboxChallenge: "too_much_volume",
};

describe("onboarding submission validation", () => {
  it("allows a complete trial submission", () => {
    expect(getOnboardingSubmissionError(complete)).toBeNull();
  });

  it("returns a visible error for an incomplete submission", () => {
    expect(getOnboardingSubmissionError({ ...complete, userRole: null })).toBe("Please select your role.");
  });
});


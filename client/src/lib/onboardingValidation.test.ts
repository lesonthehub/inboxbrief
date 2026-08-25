import { describe, expect, it } from "vitest";
import { getOnboardingSubmissionError } from "./onboardingValidation";

const complete = {
  businessType: "Consulting",
  userRole: "solo_owner",
  teamSize: "just_me",
  inboxChallenge: "too_much_volume",
};

describe("getOnboardingSubmissionError", () => {
  it("allows a complete trial submission", () => {
    expect(getOnboardingSubmissionError(complete)).toBeNull();
  });

  it("explains why a partial submission cannot start a trial", () => {
    expect(getOnboardingSubmissionError({ ...complete, userRole: null })).toBe("Please select your role.");
  });
});

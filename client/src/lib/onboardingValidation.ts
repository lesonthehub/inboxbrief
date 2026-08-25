export function getOnboardingSubmissionError(values: {
  businessType: string;
  userRole: string | null;
  teamSize: string | null;
  inboxChallenge: string | null;
}): string | null {
  if (!values.businessType) return "Please select your business type.";
  if (!values.userRole) return "Please select your role.";
  if (!values.teamSize) return "Please select your team size.";
  if (!values.inboxChallenge) return "Please select your inbox challenge.";
  return null;
}

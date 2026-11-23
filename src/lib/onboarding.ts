export function getResumeScreen(user: any): string {
  if (!user.emailVerified) return 'EmailVerify';
  if (!user.province) return 'OnboardingProvince';
  if (!user.phoneVerified) return 'OnboardingPhone';
  if (!user.dateOfBirth) return 'OnboardingDob';
  if (!user.gender) return 'OnboardingGender';
  if (!user.preferredLanguage) return 'OnboardingLanguage';
  // photo is always bypassed, skip it in resume
  if (!user.bio) return 'OnboardingBio';
  return 'OnboardingNotifications';
}

export const ONBOARDING_KEY = 'onboardingComplete';
export const THEME_KEY = 'theme';

let memoryOnboardingComplete = false;

export function isOnboardingComplete() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch (e) {
    return memoryOnboardingComplete;
  }
}

export function setOnboardingComplete(value = true) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_KEY, value ? 'true' : 'false');
    }
    memoryOnboardingComplete = value;
    return true;
  } catch (e) {
    memoryOnboardingComplete = value;
    return false;
  }
}

export function resetOnboarding() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ONBOARDING_KEY);
    }
  } catch (e) {
    // no-op
  }
}

export function setTheme(theme) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme);
    }
  } catch (e) {
    // no-op
  }
}

export function getTheme() {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(THEME_KEY);
    }
  } catch (e) {
    // no-op
  }
  return null;
}

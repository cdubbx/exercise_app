import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_STORAGE_KEY = 'tutorial-key:v1';
const TUTORIAL_COMPLETED_KEY = 'tutorial:completed:v1';
// If set to 'true', always show tutorial (even if completed).
const TUTORIAL_DEV_TOKEN_KEY = 'tutorial:dev_Token';
// Backward-compat: older override keys (true meant force-show).
const TUTORIAL_DEBUG_OVERRIDE_KEY = 'tutorial-debug:override:v1';
const TUTORIAL_OVERRIDE_KEY = 'tutorial:override:v1';

type TutorialTokenResult = {token: string; created: boolean};

let tutorialTokenInFlight: Promise<TutorialTokenResult> | null = null;
let cachedTutorialToken: string | null = null;
let cachedForceShow: boolean | undefined = undefined;
let cachedCompletedToken: string | null | undefined = undefined;

const logTutorial = (...args: any[]) => {
  if (!__DEV__) return;
  console.log('[tutorialStorage]', ...args);
};

const createTutorialToken = (): string => {
  // Not security-sensitive: used only as an install marker / debugging aid.
  // Avoids `uuid` in RN environments without `crypto.getRandomValues`.
  return `t_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const getOrCreateTutorialToken = async (): Promise<TutorialTokenResult> => {
  if (cachedTutorialToken) return {token: cachedTutorialToken, created: false};
  if (tutorialTokenInFlight) return tutorialTokenInFlight;

  const op = (async (): Promise<TutorialTokenResult> => {
    try {
      const existing = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (existing) {
        cachedTutorialToken = existing;
        logTutorial('getOrCreateTutorialToken: existing token found');
        return {token: existing, created: false};
      }

      const token = createTutorialToken();
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, token);
      cachedTutorialToken = token;
      logTutorial('getOrCreateTutorialToken: created new token');
      return {token, created: true};
    } catch (error) {
      logTutorial('getOrCreateTutorialToken: error', error);
      const token = createTutorialToken();
      cachedTutorialToken = token;
      return {token, created: true};
    }
  })();

  tutorialTokenInFlight = op.finally(() => {
    tutorialTokenInFlight = null;
  });

  return tutorialTokenInFlight;
};

export const getTutorialToken = async (): Promise<string> => {
  const {token} = await getOrCreateTutorialToken();
  return token;
};

export const getForceShowTutorial = async (): Promise<boolean> => {
  if (cachedForceShow !== undefined) return cachedForceShow;

  const devTokenRaw = await AsyncStorage.getItem(TUTORIAL_DEV_TOKEN_KEY);
  const overrideRaw = await AsyncStorage.getItem(TUTORIAL_OVERRIDE_KEY);
  const legacyOverrideRaw = await AsyncStorage.getItem(TUTORIAL_DEBUG_OVERRIDE_KEY);
  const raw = devTokenRaw ?? overrideRaw ?? legacyOverrideRaw;

  cachedForceShow = raw === 'true';
  logTutorial('getForceShowTutorial:', {
    devTokenRaw,
    overrideRaw,
    legacyOverrideRaw,
    raw,
    cachedForceShow,
  });
  return cachedForceShow;
};

export const setForceShowTutorial = async (forceShow: boolean): Promise<void> => {
  if (forceShow) {
    await AsyncStorage.setItem(TUTORIAL_DEV_TOKEN_KEY, 'true');
  } else {
    await AsyncStorage.multiRemove([
      TUTORIAL_DEV_TOKEN_KEY,
      TUTORIAL_OVERRIDE_KEY,
      TUTORIAL_DEBUG_OVERRIDE_KEY,
    ]);
  }
  cachedForceShow = forceShow;
  logTutorial('setForceShowTutorial:', {forceShow});
};

export const getTutorialCompletedToken = async (): Promise<string | null> => {
  if (cachedCompletedToken !== undefined) return cachedCompletedToken;
  const token = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
  cachedCompletedToken = token;
  logTutorial('getTutorialCompletedToken:', {token});
  return token;
};

export const markTutorialCompleted = async (): Promise<string> => {
  const token = await getTutorialToken();
  await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, token);
  cachedCompletedToken = token;
  logTutorial('markTutorialCompleted: set completed token', {token});
  return token;
};

export const clearTutorialCompleted = async (): Promise<void> => {
  await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  cachedCompletedToken = null;
  logTutorial('clearTutorialCompleted');
};

// Backward-compatible names (your screens/context might still call these).
// Boolean-only "flip": `true` forces showing, `false` restores normal logic.
export const getTutorialOverride = getForceShowTutorial;
export const setTutorialOverride = async (override: boolean | null) =>
  setForceShowTutorial(override === true);
export const getTutorialDebugOverride = async (): Promise<boolean | null> =>
  (await getTutorialOverride()) ? true : null;
export const setTutorialDebugOverride = setTutorialOverride;

export const shouldShowTutorial = async (): Promise<boolean> => {
  const forceShow = await getForceShowTutorial();
  if (forceShow) {
    logTutorial('shouldShowTutorial: forceShow=true -> show');
    return true;
  }

  const completedToken = await getTutorialCompletedToken();
  const shouldShow = completedToken == null;
  logTutorial('shouldShowTutorial:', {completedToken, shouldShow});
  return shouldShow;
};

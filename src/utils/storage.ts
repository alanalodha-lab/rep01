import { UserProfile, DailyLog, WorkoutSetting } from '../types/fitness';

const PROFILE_KEY = 'pulsefit_user_profile';
const DAILY_LOGS_KEY = 'pulsefit_daily_logs';
const ACTIVE_SETTING_KEY = 'pulsefit_active_setting_override';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (error) {
    console.error('Error reading user profile from localStorage:', error);
    return null;
  }
}

export function saveStoredProfile(profile: UserProfile): boolean {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile to localStorage:', error);
    return false;
  }
}

export function getAllDailyLogs(): Record<string, DailyLog> {
  try {
    const raw = localStorage.getItem(DAILY_LOGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DailyLog>;
  } catch (error) {
    console.error('Error reading daily logs from localStorage:', error);
    return {};
  }
}

export function getDailyLog(date: string): DailyLog {
  const logs = getAllDailyLogs();
  if (logs[date]) {
    return logs[date];
  }
  return {
    date,
    waterMl: 0,
    meals: [],
    activities: [],
    completedWorkoutDayIds: []
  };
}

export function saveDailyLog(log: DailyLog): boolean {
  try {
    const logs = getAllDailyLogs();
    logs[log.date] = log;
    localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(logs));
    return true;
  } catch (error) {
    console.error('Error saving daily log to localStorage:', error);
    return false;
  }
}

export function getActiveSettingOverride(): WorkoutSetting | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SETTING_KEY);
    if (raw === 'gym' || raw === 'outdoor' || raw === 'home') {
      return raw as WorkoutSetting;
    }
    return null;
  } catch {
    return null;
  }
}

export function setActiveSettingOverride(setting: WorkoutSetting | null): void {
  try {
    if (setting) {
      localStorage.setItem(ACTIVE_SETTING_KEY, setting);
    } else {
      localStorage.removeItem(ACTIVE_SETTING_KEY);
    }
  } catch (error) {
    console.error('Error updating active setting override:', error);
  }
}

export function resetAllPulseFitData(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(DAILY_LOGS_KEY);
    localStorage.removeItem(ACTIVE_SETTING_KEY);
    // Remove any leftover keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('pulsefit_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (error) {
    console.error('Error resetting PulseFit data:', error);
  }
}

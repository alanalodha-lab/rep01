import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  DailyLog, 
  WorkoutPlan, 
  CalorieAndMacros, 
  WorkoutSetting,
  ActivityEntry
} from './types/fitness';
import { 
  getStoredProfile, 
  saveStoredProfile, 
  getDailyLog, 
  saveDailyLog, 
  getAllDailyLogs, 
  getTodayDateString, 
  getActiveSettingOverride, 
  setActiveSettingOverride, 
  resetAllPulseFitData 
} from './utils/storage';
import { calculateCaloriesAndMacros, generateWorkoutPlan } from './utils/recommendations';

// Components
import { Onboarding } from './components/Onboarding';
import { TodayDashboard } from './components/TodayDashboard';
import { WorkoutsView } from './components/WorkoutsView';
import { ActivityView } from './components/ActivityView';
import { NutritionView } from './components/NutritionView';
import { ProfileView } from './components/ProfileView';
import { AuthScreen } from './components/AuthScreen';

// Icons
import { 
  Home as HomeIcon, 
  Dumbbell, 
  Activity as ActivityIcon, 
  Utensils, 
  User, 
  Plus, 
  Compass, 
  ShieldCheck,
  ChevronRight,
  Flame,
  Droplet
} from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => getStoredProfile());
  const [showAuth, setShowAuth] = useState<boolean>(() => !getStoredProfile());
  const [activeTab, setActiveTab] = useState<'today' | 'workouts' | 'activity' | 'nutrition' | 'profile'>('today');
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [allLogs, setAllLogs] = useState<Record<string, DailyLog>>(() => getAllDailyLogs());
  const [currentLog, setCurrentLog] = useState<DailyLog>(() => getDailyLog(getTodayDateString()));
  const [activeSetting, setActiveSetting] = useState<WorkoutSetting>(() => {
    return getActiveSettingOverride() || profile?.primarySetting || 'gym';
  });

  // Modals
  const [showQuickMealModal, setShowQuickMealModal] = useState(false);
  const [showQuickActivityModal, setShowQuickActivityModal] = useState(false);

  // Sync log whenever currentDate changes
  useEffect(() => {
    const log = getDailyLog(currentDate);
    setCurrentLog(log);
  }, [currentDate]);

  // Keep allLogs in sync
  useEffect(() => {
    setAllLogs(getAllDailyLogs());
  }, [currentLog]);

  // Update profile handler
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    saveStoredProfile(updatedProfile);
    setProfile(updatedProfile);
    if (!getActiveSettingOverride()) {
      setActiveSetting(updatedProfile.primarySetting);
    }
  };

  // Onboarding completion
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    saveStoredProfile(newProfile);
    setProfile(newProfile);
    setActiveSetting(newProfile.primarySetting);
    setActiveTab('today');
  };

  // Setting change
  const handleSettingChange = (newSetting: WorkoutSetting) => {
    setActiveSetting(newSetting);
    setActiveSettingOverride(newSetting);
  };

  // Daily log updater
  const handleUpdateDailyLog = (updated: DailyLog) => {
    saveDailyLog(updated);
    setCurrentLog(updated);
    setAllLogs(prev => ({ ...prev, [updated.date]: updated }));
  };

  // Reset all data
  const handleResetAllData = () => {
    resetAllPulseFitData();
    setProfile(null);
    setCurrentDate(getTodayDateString());
    setCurrentLog({
      date: getTodayDateString(),
      waterMl: 0,
      meals: [],
      activities: [],
      completedWorkoutDayIds: []
    });
    setActiveTab('today');
  };

  // Date navigation
  const handleChangeDate = (offset: number) => {
    if (offset === 0) {
      setCurrentDate(getTodayDateString());
      return;
    }
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const newStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setCurrentDate(newStr);
  };

  // New users can choose to continue locally or view the account entry screen.
  if (!profile && showAuth) {
    return <AuthScreen onContinueWithoutAccount={() => setShowAuth(false)} />;
  }

  // If no profile, show onboarding
  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Derived plans & targets
  const nutritionTarget: CalorieAndMacros = calculateCaloriesAndMacros(profile);
  const activePlan: WorkoutPlan = generateWorkoutPlan(profile, activeSetting);
  const isToday = currentDate === getTodayDateString();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Desktop Sidebar (visible on md+) */}
      <aside className="hidden md:flex flex-col justify-between w-64 border-r border-zinc-800/80 bg-zinc-950 p-6 sticky top-0 h-screen shrink-0">
        <div className="space-y-8">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B026FF]/15 border border-[#B026FF]/60 flex items-center justify-center text-[#D8A5FF] font-extrabold text-base shadow-[0_0_18px_rgba(176,38,255,0.22)]">
              Pf
            </div>
            <div>
              <span className="font-bold text-zinc-100 text-lg tracking-tight block">
                PulseFit
              </span>
              <span className="text-[11px] font-mono text-zinc-500 block -mt-0.5">
                v1.0 · Adaptive
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {[
              { id: 'today', label: 'Today', icon: HomeIcon },
              { id: 'workouts', label: 'Workouts', icon: Dumbbell },
              { id: 'activity', label: 'Activity', icon: ActivityIcon },
              { id: 'nutrition', label: 'Nutrition', icon: Utensils },
              { id: 'profile', label: 'Profile', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Environment Snapshot */}
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Environment</span>
              <span className="font-mono text-emerald-400 font-semibold capitalize">
                {activeSetting}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Goal</span>
              <span className="text-zinc-300 capitalize truncate max-w-[100px]">
                {profile.goal.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="pt-4 border-t border-zinc-900 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>Local Storage Active</span>
          </div>
          <div className="text-[10px] text-zinc-600">
            No cloud database required.
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 max-w-5xl">
        {activeTab === 'today' && (
          <TodayDashboard
            profile={profile}
            dailyLog={currentLog}
            workoutPlan={activePlan}
            nutritionTarget={nutritionTarget}
            onUpdateDailyLog={handleUpdateDailyLog}
            onNavigateTab={setActiveTab}
            onOpenQuickMealModal={() => setShowQuickMealModal(true)}
            onOpenQuickActivityModal={() => setShowQuickActivityModal(true)}
            onStartOutdoorTracking={() => setActiveTab('activity')}
            currentDate={currentDate}
            onChangeDate={handleChangeDate}
            isToday={isToday}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            profile={profile}
            activePlan={activePlan}
            onSettingChange={handleSettingChange}
            dailyLog={currentLog}
            onUpdateDailyLog={handleUpdateDailyLog}
            currentDate={currentDate}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityView
            profile={profile}
            dailyLog={currentLog}
            allLogs={allLogs}
            onUpdateDailyLog={handleUpdateDailyLog}
            currentDate={currentDate}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionView
            profile={profile}
            dailyLog={currentLog}
            allLogs={allLogs}
            nutritionTarget={nutritionTarget}
            onUpdateDailyLog={handleUpdateDailyLog}
            currentDate={currentDate}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-2 py-1 safe-area-bottom"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 items-center h-16">
          {[
            { id: 'today', label: 'Today', icon: HomeIcon },
            { id: 'workouts', label: 'Workouts', icon: Dumbbell },
            { id: 'activity', label: 'Activity', icon: ActivityIcon },
            { id: 'nutrition', label: 'Nutrition', icon: Utensils },
            { id: 'profile', label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-medium tracking-tight mt-1">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Add Meal Modal */}
      {showQuickMealModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100">Quick Log Meal</h3>
              <button
                type="button"
                onClick={() => setShowQuickMealModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('mealName') as HTMLInputElement).value;
                const cal = parseInt((form.elements.namedItem('mealCal') as HTMLInputElement).value) || 0;
                const prot = parseInt((form.elements.namedItem('mealProt') as HTMLInputElement).value) || 0;

                handleUpdateDailyLog({
                  ...currentLog,
                  meals: [
                    {
                      id: `meal-${Date.now()}`,
                      name,
                      mealType: 'snack',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      calories: cal,
                      proteinGrams: prot,
                      carbsGrams: Math.round(cal * 0.4 / 4),
                      fatGrams: Math.round(cal * 0.25 / 9),
                    },
                    ...currentLog.meals,
                  ],
                });
                setShowQuickMealModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Meal Title</label>
                <input
                  name="mealName"
                  required
                  defaultValue="Quick Balanced Meal"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Calories</label>
                  <input
                    name="mealCal"
                    type="number"
                    required
                    defaultValue={450}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Protein (g)</label>
                  <input
                    name="mealProt"
                    type="number"
                    defaultValue={30}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors mt-2"
              >
                Add Meal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Activity Modal */}
      {showQuickActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100">Quick Log Activity</h3>
              <button
                type="button"
                onClick={() => setShowQuickActivityModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('actTitle') as HTMLInputElement).value;
                const mins = parseInt((form.elements.namedItem('actMins') as HTMLInputElement).value) || 30;
                const cal = Math.round(mins * 6);

                const newAct: ActivityEntry = {
                  id: `manual-${Date.now()}`,
                  title,
                  type: 'manual',
                  source: 'manual',
                  timestamp: new Date().toISOString(),
                  date: currentDate,
                  steps: mins * 100,
                  distanceKm: Math.round((mins * 0.08) * 10) / 10,
                  activeMinutes: mins,
                  caloriesBurned: cal,
                };

                handleUpdateDailyLog({
                  ...currentLog,
                  activities: [newAct, ...currentLog.activities],
                });
                setShowQuickActivityModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Activity Name</label>
                <input
                  name="actTitle"
                  required
                  defaultValue="Power Walk / Jog"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Duration (minutes)</label>
                <input
                  name="actMins"
                  type="number"
                  min="1"
                  max="300"
                  required
                  defaultValue={30}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors mt-2"
              >
                Add Activity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

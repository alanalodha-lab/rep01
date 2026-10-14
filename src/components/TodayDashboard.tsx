import React from 'react';
import { 
  UserProfile, 
  DailyLog, 
  WorkoutPlan, 
  CalorieAndMacros 
} from '../types/fitness';
import { 
  Footprints, 
  Clock, 
  Flame, 
  Droplet, 
  Dumbbell, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  Compass, 
  Utensils, 
  Activity as ActivityIcon,
  ChevronLeft
} from 'lucide-react';

interface TodayDashboardProps {
  profile: UserProfile;
  dailyLog: DailyLog;
  workoutPlan: WorkoutPlan;
  nutritionTarget: CalorieAndMacros;
  onUpdateDailyLog: (updated: DailyLog) => void;
  onNavigateTab: (tab: 'today' | 'workouts' | 'activity' | 'nutrition' | 'profile') => void;
  onOpenQuickMealModal: () => void;
  onOpenQuickActivityModal: () => void;
  onStartOutdoorTracking: () => void;
  currentDate: string;
  onChangeDate: (offset: number) => void;
  isToday: boolean;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  profile,
  dailyLog,
  workoutPlan,
  nutritionTarget,
  onUpdateDailyLog,
  onNavigateTab,
  onOpenQuickMealModal,
  onOpenQuickActivityModal,
  onStartOutdoorTracking,
  currentDate,
  onChangeDate,
  isToday,
}) => {
  // Aggregate daily activities
  const totalSteps = dailyLog.activities.reduce((acc, act) => acc + (act.steps || 0), 0);
  const totalActiveMinutes = dailyLog.activities.reduce((acc, act) => acc + (act.activeMinutes || 0), 0);
  const totalCaloriesBurned = dailyLog.activities.reduce((acc, act) => acc + (act.caloriesBurned || 0), 0);

  // Aggregate daily nutrition
  const totalCaloriesIn = dailyLog.meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = dailyLog.meals.reduce((acc, m) => acc + m.proteinGrams, 0);
  const totalCarbs = dailyLog.meals.reduce((acc, m) => acc + m.carbsGrams, 0);
  const totalFat = dailyLog.meals.reduce((acc, m) => acc + m.fatGrams, 0);

  // Targets
  const stepTarget = 8000;
  const activeMinutesTarget = profile.sessionMinutes || 45;
  const waterTargetMl = 2500;

  // Today's scheduled workout: pick day based on date day-of-week
  const dateObj = new Date(currentDate + 'T00:00:00');
  const dayIndex = (dateObj.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const workoutDayNumber = (dayIndex % workoutPlan.days.length) + 1;
  const scheduledDay = workoutPlan.days.find(d => d.dayNumber === workoutDayNumber) || workoutPlan.days[0];
  const isWorkoutCompleted = dailyLog.completedWorkoutDayIds?.includes(scheduledDay?.dayNumber || 0);

  // Quick water addition (+250ml)
  const handleQuickWater = () => {
    const updated: DailyLog = {
      ...dailyLog,
      waterMl: (dailyLog.waterMl || 0) + 250,
    };
    onUpdateDailyLog(updated);
  };

  // Mark today's workout as completed
  const handleToggleWorkoutComplete = () => {
    if (!scheduledDay) return;
    const currentCompleted = dailyLog.completedWorkoutDayIds || [];
    let updatedCompleted: number[];
    let updatedActivities = [...dailyLog.activities];

    if (isWorkoutCompleted) {
      updatedCompleted = currentCompleted.filter(id => id !== scheduledDay.dayNumber);
      updatedActivities = updatedActivities.filter(a => a.id !== `workout-auto-${scheduledDay.dayNumber}`);
    } else {
      updatedCompleted = [...currentCompleted, scheduledDay.dayNumber];
      updatedActivities.push({
        id: `workout-auto-${scheduledDay.dayNumber}`,
        title: `${scheduledDay.dayName} (${workoutPlan.setting})`,
        type: 'workout',
        source: 'manual',
        timestamp: new Date().toISOString(),
        date: currentDate,
        steps: 1200,
        distanceKm: 0.8,
        activeMinutes: scheduledDay.estimatedMinutes,
        caloriesBurned: Math.round(scheduledDay.estimatedMinutes * 6.5),
        notes: `Completed ${scheduledDay.exercises.length} exercises from ${workoutPlan.setting} plan.`,
      });
    }

    onUpdateDailyLog({
      ...dailyLog,
      completedWorkoutDayIds: updatedCompleted,
      activities: updatedActivities,
    });
  };

  // Percentage calculations
  const stepPercent = Math.min(100, Math.round((totalSteps / stepTarget) * 100));
  const activePercent = Math.min(100, Math.round((totalActiveMinutes / activeMinutesTarget) * 100));
  const waterPercent = Math.min(100, Math.round(((dailyLog.waterMl || 0) / waterTargetMl) * 100));
  const caloriePercent = Math.min(100, Math.round((totalCaloriesIn / nutritionTarget.targetCalories) * 100));

  const caloriesRemaining = Math.max(0, nutritionTarget.targetCalories - totalCaloriesIn);

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      {/* Date Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">
              {isToday ? 'Today' : 'Daily Record'}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-400 capitalize">
              {workoutPlan.setting} Plan Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mt-0.5">
            {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h1>
        </div>

        {/* Date Selector buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChangeDate(-1)}
            aria-label="Previous Day"
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              if (currentDate !== todayStr) onChangeDate(0);
            }}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors ${
              isToday ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onChangeDate(1)}
            aria-label="Next Day"
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Cluster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={handleQuickWater}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                +250 ml Water
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                {dailyLog.waterMl || 0} / {waterTargetMl} ml
              </div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
        </button>

        <button
          type="button"
          onClick={onOpenQuickMealModal}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                Log Meal
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                {dailyLog.meals.length} logged
              </div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
        </button>

        <button
          type="button"
          onClick={onOpenQuickActivityModal}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ActivityIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                Log Activity
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                {totalActiveMinutes}m done
              </div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
        </button>

        <button
          type="button"
          onClick={onStartOutdoorTracking}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                Outdoor GPS
              </div>
              <div className="text-[11px] text-zinc-400">Live tracker</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
        </button>
      </div>

      {/* Main Rings & Bars Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Daily Activity Rings (Steps & Active Time) */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Movement & Steps
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('activity')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Steps Progress */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-bold font-mono text-zinc-100">
                  {totalSteps.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Target: {stepTarget.toLocaleString()} steps
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stepPercent}%` }}
                />
              </div>
            </div>

            {/* Active Minutes Progress */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-lg font-bold font-mono text-zinc-100">
                    {totalActiveMinutes}m
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Target: {activeMinutesTarget} min
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${activePercent}%` }}
                />
              </div>
            </div>

            {/* Calories Burned Stat */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Active Caloric Burn
              </span>
              <span className="font-mono font-semibold text-zinc-200">
                ~{totalCaloriesBurned} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Caloric & Macro Balance */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Energy Balance
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('nutrition')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Nutrition <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <div>
                  <span className="text-2xl font-bold font-mono text-zinc-100">
                    {totalCaloriesIn.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400 ml-1 font-mono">
                    / {nutritionTarget.targetCalories} kcal
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-medium">
                  {caloriesRemaining > 0 ? `${caloriesRemaining} kcal left` : 'Target reached'}
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${caloriePercent}%` }}
                />
              </div>
            </div>

            {/* Macro Splits */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Protein</span>
                  <span className="font-mono text-zinc-200">
                    {totalProtein}g / {nutritionTarget.proteinGrams}g
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((totalProtein / (nutritionTarget.proteinGrams || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Carbs</span>
                  <span className="font-mono text-zinc-200">
                    {totalCarbs}g / {nutritionTarget.carbsGrams}g
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((totalCarbs / (nutritionTarget.carbsGrams || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Fat</span>
                  <span className="font-mono text-zinc-200">
                    {totalFat}g / {nutritionTarget.fatGrams}g
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((totalFat / (nutritionTarget.fatGrams || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Water Hydration Tracker */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Hydration
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickWater}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              +250 ml
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-bold font-mono text-zinc-100">
                  {dailyLog.waterMl || 0}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Target: {waterTargetMl} ml
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Increment buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
              {[250, 500, 750].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    onUpdateDailyLog({
                      ...dailyLog,
                      waterMl: (dailyLog.waterMl || 0) + amount,
                    });
                  }}
                  className="py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-medium text-cyan-300 hover:bg-zinc-800 transition-colors"
                >
                  +{amount}ml
                </button>
              ))}
            </div>

            <div className="text-[11px] text-zinc-500 leading-tight">
              Optimal daily hydration maintains athletic endurance, cognitive clarity, and joint lubrication.
            </div>
          </div>
        </div>
      </div>

      {/* Today's Planned Workout Section */}
      {scheduledDay && (
        <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Today's Planned Workout
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-400 capitalize">
                  {workoutPlan.setting} Training
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
                {scheduledDay.dayName}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Focus: <strong className="text-zinc-300">{scheduledDay.focus}</strong> · {scheduledDay.exercises.length} exercises · ~{scheduledDay.estimatedMinutes} min
              </p>
            </div>

            {/* Action button: Complete or Start */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleWorkoutComplete}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isWorkoutCompleted
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isWorkoutCompleted ? 'text-emerald-400' : 'text-zinc-400'}`} />
                {isWorkoutCompleted ? 'Completed' : 'Mark Complete'}
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('workouts')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
              >
                View Routine
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Exercise list preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-4 border-t border-zinc-800">
            {scheduledDay.exercises.slice(0, 3).map((ex) => (
              <div
                key={ex.id}
                className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200 mb-0.5">
                    {ex.name}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {ex.defaultSets} sets · {ex.defaultRepsOrDuration}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 mt-2 italic truncate">
                  "{ex.formCue}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

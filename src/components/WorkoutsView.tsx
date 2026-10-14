import React, { useState } from 'react';
import { 
  UserProfile, 
  WorkoutPlan, 
  WorkoutSetting, 
  Exercise, 
  DailyLog 
} from '../types/fitness';
import { generateWorkoutPlan } from '../utils/recommendations';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { 
  Building2, 
  Home, 
  TreePine, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

interface WorkoutsViewProps {
  profile: UserProfile;
  activePlan: WorkoutPlan;
  onSettingChange: (newSetting: WorkoutSetting) => void;
  dailyLog: DailyLog;
  onUpdateDailyLog: (updated: DailyLog) => void;
  currentDate: string;
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  profile,
  activePlan,
  onSettingChange,
  dailyLog,
  onUpdateDailyLog,
  currentDate,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'plan' | 'library'>('plan');

  // Exercise library search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSetting, setFilterSetting] = useState<string>('all');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');

  // Interactive completed exercises checklist for active workout session
  const [checkedExerciseIds, setCheckedExerciseIds] = useState<Record<string, boolean>>({});
  const [logSessionMinutes, setLogSessionMinutes] = useState<number>(activePlan.days[0]?.estimatedMinutes || 45);

  const currentDay = activePlan.days.find(d => d.dayNumber === selectedDayNumber) || activePlan.days[0];
  const isWorkoutCompleted = dailyLog.completedWorkoutDayIds?.includes(currentDay?.dayNumber || 0);

  const toggleExerciseCheck = (exId: string) => {
    setCheckedExerciseIds(prev => ({
      ...prev,
      [exId]: !prev[exId],
    }));
  };

  const handleCompleteWorkout = () => {
    if (!currentDay) return;
    const currentCompleted = dailyLog.completedWorkoutDayIds || [];
    let updatedCompleted: number[];
    let updatedActivities = [...dailyLog.activities];

    if (isWorkoutCompleted) {
      updatedCompleted = currentCompleted.filter(id => id !== currentDay.dayNumber);
      updatedActivities = updatedActivities.filter(a => a.id !== `workout-${activePlan.setting}-${currentDay.dayNumber}`);
    } else {
      updatedCompleted = [...currentCompleted, currentDay.dayNumber];
      updatedActivities.push({
        id: `workout-${activePlan.setting}-${currentDay.dayNumber}`,
        title: `${currentDay.dayName} (${activePlan.setting})`,
        type: 'workout',
        source: 'manual',
        timestamp: new Date().toISOString(),
        date: currentDate,
        steps: Math.round(logSessionMinutes * 30),
        distanceKm: Math.round((logSessionMinutes * 0.02) * 10) / 10,
        activeMinutes: logSessionMinutes,
        caloriesBurned: Math.round(logSessionMinutes * 6.5),
        notes: `Completed ${currentDay.exercises.length} exercises from ${activePlan.setting} program.`,
      });
    }

    onUpdateDailyLog({
      ...dailyLog,
      completedWorkoutDayIds: updatedCompleted,
      activities: updatedActivities,
    });
  };

  // Filtered exercise library list
  const filteredLibrary = EXERCISE_LIBRARY.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.formCue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSetting = filterSetting === 'all' || ex.setting === filterSetting;
    const matchesMuscle = filterMuscle === 'all' || ex.muscleGroup === filterMuscle;
    return matchesSearch && matchesSetting && matchesMuscle;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Workout Program
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Targeting {profile.goal.replace('_', ' ')} · {profile.level} level · {activePlan.daysPerWeek} days/week
          </p>
        </div>

        {/* View Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'plan'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active Plan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'library'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Exercise Library ({EXERCISE_LIBRARY.length})
          </button>
        </div>
      </div>

      {/* Setting Switcher Card */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            {activePlan.setting === 'gym' && <Building2 className="w-5 h-5" />}
            {activePlan.setting === 'home' && <Home className="w-5 h-5" />}
            {activePlan.setting === 'outdoor' && <TreePine className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Environment: <span className="text-emerald-400 capitalize">{activePlan.setting}</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Switch anytime to instantly adapt your weekly program to another setting.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['gym', 'home', 'outdoor'] as WorkoutSetting[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSettingChange(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border capitalize transition-all ${
                activePlan.setting === s
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'plan' ? (
        <div className="space-y-6">
          {/* Why this plan rationale banner */}
          <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 leading-relaxed">
              <strong className="text-zinc-100">Why this plan: </strong>
              {activePlan.whyThisPlan}
            </div>
          </div>

          {/* Day selection tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {activePlan.days.map((day) => {
              const isSelected = day.dayNumber === selectedDayNumber;
              const isCompleted = dailyLog.completedWorkoutDayIds?.includes(day.dayNumber);
              return (
                <button
                  key={day.dayNumber}
                  type="button"
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 font-semibold'
                      : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                  Day {day.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Current Day Details */}
          {currentDay && (
            <div className="space-y-4">
              {/* Day Header */}
              <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                    Day {currentDay.dayNumber} of {activePlan.daysPerWeek}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
                    {currentDay.dayName}
                  </h2>
                  <div className="text-xs text-zinc-400 mt-1">
                    Primary Focus: <strong className="text-zinc-200">{currentDay.focus}</strong> · {currentDay.exercises.length} exercises · ~{currentDay.estimatedMinutes} min
                  </div>
                </div>

                {/* Mark Workout Complete button */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={logSessionMinutes}
                      onChange={(e) => setLogSessionMinutes(parseInt(e.target.value) || 45)}
                      className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center font-mono text-zinc-100"
                    />
                    <span>min</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompleteWorkout}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isWorkoutCompleted
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-emerald-500/40 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/10'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isWorkoutCompleted ? 'text-emerald-400' : 'text-zinc-950'}`} />
                    {isWorkoutCompleted ? 'Completed' : 'Finish & Log Workout'}
                  </button>
                </div>
              </div>

              {/* Dynamic Warm-Up Section */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                  Dynamic Warm-Up (5–8 Minutes)
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  {currentDay.warmUp.map((w, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exercises List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-400 px-1">
                  <span>Target Exercises ({currentDay.exercises.length})</span>
                  <span>Tap checkbox when set is done</span>
                </div>

                {currentDay.exercises.map((ex, index) => {
                  const isChecked = !!checkedExerciseIds[ex.id];
                  return (
                    <div
                      key={ex.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isChecked
                          ? 'border-emerald-500/40 bg-zinc-900/40 opacity-80'
                          : 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleExerciseCheck(ex.id)}
                            aria-label={`Mark ${ex.name} completed`}
                            className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                                : 'border-zinc-700 bg-zinc-950 text-transparent hover:border-emerald-500'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-base font-semibold ${isChecked ? 'line-through text-zinc-400' : 'text-zinc-100'}`}>
                                {index + 1}. {ex.name}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-400">
                                {ex.muscleGroup}
                              </span>
                            </div>

                            {/* Sets, Reps, Rest */}
                            <div className="flex items-center gap-3 text-xs text-zinc-300 mt-1 font-mono">
                              <span className="bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                                {ex.defaultSets} sets
                              </span>
                              <span className="bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                                {ex.defaultRepsOrDuration}
                              </span>
                              <span className="text-zinc-500">
                                Rest: {ex.restSeconds}s
                              </span>
                            </div>

                            {/* Form Cue */}
                            <div className="text-xs text-zinc-400 mt-2.5 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                              <strong className="text-zinc-300 font-medium">Form Cue: </strong>
                              {ex.formCue}
                            </div>

                            {/* Swap Alternative */}
                            {ex.swapAlternative && (
                              <div className="text-[11px] text-zinc-400 mt-1.5">
                                <span className="text-zinc-500">Alternative: </span>
                                {ex.swapAlternative}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-zinc-400 shrink-0 capitalize">
                          {ex.equipment}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cool-Down & Mobility Section */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                  Cool-Down & Joint Mobility (5 Minutes)
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  {currentDay.coolDown.map((c, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Exercise Library Browser */
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by exercise name, muscle, or equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-zinc-500 mr-1">Setting:</span>
              {['all', 'gym', 'home', 'outdoor'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterSetting(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-colors ${
                    filterSetting === st
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              <span className="text-xs text-zinc-500 ml-2 mr-1">Muscle:</span>
              {['all', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Mobility'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMuscle(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    filterMuscle === m
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Library Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredLibrary.map((ex) => (
              <div
                key={ex.id}
                className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">
                      {ex.muscleGroup}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 capitalize">
                      {ex.setting} · {ex.level}
                    </span>
                  </div>
                  <h3 className="font-semibold text-zinc-100 text-sm mb-1">{ex.name}</h3>
                  <div className="text-xs text-zinc-400 mb-2">
                    {ex.defaultSets} sets · {ex.defaultRepsOrDuration} · Rest {ex.restSeconds}s
                  </div>
                  <div className="text-xs text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 leading-relaxed mb-2">
                    <strong className="text-zinc-300 font-medium">Form: </strong>
                    {ex.formCue}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Equip: {ex.equipment}</span>
                  {ex.swapAlternative && <span>Swap: {ex.swapAlternative}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  UserProfile, 
  DailyLog, 
  MealEntry, 
  MealType, 
  CalorieAndMacros 
} from '../types/fitness';
import { 
  Utensils, 
  Droplet, 
  Plus, 
  Trash2, 
  Flame, 
  PieChart, 
  Check, 
  BarChart2, 
  Clock,
  Sparkles
} from 'lucide-react';

interface NutritionViewProps {
  profile: UserProfile;
  dailyLog: DailyLog;
  allLogs: Record<string, DailyLog>;
  nutritionTarget: CalorieAndMacros;
  onUpdateDailyLog: (updated: DailyLog) => void;
  currentDate: string;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  profile,
  dailyLog,
  allLogs,
  nutritionTarget,
  onUpdateDailyLog,
  currentDate,
}) => {
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [calories, setCalories] = useState<number>(450);
  const [proteinGrams, setProteinGrams] = useState<number>(32);
  const [carbsGrams, setCarbsGrams] = useState<number>(45);
  const [fatGrams, setFatGrams] = useState<number>(14);

  // Quick Preset Meals
  const mealPresets = [
    { name: 'Oatmeal, Berries & Whey Protein', type: 'breakfast' as MealType, cal: 420, p: 32, c: 54, f: 8 },
    { name: 'Grilled Chicken Breast & Jasmine Rice', type: 'lunch' as MealType, cal: 560, p: 48, c: 62, f: 12 },
    { name: 'Salmon Fillet with Sweet Potato', type: 'dinner' as MealType, cal: 590, p: 42, c: 46, f: 24 },
    { name: 'Greek Yogurt (0%) with Almonds & Honey', type: 'snack' as MealType, cal: 260, p: 22, c: 24, f: 8 },
    { name: 'Post-Workout Whey Shake with Banana', type: 'snack' as MealType, cal: 290, p: 28, c: 38, f: 3 },
    { name: 'Tofu & Edamame Quinoa Bowl', type: 'dinner' as MealType, cal: 480, p: 30, c: 58, f: 14 }
  ];

  const handleApplyPreset = (preset: typeof mealPresets[0]) => {
    setMealName(preset.name);
    setMealType(preset.type);
    setCalories(preset.cal);
    setProteinGrams(preset.p);
    setCarbsGrams(preset.c);
    setFatGrams(preset.f);
  };

  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    const newMeal: MealEntry = {
      id: `meal-${Date.now()}`,
      name: mealName.trim(),
      mealType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calories: Number(calories) || 0,
      proteinGrams: Number(proteinGrams) || 0,
      carbsGrams: Number(carbsGrams) || 0,
      fatGrams: Number(fatGrams) || 0,
    };

    onUpdateDailyLog({
      ...dailyLog,
      meals: [newMeal, ...dailyLog.meals],
    });

    setMealName('');
    setShowAddMealModal(false);
  };

  const handleDeleteMeal = (id: string) => {
    onUpdateDailyLog({
      ...dailyLog,
      meals: dailyLog.meals.filter(m => m.id !== id),
    });
  };

  const handleQuickWater = (ml: number) => {
    onUpdateDailyLog({
      ...dailyLog,
      waterMl: Math.max(0, (dailyLog.waterMl || 0) + ml),
    });
  };

  // Nutrition totals for today
  const totalCalories = dailyLog.meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = dailyLog.meals.reduce((sum, m) => sum + m.proteinGrams, 0);
  const totalCarbs = dailyLog.meals.reduce((sum, m) => sum + m.carbsGrams, 0);
  const totalFat = dailyLog.meals.reduce((sum, m) => sum + m.fatGrams, 0);

  const waterTargetMl = 2500;
  const waterMl = dailyLog.waterMl || 0;

  // 7-day calorie adherence data
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - (6 - i));
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const log = allLogs[dStr];
    const cals = log?.meals?.reduce((acc, m) => acc + m.calories, 0) || 0;
    const prot = log?.meals?.reduce((acc, m) => acc + m.proteinGrams, 0) || 0;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    return { date: dStr, cals, prot, dayLabel };
  });

  const maxCal7Days = Math.max(nutritionTarget.targetCalories * 1.2, ...last7DaysData.map(d => d.cals));

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Nutrition & Hydration
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Calibrated for your {profile.goal.replace('_', ' ')} target.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddMealModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Log Meal
        </button>
      </div>

      {/* Target Comparison Summary Card */}
      <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">
              Calorie Budget
            </div>
            <div className="text-3xl font-extrabold font-mono text-zinc-100 mt-1">
              {totalCalories.toLocaleString()}{' '}
              <span className="text-sm font-normal text-zinc-400">
                / {nutritionTarget.targetCalories.toLocaleString()} kcal
              </span>
            </div>
          </div>

          <div className="text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80 max-w-sm">
            {nutritionTarget.rationale}
          </div>
        </div>

        {/* Progress Bar for Calories */}
        <div>
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((totalCalories / nutritionTarget.targetCalories) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Macro Trio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Protein */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-zinc-300">Protein</span>
              <span className="font-mono text-emerald-400">
                {totalProtein}g / {nutritionTarget.proteinGrams}g
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((totalProtein / (nutritionTarget.proteinGrams || 1)) * 100))}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              {Math.max(0, nutritionTarget.proteinGrams - totalProtein)}g remaining
            </span>
          </div>

          {/* Carbs */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-zinc-300">Carbohydrates</span>
              <span className="font-mono text-amber-400">
                {totalCarbs}g / {nutritionTarget.carbsGrams}g
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((totalCarbs / (nutritionTarget.carbsGrams || 1)) * 100))}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              {Math.max(0, nutritionTarget.carbsGrams - totalCarbs)}g remaining
            </span>
          </div>

          {/* Fat */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-zinc-300">Dietary Fats</span>
              <span className="font-mono text-rose-400">
                {totalFat}g / {nutritionTarget.fatGrams}g
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((totalFat / (nutritionTarget.fatGrams || 1)) * 100))}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              {Math.max(0, nutritionTarget.fatGrams - totalFat)}g remaining
            </span>
          </div>
        </div>
      </div>

      {/* Hydration Tracker Card */}
      <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Water Hydration Tracker
              </h3>
              <div className="text-xs text-zinc-400">
                Current: <strong className="font-mono text-cyan-300">{waterMl} ml</strong> / target {waterTargetMl} ml
              </div>
            </div>
          </div>

          {/* Quick Water Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickWater(250)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold transition-colors"
            >
              +250 ml
            </button>
            <button
              type="button"
              onClick={() => handleQuickWater(500)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold transition-colors"
            >
              +500 ml
            </button>
            <button
              type="button"
              onClick={() => handleQuickWater(-250)}
              disabled={waterMl <= 0}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-mono transition-colors disabled:opacity-40"
            >
              -250
            </button>
          </div>
        </div>

        <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="bg-cyan-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((waterMl / waterTargetMl) * 100))}%` }}
          />
        </div>
      </div>

      {/* 7-Day Calorie & Protein Adherence Chart */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              7-Day Calorie Trend
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Target Line: {nutritionTarget.targetCalories} kcal
          </span>
        </div>

        {/* 7-Day Bars */}
        <div className="flex items-end justify-between gap-2 h-36 pt-6 px-2">
          {last7DaysData.map((d) => {
            const heightPercent = Math.max(8, Math.round((d.cals / maxCal7Days) * 100));
            const isTodayBar = d.date === currentDate;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[10px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.cals > 0 ? `${d.cals}` : '0'}
                </div>
                <div className="w-full max-w-[32px] bg-zinc-950 rounded-xl overflow-hidden h-full flex flex-col justify-end border border-zinc-800/80">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      isTodayBar ? 'bg-emerald-400' : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-[11px] font-mono ${isTodayBar ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meal History List */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Meals Logged Today ({dailyLog.meals.length})
          </h3>
          <span className="text-xs text-zinc-500">
            {totalCalories} kcal total
          </span>
        </div>

        {dailyLog.meals.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No meals logged for this date. Click "+ Log Meal" above to record your nutrition.
          </div>
        ) : (
          <div className="space-y-2.5">
            {dailyLog.meals.map((meal) => (
              <div
                key={meal.id}
                className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                    <Utensils className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-200">
                        {meal.name}
                      </span>
                      <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {meal.mealType}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      <strong className="text-zinc-200">{meal.calories} kcal</strong> · P: {meal.proteinGrams}g · C: {meal.carbsGrams}g · F: {meal.fatGrams}g
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMeal(meal.id)}
                  aria-label="Delete meal"
                  className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Meal Modal with Presets */}
      {showAddMealModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-100">
                Log Meal & Nutrition
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMealModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                Cancel
              </button>
            </div>

            {/* Quick Presets Carousel */}
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-2">
                Quick Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mealPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 text-left text-xs transition-colors"
                  >
                    <div className="font-medium text-zinc-200 truncate">{p.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-1">
                      {p.cal} kcal · {p.p}g P
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4 pt-2 border-t border-zinc-800">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Meal or Food Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scrambled Eggs with Sourdough Toast"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Meal Time / Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMealType(t)}
                      className={`py-2 text-xs font-medium rounded-xl border capitalize transition-colors ${
                        mealType === t
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    required
                    value={calories}
                    onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={proteinGrams}
                    onChange={(e) => setProteinGrams(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={carbsGrams}
                    onChange={(e) => setCarbsGrams(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={fatGrams}
                    onChange={(e) => setFatGrams(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-colors mt-2"
              >
                Save Meal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

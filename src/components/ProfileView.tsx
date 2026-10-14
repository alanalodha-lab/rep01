import React, { useState } from 'react';
import { 
  UserProfile, 
  FitnessGoal, 
  ExperienceLevel, 
  UserSex, 
  UnitSystem, 
  WorkoutSetting 
} from '../types/fitness';
import { 
  User, 
  Settings, 
  ShieldAlert, 
  RotateCcw, 
  Save, 
  Check, 
  AlertCircle, 
  Building2, 
  Home, 
  TreePine,
  ShieldCheck
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onResetAllData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onResetAllData,
}) => {
  const [age, setAge] = useState<number>(profile.age);
  const [ageError, setAgeError] = useState<string>('');
  const [sex, setSex] = useState<UserSex>(profile.sex);
  const [units, setUnits] = useState<UnitSystem>(profile.units);
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg);

  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [level, setLevel] = useState<ExperienceLevel>(profile.level);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(profile.daysPerWeek);
  const [sessionMinutes, setSessionMinutes] = useState<number>(profile.sessionMinutes);
  const [primarySetting, setPrimarySetting] = useState<WorkoutSetting>(profile.primarySetting);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (age < 16) {
      setAgeError('Must be at least 16 years old');
      return;
    }
    setAgeError('');

    const updated: UserProfile = {
      ...profile,
      age,
      sex,
      units,
      heightCm,
      weightKg,
      goal,
      level,
      daysPerWeek,
      sessionMinutes,
      primarySetting,
    };

    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Profile & Preferences
        </h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Update your biometric data, goals, or training environment anytime.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Biometrics & Units Card */}
        <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Biometric Profile
            </h2>

            {/* Units Toggle */}
            <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setUnits('metric')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  units === 'metric'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Metric (cm)
              </button>
              <button
                type="button"
                onClick={() => setUnits('imperial')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  units === 'imperial'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Imperial (in)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Age */}
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Age (16+)
              </label>
              <input
                type="number"
                min="16"
                max="100"
                value={age}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setAge(val);
                  if (val < 16) setAgeError('Age 16+ required');
                  else setAgeError('');
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 font-mono text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
              />
              {ageError && (
                <span className="text-[11px] text-rose-400 mt-1 block">
                  {ageError}
                </span>
              )}
            </div>

            {/* Sex */}
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Biological Sex
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as UserSex)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Neutral</option>
              </select>
            </div>

            {/* Height */}
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Height ({units === 'metric' ? 'cm' : 'inches'})
              </label>
              <input
                type="number"
                min="100"
                max="250"
                value={units === 'metric' ? heightCm : Math.round(heightCm / 2.54)}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setHeightCm(units === 'metric' ? val : Math.round(val * 2.54));
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 font-mono text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Weight */}
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                value={weightKg}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setWeightKg(val);
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 font-mono text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Training Setting & Goals Card */}
        <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            Training Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Primary Setting */}
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Primary Setting
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'gym', label: 'Gym', icon: Building2 },
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'outdoor', label: 'Outdoor', icon: TreePine },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPrimarySetting(s.id as WorkoutSetting)}
                      className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                        primarySetting === s.id
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goal */}
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Fitness Goal
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'build_muscle', label: 'Build Muscle' },
                  { id: 'lose_weight', label: 'Lose Weight' },
                  { id: 'endurance', label: 'General Fitness' },
                  { id: 'mobility', label: 'Flexibility & Mobility' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id as FitnessGoal)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium border transition-colors ${
                      goal === g.id
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule & Intensity */}
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Days / Week: <span className="font-mono text-emerald-400">{daysPerWeek}d</span>
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPerWeek(num)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-medium ${
                        daysPerWeek === num
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Session Duration
                </label>
                <select
                  value={sessionMinutes}
                  onChange={(e) => setSessionMinutes(parseInt(e.target.value) || 45)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value={25}>25 minutes (Express)</option>
                  <option value={35}>35 minutes (Standard Home)</option>
                  <option value={45}>45 minutes (Optimal)</option>
                  <option value={60}>60 minutes (Comprehensive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Experience Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 capitalize"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-zinc-950" />
                  Preferences Saved & Plan Regenerated!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes & Update Plan
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Safety & Medical Disclaimer */}
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Health & Safety Advisory
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            PulseFit provides general fitness, exercise programming, and nutritional estimation strictly for informational purposes. It does not provide medical diagnosis, clinical nutritional therapy, or treatment. Always consult a qualified physician or healthcare provider prior to starting any rigorous exercise routine, particularly if managing pre-existing cardiovascular, musculoskeletal, or metabolic conditions.
          </p>
        </div>
      </div>

      {/* Danger Zone: Reset All Data */}
      <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-3xl space-y-4">
        <div className="flex items-center gap-2.5 text-rose-400">
          <ShieldAlert className="w-5 h-5" />
          <h2 className="text-base font-bold">Data Management & Reset</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          PulseFit stores all data strictly in your local browser storage (<code className="font-mono text-zinc-300">localStorage</code>). No cloud servers, external databases, or third-party cookies are used. Resetting will clear your questionnaire responses, daily logs, activity records, and custom workouts.
        </p>

        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Data & Start Over
          </button>
        ) : (
          <div className="p-4 bg-zinc-950 border border-rose-800/60 rounded-2xl space-y-3">
            <div className="text-xs text-rose-300 font-semibold">
              Are you sure? This action cannot be undone. All daily logs and profiles will be erased.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetAllData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Yes, Delete Everything & Restart
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

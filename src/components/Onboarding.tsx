import React, { useState } from 'react';
import { 
  UserProfile, 
  WorkoutSetting, 
  FitnessGoal, 
  ExperienceLevel, 
  UserSex, 
  UnitSystem 
} from '../types/fitness';
import { calculateCaloriesAndMacros, generateWorkoutPlan } from '../utils/recommendations';
import { 
  Building2, 
  TreePine, 
  Home, 
  Flame, 
  Dumbbell, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  ShieldCheck,
  Calendar,
  Clock
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 7;

  // Form states
  const [age, setAge] = useState<number>(25);
  const [ageError, setAgeError] = useState<string>('');
  const [sex, setSex] = useState<UserSex>('female');
  const [units, setUnits] = useState<UnitSystem>('metric');
  
  // Height & Weight stored internally in Metric (cm, kg)
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(68);

  // Imperial input helpers
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(7);
  const [weightLbs, setWeightLbs] = useState<number>(150);

  // Goal & Level
  const [goal, setGoal] = useState<FitnessGoal>('build_muscle');
  const [level, setLevel] = useState<ExperienceLevel>('beginner');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [sessionMinutes, setSessionMinutes] = useState<number>(45);

  // Settings & Equipment
  const [selectedSettings, setSelectedSettings] = useState<WorkoutSetting[]>(['gym']);
  const [primarySetting, setPrimarySetting] = useState<WorkoutSetting>('gym');

  const [gymEquipment, setGymEquipment] = useState<string[]>([
    'Barbells', 'Dumbbells', 'Cable Machines', 'Weight Machines'
  ]);
  const [homeEquipment, setHomeEquipment] = useState<string[]>([
    'None (Bodyweight)', 'Dumbbells', 'Resistance Bands'
  ]);
  const [outdoorActivities, setOutdoorActivities] = useState<string[]>([
    'Walking', 'Jogging / Running', 'Park Calisthenics'
  ]);

  // Unit toggle handlers
  const handleUnitChange = (newUnit: UnitSystem) => {
    if (newUnit === units) return;
    setUnits(newUnit);
    if (newUnit === 'imperial') {
      const totalInches = Math.round(heightCm / 2.54);
      setHeightFeet(Math.floor(totalInches / 12));
      setHeightInches(totalInches % 12);
      setWeightLbs(Math.round(weightKg * 2.20462));
    } else {
      const cm = Math.round((heightFeet * 12 + heightInches) * 2.54);
      const kg = Math.round(weightLbs / 2.20462);
      setHeightCm(cm);
      setWeightKg(kg);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (age < 16) {
        setAgeError('PulseFit is designed for users aged 16 and older.');
        return;
      }
      setAgeError('');
      // Sync metric height & weight if imperial
      if (units === 'imperial') {
        const cm = Math.round((heightFeet * 12 + heightInches) * 2.54);
        const kg = Math.round(weightLbs / 2.20462);
        setHeightCm(cm);
        setWeightKg(kg);
      }
    }

    if (step === 5) {
      if (selectedSettings.length === 0) {
        setSelectedSettings(['home']);
        setPrimarySetting('home');
      } else if (!selectedSettings.includes(primarySetting)) {
        setPrimarySetting(selectedSettings[0]);
      }
    }

    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSettingToggle = (s: WorkoutSetting) => {
    if (selectedSettings.includes(s)) {
      if (selectedSettings.length === 1) return; // Keep at least one
      const updated = selectedSettings.filter(x => x !== s);
      setSelectedSettings(updated);
      if (primarySetting === s) {
        setPrimarySetting(updated[0]);
      }
    } else {
      const updated = [...selectedSettings, s];
      setSelectedSettings(updated);
      if (updated.length === 1) {
        setPrimarySetting(s);
      }
    }
  };

  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(x => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const currentProfile: UserProfile = {
    age,
    sex,
    heightCm,
    weightKg,
    goal,
    level,
    daysPerWeek,
    sessionMinutes,
    selectedSettings,
    primarySetting,
    equipment: {
      gym: gymEquipment,
      home: homeEquipment,
      outdoor: outdoorActivities
    },
    units,
    createdAt: new Date().toISOString()
  };

  const nutritionPlan = calculateCaloriesAndMacros(currentProfile);
  const workoutPlan = generateWorkoutPlan(currentProfile);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
      {/* Top Header & Progress */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              P
            </div>
            <span className="font-semibold text-zinc-200 tracking-tight text-lg">
              PulseFit
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-8">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step 1: Body Metrics */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Your Baseline Stats
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Used to personalize calorie targets, intensity levels, and age safeguards.
              </p>
            </div>

            {/* Units Selector */}
            <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => handleUnitChange('metric')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  units === 'metric'
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                type="button"
                onClick={() => handleUnitChange('imperial')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  units === 'imperial'
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Imperial (lbs / ft-in)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl">
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Age (16+ enforced)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="16"
                    max="100"
                    value={age}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setAge(val);
                      if (val < 16) {
                        setAgeError('Must be at least 16 years old');
                      } else {
                        setAgeError('');
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-lg font-mono font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-zinc-500 text-sm">years</span>
                </div>
                {ageError && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {ageError}
                  </p>
                )}
                {age < 18 && age >= 16 && (
                  <p className="text-xs text-emerald-400/90 mt-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Adolescent growth calorie floor safeguard enabled.
                  </p>
                )}
              </div>

              {/* Sex */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl">
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Biological Sex (for BMR calculation)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['female', 'male', 'other'] as UserSex[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`py-2.5 px-2 text-xs font-medium rounded-xl border transition-colors capitalize ${
                        sex === s
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl">
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Height
                </label>
                {units === 'metric' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="120"
                      max="240"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseInt(e.target.value) || 170)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-lg font-mono font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-zinc-500 text-sm">cm</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="3"
                        max="7"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(parseInt(e.target.value) || 5)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2.5 text-lg font-mono font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-zinc-500 text-xs">ft</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={heightInches}
                        onChange={(e) => setHeightInches(parseInt(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2.5 text-lg font-mono font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-zinc-500 text-xs">in</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl">
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Weight
                </label>
                {units === 'metric' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="35"
                      max="250"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseInt(e.target.value) || 68)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-lg font-mono font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-zinc-500 text-sm">kg</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="75"
                      max="550"
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(parseInt(e.target.value) || 150)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-lg font-mono font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-zinc-500 text-sm">lbs</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Primary Goal */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                What is your primary goal?
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Your workout structure and nutritional targets adjust directly based on this focus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  id: 'build_muscle',
                  title: 'Build Muscle & Strength',
                  desc: 'Hypertrophy-focused sets, progressive resistance, and lean caloric surplus.',
                  icon: Dumbbell
                },
                {
                  id: 'lose_weight',
                  title: 'Lose Weight & Burn Fat',
                  desc: 'Metabolic conditioning, moderate deficit, and high protein preservation.',
                  icon: Flame
                },
                {
                  id: 'endurance',
                  title: 'General Fitness & Stamina',
                  desc: 'Cardiovascular efficiency, total body conditioning, and balanced energy.',
                  icon: Heart
                },
                {
                  id: 'mobility',
                  title: 'Flexibility & Joint Health',
                  desc: 'Range of motion, posture correction, core stability, and injury prevention.',
                  icon: Sparkles
                }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id as FitnessGoal)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-zinc-100 ring-1 ring-emerald-500/30'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="font-semibold text-base mb-1">{item.title}</div>
                    <div className="text-xs text-zinc-400 leading-relaxed">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Experience Level */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                What is your experience level?
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Ensures exercise selections and training volume match your recovery capacity safely.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'beginner',
                  title: 'Beginner',
                  badge: 'New or returning after a long break',
                  desc: 'Emphasizes fundamental movement patterns, joint integrity, clear form cues, and moderate rest periods.'
                },
                {
                  id: 'intermediate',
                  title: 'Intermediate',
                  badge: 'Consistent for 6+ months',
                  desc: 'Introduces compound variations, moderate progressive overload, supersets, and higher density.'
                },
                {
                  id: 'advanced',
                  title: 'Advanced',
                  badge: 'Trained regularly for 2+ years',
                  desc: 'High-intensity conditioning, advanced barbell/calisthenic progressions, and structured periodization.'
                }
              ].map((item) => {
                const isSelected = level === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id as ExperienceLevel)}
                    className={`w-full p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-zinc-100 ring-1 ring-emerald-500/30'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-semibold text-base">{item.title}</div>
                      <span className="text-xs font-mono text-zinc-400">{item.badge}</span>
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Schedule Availability */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Your Weekly Routine
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Consistency beats intensity. Choose a realistic schedule you can sustain.
              </p>
            </div>

            {/* Days per week */}
            <div className="p-5 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Training Days Per Week
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {daysPerWeek} days
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDaysPerWeek(num)}
                    className={`py-3 rounded-xl border font-mono font-semibold text-sm transition-all ${
                      daysPerWeek === num
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {num}d
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                {daysPerWeek <= 3 && 'Full-body frequency allowing full 48-hour muscular recovery windows.'}
                {daysPerWeek === 4 && 'Balanced Upper/Lower split with dedicated active recovery intervals.'}
                {daysPerWeek >= 5 && 'High-frequency Push/Pull/Legs program with targeted muscle focus.'}
              </p>
            </div>

            {/* Session length */}
            <div className="p-5 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Target Session Length
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {sessionMinutes} min
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[25, 35, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSessionMinutes(mins)}
                    className={`py-3 rounded-xl border font-mono font-semibold text-sm transition-all ${
                      sessionMinutes === mins
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Workout Setting */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Where do you work out?
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Select one or more environments. You can easily switch between plans at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'gym',
                  title: 'Gym',
                  subtitle: 'Free weights, machines & cables',
                  icon: Building2
                },
                {
                  id: 'home',
                  title: 'Home',
                  subtitle: 'Bodyweight, mats, dumbbells & bands',
                  icon: Home
                },
                {
                  id: 'outdoor',
                  title: 'Outdoor',
                  subtitle: 'Tracks, trails, parks & benches',
                  icon: TreePine
                }
              ].map((setting) => {
                const Icon = setting.icon;
                const isSelected = selectedSettings.includes(setting.id as WorkoutSetting);
                return (
                  <button
                    key={setting.id}
                    type="button"
                    onClick={() => handleSettingToggle(setting.id as WorkoutSetting)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-zinc-100 ring-1 ring-emerald-500/30'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-700'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="font-bold text-lg mb-1">{setting.title}</div>
                    <div className="text-xs text-zinc-400 leading-snug">{setting.subtitle}</div>
                  </button>
                );
              })}
            </div>

            {/* If multiple settings selected, ask which is primary */}
            {selectedSettings.length > 1 && (
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Which is your primary training environment?
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedSettings.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPrimarySetting(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border capitalize transition-all ${
                        primarySetting === s
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-semibold'
                          : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s} (Primary)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Follow-up equipment / activities */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Equipment & Preferences
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Customize your exercises to fit what you actually have available.
              </p>
            </div>

            {/* Gym Equipment */}
            {selectedSettings.includes('gym') && (
              <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Gym Equipment Available
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Barbells', 'Dumbbells', 'Cable Machines', 'Weight Machines'].map((eq) => {
                    const isChecked = gymEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleArrayItem(gymEquipment, eq, setGymEquipment)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Home Equipment */}
            {selectedSettings.includes('home') && (
              <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Home className="w-4 h-4 text-emerald-400" />
                  Home Equipment Owned
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['None (Bodyweight)', 'Dumbbells', 'Resistance Bands', 'Pull-Up Bar'].map((eq) => {
                    const isChecked = homeEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleArrayItem(homeEquipment, eq, setHomeEquipment)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outdoor Activities */}
            {selectedSettings.includes('outdoor') && (
              <div className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <TreePine className="w-4 h-4 text-emerald-400" />
                  Outdoor Activities Enjoyed
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Walking', 'Jogging / Running', 'Hill Repeats', 'Park Calisthenics', 'Cycling'].map((act) => {
                    const isChecked = outdoorActivities.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => toggleArrayItem(outdoorActivities, act, setOutdoorActivities)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {act}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 7: Summary & Plan Reveal */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-2 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive Plan Generated
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Your Personalized Fitness Blueprint
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Everything is ready. Review your targets below. You can change settings anytime.
              </p>
            </div>

            {/* Nutrition & Energy Target Card */}
            <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-mono text-zinc-400">Daily Calorie Target</span>
                  <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">
                    {nutritionPlan.targetCalories.toLocaleString()} <span className="text-sm font-normal text-zinc-400">kcal/day</span>
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-zinc-400">
                  <div>BMR: {nutritionPlan.bmr} kcal</div>
                  <div>TDEE: {nutritionPlan.tdee} kcal</div>
                </div>
              </div>

              {/* Macro Bars */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="text-xs text-zinc-400 font-medium">Protein</div>
                  <div className="text-lg font-bold font-mono text-zinc-100">{nutritionPlan.proteinGrams}g</div>
                  <div className="text-[11px] text-zinc-500">Muscle recovery</div>
                </div>
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="text-xs text-zinc-400 font-medium">Carbohydrates</div>
                  <div className="text-lg font-bold font-mono text-zinc-100">{nutritionPlan.carbsGrams}g</div>
                  <div className="text-[11px] text-zinc-500">Daily energy</div>
                </div>
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="text-xs text-zinc-400 font-medium">Fats</div>
                  <div className="text-lg font-bold font-mono text-zinc-100">{nutritionPlan.fatGrams}g</div>
                  <div className="text-[11px] text-zinc-500">Hormonal health</div>
                </div>
              </div>

              <div className="text-xs text-zinc-400 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 leading-relaxed">
                {nutritionPlan.rationale}
              </div>
            </div>

            {/* Workout Plan Preview */}
            <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-mono text-zinc-400">Recommended Routine</span>
                  <div className="text-lg font-bold text-zinc-100 mt-0.5 capitalize">
                    {workoutPlan.setting} Training Blueprint ({workoutPlan.daysPerWeek} Days/Week)
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg capitalize border border-emerald-500/20">
                  {workoutPlan.level}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {workoutPlan.whyThisPlan}
              </p>

              {/* Day Breakdown preview */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                {workoutPlan.days.map((day) => (
                  <div key={day.dayNumber} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs">
                    <span className="font-semibold text-zinc-200">{day.dayName}</span>
                    <span className="text-zinc-400">{day.exercises.length} exercises · ~{day.estimatedMinutes}m</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-alarmist safety disclaimer */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300">Health & Safety Disclaimer:</strong> PulseFit provides informational fitness and dietary guidelines. It is not medical advice. Consult a healthcare provider before beginning any new training regimen, especially if managing existing health conditions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="pt-8 border-t border-zinc-800/60 flex items-center justify-between mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={step === 1 && age < 16}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
          >
            Next Step
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onComplete(currentProfile)}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            Launch PulseFit
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

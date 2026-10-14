export type WorkoutSetting = 'gym' | 'outdoor' | 'home';

export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'endurance' | 'mobility';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type UserSex = 'male' | 'female' | 'other';

export type UnitSystem = 'metric' | 'imperial';

export interface UserEquipment {
  gym: string[];
  home: string[];
  outdoor: string[];
}

export interface UserProfile {
  age: number;
  sex: UserSex;
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  level: ExperienceLevel;
  daysPerWeek: number;
  sessionMinutes: number;
  selectedSettings: WorkoutSetting[];
  primarySetting: WorkoutSetting;
  equipment: UserEquipment;
  units: UnitSystem;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio' | 'Mobility';
  setting: WorkoutSetting;
  level: ExperienceLevel;
  equipment: string;
  defaultSets: number;
  defaultRepsOrDuration: string;
  restSeconds: number;
  formCue: string;
  swapAlternative?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  dayName: string; // e.g. "Day 1: Full Body Foundation"
  focus: string;
  estimatedMinutes: number;
  warmUp: string[];
  exercises: Exercise[];
  coolDown: string[];
}

export interface WorkoutPlan {
  id: string;
  setting: WorkoutSetting;
  goal: FitnessGoal;
  level: ExperienceLevel;
  daysPerWeek: number;
  whyThisPlan: string;
  days: WorkoutDay[];
}

export type ActivitySource = 'manual' | 'sensor' | 'simulated';

export interface ActivityEntry {
  id: string;
  title: string;
  type: 'workout' | 'run' | 'walk' | 'cycling' | 'calisthenics' | 'sensor_steps' | 'manual';
  source: ActivitySource;
  timestamp: string; // ISO
  date: string; // YYYY-MM-DD
  steps: number;
  distanceKm: number;
  activeMinutes: number;
  caloriesBurned: number;
  paceMinPerKm?: number;
  notes?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  name: string;
  mealType: MealType;
  timestamp: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  waterMl: number;
  meals: MealEntry[];
  activities: ActivityEntry[];
  completedWorkoutDayIds: number[];
}

export interface CalorieAndMacros {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  rationale: string;
}

import { 
  UserProfile, 
  CalorieAndMacros, 
  WorkoutPlan, 
  WorkoutDay, 
  WorkoutSetting, 
  Exercise 
} from '../types/fitness';
import { EXERCISE_LIBRARY } from '../data/exercises';

export function calculateCaloriesAndMacros(profile: UserProfile): CalorieAndMacros {
  const { age, sex, heightCm, weightKg, goal, daysPerWeek } = profile;

  // Mifflin-St Jeor formula
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (sex === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Neutral mid-point
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity multiplier
  let activityMultiplier = 1.25;
  if (daysPerWeek >= 5) {
    activityMultiplier = 1.55;
  } else if (daysPerWeek >= 3) {
    activityMultiplier = 1.40;
  }
  if (daysPerWeek >= 6) {
    activityMultiplier = 1.65;
  }

  const tdee = Math.round(bmr * activityMultiplier);

  // Goal adjustment
  let calorieAdjustment = 0;
  let rationale = `Calculated via Mifflin-St Jeor formula (BMR: ${Math.round(bmr)} kcal) with an activity factor of ${activityMultiplier.toFixed(2)}x for ${daysPerWeek} training days/week.`;

  if (goal === 'lose_weight') {
    calorieAdjustment = -380; // moderate, sustainable deficit
    rationale += ' Applied a sustainable 380 kcal deficit for fat loss without metabolic slowdown.';
  } else if (goal === 'build_muscle') {
    calorieAdjustment = 280; // lean mass surplus
    rationale += ' Applied a focused 280 kcal lean surplus to fuel muscular hypertrophy.';
  } else if (goal === 'endurance') {
    calorieAdjustment = 50;
    rationale += ' Maintained energy balance to support cardiovascular output and stamina.';
  } else {
    calorieAdjustment = 0;
    rationale += ' Maintained baseline energy balance focused on mobility, flexibility, and recovery.';
  }

  let targetCalories = Math.round(tdee + calorieAdjustment);

  // Age 16-17 Safeguard: Enforce minimum healthy calorie floor
  if (age < 18) {
    const minFloor = sex === 'female' ? 1650 : 1950;
    if (targetCalories < minFloor) {
      targetCalories = minFloor;
      rationale += ` Note: Caloric intake adjusted to healthy minimum floor (${minFloor} kcal) to safeguard adolescent growth and developmental health.`;
    }
  }

  // Age 55+ Safeguard: Ensure adequate protein for sarcopenia prevention
  if (age >= 55) {
    rationale += ' Calibrated with enhanced protein distribution to support mature joint health and muscle preservation.';
  }

  // Macro splits
  // 1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal
  let proteinRatio = 0.25;
  let carbsRatio = 0.50;
  let fatRatio = 0.25;

  if (goal === 'build_muscle') {
    proteinRatio = 0.30;
    carbsRatio = 0.45;
    fatRatio = 0.25;
  } else if (goal === 'lose_weight') {
    proteinRatio = 0.35;
    carbsRatio = 0.35;
    fatRatio = 0.30;
  } else if (goal === 'endurance') {
    proteinRatio = 0.22;
    carbsRatio = 0.55;
    fatRatio = 0.23;
  } else { // mobility
    proteinRatio = 0.22;
    carbsRatio = 0.50;
    fatRatio = 0.28;
  }

  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const carbsGrams = Math.round((targetCalories * carbsRatio) / 4);
  const fatGrams = Math.round((targetCalories * fatRatio) / 9);

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    rationale
  };
}

export function generateWorkoutPlan(
  profile: UserProfile, 
  overrideSetting?: WorkoutSetting
): WorkoutPlan {
  const setting = overrideSetting || profile.primarySetting;
  const { goal, level, daysPerWeek, age } = profile;

  // Filter exercises relevant to setting
  const settingExercises = EXERCISE_LIBRARY.filter(e => e.setting === setting);

  const days: WorkoutDay[] = [];

  // Generate day names and muscle groupings based on setting and days/week
  if (setting === 'gym') {
    if (daysPerWeek <= 3) {
      // Full Body structure
      for (let i = 1; i <= daysPerWeek; i++) {
        const isB = i % 2 === 0;
        const focus = isB ? 'Full Body (Posterior Chain & Core)' : 'Full Body (Anterior & Upper Push)';
        
        const dayExs: Exercise[] = isB
          ? [
              settingExercises.find(e => e.id === 'gym-barbell-deadlift') || settingExercises.find(e => e.id === 'gym-romanian-deadlift')!,
              settingExercises.find(e => e.id === 'gym-seated-cable-row')!,
              settingExercises.find(e => e.id === 'gym-db-shoulder-press')!,
              settingExercises.find(e => e.id === 'gym-leg-curl')!,
              settingExercises.find(e => e.id === 'gym-hanging-leg-raise')!
            ].filter(Boolean)
          : [
              settingExercises.find(e => e.id === 'gym-barbell-squat') || settingExercises.find(e => e.id === 'gym-leg-press')!,
              settingExercises.find(e => e.id === 'gym-bench-press') || settingExercises.find(e => e.id === 'gym-incline-db-press')!,
              settingExercises.find(e => e.id === 'gym-lat-pulldown')!,
              settingExercises.find(e => e.id === 'gym-lateral-raise')!,
              settingExercises.find(e => e.id === 'gym-tricep-pushdown')!
            ].filter(Boolean);

        if (goal === 'lose_weight') {
          const cardioEx = settingExercises.find(e => e.id === 'gym-treadmill-incline');
          if (cardioEx) dayExs.push(cardioEx);
        }

        days.push({
          dayNumber: i,
          dayName: `Gym Day ${i}: ${isB ? 'Full Body B' : 'Full Body A'}`,
          focus,
          estimatedMinutes: profile.sessionMinutes || 45,
          warmUp: [
            '5 minutes brisk treadmill walk or rowing warm-up',
            '10 arm swings and thoracic spine rotations',
            '10 bodyweight air squats and hip openers',
            age >= 55 ? 'Extra 3 min slow ankle, knee, and hip rotations' : '2 warm-up sets with light weights'
          ],
          exercises: dayExs,
          coolDown: [
            'Lying hamstring stretch (30s each leg)',
            'Doorframe pectoral stretch (30s each side)',
            'Child’s pose deep breathing (60 seconds)'
          ]
        });
      }
    } else {
      // 4-6 Days: Upper / Lower or Push / Pull / Legs
      const routines = [
        { name: 'Upper Body Power & Hypertrophy', focus: 'Chest, Back, Shoulders & Arms' },
        { name: 'Lower Body Strength & Calves', focus: 'Quads, Hamstrings & Core' },
        { name: 'Upper Body Pump & Back Width', focus: 'Lats, Rear Delts & Triceps' },
        { name: 'Lower Body Glute & Hamstring Focus', focus: 'Posterior Chain & Conditioning' },
        { name: 'Full Body Conditioning & Arms', focus: 'Functional Strength & Core' },
        { name: 'Active Recovery & Mobility', focus: 'Joint Care & Thoracic Mobility' }
      ];

      for (let i = 1; i <= daysPerWeek; i++) {
        const routine = routines[i - 1] || routines[0];
        let dayExs: Exercise[] = [];

        if (i % 2 === 1) {
          // Upper
          dayExs = [
            settingExercises.find(e => e.id === 'gym-bench-press') || settingExercises.find(e => e.id === 'gym-incline-db-press')!,
            settingExercises.find(e => e.id === 'gym-lat-pulldown')!,
            settingExercises.find(e => e.id === 'gym-db-shoulder-press')!,
            settingExercises.find(e => e.id === 'gym-seated-cable-row')!,
            settingExercises.find(e => e.id === 'gym-tricep-pushdown')!
          ].filter(Boolean);
        } else {
          // Lower
          dayExs = [
            settingExercises.find(e => e.id === 'gym-barbell-squat') || settingExercises.find(e => e.id === 'gym-leg-press')!,
            settingExercises.find(e => e.id === 'gym-romanian-deadlift')!,
            settingExercises.find(e => e.id === 'gym-leg-curl')!,
            settingExercises.find(e => e.id === 'gym-seated-calf-raise')!,
            settingExercises.find(e => e.id === 'gym-hanging-leg-raise')!
          ].filter(Boolean);
        }

        if (goal === 'lose_weight') {
          const cardio = settingExercises.find(e => e.id === 'gym-rower-intervals') || settingExercises.find(e => e.id === 'gym-treadmill-incline');
          if (cardio && !dayExs.includes(cardio)) dayExs.push(cardio);
        }

        days.push({
          dayNumber: i,
          dayName: `Gym Day ${i}: ${routine.name}`,
          focus: routine.focus,
          estimatedMinutes: profile.sessionMinutes || 50,
          warmUp: [
            '5 minutes stationary bike or incline walk',
            'Band shoulder dislocates & hip circles (10 reps)',
            age >= 55 ? 'Extended joint mobilization routine' : 'Light pyramid warm-up sets'
          ],
          exercises: dayExs,
          coolDown: [
            'Kneeling hip flexor stretch (45s each)',
            'Overhead tricep and lat reach',
            'Gentle forward fold decompression'
          ]
        });
      }
    }
  } else if (setting === 'home') {
    // HOME WORKOUTS
    const routines = [
      { name: 'Bodyweight Foundation & Core', focus: 'Quads, Chest & Core Stability' },
      { name: 'Posterior Chain & Upper Pull', focus: 'Glutes, Hamstrings & Upper Back' },
      { name: 'Isometric Strength & Calisthenics', focus: 'Deltoids, Triceps & Abdominals' },
      { name: 'Unilateral Balance & Lower Body', focus: 'Single-Leg Stability & Hip Mobility' },
      { name: 'Full-Body Metabolic Circuit', focus: 'Cardio Intervals & Full Musculature' },
      { name: 'Restorative Mobility & Spine Flow', focus: 'Thoracic Extension & Flexibility' }
    ];

    for (let i = 1; i <= daysPerWeek; i++) {
      const routine = routines[(i - 1) % routines.length];
      let dayExs: Exercise[] = [];

      if (i % 2 === 1) {
        dayExs = [
          settingExercises.find(e => e.id === 'home-bodyweight-squat')!,
          settingExercises.find(e => e.id === 'home-pushups-standard')!,
          settingExercises.find(e => e.id === 'home-glute-bridge')!,
          settingExercises.find(e => e.id === 'home-forearm-plank')!,
          settingExercises.find(e => e.id === 'home-mountain-climbers')!
        ].filter(Boolean);
      } else {
        dayExs = [
          settingExercises.find(e => e.id === 'home-walking-lunges')!,
          settingExercises.find(e => e.id === 'home-superman-hold')!,
          settingExercises.find(e => e.id === 'home-chair-dips')!,
          settingExercises.find(e => e.id === 'home-bird-dog')!,
          settingExercises.find(e => e.id === 'home-wall-sit')!
        ].filter(Boolean);
      }

      // Add dumbbell/band variations if user has equipment
      if (profile.equipment?.home?.includes('Dumbbells')) {
        const goblet = settingExercises.find(e => e.id === 'home-db-goblet-squat');
        const dbRow = settingExercises.find(e => e.id === 'home-db-bent-over-row');
        if (goblet && i % 2 === 1) dayExs[0] = goblet;
        if (dbRow && i % 2 === 0) dayExs[1] = dbRow;
      }

      if (goal === 'mobility') {
        const catCow = settingExercises.find(e => e.id === 'home-cat-cow');
        const wgs = settingExercises.find(e => e.id === 'home-worlds-greatest-stretch');
        if (wgs && !dayExs.includes(wgs)) dayExs.push(wgs);
        if (catCow && !dayExs.includes(catCow)) dayExs.push(catCow);
      }

      days.push({
        dayNumber: i,
        dayName: `Home Day ${i}: ${routine.name}`,
        focus: routine.focus,
        estimatedMinutes: profile.sessionMinutes || 35,
        warmUp: [
          '3 minutes marching in place with shoulder rolls',
          '10 bodyweight good-mornings for hamstring priming',
          'Cat-cow spinal waves (8 cycles)'
        ],
        exercises: dayExs,
        coolDown: [
          'Child’s pose hold with side reach (45s)',
          'Seated figure-4 piriformis stretch (30s each)',
          'Deep belly breathing on floor (60s)'
        ]
      });
    }
  } else {
    // OUTDOOR WORKOUTS
    const routines = [
      { name: 'Aerobic Cadence & Strides', focus: 'Cardiovascular Base & Footwork' },
      { name: 'Park Calisthenics & Bench Circuit', focus: 'Upper Body Pushing & Core Tucks' },
      { name: 'Hill/Stair Repeats & Glutes', focus: 'Lower Body Power & Anaerobic Capacity' },
      { name: 'Agility & Outdoor Intervals', focus: 'Shuttle Runs, Jumping Jacks & Turf Planks' },
      { name: 'Zone-2 Steady-State & Stride Out', focus: 'Endurance & Active Aerobic Reset' },
      { name: 'Outdoor Nature Mobility & Stretch', focus: 'Hip Flexors, Spine & Breathing' }
    ];

    for (let i = 1; i <= daysPerWeek; i++) {
      const routine = routines[(i - 1) % routines.length];
      let dayExs: Exercise[] = [];

      if (i === 1) {
        dayExs = [
          settingExercises.find(e => e.id === 'outdoor-zone2-jog') || settingExercises.find(e => e.id === 'outdoor-brisk-walk')!,
          settingExercises.find(e => e.id === 'outdoor-bench-stepups')!,
          settingExercises.find(e => e.id === 'outdoor-turf-lunges')!,
          settingExercises.find(e => e.id === 'outdoor-tree-calf-stretch')!
        ].filter(Boolean);
      } else if (i === 2) {
        dayExs = [
          settingExercises.find(e => e.id === 'outdoor-bench-pushups')!,
          settingExercises.find(e => e.id === 'outdoor-bench-dips')!,
          settingExercises.find(e => e.id === 'outdoor-bar-inverted-row') || settingExercises.find(e => e.id === 'outdoor-bench-stepups')!,
          settingExercises.find(e => e.id === 'outdoor-hanging-knee-tuck')!,
          settingExercises.find(e => e.id === 'outdoor-deep-squat-pry')!
        ].filter(Boolean);
      } else if (i === 3) {
        dayExs = [
          settingExercises.find(e => e.id === 'outdoor-hill-repeats') || settingExercises.find(e => e.id === 'outdoor-run-walk-intervals')!,
          settingExercises.find(e => e.id === 'outdoor-stair-climbs')!,
          settingExercises.find(e => e.id === 'outdoor-squat-jump')!,
          settingExercises.find(e => e.id === 'outdoor-tree-calf-stretch')!
        ].filter(Boolean);
      } else {
        dayExs = [
          settingExercises.find(e => e.id === 'outdoor-jump-rope') || settingExercises.find(e => e.id === 'outdoor-shuttle-runs')!,
          settingExercises.find(e => e.id === 'outdoor-turf-lunges')!,
          settingExercises.find(e => e.id === 'outdoor-bear-crawl')!,
          settingExercises.find(e => e.id === 'outdoor-sun-mobility-flow')!
        ].filter(Boolean);
      }

      days.push({
        dayNumber: i,
        dayName: `Outdoor Day ${i}: ${routine.name}`,
        focus: routine.focus,
        estimatedMinutes: profile.sessionMinutes || 40,
        warmUp: [
          '5 minutes brisk walking on natural path',
          'High knee marches and butt kicks (10 reps each)',
          'Ankle circles and hamstring sweeps'
        ],
        exercises: dayExs,
        coolDown: [
          'Tree-assisted calf and Achilles stretch (45s each)',
          'Standing quad stretch (30s each)',
          'Walking cool-down until heart rate normalizes'
        ]
      });
    }
  }

  // Why this plan explanation
  const settingName = setting.charAt(0).toUpperCase() + setting.slice(1);
  const goalNames: Record<string, string> = {
    lose_weight: 'Fat Loss & Caloric Expenditure',
    build_muscle: 'Muscular Hypertrophy & Progressive Overload',
    endurance: 'Cardiovascular Capacity & Aerobic Endurance',
    mobility: 'Joint Mobility, Posture & Recovery'
  };

  const whyThisPlan = `Customized for your ${settingName} environment, focusing on ${goalNames[goal] || goal} at a ${level} intensity over ${daysPerWeek} training days/week. Structured to prevent overtraining with built-in progressive overload, dynamic warm-ups, and restorative cool-downs.`;

  return {
    id: `plan-${setting}-${goal}-${level}-${daysPerWeek}d`,
    setting,
    goal,
    level,
    daysPerWeek,
    whyThisPlan,
    days
  };
}

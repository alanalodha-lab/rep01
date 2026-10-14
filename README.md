# PulseFit — Adaptive Fitness Companion

PulseFit is a responsive fitness companion for planning workouts and keeping track of daily activity, meals, and hydration. It adapts recommendations to a user's fitness goal, experience level, training schedule, equipment, and preferred environment.

> **Health note:** PulseFit provides general fitness estimates and planning support. Calorie and macronutrient targets are estimates, not medical advice or a substitute for guidance from a qualified healthcare professional. Exercise safely and adapt activities to your needs.

## Features

- **Personalized onboarding:** Create a profile with age, sex, height, weight, fitness goal, experience level, preferred workout setting, available equipment, training days, session length, and units.
- **Daily dashboard:** Review the selected day's logged activity and nutrition, navigate between dates, and access quick-entry actions.
- **Adaptive workout plans:** Generate workout schedules for the gym, home, or outdoors based on the profile and goal, with exercises, warm-ups, cool-downs, and estimated session lengths.
- **Exercise library:** Use a structured catalogue of exercises with muscle groups, equipment, experience levels, sets/reps or duration, rest periods, form cues, and alternatives where available.
- **Activity tracking:** Log activities manually and use supported device capabilities for outdoor GPS tracking and motion-based step counting.
- **Nutrition tracking:** Record meals and their calorie and macronutrient estimates, and view daily targets calculated from profile details and fitness goals.
- **Hydration tracking:** Record water intake in the daily log.
- **Profile management:** Update profile details and reset locally stored PulseFit data.
- **Responsive interface:** Navigate through Today, Workouts, Activity, Nutrition, and Profile views on desktop or mobile layouts.

## Technology stack

- **React 19** and **TypeScript**
- **Vite 8** for local development and production builds
- **Tailwind CSS 4** for styling
- **Lucide React** for icons
- **Motion** for interface animation
- Browser **Local Storage** for profile and daily-log persistence
- Browser **Geolocation** and **Device Motion** APIs for supported tracking features

The workout-plan and calorie/macro recommendation logic lives in `src/utils/recommendations.ts`. Exercise data is maintained in `src/data/exercises.ts`, and local persistence helpers are in `src/utils/storage.ts`.

## Getting started

### Prerequisites

- Node.js compatible with the installed Vite version
- npm (included with Node.js)

### Install dependencies

Clone the repository and enter the project directory:

```bash
git clone https://github.com/alanalodha-lab/rep01.git
cd rep01
npm install
```

### Run the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### Build for production

```bash
npm run build
```

The production build is generated in the `dist/` directory.

### Type-check the project

```bash
npm run lint
```

Despite the script name, this command runs TypeScript's `tsc --noEmit`; it does not run a separate ESLint ruleset.

## Usage

1. Open PulseFit in a browser.
2. Complete onboarding to create your fitness profile.
3. Visit **Today** to review the selected day's information and use quick-entry actions.
4. Open **Workouts** to view the generated plan and change the active training setting.
5. Use **Activity** to review or record activities. GPS and motion features require a compatible browser/device and permission.
6. Use **Nutrition** to record meals and monitor estimated daily nutrition.
7. Open **Profile** to update your details or reset the app's locally stored data.

### Browser permissions and tracking

- Outdoor GPS tracking requires browser geolocation permission and generally works only in a secure context, such as HTTPS or localhost.
- Step counting depends on browser and device support for the Device Motion API. Some platforms, including iOS, require an explicit permission request.
- If a sensor is unavailable or permission is denied, use the manual-entry options where provided.

## Data and privacy

PulseFit stores its user profile, daily logs, and active workout-setting override in the browser's Local Storage. The keys currently used are:

- `pulsefit_user_profile`
- `pulsefit_daily_logs`
- `pulsefit_active_setting_override`

This means data is tied to the browser and origin being used; it is not automatically synced between devices or browsers. Clearing site data or using the profile reset action can remove saved information. Avoid entering information you do not want stored in that browser.

## Project structure

```text
rep01/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   ├── Onboarding.tsx
    │   ├── TodayDashboard.tsx
    │   ├── WorkoutsView.tsx
    │   ├── ActivityView.tsx
    │   ├── NutritionView.tsx
    │   └── ProfileView.tsx
    ├── data/
    │   └── exercises.ts
    ├── hooks/
    │   └── useSensors.ts
    ├── types/
    │   └── fitness.ts
    └── utils/
        ├── recommendations.ts
        └── storage.ts
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run TypeScript checks without emitting files |

## Configuration

An `.env.example` file is included as a starting point for environment configuration. It lists `GEMINI_API_KEY` and `APP_URL` placeholders. Copy it to `.env.local` only if your deployment or additional integration requires those variables, and replace placeholders with appropriate values.

**Never commit real API keys, credentials, or other secrets.** Keep local environment files out of version control and configure secrets through your hosting provider when deploying.

## Troubleshooting

- **The app starts at onboarding:** No saved PulseFit profile was found in this browser. Complete onboarding to continue.
- **Your profile or logs are missing on another device:** Local Storage is browser- and origin-specific; the current implementation does not provide automatic cloud sync.
- **GPS tracking does not start:** Check that the browser supports geolocation, the page is served over HTTPS or localhost, and location permission is granted.
- **Step counting is unavailable:** Try a compatible mobile browser/device and grant motion permission if prompted, or use manual logging.
- **The build or type-check fails:** Confirm that dependencies are installed with `npm install`, then review the terminal output for the relevant TypeScript or Vite error.

## Contributing

Contributions and improvements are welcome.

1. Create a branch for your change.
2. Keep changes focused and follow the existing React/TypeScript conventions.
3. Run `npm run lint` and `npm run build` before submitting.
4. Describe the change, its motivation, and any manual testing performed in your pull request.
5. Update this README when user-facing behavior, setup steps, or project structure changes.

For larger changes, open an issue first to discuss the proposed approach.

## License

No license file is currently present in the repository. Unless a license is added, reuse and redistribution rights should not be assumed. Add a license file before distributing the project under an open-source license.

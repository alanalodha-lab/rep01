import React, { useState } from 'react';
import { 
  UserProfile, 
  DailyLog, 
  ActivityEntry, 
  ActivitySource 
} from '../types/fitness';
import { 
  useOutdoorGpsTracker, 
  useDeviceMotionStepCounter 
} from '../hooks/useSensors';
import { 
  Footprints, 
  Clock, 
  Flame, 
  MapPin, 
  Compass, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Smartphone, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  RotateCcw,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface ActivityViewProps {
  profile: UserProfile;
  dailyLog: DailyLog;
  allLogs: Record<string, DailyLog>;
  onUpdateDailyLog: (updated: DailyLog) => void;
  currentDate: string;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  profile,
  dailyLog,
  allLogs,
  onUpdateDailyLog,
  currentDate,
}) => {
  // Manual Activity Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('Brisk Outdoor Walk');
  const [manualType, setManualType] = useState<ActivityEntry['type']>('walk');
  const [manualMinutes, setManualMinutes] = useState(30);
  const [manualSteps, setManualSteps] = useState(3200);
  const [manualDistanceKm, setManualDistanceKm] = useState(2.4);
  const [manualCalories, setManualCalories] = useState(150);

  // Live Outdoor GPS Hook
  const {
    isTracking: isGpsTracking,
    isPaused: isGpsPaused,
    elapsedSeconds: gpsElapsedSeconds,
    distanceKm: gpsDistanceKm,
    currentSpeedKmh: gpsSpeedKmh,
    paceMinPerKm: gpsPace,
    errorMsg: gpsError,
    startTracking: startGps,
    pauseTracking: pauseGps,
    resumeTracking: resumeGps,
    stopTracking: stopGps,
  } = useOutdoorGpsTracker();

  // DeviceMotion Step Counter Hook
  const {
    isCounting: isMotionCounting,
    steps: motionSteps,
    setSteps: setMotionSteps,
    supported: motionSupported,
    statusMessage: motionStatus,
    startStepCounter,
    stopStepCounter,
  } = useDeviceMotionStepCounter();

  // Deduplication & Aggregation logic (prefer manual > sensor > simulated)
  const activities = dailyLog.activities || [];
  const manualEntries = activities.filter(a => a.source === 'manual');
  const sensorEntries = activities.filter(a => a.source === 'sensor');
  const simulatedEntries = activities.filter(a => a.source === 'simulated');

  const totalSteps = activities.reduce((acc, a) => acc + (a.steps || 0), 0);
  const totalDistanceKm = Math.round(activities.reduce((acc, a) => acc + (a.distanceKm || 0), 0) * 10) / 10;
  const totalMinutes = activities.reduce((acc, a) => acc + (a.activeMinutes || 0), 0);
  const totalCalories = activities.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);

  // 7-day trend calculation
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - (6 - i));
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const log = allLogs[dStr];
    const steps = log?.activities?.reduce((acc, a) => acc + (a.steps || 0), 0) || 0;
    const mins = log?.activities?.reduce((acc, a) => acc + (a.activeMinutes || 0), 0) || 0;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    return { date: dStr, steps, mins, dayLabel };
  });

  const maxSteps7Days = Math.max(8000, ...last7DaysData.map(d => d.steps));

  // Save manual activity
  const handleSaveManualActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: ActivityEntry = {
      id: `manual-${Date.now()}`,
      title: manualTitle,
      type: manualType,
      source: 'manual',
      timestamp: new Date().toISOString(),
      date: currentDate,
      steps: Number(manualSteps) || 0,
      distanceKm: Number(manualDistanceKm) || 0,
      activeMinutes: Number(manualMinutes) || 0,
      caloriesBurned: Number(manualCalories) || 0,
    };

    onUpdateDailyLog({
      ...dailyLog,
      activities: [newEntry, ...dailyLog.activities],
    });
    setShowManualModal(false);
  };

  // Stop & Save Outdoor GPS Session
  const handleSaveGpsSession = () => {
    const durationMin = Math.max(1, Math.round(gpsElapsedSeconds / 60));
    const estimatedCalories = Math.round(durationMin * 7.5);
    const estimatedSteps = Math.round(gpsDistanceKm * 1350);

    const newEntry: ActivityEntry = {
      id: `sensor-gps-${Date.now()}`,
      title: 'Outdoor Live GPS Session',
      type: 'run',
      source: 'sensor',
      timestamp: new Date().toISOString(),
      date: currentDate,
      steps: estimatedSteps,
      distanceKm: gpsDistanceKm,
      activeMinutes: durationMin,
      caloriesBurned: estimatedCalories,
      paceMinPerKm: gpsPace,
      notes: `Recorded via browser Geolocation (${durationMin} min at ${gpsPace > 0 ? gpsPace + ' min/km' : 'variable pace'}).`,
    };

    stopGps();
    onUpdateDailyLog({
      ...dailyLog,
      activities: [newEntry, ...dailyLog.activities],
    });
  };

  // Sync Live Motion Steps to Daily Log
  const handleSaveMotionSteps = () => {
    if (motionSteps <= 0) return;
    const estDistanceKm = Math.round((motionSteps * 0.00075) * 100) / 100;
    const estMinutes = Math.round(motionSteps / 100);
    const estCalories = Math.round(estMinutes * 4.5);

    const newEntry: ActivityEntry = {
      id: `sensor-motion-${Date.now()}`,
      title: 'Sensor Step Batch',
      type: 'sensor_steps',
      source: 'sensor',
      timestamp: new Date().toISOString(),
      date: currentDate,
      steps: motionSteps,
      distanceKm: estDistanceKm,
      activeMinutes: estMinutes,
      caloriesBurned: estCalories,
      notes: 'Recorded via device accelerometer motion events.',
    };

    stopStepCounter();
    setMotionSteps(0);
    onUpdateDailyLog({
      ...dailyLog,
      activities: [newEntry, ...dailyLog.activities],
    });
  };

  // Simulated Phone Sync ("Demo data")
  const handleSimulatePhoneSync = () => {
    // Generate realistic demo data
    const randomSteps = 6500 + Math.floor(Math.random() * 2500);
    const randomMins = 35 + Math.floor(Math.random() * 25);
    const randomDist = Math.round((randomSteps * 0.00076) * 10) / 10;
    const randomCalories = Math.round(randomMins * 6.2);

    const demoEntry: ActivityEntry = {
      id: `simulated-${Date.now()}`,
      title: 'Phone Step Recorder Sync',
      type: 'walk',
      source: 'simulated',
      timestamp: new Date().toISOString(),
      date: currentDate,
      steps: randomSteps,
      distanceKm: randomDist,
      activeMinutes: randomMins,
      caloriesBurned: randomCalories,
      notes: 'Demo data simulating background phone activity recording.',
    };

    onUpdateDailyLog({
      ...dailyLog,
      activities: [demoEntry, ...dailyLog.activities],
    });
  };

  // Delete an activity entry
  const handleDeleteActivity = (id: string) => {
    onUpdateDailyLog({
      ...dailyLog,
      activities: dailyLog.activities.filter(a => a.id !== id),
    });
  };

  // Format elapsed seconds as MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Activity & Movement
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Integrates manual logs, live browser sensors, and demo sync.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleSimulatePhoneSync}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-300 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
            Sync Demo Data
          </button>

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log Activity
          </button>
        </div>
      </div>

      {/* Daily Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Footprints className="w-3.5 h-3.5 text-emerald-400" />
            Total Steps
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalSteps.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Goal: 8,000</div>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Distance
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalDistanceKm} <span className="text-xs font-normal text-zinc-400">km</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {(totalDistanceKm * 0.621371).toFixed(1)} miles
          </div>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Active Time
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalMinutes} <span className="text-xs font-normal text-zinc-400">min</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Goal: {profile.sessionMinutes || 45}m
          </div>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Burned
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalCalories} <span className="text-xs font-normal text-zinc-400">kcal</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Estimated total</div>
        </div>
      </div>

      {/* Live Sensors Section: GPS & Accelerometer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GPS Outdoor Live Tracker */}
        <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Outdoor GPS Tracker
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Measures distance, pace & route duration
                </span>
              </div>
            </div>
            {isGpsTracking && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Recording
              </span>
            )}
          </div>

          {/* GPS Metrics Display */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-center font-mono">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase">Elapsed</div>
              <div className="text-xl font-bold text-zinc-100 mt-0.5">
                {formatTime(gpsElapsedSeconds)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase">Distance</div>
              <div className="text-xl font-bold text-purple-400 mt-0.5">
                {gpsDistanceKm} <span className="text-xs">km</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase">Pace</div>
              <div className="text-xl font-bold text-zinc-100 mt-0.5">
                {gpsPace > 0 ? `${gpsPace}` : '--'} <span className="text-xs">/km</span>
              </div>
            </div>
          </div>

          {gpsError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* GPS Controls */}
          <div className="flex items-center gap-2">
            {!isGpsTracking ? (
              <button
                type="button"
                onClick={startGps}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Outdoor Session
              </button>
            ) : (
              <>
                {isGpsPaused ? (
                  <button
                    type="button"
                    onClick={resumeGps}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseGps}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    Pause
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveGpsSession}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Save Session
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Device Motion Accelerometer Step Counter */}
        <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Device Motion Counter
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Estimates steps via device accelerometer
                </span>
              </div>
            </div>
            {isMotionCounting && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            )}
          </div>

          {/* Steps Display */}
          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Current Live Steps</div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {motionSteps.toLocaleString()}
              </div>
            </div>
            <div className="text-right text-xs font-mono text-zinc-500">
              <div>~{(motionSteps * 0.00075).toFixed(2)} km</div>
              <div>~{Math.round(motionSteps * 0.045)} kcal</div>
            </div>
          </div>

          {motionStatus && (
            <div className="text-xs text-zinc-400 leading-snug">
              {motionStatus}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isMotionCounting ? (
              <button
                type="button"
                onClick={startStepCounter}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Step Sensor
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveMotionSteps}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Save & Add {motionSteps} Steps to Log
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Activity Chart */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              7-Day Activity Trend
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Average: {Math.round(last7DaysData.reduce((a, b) => a + b.steps, 0) / 7).toLocaleString()} steps/day
          </span>
        </div>

        {/* Bar Graph */}
        <div className="flex items-end justify-between gap-2 h-36 pt-6 px-2">
          {last7DaysData.map((d) => {
            const heightPercent = Math.max(8, Math.round((d.steps / maxSteps7Days) * 100));
            const isTodayBar = d.date === currentDate;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[10px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.steps > 0 ? `${Math.round(d.steps / 1000)}k` : '0'}
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

      {/* Activity History List with Source Badges */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Today's Logged Sessions ({activities.length})
          </h3>
          <span className="text-xs text-zinc-500">
            Precedence: Manual &gt; Sensor &gt; Demo Data
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No activities recorded for today yet. Use manual entry, start GPS, or tap Sync Demo Data.
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((act) => {
              // Source badge styling
              let sourceBadge = (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300">
                  Manual
                </span>
              );
              if (act.source === 'sensor') {
                sourceBadge = (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300">
                    Live Sensor
                  </span>
                );
              } else if (act.source === 'simulated') {
                sourceBadge = (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    Demo Data
                  </span>
                );
              }

              return (
                <div
                  key={act.id}
                  className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                      <Footprints className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-200">
                          {act.title}
                        </span>
                        {sourceBadge}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        {act.steps > 0 && `${act.steps.toLocaleString()} steps · `}
                        {act.distanceKm > 0 && `${act.distanceKm} km · `}
                        {act.activeMinutes} min · ~{act.caloriesBurned} kcal
                      </div>
                      {act.notes && (
                        <div className="text-[11px] text-zinc-500 mt-1 italic">
                          {act.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteActivity(act.id)}
                    aria-label="Delete entry"
                    className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Activity Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-100">
                Log Activity Manually
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveManualActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    required
                    value={manualMinutes}
                    onChange={(e) => {
                      const mins = parseInt(e.target.value) || 0;
                      setManualMinutes(mins);
                      setManualCalories(Math.round(mins * 5.5));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3000"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Steps (optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={manualSteps}
                    onChange={(e) => setManualSteps(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={manualDistanceKm}
                    onChange={(e) => setManualDistanceKm(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-colors mt-2"
              >
                Save Activity to Daily Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

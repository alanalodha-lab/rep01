import { useState, useEffect, useRef, useCallback } from 'react';

// Haversine formula for calculating distance between 2 coordinates in kilometers
function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GpsLocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export function useOutdoorGpsTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GpsLocationPoint | null>(null);

  // Timer loop
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, isPaused]);

  const startTracking = useCallback(() => {
    setErrorMsg(null);
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported in this browser environment.');
      return false;
    }

    setElapsedSeconds(0);
    setDistanceKm(0);
    setCurrentSpeedKmh(0);
    lastLocationRef.current = null;
    setIsPaused(false);
    setIsTracking(true);

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed } = position.coords;
          if (speed && speed > 0) {
            setCurrentSpeedKmh(Math.round(speed * 3.6 * 10) / 10);
          }

          if (lastLocationRef.current) {
            const delta = calculateHaversineDistanceKm(
              lastLocationRef.current.latitude,
              lastLocationRef.current.longitude,
              latitude,
              longitude
            );
            // Ignore tiny jitter movements (< 3 meters) or huge GPS leaps
            if (delta > 0.003 && delta < 0.5) {
              setDistanceKm((prev) => {
                const updated = prev + delta;
                return Math.round(updated * 100) / 100;
              });
            }
          }

          lastLocationRef.current = {
            latitude,
            longitude,
            accuracy,
            timestamp: position.timestamp,
          };
        },
        (err) => {
          console.warn('Geolocation warning/error:', err.message);
          if (err.code === 1) {
            setErrorMsg('Location access was denied. Please allow location permissions in browser settings.');
          } else {
            setErrorMsg('Unable to acquire GPS signal: ' + err.message);
          }
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000,
        }
      );
      watchIdRef.current = id;
      return true;
    } catch (e: any) {
      setErrorMsg('Failed to initialize GPS: ' + (e?.message || 'Unknown error'));
      setIsTracking(false);
      return false;
    }
  }, []);

  const pauseTracking = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTracking = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
  }, []);

  // Compute pace in minutes per km
  const paceMinPerKm = distanceKm > 0.05
    ? Math.round((elapsedSeconds / 60 / distanceKm) * 10) / 10
    : 0;

  return {
    isTracking,
    isPaused,
    elapsedSeconds,
    distanceKm,
    currentSpeedKmh,
    paceMinPerKm,
    errorMsg,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  };
}

export function useDeviceMotionStepCounter() {
  const [isCounting, setIsCounting] = useState(false);
  const [steps, setSteps] = useState(0);
  const [supported, setSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const lastAccelRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const delta = Math.abs(magnitude - lastAccelRef.current);
    const now = Date.now();

    // Step threshold filter and debounce (at least 280ms between steps)
    if (delta > 3.2 && now - lastStepTimeRef.current > 280) {
      lastStepTimeRef.current = now;
      setSteps((prev) => prev + 1);
    }
    lastAccelRef.current = magnitude;
  }, []);

  const startStepCounter = async () => {
    setStatusMessage(null);

    // iOS 13+ Permission API
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
          setIsCounting(true);
          setStatusMessage('Step counter active via DeviceMotion sensor.');
          return true;
        } else {
          setStatusMessage('Motion sensor permission was denied on iOS. Use manual entry or demo sync.');
          return false;
        }
      } catch (err: any) {
        setStatusMessage('Error requesting motion permission: ' + (err?.message || 'Denied'));
        return false;
      }
    } else if ('ondevicemotion' in window) {
      // Standard Android / Desktop browser
      window.addEventListener('devicemotion', handleMotion);
      setIsCounting(true);
      setStatusMessage('Step counter active via DeviceMotion sensor.');
      return true;
    } else {
      setSupported(false);
      setStatusMessage('DeviceMotion sensor is not supported in this browser. Please use manual entry.');
      return false;
    }
  };

  const stopStepCounter = () => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsCounting(false);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return {
    isCounting,
    steps,
    setSteps,
    supported,
    statusMessage,
    startStepCounter,
    stopStepCounter,
  };
}

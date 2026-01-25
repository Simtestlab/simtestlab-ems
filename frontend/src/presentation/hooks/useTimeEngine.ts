/**
 * React Hooks for Time Engine
 * 
 * Provides React integration for time management and scenario control.
 */

import { useEffect, useState, useCallback } from 'react';
import { timeEngine } from '@/infrastructure/time/time-engine';
import { ScenarioConfig, ScenarioMode, TimeEngineStatus } from '@/domain/entities/time-series.entity';

/**
 * Hook to access current time from time engine
 * Automatically subscribes to time updates and re-renders component
 */
export function useTimeEngine() {
  const [currentTime, setCurrentTime] = useState<number>(timeEngine.getCurrentTime());

  useEffect(() => {
    // Start time engine if not already running
    timeEngine.start();

    // Subscribe to time updates
    const unsubscribe = timeEngine.subscribe((time) => {
      setCurrentTime(time);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  return currentTime;
}

/**
 * Hook to access and control time engine scenario
 */
export function useTimeEngineControl() {
  const [scenario, setScenario] = useState<ScenarioConfig>(timeEngine.getScenario());
  const [status, setStatus] = useState<TimeEngineStatus>(timeEngine.getStatus());
  const currentTime = useTimeEngine();

  // Update scenario and status when time changes
  useEffect(() => {
    setScenario(timeEngine.getScenario());
    setStatus(timeEngine.getStatus());
  }, [currentTime]);

  // Control functions
  const setMode = useCallback((mode: ScenarioMode, startTime?: number) => {
    timeEngine.setScenario({ mode, startTime });
    setScenario(timeEngine.getScenario());
  }, []);

  const setSpeed = useCallback((speedMultiplier: number) => {
    timeEngine.setSpeed(speedMultiplier);
    setScenario(timeEngine.getScenario());
  }, []);

  const pause = useCallback(() => {
    timeEngine.pause();
    setScenario(timeEngine.getScenario());
  }, []);

  const resume = useCallback(() => {
    timeEngine.resume();
    setScenario(timeEngine.getScenario());
  }, []);

  const jumpTo = useCallback((timestamp: number) => {
    timeEngine.jumpTo(timestamp);
  }, []);

  const stepForward = useCallback((ms: number) => {
    timeEngine.stepForward(ms);
  }, []);

  const goLive = useCallback(() => {
    timeEngine.setScenario({ mode: ScenarioMode.LIVE });
    setScenario(timeEngine.getScenario());
  }, []);

  const goHistorical = useCallback((startTime: number, speedMultiplier: number = 1.0) => {
    timeEngine.setScenario({
      mode: ScenarioMode.HISTORICAL,
      startTime,
      speedMultiplier,
    });
    setScenario(timeEngine.getScenario());
  }, []);

  const goSimulation = useCallback((startTime: number, speedMultiplier: number = 1.0) => {
    timeEngine.setScenario({
      mode: ScenarioMode.SIMULATION,
      startTime,
      speedMultiplier,
    });
    setScenario(timeEngine.getScenario());
  }, []);

  return {
    currentTime,
    scenario,
    status,
    controls: {
      setMode,
      setSpeed,
      pause,
      resume,
      jumpTo,
      stepForward,
      goLive,
      goHistorical,
      goSimulation,
    },
  };
}

/**
 * Hook to format current time
 */
export function useFormattedTime(format: 'full' | 'time' | 'date' = 'full') {
  const currentTime = useTimeEngine();
  const date = new Date(currentTime);

  switch (format) {
    case 'time':
      return date.toLocaleTimeString();
    case 'date':
      return date.toLocaleDateString();
    case 'full':
    default:
      return date.toLocaleString();
  }
}

/**
 * Hook to check if time engine is in live mode
 */
export function useIsLiveMode() {
  const currentTime = useTimeEngine();
  const [isLive, setIsLive] = useState<boolean>(
    timeEngine.getScenario().mode === ScenarioMode.LIVE
  );

  useEffect(() => {
    setIsLive(timeEngine.getScenario().mode === ScenarioMode.LIVE);
  }, [currentTime]);

  return isLive;
}

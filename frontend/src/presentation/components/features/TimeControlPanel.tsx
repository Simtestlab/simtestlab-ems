/**
 * Time Control Panel Component
 * 
 * Provides UI controls for time engine scenario management:
 * - Mode switching (Live/Historical/Simulation)
 * - Speed control
 * - Time navigation
 * - Pause/Resume
 */

'use client';

import React, { useState } from 'react';
import { useTimeEngineControl, useFormattedTime } from '@/presentation/hooks/useTimeEngine';
import { ScenarioMode } from '@/domain/entities/time-series.entity';
import { 
  Play, 
  Pause, 
  FastForward, 
  Rewind, 
  Radio,
  Clock,
  Calendar,
  Zap
} from 'lucide-react';

export default function TimeControlPanel() {
  const { currentTime, scenario, controls } = useTimeEngineControl();
  const formattedTime = useFormattedTime('full');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Speed presets
  const speedPresets = [0.5, 1, 2, 5, 10, 60];

  // Quick jump options (for historical mode)
  const jumpOptions = [
    { label: '1 Hour Ago', ms: 60 * 60 * 1000 },
    { label: '6 Hours Ago', ms: 6 * 60 * 60 * 1000 },
    { label: '1 Day Ago', ms: 24 * 60 * 60 * 1000 },
    { label: '1 Week Ago', ms: 7 * 24 * 60 * 60 * 1000 },
  ];

  const handleModeChange = (mode: ScenarioMode) => {
    switch (mode) {
      case ScenarioMode.LIVE:
        controls.goLive();
        break;
      case ScenarioMode.HISTORICAL:
        // Go to 24 hours ago
        const yesterday = Date.now() - 24 * 60 * 60 * 1000;
        controls.goHistorical(yesterday, 1);
        break;
      case ScenarioMode.SIMULATION:
        controls.goSimulation(currentTime, 1);
        break;
    }
  };

  const handleQuickJump = (msAgo: number) => {
    const targetTime = Date.now() - msAgo;
    controls.jumpTo(targetTime);
  };

  const getModeColor = (mode: ScenarioMode) => {
    switch (mode) {
      case ScenarioMode.LIVE:
        return 'bg-green-100 text-green-800 border-green-300';
      case ScenarioMode.HISTORICAL:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case ScenarioMode.SIMULATION:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  const getModeIcon = (mode: ScenarioMode) => {
    switch (mode) {
      case ScenarioMode.LIVE:
        return <Radio className="w-4 h-4" />;
      case ScenarioMode.HISTORICAL:
        return <Clock className="w-4 h-4" />;
      case ScenarioMode.SIMULATION:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          Time Control
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      {/* Current Time Display */}
      <div className={`mb-4 p-3 rounded-lg border ${getModeColor(scenario.mode)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getModeIcon(scenario.mode)}
            <span className="font-semibold capitalize">{scenario.mode}</span>
          </div>
          <div className="text-sm font-mono">{formattedTime}</div>
        </div>
        {scenario.mode !== ScenarioMode.LIVE && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span>Speed: {scenario.speedMultiplier}x</span>
            <span>{scenario.paused ? 'Paused' : 'Running'}</span>
          </div>
        )}
      </div>

      {/* Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(ScenarioMode).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                scenario.mode === mode
                  ? getModeColor(mode)
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {getModeIcon(mode)}
                <span className="capitalize">{mode}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Playback Controls (for non-live modes) */}
      {scenario.mode !== ScenarioMode.LIVE && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Playback
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => controls.stepForward(-60 * 60 * 1000)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Back 1 hour"
              >
                <Rewind className="w-4 h-4" />
              </button>
              <button
                onClick={() => (scenario.paused ? controls.resume() : controls.pause())}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  {scenario.paused ? (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={() => controls.stepForward(60 * 60 * 1000)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Forward 1 hour"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Speed Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speed Multiplier
            </label>
            <div className="grid grid-cols-6 gap-1">
              {speedPresets.map((speed) => (
                <button
                  key={speed}
                  onClick={() => controls.setSpeed(speed)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    scenario.speedMultiplier === speed
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Controls */}
          {showAdvanced && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Jump
              </label>
              <div className="grid grid-cols-2 gap-2">
                {jumpOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleQuickJump(option.ms)}
                    className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Go Live Button (for non-live modes) */}
      {scenario.mode !== ScenarioMode.LIVE && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => controls.goLive()}
            className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4" />
            <span>Go Live</span>
          </button>
        </div>
      )}
    </div>
  );
}
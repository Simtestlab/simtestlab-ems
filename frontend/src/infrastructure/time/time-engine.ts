/**
 * Time Engine Implementation
 * 
 * Provides unified time management for the entire EMS simulation.
 * Supports live, historical, and simulation modes with configurable speed.
 * All mock data generators should use this as the single source of truth for time.
 */

import {
  ITimeEngine,
  ScenarioConfig,
  ScenarioMode,
  TimeEngineStatus,
  TimeUpdateCallback,
} from '@/domain/entities/time-series.entity';

/**
 * TimeEngine - Master clock for all EMS simulations
 * 
 * This singleton ensures all mock data generators are synchronized to the same clock,
 * enabling consistent historical data and replay capabilities.
 */
export class TimeEngine implements ITimeEngine {
  private static instance: TimeEngine | null = null;

  // Time management
  private currentTime: number;
  private startupTime: number;
  private lastTickTime: number;

  // Scenario configuration
  private scenario: ScenarioConfig;

  // Observer pattern for time updates
  private subscribers: Set<TimeUpdateCallback>;
  private tickInterval: NodeJS.Timeout | null;
  private readonly TICK_INTERVAL_MS = 1000; // Update every second

  // Running state
  private isRunning: boolean;

  private constructor() {
    this.currentTime = Date.now();
    this.startupTime = Date.now();
    this.lastTickTime = Date.now();
    this.subscribers = new Set();
    this.tickInterval = null;
    this.isRunning = false;

    // Default to live mode
    this.scenario = {
      mode: ScenarioMode.LIVE,
      speedMultiplier: 1.0,
      paused: false,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TimeEngine {
    if (!TimeEngine.instance) {
      TimeEngine.instance = new TimeEngine();
    }
    return TimeEngine.instance;
  }

  /**
   * Reset singleton (useful for testing)
   */
  public static resetInstance(): void {
    if (TimeEngine.instance) {
      TimeEngine.instance.stop();
      TimeEngine.instance = null;
    }
  }

  /**
   * Get current timestamp
   */
  public getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Get current scenario configuration
   */
  public getScenario(): ScenarioConfig {
    return { ...this.scenario };
  }

  /**
   * Set scenario configuration
   */
  public setScenario(config: Partial<ScenarioConfig>): void {
    const wasRunning = this.isRunning;
    
    // Stop current scenario
    if (wasRunning) {
      this.stop();
    }

    // Update scenario
    this.scenario = {
      ...this.scenario,
      ...config,
    };

    // Handle mode-specific initialization
    if (config.mode !== undefined) {
      switch (config.mode) {
        case ScenarioMode.LIVE:
          // Reset to current system time
          this.currentTime = Date.now();
          break;

        case ScenarioMode.HISTORICAL:
        case ScenarioMode.SIMULATION:
          // Use provided start time or keep current
          if (config.startTime !== undefined) {
            this.currentTime = config.startTime;
          }
          break;
      }
    }

    // Reset tick tracking
    this.lastTickTime = Date.now();

    // Restart if was running
    if (wasRunning && !this.scenario.paused) {
      this.start();
    }

    // Notify subscribers of time change
    this.notifySubscribers();
  }

  /**
   * Subscribe to time updates
   * @returns Unsubscribe function
   */
  public subscribe(callback: TimeUpdateCallback): () => void {
    this.subscribers.add(callback);

    // Immediately call with current time
    callback(this.currentTime);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get engine status
   */
  public getStatus(): TimeEngineStatus {
    return {
      currentTime: this.currentTime,
      scenario: this.getScenario(),
      subscriberCount: this.subscribers.size,
      uptimeMs: Date.now() - this.startupTime,
    };
  }

  /**
   * Start the time engine
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTickTime = Date.now();

    // Start tick loop
    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.TICK_INTERVAL_MS);
  }

  /**
   * Stop the time engine
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Perform a time tick
   */
  private tick(): void {
    if (this.scenario.paused) {
      return;
    }

    const now = Date.now();
    const realElapsedMs = now - this.lastTickTime;
    this.lastTickTime = now;

    // Calculate simulated time advancement
    const simulatedElapsedMs = this.calculateSimulatedElapsed(realElapsedMs);

    // Update current time based on mode
    switch (this.scenario.mode) {
      case ScenarioMode.LIVE:
        // In live mode, always use system time
        this.currentTime = now;
        break;

      case ScenarioMode.HISTORICAL:
      case ScenarioMode.SIMULATION:
        // In historical/simulation mode, advance by simulated elapsed time
        this.currentTime += simulatedElapsedMs;
        break;
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Calculate simulated elapsed time based on speed multiplier
   */
  private calculateSimulatedElapsed(realElapsedMs: number): number {
    return Math.floor(realElapsedMs * this.scenario.speedMultiplier);
  }

  /**
   * Notify all subscribers of time update
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentTime);
      } catch (error) {
        console.error('Error in time update callback:', error);
      }
    });
  }

  /**
   * Pause time progression
   */
  public pause(): void {
    this.scenario.paused = true;
  }

  /**
   * Resume time progression
   */
  public resume(): void {
    this.scenario.paused = false;
    this.lastTickTime = Date.now();
  }

  /**
   * Jump to specific timestamp (for historical mode)
   */
  public jumpTo(timestamp: number): void {
    if (this.scenario.mode === ScenarioMode.LIVE) {
      console.warn('Cannot jump time in LIVE mode');
      return;
    }

    this.currentTime = timestamp;
    this.notifySubscribers();
  }

  /**
   * Step forward by specified milliseconds (useful for testing)
   */
  public stepForward(ms: number): void {
    if (this.scenario.mode === ScenarioMode.LIVE) {
      console.warn('Cannot step time in LIVE mode');
      return;
    }

    this.currentTime += ms;
    this.notifySubscribers();
  }

  /**
   * Set speed multiplier
   */
  public setSpeed(multiplier: number): void {
    if (multiplier <= 0) {
      console.warn('Speed multiplier must be positive');
      return;
    }

    this.scenario.speedMultiplier = multiplier;
  }
}

// Export singleton instance
export const timeEngine = TimeEngine.getInstance();

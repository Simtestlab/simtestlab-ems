/**
 * Time-Series Domain Entities
 * 
 * Core types for time management, scenario control, and time-series data storage.
 * These entities establish the foundation for consistent historical data and replay capabilities.
 */

/**
 * Scenario modes for time engine operation
 */
export enum ScenarioMode {
  /** Real-time mode: clock follows system time */
  LIVE = 'live',
  /** Historical mode: replay past data at any speed */
  HISTORICAL = 'historical',
  /** Simulation mode: run forward from any point at any speed */
  SIMULATION = 'simulation',
}

/**
 * Configuration for time engine scenario
 */
export interface ScenarioConfig {
  /** Current scenario mode */
  mode: ScenarioMode;
  /** Start timestamp for historical/simulation mode (ms since epoch) */
  startTime?: number;
  /** Speed multiplier (1.0 = real-time, 2.0 = 2x speed, 0.5 = half speed) */
  speedMultiplier: number;
  /** Whether time is currently paused */
  paused: boolean;
}

/**
 * Time range for queries
 */
export interface TimeRange {
  /** Start timestamp (ms since epoch) */
  start: number;
  /** End timestamp (ms since epoch) */
  end: number;
}

/**
 * Single data point in a time series
 */
export interface TimePoint<T = number> {
  /** Timestamp (ms since epoch) */
  timestamp: number;
  /** Data value */
  value: T;
}

/**
 * Aggregation methods for time-series data
 */
export enum AggregationMethod {
  SUM = 'sum',
  AVERAGE = 'avg',
  MIN = 'min',
  MAX = 'max',
  LAST = 'last',
  FIRST = 'first',
}

/**
 * Configuration for time-series storage
 */
export interface TimeSeriesConfig {
  /** Maximum number of points to retain */
  maxPoints: number;
  /** Retention period in milliseconds (points older than this are dropped) */
  retentionMs: number;
  /** Aggregation method for downsampling */
  aggregationMethod: AggregationMethod;
}

/**
 * Query options for time-series data
 */
export interface TimeSeriesQuery {
  /** Time range to query */
  range: TimeRange;
  /** Maximum number of points to return (triggers downsampling if needed) */
  maxPoints?: number;
  /** Aggregation method for downsampling */
  aggregation?: AggregationMethod;
}

/**
 * Result of a time-series query
 */
export interface TimeSeriesQueryResult<T = number> {
  /** Data points in the requested range */
  points: TimePoint<T>[];
  /** Whether downsampling was applied */
  downsampled: boolean;
  /** Original number of points before downsampling */
  originalPointCount?: number;
}

/**
 * Statistics about a time series
 */
export interface TimeSeriesStats {
  /** Total number of points stored */
  pointCount: number;
  /** Timestamp of oldest point */
  oldestTimestamp?: number;
  /** Timestamp of newest point */
  newestTimestamp?: number;
  /** Memory usage estimate in bytes */
  memoryUsage: number;
}

/**
 * Time engine status information
 */
export interface TimeEngineStatus {
  /** Current timestamp (ms since epoch) */
  currentTime: number;
  /** Current scenario configuration */
  scenario: ScenarioConfig;
  /** Number of active subscribers */
  subscriberCount: number;
  /** Time engine uptime in milliseconds */
  uptimeMs: number;
}

/**
 * Observer callback for time updates
 */
export type TimeUpdateCallback = (currentTime: number) => void;

/**
 * Time engine interface for dependency injection
 */
export interface ITimeEngine {
  /** Get current timestamp */
  getCurrentTime(): number;
  
  /** Get current scenario configuration */
  getScenario(): ScenarioConfig;
  
  /** Set scenario configuration */
  setScenario(config: Partial<ScenarioConfig>): void;
  
  /** Subscribe to time updates */
  subscribe(callback: TimeUpdateCallback): () => void;
  
  /** Get engine status */
  getStatus(): TimeEngineStatus;
  
  /** Start the time engine */
  start(): void;
  
  /** Stop the time engine */
  stop(): void;
}

/**
 * Time-Series Store Implementation
 * 
 * Provides efficient storage and retrieval of time-series data with:
 * - Circular buffer for memory-efficient fixed-size storage
 * - Fast range queries
 * - Automatic downsampling for large datasets
 * - Multiple aggregation methods
 * - Automatic data retention management
 */

import {
  AggregationMethod,
  TimePoint,
  TimeRange,
  TimeSeriesConfig,
  TimeSeriesQuery,
  TimeSeriesQueryResult,
  TimeSeriesStats,
} from '@/domain/entities/time-series.entity';

/**
 * TimeSeriesStore - Efficient circular buffer storage for time-series data
 */
export class TimeSeriesStore<T = number> {
  private points: TimePoint<T>[];
  private config: TimeSeriesConfig;
  private writeIndex: number;
  private isFull: boolean;

  constructor(config: Partial<TimeSeriesConfig> = {}) {
    this.config = {
      maxPoints: config.maxPoints ?? 10000,
      retentionMs: config.retentionMs ?? 7 * 24 * 60 * 60 * 1000, // 7 days default
      aggregationMethod: config.aggregationMethod ?? AggregationMethod.AVERAGE,
    };

    this.points = [];
    this.writeIndex = 0;
    this.isFull = false;
  }

  /**
   * Add a data point to the store
   */
  public addPoint(point: TimePoint<T>): void {
    // If buffer is full, use circular write
    if (this.isFull) {
      this.points[this.writeIndex] = point;
      this.writeIndex = (this.writeIndex + 1) % this.config.maxPoints;
    } else {
      this.points.push(point);
      
      // Check if we've filled the buffer
      if (this.points.length >= this.config.maxPoints) {
        this.isFull = true;
        this.writeIndex = 0;
      }
    }

    // Clean up old points if needed
    this.cleanupOldPoints();
  }

  /**
   * Add multiple points efficiently
   */
  public addPoints(points: TimePoint<T>[]): void {
    points.forEach(point => this.addPoint(point));
  }

  /**
   * Query data points in a time range
   */
  public query(query: TimeSeriesQuery): TimeSeriesQueryResult<T> {
    // Get all points in range
    const pointsInRange = this.getPointsInRange(query.range);

    // Apply downsampling if needed
    if (query.maxPoints && pointsInRange.length > query.maxPoints) {
      const downsampled = this.downsample(
        pointsInRange,
        query.maxPoints,
        query.aggregation ?? this.config.aggregationMethod
      );

      return {
        points: downsampled,
        downsampled: true,
        originalPointCount: pointsInRange.length,
      };
    }

    return {
      points: pointsInRange,
      downsampled: false,
    };
  }

  /**
   * Get all points in a time range (sorted by timestamp)
   */
  private getPointsInRange(range: TimeRange): TimePoint<T>[] {
    // Sort points by timestamp (handle circular buffer)
    const sortedPoints = this.getSortedPoints();

    // Filter by range
    return sortedPoints.filter(
      p => p.timestamp >= range.start && p.timestamp <= range.end
    );
  }

  /**
   * Get all points sorted by timestamp
   */
  private getSortedPoints(): TimePoint<T>[] {
    if (!this.isFull) {
      // If buffer not full, points are already in order
      return [...this.points];
    }

    // Buffer is full and circular, need to reconstruct order
    const older = this.points.slice(this.writeIndex);
    const newer = this.points.slice(0, this.writeIndex);
    return [...older, ...newer];
  }

  /**
   * Downsample data points using specified aggregation method
   */
  private downsample(
    points: TimePoint<T>[],
    targetCount: number,
    method: AggregationMethod
  ): TimePoint<T>[] {
    if (points.length <= targetCount) {
      return points;
    }

    const bucketSize = Math.ceil(points.length / targetCount);
    const downsampled: TimePoint<T>[] = [];

    for (let i = 0; i < points.length; i += bucketSize) {
      const bucket = points.slice(i, i + bucketSize);
      const aggregated = this.aggregateBucket(bucket, method);
      downsampled.push(aggregated);
    }

    return downsampled;
  }

  /**
   * Aggregate a bucket of points using specified method
   */
  private aggregateBucket(
    bucket: TimePoint<T>[],
    method: AggregationMethod
  ): TimePoint<T> {
    if (bucket.length === 0) {
      throw new Error('Cannot aggregate empty bucket');
    }

    switch (method) {
      case AggregationMethod.FIRST:
        return bucket[0];

      case AggregationMethod.LAST:
        return bucket[bucket.length - 1];

      case AggregationMethod.MIN:
        return this.aggregateNumericBucket(bucket, Math.min);

      case AggregationMethod.MAX:
        return this.aggregateNumericBucket(bucket, Math.max);

      case AggregationMethod.AVERAGE:
        return this.aggregateAverage(bucket);

      case AggregationMethod.SUM:
        return this.aggregateSum(bucket);

      default:
        return bucket[bucket.length - 1];
    }
  }

  /**
   * Aggregate numeric bucket using a reducer function
   */
  private aggregateNumericBucket(
    bucket: TimePoint<T>[],
    reducer: (a: number, b: number) => number
  ): TimePoint<T> {
    const numericValues = bucket.map(p => Number(p.value));
    const aggregatedValue = numericValues.reduce(reducer);

    // Use middle timestamp of bucket
    const middleIndex = Math.floor(bucket.length / 2);
    
    return {
      timestamp: bucket[middleIndex].timestamp,
      value: aggregatedValue as T,
    };
  }

  /**
   * Aggregate bucket using average
   */
  private aggregateAverage(bucket: TimePoint<T>[]): TimePoint<T> {
    const numericValues = bucket.map(p => Number(p.value));
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / bucket.length;

    const middleIndex = Math.floor(bucket.length / 2);
    
    return {
      timestamp: bucket[middleIndex].timestamp,
      value: avg as T,
    };
  }

  /**
   * Aggregate bucket using sum
   */
  private aggregateSum(bucket: TimePoint<T>[]): TimePoint<T> {
    const numericValues = bucket.map(p => Number(p.value));
    const sum = numericValues.reduce((a, b) => a + b, 0);

    const middleIndex = Math.floor(bucket.length / 2);
    
    return {
      timestamp: bucket[middleIndex].timestamp,
      value: sum as T,
    };
  }

  /**
   * Remove points older than retention period
   */
  private cleanupOldPoints(): void {
    const now = Date.now();
    const cutoffTime = now - this.config.retentionMs;

    if (!this.isFull) {
      // Simple case: remove from start of array
      const validIndex = this.points.findIndex(p => p.timestamp >= cutoffTime);
      if (validIndex > 0) {
        this.points = this.points.slice(validIndex);
      }
    } else {
      // Circular buffer case: more complex cleanup
      // For simplicity, we'll reconstruct the array
      const sortedPoints = this.getSortedPoints();
      const validPoints = sortedPoints.filter(p => p.timestamp >= cutoffTime);
      
      this.points = validPoints;
      this.writeIndex = 0;
      this.isFull = this.points.length >= this.config.maxPoints;
    }
  }

  /**
   * Get statistics about the store
   */
  public getStats(): TimeSeriesStats {
    const sortedPoints = this.getSortedPoints();
    const pointCount = sortedPoints.length;

    return {
      pointCount,
      oldestTimestamp: pointCount > 0 ? sortedPoints[0].timestamp : undefined,
      newestTimestamp: pointCount > 0 ? sortedPoints[pointCount - 1].timestamp : undefined,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: each point has timestamp (8 bytes) + value (8 bytes for number)
    const bytesPerPoint = 16;
    return this.points.length * bytesPerPoint;
  }

  /**
   * Get most recent point
   */
  public getLatest(): TimePoint<T> | undefined {
    const sorted = this.getSortedPoints();
    return sorted.length > 0 ? sorted[sorted.length - 1] : undefined;
  }

  /**
   * Get oldest point
   */
  public getOldest(): TimePoint<T> | undefined {
    const sorted = this.getSortedPoints();
    return sorted.length > 0 ? sorted[0] : undefined;
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.points = [];
    this.writeIndex = 0;
    this.isFull = false;
  }

  /**
   * Get current configuration
   */
  public getConfig(): TimeSeriesConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<TimeSeriesConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // If maxPoints changed, may need to trim
    if (config.maxPoints !== undefined && this.points.length > config.maxPoints) {
      const sortedPoints = this.getSortedPoints();
      this.points = sortedPoints.slice(-config.maxPoints);
      this.writeIndex = 0;
      this.isFull = true;
    }
  }
}

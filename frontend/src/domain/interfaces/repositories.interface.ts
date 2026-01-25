/**
 * Repository Interfaces (Ports)
 * Define contracts for data access without implementation details
 */

import { RealtimeMetrics, HistoricalMetrics } from '../entities/metrics.entity';
import { Space, SpaceMapMarker } from '../entities/space.entity';

/**
 * Metrics Repository Interface
 */
export interface IMetricsRepository {
  /**
   * Get current real-time metrics
   */
  getCurrentMetrics(spaceId?: string): Promise<RealtimeMetrics>;

  /**
   * Subscribe to real-time metrics updates
   * @returns Unsubscribe function
   */
  subscribeToMetrics(
    callback: (metrics: RealtimeMetrics) => void,
    spaceId?: string
  ): () => void;

  /**
   * Get historical metrics for a time range
   */
  getHistoricalMetrics(
    startDate: Date,
    endDate: Date,
    periodType: 'hour' | 'day' | 'week' | 'month',
    spaceId?: string
  ): Promise<HistoricalMetrics[]>;
}

/**
 * Space Repository Interface
 */
export interface ISpaceRepository {
  /**
   * Get all spaces (flat list)
   */
  getAllSpaces(): Promise<Space[]>;

  /**
   * Get space by ID
   */
  getSpaceById(id: string): Promise<Space | null>;

  /**
   * Get root spaces (top-level in hierarchy)
   */
  getRootSpaces(): Promise<Space[]>;

  /**
   * Get children of a space
   */
  getChildSpaces(parentId: string): Promise<Space[]>;

  /**
   * Get space hierarchy as tree
   */
  getSpaceTree(): Promise<Space[]>;

  /**
   * Get spaces with location data for map display
   */
  getSpaceMapMarkers(): Promise<SpaceMapMarker[]>;
}

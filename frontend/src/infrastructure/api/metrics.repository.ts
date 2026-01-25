/**
 * Mock Metrics Repository Implementation
 * Adapts mock data generators to repository interface
 */

import { IMetricsRepository } from '@/domain/interfaces/repositories.interface';
import { RealtimeMetrics, HistoricalMetrics } from '@/domain/entities/metrics.entity';
import { mockMetricsGenerator } from '../mock/metrics.mock';

export class MockMetricsRepository implements IMetricsRepository {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  async getCurrentMetrics(spaceId?: string): Promise<RealtimeMetrics> {
    // For now, ignore spaceId - return global metrics
    return Promise.resolve(mockMetricsGenerator.generateMetrics());
  }
  
  subscribeToMetrics(
    callback: (metrics: RealtimeMetrics) => void,
    spaceId?: string
  ): () => void {
    const intervalId = setInterval(() => {
      const metrics = mockMetricsGenerator.generateMetrics();
      callback(metrics);
    }, 2000); // Update every 2 seconds
    
    // Return unsubscribe function
    return () => {
      clearInterval(intervalId);
    };
  }
  
  async getHistoricalMetrics(
    startDate: Date,
    endDate: Date,
    periodType: 'hour' | 'day' | 'week' | 'month',
    spaceId?: string
  ): Promise<HistoricalMetrics[]> {
    // TODO: Implement historical data generation in Stage 5
    return Promise.resolve([]);
  }
}

/**
 * Singleton instance
 */
export const mockMetricsRepository = new MockMetricsRepository();

/**
 * Metrics Service
 * Application layer service for metrics operations
 */

import { RealtimeMetrics } from '@/domain/entities/metrics.entity';
import { mockMetricsRepository } from '@/infrastructure/api/metrics.repository';

export class MetricsService {
  async getCurrentMetrics(spaceId?: string): Promise<RealtimeMetrics> {
    return mockMetricsRepository.getCurrentMetrics(spaceId);
  }
  
  subscribeToRealtimeMetrics(
    callback: (metrics: RealtimeMetrics) => void,
    spaceId?: string
  ): () => void {
    return mockMetricsRepository.subscribeToMetrics(callback, spaceId);
  }
}

/**
 * Singleton instance
 */
export const metricsService = new MetricsService();

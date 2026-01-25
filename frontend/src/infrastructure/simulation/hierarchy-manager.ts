/**
 * Hierarchical Space Manager
 * 
 * Manages hierarchical simulation with bottom-up aggregation.
 * Simulates leaf zones independently, aggregates metrics to parents.
 */

import { TimeEngine } from '@/infrastructure/time/time-engine';
import { AggregationEngine } from './aggregation-engine';
import { SpaceSimulatorFactory } from './space-simulator';
import { DEFAULT_SITE_CONFIG, SiteConfig } from './simulation-config';
import {
  HierarchicalSpace,
  SpaceMetrics,
  SpaceType,
} from '@/domain/entities/hierarchy.entity';

interface HierarchyUpdateResult {
  spaces: Map<string, HierarchicalSpace>;
  validationErrors: string[];
  lastUpdate: Date;
}

/**
 * Manages hierarchical space simulation
 */
export class HierarchyManager {
  private spaces: Map<string, HierarchicalSpace>;
  private simulators: Map<string, any>;
  private aggregationEngine: AggregationEngine;
  private lastUpdate: number = 0;
  private updateInterval: number = 1000; // 1 second
  private siteConfig: SiteConfig;

  constructor(spaces: HierarchicalSpace[], siteConfig?: SiteConfig) {
    // Build spaces map
    this.spaces = new Map();
    spaces.forEach(space => {
      this.spaces.set(space.id, space);
    });

    // Use provided config or default
    this.siteConfig = siteConfig || DEFAULT_SITE_CONFIG;

    // Create simulators for all leaf nodes (zones)
    this.simulators = SpaceSimulatorFactory.createForHierarchy(spaces, this.siteConfig);

    // Create aggregation engine
    this.aggregationEngine = new AggregationEngine();

    console.log(
      `[HierarchyManager] Initialized with ${spaces.length} spaces, ${this.simulators.size} simulators`
    );
  }

  /**
   * Update all space metrics
   */
  update(): HierarchyUpdateResult {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return {
        spaces: this.spaces,
        validationErrors: [],
        lastUpdate: new Date(this.lastUpdate),
      };
    }

    const timeEngine = TimeEngine.getInstance();
    const currentTime = timeEngine.getCurrentTime();

    // Step 1: Simulate all leaf nodes
    const leafSpaces: HierarchicalSpace[] = [];
    this.spaces.forEach(space => {
      if (space.childIds.length === 0) {
        // Leaf node
        const simulator = this.simulators.get(space.id);
        if (simulator) {
          const metrics = simulator.simulate(currentTime);
          space.metrics = metrics;
          leafSpaces.push(space);
        }
      }
    });

    // Step 2: Aggregate from bottom to top
    const aggregatedMetrics = this.aggregationEngine.aggregateHierarchy(
      this.spaces
    );

    // Update our spaces with aggregated metrics
    aggregatedMetrics.forEach((metrics, spaceId) => {
      const space = this.spaces.get(spaceId);
      if (space) {
        space.metrics = metrics;
        this.spaces.set(spaceId, space);
      }
    });

    // Step 3: Validate aggregation
    const validationErrors = this.validateHierarchy();

    this.lastUpdate = now;

    return {
      spaces: this.spaces,
      validationErrors,
      lastUpdate: new Date(now),
    };
  }

  /**
   * Get current space metrics
   */
  getSpace(id: string): HierarchicalSpace | undefined {
    // Ensure fresh data
    this.update();
    return this.spaces.get(id);
  }

  /**
   * Get all spaces
   */
  getAllSpaces(): HierarchicalSpace[] {
    this.update();
    return Array.from(this.spaces.values());
  }

  /**
   * Get spaces by type
   */
  getSpacesByType(type: SpaceType): HierarchicalSpace[] {
    this.update();
    return Array.from(this.spaces.values()).filter(s => s.type === type);
  }

  /**
   * Get children of a space
   */
  getChildren(parentId: string): HierarchicalSpace[] {
    const parent = this.spaces.get(parentId);
    if (!parent) return [];

    return parent.childIds
      .map(id => this.spaces.get(id))
      .filter((s): s is HierarchicalSpace => s !== undefined);
  }

  /**
   * Get parent of a space
   */
  getParent(childId: string): HierarchicalSpace | undefined {
    const child = this.spaces.get(childId);
    if (!child || !child.parentId) return undefined;
    return this.spaces.get(child.parentId);
  }

  /**
   * Validate hierarchy (parent = sum of children)
   */
  private validateHierarchy(): string[] {
    const errors: string[] = [];
    const tolerance = 0.01; // 1% tolerance for floating point

    this.spaces.forEach(parent => {
      if (parent.childIds.length === 0) return; // Leaf node

      const children = parent.childIds
        .map(id => this.spaces.get(id))
        .filter((s): s is HierarchicalSpace => s !== undefined);

      if (children.length === 0) return;

      // Validate each metric
      const childSolarSum = children.reduce(
        (sum, c) => sum + c.metrics.solarPower,
        0
      );
      const childConsumptionSum = children.reduce(
        (sum, c) => sum + c.metrics.consumptionPower,
        0
      );
      const childBatterySum = children.reduce(
        (sum, c) => sum + c.metrics.batteryPower,
        0
      );
      const childGridSum = children.reduce(
        (sum, c) => sum + c.metrics.gridPower,
        0
      );

      // Check solar
      const solarDiff = Math.abs(parent.metrics.solarPower - childSolarSum);
      if (solarDiff > tolerance * Math.max(parent.metrics.solarPower, childSolarSum)) {
        errors.push(
          `${parent.name}: Solar mismatch (parent=${parent.metrics.solarPower.toFixed(2)}, children=${childSolarSum.toFixed(2)})`
        );
      }

      // Check consumption
      const consumptionDiff = Math.abs(
        parent.metrics.consumptionPower - childConsumptionSum
      );
      if (
        consumptionDiff >
        tolerance * Math.max(parent.metrics.consumptionPower, childConsumptionSum)
      ) {
        errors.push(
          `${parent.name}: Consumption mismatch (parent=${parent.metrics.consumptionPower.toFixed(2)}, children=${childConsumptionSum.toFixed(2)})`
        );
      }

      // Check battery
      const batteryDiff = Math.abs(parent.metrics.batteryPower - childBatterySum);
      if (
        batteryDiff >
        tolerance * Math.max(Math.abs(parent.metrics.batteryPower), Math.abs(childBatterySum))
      ) {
        errors.push(
          `${parent.name}: Battery mismatch (parent=${parent.metrics.batteryPower.toFixed(2)}, children=${childBatterySum.toFixed(2)})`
        );
      }

      // Check grid
      const gridDiff = Math.abs(parent.metrics.gridPower - childGridSum);
      if (gridDiff > tolerance * Math.max(Math.abs(parent.metrics.gridPower), Math.abs(childGridSum))) {
        errors.push(
          `${parent.name}: Grid mismatch (parent=${parent.metrics.gridPower.toFixed(2)}, children=${childGridSum.toFixed(2)})`
        );
      }
    });

    if (errors.length > 0) {
      console.warn('[HierarchyManager] Validation errors:', errors);
    }

    return errors;
  }

  /**
   * Get hierarchy summary
   */
  getSummary(): {
    totalSpaces: number;
    spacesByType: Record<SpaceType, number>;
    totalSimulators: number;
    lastUpdate: Date;
  } {
    const spacesByType: Record<SpaceType, number> = {
      [SpaceType.SITE]: 0,
      [SpaceType.BUILDING]: 0,
      [SpaceType.FLOOR]: 0,
      [SpaceType.ZONE]: 0,
    };

    this.spaces.forEach(space => {
      spacesByType[space.type]++;
    });

    return {
      totalSpaces: this.spaces.size,
      spacesByType,
      totalSimulators: this.simulators.size,
      lastUpdate: new Date(this.lastUpdate),
    };
  }
}

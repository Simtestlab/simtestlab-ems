/**
 * Aggregation Engine
 * 
 * Handles metric aggregation from leaf nodes up through the hierarchy.
 * Ensures parent metrics always equal sum/average of children.
 */

import {
  HierarchicalSpace,
  SpaceMetrics,
  AggregationRule,
  DEFAULT_AGGREGATION_RULES,
  AggregatedMetrics,
} from '@/domain/entities/hierarchy.entity';

/**
 * Aggregation Engine Class
 */
export class AggregationEngine {
  private aggregationRules: AggregationRule[];
  
  constructor(customRules?: AggregationRule[]) {
    this.aggregationRules = customRules || DEFAULT_AGGREGATION_RULES;
  }
  
  /**
   * Aggregate metrics from multiple child spaces
   */
  public aggregateMetrics(children: HierarchicalSpace[]): AggregatedMetrics {
    if (children.length === 0) {
      return {
        solarPower: 0,
        consumptionPower: 0,
        batteryPower: 0,
        gridPower: 0,
        batterySoc: undefined,
        breakdown: {
          hvac: 0,
          lighting: 0,
          equipment: 0,
          other: 0,
        },
        childCount: 0,
        isAggregated: true,
        timestamp: new Date(),
      };
    }
    
    const aggregated: AggregatedMetrics = {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
      breakdown: {
        hvac: 0,
        lighting: 0,
        equipment: 0,
        other: 0,
      },
      childCount: children.length,
      isAggregated: true,
      timestamp: new Date(),
    };
    
    // Apply aggregation rules
    for (const rule of this.aggregationRules) {
      const values = children.map(child => child.metrics[rule.metric as keyof SpaceMetrics]);
      
      switch (rule.method) {
        case 'sum':
          (aggregated as any)[rule.metric] = this.sum(values as number[]);
          break;
        
        case 'average':
          (aggregated as any)[rule.metric] = this.average(values as number[]);
          break;
        
        case 'min':
          (aggregated as any)[rule.metric] = this.min(values as number[]);
          break;
        
        case 'max':
          (aggregated as any)[rule.metric] = this.max(values as number[]);
          break;
        
        case 'weighted_average':
          if (rule.weightBy) {
            (aggregated as any)[rule.metric] = this.weightedAverage(
              values as number[],
              children,
              rule.weightBy
            );
          }
          break;
      }
    }
    
    // Aggregate breakdown if present
    if (children.some(child => child.metrics.breakdown)) {
      aggregated.breakdown = {
        hvac: this.sum(children.map(c => c.metrics.breakdown?.hvac || 0)),
        lighting: this.sum(children.map(c => c.metrics.breakdown?.lighting || 0)),
        equipment: this.sum(children.map(c => c.metrics.breakdown?.equipment || 0)),
        other: this.sum(children.map(c => c.metrics.breakdown?.other || 0)),
      };
    }
    
    // Calculate average SOC weighted by battery capacity
    const batteriesWithSoc = children.filter(
      child => child.metrics.batterySoc !== undefined && child.equipment.batteryCapacity
    );
    
    if (batteriesWithSoc.length > 0) {
      const totalCapacity = batteriesWithSoc.reduce(
        (sum, child) => sum + (child.equipment.batteryCapacity || 0),
        0
      );
      
      if (totalCapacity > 0) {
        const weightedSoc = batteriesWithSoc.reduce(
          (sum, child) =>
            sum +
            (child.metrics.batterySoc || 0) *
            ((child.equipment.batteryCapacity || 0) / totalCapacity),
          0
        );
        aggregated.batterySoc = weightedSoc;
      }
    }
    
    return aggregated;
  }
  
  /**
   * Aggregate entire hierarchy bottom-up
   */
  public aggregateHierarchy(
    spaces: Map<string, HierarchicalSpace>
  ): Map<string, SpaceMetrics> {
    const aggregatedMetrics = new Map<string, SpaceMetrics>();
    
    // Process spaces level by level from bottom to top
    const levels = this.groupByLevel(spaces);
    
    // Start from deepest level (leaves) and work up
    for (let level = levels.length - 1; level >= 0; level--) {
      for (const space of levels[level]) {
        if (space.childIds.length === 0) {
          // Leaf node: use direct metrics
          aggregatedMetrics.set(space.id, space.metrics);
        } else {
          // Parent node: aggregate from children
          const children: HierarchicalSpace[] = [];
          for (const childId of space.childIds) {
            const child = spaces.get(childId);
            if (child) {
              // Create child with aggregated metrics
              const childWithMetrics = {
                ...child,
                metrics: aggregatedMetrics.get(childId) || child.metrics,
              };
              children.push(childWithMetrics);
            }
          }
          
          const aggregated = this.aggregateMetrics(children);
          aggregatedMetrics.set(space.id, aggregated);
        }
      }
    }
    
    return aggregatedMetrics;
  }
  
  /**
   * Group spaces by hierarchy level (0 = root, 1 = children of root, etc.)
   */
  private groupByLevel(
    spaces: Map<string, HierarchicalSpace>
  ): HierarchicalSpace[][] {
    const levels: HierarchicalSpace[][] = [];
    const visited = new Set<string>();
    
    // Find root nodes (no parent)
    const roots: HierarchicalSpace[] = [];
    for (const space of spaces.values()) {
      if (space.parentId === null) {
        roots.push(space);
      }
    }
    
    // BFS to assign levels
    let currentLevel = roots;
    while (currentLevel.length > 0) {
      levels.push([...currentLevel]);
      currentLevel.forEach(space => visited.add(space.id));
      
      const nextLevel: HierarchicalSpace[] = [];
      for (const space of currentLevel) {
        for (const childId of space.childIds) {
          const child = spaces.get(childId);
          if (child && !visited.has(childId)) {
            nextLevel.push(child);
          }
        }
      }
      
      currentLevel = nextLevel;
    }
    
    return levels;
  }
  
  /**
   * Sum aggregation
   */
  private sum(values: number[]): number {
    return values.reduce((sum, val) => sum + (val || 0), 0);
  }
  
  /**
   * Average aggregation
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return this.sum(values) / values.length;
  }
  
  /**
   * Min aggregation
   */
  private min(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values.filter(v => v !== undefined));
  }
  
  /**
   * Max aggregation
   */
  private max(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values.filter(v => v !== undefined));
  }
  
  /**
   * Weighted average aggregation
   */
  private weightedAverage(
    values: number[],
    spaces: HierarchicalSpace[],
    weightBy: string
  ): number {
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i] || 0;
      const weight = this.getWeight(spaces[i], weightBy);
      
      weightedSum += value * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Get weight value from space
   */
  private getWeight(space: HierarchicalSpace, weightBy: string): number {
    switch (weightBy) {
      case 'area':
        return space.metadata?.area || 1;
      case 'capacity':
        return space.equipment.loadCapacity || 1;
      case 'solar':
        return space.equipment.solarCapacity || 0;
      case 'battery':
        return space.equipment.batteryCapacity || 0;
      default:
        return 1;
    }
  }
  
  /**
   * Validate aggregation (ensure parent = sum of children)
   */
  public validateAggregation(
    parent: HierarchicalSpace,
    children: HierarchicalSpace[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (children.length === 0) {
      return { valid: true, errors };
    }
    
    const aggregated = this.aggregateMetrics(children);
    
    // Check each metric (allow small floating point tolerance)
    const tolerance = 0.01;
    
    const checkMetric = (name: keyof SpaceMetrics, parentVal: number, aggVal: number) => {
      if (Math.abs(parentVal - aggVal) > tolerance) {
        errors.push(
          `${name}: parent=${parentVal.toFixed(2)}, aggregated=${aggVal.toFixed(2)}`
        );
      }
    };
    
    checkMetric('solarPower', parent.metrics.solarPower, aggregated.solarPower);
    checkMetric('consumptionPower', parent.metrics.consumptionPower, aggregated.consumptionPower);
    checkMetric('batteryPower', parent.metrics.batteryPower, aggregated.batteryPower);
    checkMetric('gridPower', parent.metrics.gridPower, aggregated.gridPower);
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Singleton instance
 */
export const aggregationEngine = new AggregationEngine();

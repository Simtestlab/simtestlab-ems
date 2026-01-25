/**
 * Hierarchical Space Entities
 * 
 * Defines the domain model for hierarchical space structures in EMS.
 * Supports site → building → floor → zone hierarchy with metric aggregation.
 */

/**
 * Space types in the hierarchy
 */
export enum SpaceType {
  SITE = 'site',
  BUILDING = 'building',
  FLOOR = 'floor',
  ZONE = 'zone',
}

/**
 * Real-time metrics for a space node
 */
export interface SpaceMetrics {
  /** Solar generation in kW (0 for zones/floors without solar) */
  solarPower: number;
  /** Total consumption in kW */
  consumptionPower: number;
  /** Battery power in kW (positive = charging, negative = discharging) */
  batteryPower: number;
  /** Grid power in kW (positive = import, negative = export) */
  gridPower: number;
  /** Battery state of charge (%) - only for spaces with batteries */
  batterySoc?: number;
  /** System efficiency (%) - calculated from generation and consumption */
  efficiency?: number;
  /** Breakdown of consumption */
  breakdown?: {
    hvac: number;
    lighting: number;
    equipment: number;
    other: number;
  };
}

/**
 * Equipment configuration for a space
 */
export interface SpaceEquipment {
  /** Solar capacity in kW */
  solarCapacity?: number;
  /** Battery capacity in kWh */
  batteryCapacity?: number;
  /** Battery max power in kW */
  batteryMaxPower?: number;
  /** Load capacity in kW */
  loadCapacity?: number;
  /** HVAC capacity in kW */
  hvacCapacity?: number;
  /** Lighting capacity in kW */
  lightingCapacity?: number;
  /** Equipment capacity in kW */
  equipmentCapacity?: number;
}

/**
 * Space status indicators
 */
export enum SpaceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

/**
 * Hierarchical space node
 */
export interface HierarchicalSpace {
  /** Unique identifier */
  id: string;
  /** Space name */
  name: string;
  /** Space type */
  type: SpaceType;
  /** Parent space ID (null for root/site) */
  parentId: string | null;
  /** Child space IDs */
  childIds: string[];
  /** Equipment installed at this space */
  equipment: SpaceEquipment;
  /** Current real-time metrics */
  metrics: SpaceMetrics;
  /** Space status */
  status: SpaceStatus;
  /** Additional metadata */
  metadata?: {
    area?: number;
    occupancy?: number;
    description?: string;
    tags?: string[];
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

/**
 * Aggregation rules for rolling up metrics
 */
export interface AggregationRule {
  /** Metric name */
  metric: keyof SpaceMetrics;
  /** Aggregation method */
  method: 'sum' | 'average' | 'min' | 'max' | 'weighted_average';
  /** Weight property for weighted average (e.g., 'area', 'capacity') */
  weightBy?: string;
}

/**
 * Default aggregation rules for space metrics
 */
export const DEFAULT_AGGREGATION_RULES: AggregationRule[] = [
  { metric: 'solarPower', method: 'sum' },
  { metric: 'consumptionPower', method: 'sum' },
  { metric: 'batteryPower', method: 'sum' },
  { metric: 'gridPower', method: 'sum' },
];

/**
 * Space hierarchy repository interface
 */
export interface ISpaceHierarchyRepository {
  /** Get all spaces */
  getAllSpaces(): HierarchicalSpace[];
  
  /** Get space by ID */
  getSpaceById(id: string): HierarchicalSpace | null;
  
  /** Get children of a space */
  getChildren(spaceId: string): HierarchicalSpace[];
  
  /** Get parent of a space */
  getParent(spaceId: string): HierarchicalSpace | null;
  
  /** Get all ancestors of a space (parent, grandparent, etc.) */
  getAncestors(spaceId: string): HierarchicalSpace[];
  
  /** Get all descendants of a space (children, grandchildren, etc.) */
  getDescendants(spaceId: string): HierarchicalSpace[];
  
  /** Get spaces by type */
  getSpacesByType(type: SpaceType): HierarchicalSpace[];
  
  /** Update space metrics */
  updateMetrics(spaceId: string, metrics: SpaceMetrics): void;
  
  /** Get space path (from root to space) */
  getPath(spaceId: string): HierarchicalSpace[];
}

/**
 * Space hierarchy query result
 */
export interface SpaceHierarchyNode extends HierarchicalSpace {
  /** Nested children (for tree visualization) */
  children?: SpaceHierarchyNode[];
  /** Depth in hierarchy (0 = root) */
  depth: number;
  /** Full path from root */
  path: string[];
}

/**
 * Metrics aggregation result
 */
export interface AggregatedMetrics extends SpaceMetrics {
  /** Number of child spaces included */
  childCount: number;
  /** Whether metrics are aggregated or direct */
  isAggregated: boolean;
  /** Timestamp of aggregation */
  timestamp: Date;
}

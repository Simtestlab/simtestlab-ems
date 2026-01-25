/**
 * Domain Entity: Space Hierarchy
 * Represents physical locations and their energy systems
 */

export type SpaceType = 'site' | 'building' | 'floor' | 'zone' | 'room';
export type SpaceStatus = 'online' | 'offline' | 'warning' | 'error';

export interface SpaceLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;           // State/Province
  country?: string;
}

export interface SpaceCapacity {
  solar: number;            // kW (installed solar capacity)
  storage: number;          // kWh (installed storage capacity)
  consumption: number;      // kW (peak consumption capacity)
}

export interface SpaceMetrics {
  currentPower: number;     // kW (current power usage)
  status: SpaceStatus;
  soc?: number;             // % (battery state of charge, if applicable)
  efficiency?: number;      // % (current efficiency)
}

/**
 * Space Entity
 */
export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  parentId?: string;        // Reference to parent space
  children: string[];       // Array of child space IDs
  location?: SpaceLocation;
  capacity: SpaceCapacity;
  metrics?: SpaceMetrics;
  metadata?: {
    area?: number;          // m² (floor area)
    occupancy?: number;     // number of occupants
    timezone?: string;      // IANA timezone
    tags?: string[];        // Custom tags
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Space Tree Node (for UI representation)
 */
export interface SpaceTreeNode extends Space {
  level: number;            // Depth in hierarchy (0 = root)
  path: string[];           // Array of ancestor IDs
  childNodes?: SpaceTreeNode[]; // Populated children
  isExpanded?: boolean;     // UI state
  isSelected?: boolean;     // UI state
}

/**
 * Map Marker for Space
 */
export interface SpaceMapMarker {
  id: string;
  name: string;
  type: SpaceType;
  coordinates: [longitude: number, latitude: number];
  metrics: SpaceMetrics;
  capacity: SpaceCapacity;
}

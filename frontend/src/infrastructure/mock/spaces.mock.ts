/**
 * Mock Data Generator for Space Hierarchy
 * 
 * Uses physics-based hierarchical simulation with HierarchyManager.
 * Spaces are simulated at zone level and aggregated bottom-up.
 */

import { Space, SpaceMapMarker, SpaceType } from '@/domain/entities/space.entity';
import { HierarchyManager } from '@/infrastructure/simulation/hierarchy-manager';
import { MULTI_SITE_HIERARCHY } from './multi-site-hierarchy';
import {
  HierarchicalSpace,
  SpaceType as HSpaceType,
  SpaceStatus,
} from '@/domain/entities/hierarchy.entity';

// Initialize hierarchy manager (singleton pattern)
let hierarchyManager: HierarchyManager | null = null;

function getHierarchyManager(): HierarchyManager {
  if (!hierarchyManager) {
    hierarchyManager = new HierarchyManager(MULTI_SITE_HIERARCHY);
    console.log('[SpacesMock] Initialized hierarchy manager with', MULTI_SITE_HIERARCHY.length, 'spaces across 6 sites');
  }
  return hierarchyManager;
}
import { getEquipmentForSite } from './equipment.mock';

/**
 * Convert HierarchicalSpace to Space entity
 */
function convertToSpace(hSpace: HierarchicalSpace): Space {
  // Map space types
  const typeMap: Record<HSpaceType, SpaceType> = {
    [HSpaceType.SITE]: 'site',
    [HSpaceType.BUILDING]: 'building',
    [HSpaceType.FLOOR]: 'floor',
    [HSpaceType.ZONE]: 'zone',
  };

  // Extract location from metadata or equipment
  const location = hSpace.metadata?.location || {
    latitude: 13.0827, // Default to Chennai
    longitude: 80.2707,
    address: hSpace.name,
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
  };

  return {
    id: hSpace.id,
    name: hSpace.name,
    type: typeMap[hSpace.type],
    children: hSpace.childIds,
    parentId: hSpace.parentId || undefined,
    location,
    capacity: {
      solar: hSpace.equipment.solarCapacity || 0,
      storage: hSpace.equipment.batteryCapacity || 0,
      consumption: hSpace.equipment.loadCapacity || 0,
    },
    metrics: {
      currentPower: hSpace.metrics.consumptionPower,
      status: hSpace.status === SpaceStatus.ONLINE ? 'online' : 'offline',
      soc: hSpace.metrics.batterySoc,
      efficiency: hSpace.metrics.efficiency,
    },
    metadata: {
      area: hSpace.metadata?.area,
      occupancy: hSpace.metadata?.occupancy,
      timezone: 'Asia/Kolkata',
      tags: hSpace.metadata?.tags || [],
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  };
}

/**
 * Mock Space Repository Implementation
 * 
 * Uses HierarchyManager to provide real-time hierarchical metrics.
 */
export class MockSpaceRepository {
  private manager: HierarchyManager;
  
  constructor() {
    this.manager = getHierarchyManager();
  }
  
  /**
   * Get all spaces with real-time metrics
   */
  getSpaces(): Space[] {
    const hierarchicalSpaces = this.manager.getAllSpaces();
    return hierarchicalSpaces.map(convertToSpace);
  }

  /**
   * Get spaces by type with real-time metrics
   */
  getSpacesByType(type: SpaceType): Space[] {
    const hTypeMap: Record<SpaceType, HSpaceType> = {
      site: HSpaceType.SITE,
      building: HSpaceType.BUILDING,
      floor: HSpaceType.FLOOR,
      zone: HSpaceType.ZONE,
      room: HSpaceType.ZONE, // Map room to zone
    };
    
    const hSpaces = this.manager.getSpacesByType(hTypeMap[type]);
    return hSpaces.map(convertToSpace);
  }

  /**
   * Get child spaces with real-time metrics
   */
  getChildren(parentId: string): Space[] {
    const hSpaces = this.manager.getChildren(parentId);
    return hSpaces.map(convertToSpace);
  }

  /**
   * Get parent space with real-time metrics
   */
  getParent(childId: string): Space | undefined {
    const hSpace = this.manager.getParent(childId);
    return hSpace ? convertToSpace(hSpace) : undefined;
  }

  /**
   * Get hierarchy summary
   */
  getSummary() {
    return this.manager.getSummary();
  }
  
  async getAllSpaces(): Promise<Space[]> {
    return Promise.resolve(this.getSpaces());
  }
  
  async getSpaceById(id: string): Promise<Space | null> {
    const space = this.getSpaceById(id);
    return Promise.resolve(space || null);
  }
  
  async getRootSpaces(): Promise<Space[]> {
    const roots = this.getSpacesByType('site');
    return Promise.resolve(roots);
  }
  
  async getChildSpaces(parentId: string): Promise<Space[]> {
    return Promise.resolve(this.getChildren(parentId));
  }
  
  async getSpaceTree(): Promise<Space[]> {
    // Return root spaces (sites)
    return Promise.resolve(this.getSpacesByType('site'));
  }
  
  async getSpaceMapMarkers(): Promise<SpaceMapMarker[]> {
    const spaces = this.getSpaces();
    const markers = spaces
      .filter(s => s.location?.latitude && s.location?.longitude && s.metrics)
      .map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        coordinates: [s.location!.longitude, s.location!.latitude] as [number, number],
        metrics: s.metrics!,
        capacity: s.capacity,
      }));
    
    return Promise.resolve(markers);
  }
}

/**
 * Backward compatibility: Export static mock data
 * (This is now dynamically generated from hierarchy)
 */
export function getMockSpaces(): Space[] {
  const manager = getHierarchyManager();
  return manager.getAllSpaces().map(convertToSpace);
}

const MOCK_SPACES: Space[] = getMockSpaces();

/**
 * Singleton instance
 */
export const mockSpaceRepository = new MockSpaceRepository();

/**
 * Export the spaces array directly for convenience
 */
export const mockSpaces = MOCK_SPACES;

/**
 * Export spaces enriched with equipment data
 */
export const mockSpacesWithEquipment = MOCK_SPACES.map(space => ({
  ...space,
  equipment: getEquipmentForSite(space.id),
}));

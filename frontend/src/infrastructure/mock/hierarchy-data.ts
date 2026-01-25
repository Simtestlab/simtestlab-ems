/**
 * Hierarchical Space Data
 * 
 * Defines the complete space hierarchy with equipment configuration.
 * Chennai Technology Park with realistic building→floor→zone structure.
 */

import {
  HierarchicalSpace,
  SpaceType,
  SpaceStatus,
} from '@/domain/entities/hierarchy.entity';

/**
 * Chennai Technology Park - Complete Hierarchy
 */
export const CHENNAI_HIERARCHY: HierarchicalSpace[] = [
  // Site Level
  {
    id: 'site-chennai',
    name: 'Chennai Technology Park',
    type: SpaceType.SITE,
    parentId: null,
    childIds: ['building-chennai-a', 'building-chennai-b'],
    equipment: {
      solarCapacity: 500, // kW total
      batteryCapacity: 1000, // kWh
      batteryMaxPower: 250, // kW
      loadCapacity: 400, // kW
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 65000, // sq meters
      occupancy: 800,
      description: 'Main IT campus with R&D facilities',
      tags: ['headquarters', 'IT', 'R&D'],
      location: {
        latitude: 13.0827,
        longitude: 80.2707,
        address: 'Tidel Park, Rajiv Gandhi Salai, Taramani',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
      },
    },
  },

  // Building Level - Building A
  {
    id: 'building-chennai-a',
    name: 'Building A - Office Tower',
    type: SpaceType.BUILDING,
    parentId: 'site-chennai',
    childIds: ['floor-a-1', 'floor-a-2', 'floor-a-3'],
    equipment: {
      solarCapacity: 300, // kW (rooftop)
      batteryCapacity: 600, // kWh
      batteryMaxPower: 150, // kW
      loadCapacity: 240, // kW
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 36000,
      occupancy: 480,
      description: '12-floor office tower',
      tags: ['office', 'main'],
    },
  },

  // Building Level - Building B
  {
    id: 'building-chennai-b',
    name: 'Building B - Data Center',
    type: SpaceType.BUILDING,
    parentId: 'site-chennai',
    childIds: ['floor-b-1', 'floor-b-2'],
    equipment: {
      solarCapacity: 200, // kW (rooftop)
      batteryCapacity: 400, // kWh
      batteryMaxPower: 100, // kW
      loadCapacity: 160, // kW
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 29000,
      occupancy: 320,
      description: '4-floor data center with cooling systems',
      tags: ['datacenter', '24/7'],
    },
  },

  // Floor Level - Building A Floors
  {
    id: 'floor-a-1',
    name: 'Floor A1 - Ground Floor',
    type: SpaceType.FLOOR,
    parentId: 'building-chennai-a',
    childIds: ['zone-a1-lobby', 'zone-a1-cafeteria', 'zone-a1-ops'],
    equipment: {
      loadCapacity: 80,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 12000,
      occupancy: 160,
      tags: ['reception', 'common'],
    },
  },
  {
    id: 'floor-a-2',
    name: 'Floor A2 - Second Floor',
    type: SpaceType.FLOOR,
    parentId: 'building-chennai-a',
    childIds: ['zone-a2-dev1', 'zone-a2-dev2', 'zone-a2-meeting'],
    equipment: {
      loadCapacity: 80,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 12000,
      occupancy: 160,
      tags: ['development', 'office'],
    },
  },
  {
    id: 'floor-a-3',
    name: 'Floor A3 - Third Floor',
    type: SpaceType.FLOOR,
    parentId: 'building-chennai-a',
    childIds: ['zone-a3-exec', 'zone-a3-hr', 'zone-a3-fin'],
    equipment: {
      loadCapacity: 80,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 12000,
      occupancy: 160,
      tags: ['executive', 'admin'],
    },
  },

  // Floor Level - Building B Floors
  {
    id: 'floor-b-1',
    name: 'Floor B1 - Server Room',
    type: SpaceType.FLOOR,
    parentId: 'building-chennai-b',
    childIds: ['zone-b1-servers', 'zone-b1-storage', 'zone-b1-network'],
    equipment: {
      loadCapacity: 100, // High load for servers
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 15000,
      occupancy: 180,
      tags: ['datacenter', 'critical'],
    },
  },
  {
    id: 'floor-b-2',
    name: 'Floor B2 - Cooling & UPS',
    type: SpaceType.FLOOR,
    parentId: 'building-chennai-b',
    childIds: ['zone-b2-cooling', 'zone-b2-ups', 'zone-b2-control'],
    equipment: {
      loadCapacity: 60, // HVAC and UPS
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 14000,
      occupancy: 140,
      tags: ['infrastructure', 'mechanical'],
    },
  },

  // Zone Level - Floor A1 Zones (Leaf nodes with equipment)
  {
    id: 'zone-a1-lobby',
    name: 'Zone A1-L - Main Lobby',
    type: SpaceType.ZONE,
    parentId: 'floor-a-1',
    childIds: [],
    equipment: {
      loadCapacity: 25,
      hvacCapacity: 10,
      lightingCapacity: 8,
      equipmentCapacity: 5,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 4000,
      occupancy: 50,
      tags: ['public', 'lobby'],
    },
  },
  {
    id: 'zone-a1-cafeteria',
    name: 'Zone A1-C - Cafeteria',
    type: SpaceType.ZONE,
    parentId: 'floor-a-1',
    childIds: [],
    equipment: {
      loadCapacity: 30,
      hvacCapacity: 12,
      lightingCapacity: 6,
      equipmentCapacity: 10, // Kitchen equipment
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 5000,
      occupancy: 70,
      tags: ['food', 'common'],
    },
  },
  {
    id: 'zone-a1-ops',
    name: 'Zone A1-O - Operations',
    type: SpaceType.ZONE,
    parentId: 'floor-a-1',
    childIds: [],
    equipment: {
      solarCapacity: 15, // Small rooftop section
      loadCapacity: 25,
      hvacCapacity: 10,
      lightingCapacity: 6,
      equipmentCapacity: 7,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 3000,
      occupancy: 40,
      tags: ['operations', 'facility'],
    },
  },

  // Zone Level - Floor A2 Zones
  {
    id: 'zone-a2-dev1',
    name: 'Zone A2-D1 - Dev Team Alpha',
    type: SpaceType.ZONE,
    parentId: 'floor-a-2',
    childIds: [],
    equipment: {
      solarCapacity: 50, // Rooftop panels
      loadCapacity: 30,
      hvacCapacity: 12,
      lightingCapacity: 7,
      equipmentCapacity: 9, // Workstations
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 4500,
      occupancy: 60,
      tags: ['development', 'tech'],
    },
  },
  {
    id: 'zone-a2-dev2',
    name: 'Zone A2-D2 - Dev Team Beta',
    type: SpaceType.ZONE,
    parentId: 'floor-a-2',
    childIds: [],
    equipment: {
      solarCapacity: 50,
      loadCapacity: 30,
      hvacCapacity: 12,
      lightingCapacity: 7,
      equipmentCapacity: 9,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 4500,
      occupancy: 60,
      tags: ['development', 'tech'],
    },
  },
  {
    id: 'zone-a2-meeting',
    name: 'Zone A2-M - Meeting Rooms',
    type: SpaceType.ZONE,
    parentId: 'floor-a-2',
    childIds: [],
    equipment: {
      loadCapacity: 20,
      hvacCapacity: 8,
      lightingCapacity: 5,
      equipmentCapacity: 6, // AV equipment
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 3000,
      occupancy: 40,
      tags: ['meeting', 'conference'],
    },
  },

  // Zone Level - Floor A3 Zones
  {
    id: 'zone-a3-exec',
    name: 'Zone A3-E - Executive Offices',
    type: SpaceType.ZONE,
    parentId: 'floor-a-3',
    childIds: [],
    equipment: {
      solarCapacity: 60,
      batteryCapacity: 100, // Small battery for exec area
      batteryMaxPower: 25,
      loadCapacity: 30,
      hvacCapacity: 12,
      lightingCapacity: 8,
      equipmentCapacity: 8,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 5000,
      occupancy: 70,
      tags: ['executive', 'premium'],
    },
  },
  {
    id: 'zone-a3-hr',
    name: 'Zone A3-H - Human Resources',
    type: SpaceType.ZONE,
    parentId: 'floor-a-3',
    childIds: [],
    equipment: {
      solarCapacity: 50,
      loadCapacity: 25,
      hvacCapacity: 10,
      lightingCapacity: 6,
      equipmentCapacity: 7,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 3500,
      occupancy: 45,
      tags: ['admin', 'hr'],
    },
  },
  {
    id: 'zone-a3-fin',
    name: 'Zone A3-F - Finance',
    type: SpaceType.ZONE,
    parentId: 'floor-a-3',
    childIds: [],
    equipment: {
      solarCapacity: 75,
      loadCapacity: 25,
      hvacCapacity: 10,
      lightingCapacity: 6,
      equipmentCapacity: 7,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 3500,
      occupancy: 45,
      tags: ['admin', 'finance'],
    },
  },

  // Zone Level - Floor B1 Zones (Data Center)
  {
    id: 'zone-b1-servers',
    name: 'Zone B1-S - Server Racks',
    type: SpaceType.ZONE,
    parentId: 'floor-b-1',
    childIds: [],
    equipment: {
      solarCapacity: 50,
      loadCapacity: 50, // High consumption
      hvacCapacity: 20, // Heavy cooling
      lightingCapacity: 3, // Minimal lighting
      equipmentCapacity: 25, // Servers
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 6000,
      occupancy: 70,
      tags: ['servers', 'critical', '24/7'],
    },
  },
  {
    id: 'zone-b1-storage',
    name: 'Zone B1-ST - Storage Systems',
    type: SpaceType.ZONE,
    parentId: 'floor-b-1',
    childIds: [],
    equipment: {
      solarCapacity: 50,
      loadCapacity: 30,
      hvacCapacity: 12,
      lightingCapacity: 2,
      equipmentCapacity: 15,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 5000,
      occupancy: 60,
      tags: ['storage', 'critical'],
    },
  },
  {
    id: 'zone-b1-network',
    name: 'Zone B1-N - Network Operations',
    type: SpaceType.ZONE,
    parentId: 'floor-b-1',
    childIds: [],
    equipment: {
      solarCapacity: 50,
      batteryCapacity: 150, // Critical network backup
      batteryMaxPower: 40,
      loadCapacity: 20,
      hvacCapacity: 8,
      lightingCapacity: 3,
      equipmentCapacity: 8,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 4000,
      occupancy: 50,
      tags: ['network', 'noc', '24/7'],
    },
  },

  // Zone Level - Floor B2 Zones
  {
    id: 'zone-b2-cooling',
    name: 'Zone B2-C - Cooling Systems',
    type: SpaceType.ZONE,
    parentId: 'floor-b-2',
    childIds: [],
    equipment: {
      solarCapacity: 50,
      batteryCapacity: 150,
      batteryMaxPower: 35,
      loadCapacity: 35, // Large chillers
      hvacCapacity: 25, // Cooling for cooling!
      lightingCapacity: 2,
      equipmentCapacity: 6,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 7000,
      occupancy: 70,
      tags: ['mechanical', 'hvac', '24/7'],
    },
  },
  {
    id: 'zone-b2-ups',
    name: 'Zone B2-U - UPS Room',
    type: SpaceType.ZONE,
    parentId: 'floor-b-2',
    childIds: [],
    equipment: {
      batteryCapacity: 100, // UPS batteries
      batteryMaxPower: 25,
      loadCapacity: 15,
      hvacCapacity: 8,
      lightingCapacity: 2,
      equipmentCapacity: 4,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 4000,
      occupancy: 40,
      tags: ['power', 'ups', 'critical'],
    },
  },
  {
    id: 'zone-b2-control',
    name: 'Zone B2-CT - Control Room',
    type: SpaceType.ZONE,
    parentId: 'floor-b-2',
    childIds: [],
    equipment: {
      solarCapacity: 50,
      loadCapacity: 10,
      hvacCapacity: 5,
      lightingCapacity: 3,
      equipmentCapacity: 2,
    },
    metrics: {
      solarPower: 0,
      consumptionPower: 0,
      batteryPower: 0,
      gridPower: 0,
    },
    status: SpaceStatus.ONLINE,
    metadata: {
      area: 3000,
      occupancy: 30,
      tags: ['control', 'monitoring', '24/7'],
    },
  },
];

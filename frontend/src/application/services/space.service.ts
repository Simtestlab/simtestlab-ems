/**
 * Space Service
 * Application layer service for space operations
 */

import { Space, SpaceMapMarker } from '@/domain/entities/space.entity';
import { spaceRepository } from '@/infrastructure/api/space.repository';

export class SpaceService {
  async getAllSpaces(): Promise<Space[]> {
    return spaceRepository.getAllSpaces();
  }
  
  async getSpaceById(id: string): Promise<Space | null> {
    return spaceRepository.getSpaceById(id);
  }
  
  async getRootSpaces(): Promise<Space[]> {
    return spaceRepository.getRootSpaces();
  }
  
  async getSpaceTree(): Promise<Space[]> {
    return spaceRepository.getSpaceTree();
  }
  
  async getSpaceMapMarkers(): Promise<SpaceMapMarker[]> {
    return spaceRepository.getSpaceMapMarkers();
  }
}

/**
 * Singleton instance
 */
export const spaceService = new SpaceService();

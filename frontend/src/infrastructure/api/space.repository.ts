/**
 * Mock Space Repository Implementation
 * Adapts mock space data to repository interface
 */

import { ISpaceRepository } from '@/domain/interfaces/repositories.interface';
import { Space, SpaceMapMarker } from '@/domain/entities/space.entity';
import { mockSpaceRepository } from '../mock/spaces.mock';

export class SpaceRepository implements ISpaceRepository {
  async getAllSpaces(): Promise<Space[]> {
    return mockSpaceRepository.getAllSpaces();
  }
  
  async getSpaceById(id: string): Promise<Space | null> {
    return mockSpaceRepository.getSpaceById(id);
  }
  
  async getRootSpaces(): Promise<Space[]> {
    return mockSpaceRepository.getRootSpaces();
  }
  
  async getChildSpaces(parentId: string): Promise<Space[]> {
    return mockSpaceRepository.getChildSpaces(parentId);
  }
  
  async getSpaceTree(): Promise<Space[]> {
    return mockSpaceRepository.getSpaceTree();
  }
  
  async getSpaceMapMarkers(): Promise<SpaceMapMarker[]> {
    return mockSpaceRepository.getSpaceMapMarkers();
  }
}

/**
 * Singleton instance
 */
export const spaceRepository = new SpaceRepository();

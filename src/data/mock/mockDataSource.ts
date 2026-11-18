import type { MockDatabase } from "../../types/domain";
import { createMockSeed } from "./seed";

export interface AppDataSource {
  loadInitialSnapshot(at?: Date): Promise<MockDatabase>;
}

export const mockDataSource: AppDataSource = {
  async loadInitialSnapshot(at = new Date()) {
    return structuredClone(createMockSeed(at));
  },
};
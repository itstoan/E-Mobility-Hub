import { beforeEach } from 'vitest';
import { useMobilityDataStore } from '../../src/stores/useMobilityDataStore';

// Isolate each test: action mutations must never leak into the next case.
beforeEach(() => {
  useMobilityDataStore.getState().resetDemoData();
});

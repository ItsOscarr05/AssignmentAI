import { vi } from 'vitest';

export const api = {
  get: vi.fn(),
};

vi.mock('../../../services/api', () => ({
  api,
}));

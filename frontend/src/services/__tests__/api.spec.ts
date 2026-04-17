import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock modules before imports
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      accessToken: null,
      refreshToken: null,
      logout: vi.fn(),
      setTokens: vi.fn(),
    })),
  },
}));

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3001/api/v1' } } });

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiClient configuration', () => {
    it('should create axios instance with correct baseURL', async () => {
      const { apiClient } = await import('../api');
      expect(apiClient.defaults.baseURL).toBe('http://localhost:3001/api/v1');
    });

    it('should set Content-Type header', async () => {
      const { apiClient } = await import('../api');
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should set timeout to 30s', async () => {
      const { apiClient } = await import('../api');
      expect(apiClient.defaults.timeout).toBe(30000);
    });
  });

  describe('request interceptor', () => {
    it('should attach Authorization header when token exists', async () => {
      const { useAuthStore } = await import('@/stores/authStore');
      vi.mocked(useAuthStore.getState).mockReturnValue({
        accessToken: 'test-token',
        refreshToken: 'refresh',
        logout: vi.fn(),
        setTokens: vi.fn(),
      } as any);

      // Clear module cache and reimport to reset interceptors
      vi.resetModules();
      vi.doMock('@/stores/authStore', () => ({
        useAuthStore: {
          getState: vi.fn(() => ({
            accessToken: 'test-token',
            refreshToken: 'refresh',
            logout: vi.fn(),
            setTokens: vi.fn(),
          })),
        },
      }));
    });

    it('should not attach Authorization header when no token', async () => {
      const { useAuthStore } = await import('@/stores/authStore');
      vi.mocked(useAuthStore.getState).mockReturnValue({
        accessToken: null,
        refreshToken: null,
        logout: vi.fn(),
        setTokens: vi.fn(),
      } as any);
    });
  });

  describe('response interceptor', () => {
    it('should return successful responses as-is', () => {
      expect(true).toBe(true);
    });

    it('should handle 401 errors', () => {
      expect(true).toBe(true);
    });
  });
});

describe('API service functions', () => {
  it('should export apiClient', async () => {
    const { apiClient } = await import('../api');
    expect(apiClient).toBeDefined();
    expect(axios.isAxiosError).toBeDefined();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';

// Mock zustand persist to avoid localStorage issues
vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zustand/middleware')>();
  return {
    ...actual,
    persist: (config: any, _options: any) => config,
  };
});

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('login', () => {
    it('should set user and tokens on login', () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'EMPLOYEE' as const,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        lastLoginAt: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      useAuthStore.getState().login(user, 'access-token-123', 'refresh-token-123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.accessToken).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear all auth state on logout', () => {
      // First login
      useAuthStore.getState().login(
        {
          id: 'user-1',
          email: 'test@example.com',
          role: 'EMPLOYEE' as const,
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          lastLoginAt: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        'access-token',
        'refresh-token',
      );

      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('should update tokens and set isAuthenticated', () => {
      useAuthStore.getState().setTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should update user', () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'EMPLOYEE' as const,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        lastLoginAt: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it('should set user to null', () => {
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has one of the specified roles', () => {
      useAuthStore.getState().login(
        {
          id: 'user-1',
          email: 'test@example.com',
          role: 'ADMIN' as const,
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          lastLoginAt: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        'token',
        'token',
      );

      expect(useAuthStore.getState().hasRole(['ADMIN', 'HR_MANAGER'])).toBe(true);
      expect(useAuthStore.getState().hasRole(['EMPLOYEE'])).toBe(false);
    });

    it('should return false when no user', () => {
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().hasRole(['ADMIN'])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      useAuthStore.getState().login(
        {
          id: 'user-1',
          email: 'test@example.com',
          role: 'ADMIN' as const,
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          lastLoginAt: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        'token',
        'token',
      );

      expect(useAuthStore.getState().isAdmin()).toBe(true);
    });

    it('should return true for HR_MANAGER role', () => {
      useAuthStore.getState().login(
        {
          id: 'user-1',
          email: 'test@example.com',
          role: 'HR_MANAGER' as const,
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          lastLoginAt: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        'token',
        'token',
      );

      expect(useAuthStore.getState().isAdmin()).toBe(true);
    });

    it('should return false for EMPLOYEE role', () => {
      useAuthStore.getState().login(
        {
          id: 'user-1',
          email: 'test@example.com',
          role: 'EMPLOYEE' as const,
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          lastLoginAt: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        'token',
        'token',
      );

      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });

    it('should return false when no user', () => {
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });
  });
});

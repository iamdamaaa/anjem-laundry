import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,

  // Action to set authentication state upon successful login or registration
  login: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Action to clear credentials and call logout API
  logout: async () => {
    set({ isLoading: true });
    try {
      // Call backend logout endpoint to invalidate token
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Backend logout call failed or token already expired:', error);
    } finally {
      // Always perform client-side cleanup regardless of API failure
      localStorage.removeItem('auth_token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Action to update local user profile data (e.g. name or email changes)
  updateProfile: (updatedFields) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedFields } : updatedFields,
    }));
  },

  // Fetch current user details dynamically using Sanctum token
  fetchMe: async () => {
    const { token } = get();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.success) {
        const userData = response.data.data;
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
        return userData;
      } else {
        throw new Error('Response status was success = false');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Clean up invalid credentials
      localStorage.removeItem('auth_token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  },
}));

export default useAuthStore;

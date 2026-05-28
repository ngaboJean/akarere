// ============================================================
// Auth Store - Zustand State Management
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      umukoresha:   null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,
      error:        null,

      // Kwinjira
      injira: async (login, ijambo_banga) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/injira', { login, ijambo_banga });
          const { umukoresha, accessToken, refreshToken } = res.data.data;
          set({ umukoresha, accessToken, refreshToken, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Ikibazo mu kwinjira.';
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      // Gusohoka
      sohoka: async () => {
        try {
          await api.post('/auth/sohoka');
        } catch {}
        set({ umukoresha: null, accessToken: null, refreshToken: null });
        delete api.defaults.headers.common['Authorization'];
      },

      // Guvugurura Token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const res = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          set({ accessToken, refreshToken: newRefresh });
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return true;
        } catch {
          set({ umukoresha: null, accessToken: null, refreshToken: null });
          return false;
        }
      },

      // Kugenzura niba umukoresha afite uruhare
      hasRole: (roles) => {
        const { umukoresha } = get();
        if (!umukoresha) return false;
        return roles.includes(umukoresha.role_slug);
      },

      isUmuturage:        () => get().umukoresha?.role_slug === 'umuturage',
      isUmukuruUmudugudu: () => get().umukoresha?.role_slug === 'umukuru_umudugudu',
      isESAkagari:        () => get().umukoresha?.role_slug === 'es_akagari',
      isESUmurenge:       () => get().umukoresha?.role_slug === 'es_umurenge',
      isAdminAkarere:     () => get().umukoresha?.role_slug === 'admin_akarere',
      isLeader:           () => !['umuturage'].includes(get().umukoresha?.role_slug),
    }),
    {
      name: 'system-yibanze-auth',
      partialize: (state) => ({
        umukoresha:   state.umukoresha,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;

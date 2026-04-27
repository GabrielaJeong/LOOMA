"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const initialOnboarding = {
  provider: null,
  nickname: "",
  isComplete: false,
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      onboarding: initialOnboarding,

      login: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          onboarding: initialOnboarding,
        }),

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      beginOnboarding: ({ provider = "kakao" } = {}) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            provider,
            isComplete: false,
          },
        })),

      saveOnboardingNickname: (nickname) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            nickname,
          },
        })),

      completeOnboarding: (nickname) =>
        set((state) => {
          const finalNickname = nickname ?? state.onboarding.nickname;

          return {
            onboarding: {
              ...state.onboarding,
              nickname: finalNickname,
              isComplete: true,
            },
            user: state.user ? { ...state.user, nickname: finalNickname } : state.user,
          };
        }),

      resetOnboarding: () => set({ onboarding: initialOnboarding }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        onboarding: state.onboarding,
      }),
    }
  )
);

export { useAuthStore };

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const ROUTINE_COLORS = ["#F1A0A0", "#AADCA9", "#AFC7FF", "#F4D18D"];

const useRoutineStore = create(
  persist(
    (set) => ({
      routines: [],

      createRoutine: (payload) =>
        set((state) => {
          const routine = {
            id: `routine-${Date.now()}`,
            subjectType: payload.subjectType,
            subjectName: payload.subjectName,
            gender: payload.gender,
            birthDate: payload.birthDate,
            heightCm: payload.heightCm,
            weightKg: payload.weightKg,
            diseaseName: payload.diseaseName,
            dotColor: ROUTINE_COLORS[state.routines.length % ROUTINE_COLORS.length],
            createdAt: new Date().toISOString(),
          };

          return {
            routines: [...state.routines, routine],
          };
        }),

      removeRoutine: (routineId) =>
        set((state) => ({
          routines: state.routines.filter((routine) => routine.id !== routineId),
        })),
    }),
    {
      name: "routine-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({
        routines: state.routines,
      }),
    }
  )
);

export { useRoutineStore };

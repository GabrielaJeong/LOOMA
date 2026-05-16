"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const ROUTINE_COLORS = ["#F1A0A0", "#AADCA9", "#AFC7FF", "#F4D18D"];

function createBrowserStorage() {
  return typeof window !== "undefined"
    ? sessionStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}

function pickDotColor(seed) {
  const value = String(seed || "routine");
  const index =
    value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    ROUTINE_COLORS.length;

  return ROUTINE_COLORS[index];
}

function normalizeApiRoutine(apiRoutine, fallback = null) {
  const meta = apiRoutine.meta || {};
  const backendId = apiRoutine._id || apiRoutine.id || fallback?.backendRoutineId;

  return {
    id: backendId || fallback?.id || `routine-${Date.now()}`,
    backendRoutineId: backendId || null,
    subjectType: meta.subjectType || fallback?.subjectType || "본인",
    subjectName: meta.subjectName || fallback?.subjectName || "본인",
    gender: meta.gender || fallback?.gender || "",
    birthDate: meta.birthDate || fallback?.birthDate || "",
    heightCm: meta.heightCm || fallback?.heightCm || "",
    weightKg: meta.weightKg || fallback?.weightKg || "",
    diseaseName:
      apiRoutine.diseaseName || apiRoutine.name || fallback?.diseaseName || "",
    dotColor:
      apiRoutine.dotColor ||
      fallback?.dotColor ||
      pickDotColor(backendId || apiRoutine.diseaseName),
    createdAt: apiRoutine.createdAt || fallback?.createdAt || new Date().toISOString(),
  };
}

function hasSameIdentity(routine, targetId) {
  return routine.id === targetId || routine.backendRoutineId === targetId;
}

const useRoutineStore = create(
  persist(
    (set, get) => ({
      routines: [],

      createRoutine: (payload) => {
        const routine = {
          id: `routine-${Date.now()}`,
          backendRoutineId: payload.backendRoutineId ?? null,
          subjectType: payload.subjectType,
          subjectName: payload.subjectName,
          gender: payload.gender,
          birthDate: payload.birthDate,
          heightCm: payload.heightCm,
          weightKg: payload.weightKg,
          diseaseName: payload.diseaseName,
          dotColor:
            payload.dotColor ||
            ROUTINE_COLORS[get().routines.length % ROUTINE_COLORS.length],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          routines: [...state.routines, routine],
        }));

        return routine;
      },

      saveApiRoutine: ({ apiRoutine, fallbackRoutine = null }) => {
        const nextRoutine = normalizeApiRoutine(apiRoutine, fallbackRoutine);
        const fallbackId = fallbackRoutine?.id;
        const backendId = nextRoutine.backendRoutineId;

        set((state) => ({
          routines: [
            nextRoutine,
            ...state.routines.filter(
              (routine) =>
                routine.id !== nextRoutine.id &&
                routine.backendRoutineId !== backendId &&
                routine.id !== fallbackId
            ),
          ],
        }));

        return nextRoutine;
      },

      hydrateApiRoutines: (apiRoutines = []) => {
        const apiRoutineItems = apiRoutines.map((apiRoutine) =>
          normalizeApiRoutine(apiRoutine)
        );
        const apiIds = new Set(
          apiRoutineItems
            .map((routine) => routine.backendRoutineId)
            .filter(Boolean)
        );

        set((state) => ({
          routines: [
            ...apiRoutineItems,
            ...state.routines.filter(
              (routine) =>
                !routine.backendRoutineId || !apiIds.has(routine.backendRoutineId)
            ),
          ],
        }));

        return apiRoutineItems;
      },

      removeRoutine: (routineId) =>
        set((state) => ({
          routines: state.routines.filter(
            (routine) => !hasSameIdentity(routine, routineId)
          ),
        })),

      renameRoutine: (routineId, diseaseName) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            hasSameIdentity(routine, routineId)
              ? {
                  ...routine,
                  diseaseName,
                }
              : routine
          ),
        })),
    }),
    {
      name: "routine-storage",
      storage: createJSONStorage(createBrowserStorage),
      partialize: (state) => ({
        routines: state.routines,
      }),
    }
  )
);

export { useRoutineStore };

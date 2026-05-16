"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

function createBrowserStorage() {
  return typeof window !== "undefined"
    ? sessionStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}

function formatRecordDate(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(date);
}

function formatRecordDisplayDate(isoString) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function getSubjectRecordLabel(subjectName) {
  if (!subjectName || subjectName === "본인") {
    return "나에 대해 기록 중";
  }

  return `${subjectName}에 대해 기록 중`;
}

function resolveDotColor(seed) {
  const palette = ["#F1A0A0", "#AADCA9", "#AFC7FF", "#F4D18D"];
  const value = String(seed || "record");
  const index =
    value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    palette.length;

  return palette[index];
}

function normalizeSectionId(recordId, index) {
  return `${recordId}-section-${index}`;
}

function normalizeSections(recordId, sections = []) {
  return sections.map((section, index) => ({
    id: section.id || normalizeSectionId(recordId, index),
    title: section.title,
    items: section.items,
    order: typeof section.order === "number" ? section.order : index,
  }));
}

function mapApiRecordToLocalRecord({ apiRecord, routine, transcript }) {
  const recordId = apiRecord._id || `record-${Date.now()}`;
  const createdAt = apiRecord.createdAt || new Date().toISOString();
  const meta = apiRecord.meta || {};

  return {
    id: recordId,
    backendId: apiRecord._id || recordId,
    routineId: routine?.id || apiRecord.routineId,
    backendRoutineId: apiRecord.routineId,
    diseaseName: meta.diseaseName || routine?.diseaseName || "",
    subjectName: meta.subjectName || routine?.subjectName || "본인",
    dotColor:
      routine?.dotColor || resolveDotColor(apiRecord.routineId || meta.diseaseName),
    transcript: transcript ?? routine?.transcript ?? "",
    sections: normalizeSections(recordId, apiRecord.sections || []),
    summary: apiRecord.summary || "",
    notes: apiRecord.notes || "",
    recordedDate: apiRecord.date ?? formatRecordDate(new Date()),
    createdAt,
    displayDate: formatRecordDisplayDate(createdAt),
  };
}

const useRecordStore = create(
  persist(
    (set) => ({
      records: [],

      createRecord: (payload) => {
        const now = new Date();
        const createdAt = now.toISOString();
        const recordId = `record-${Date.now()}`;
        const record = {
          id: recordId,
          backendId: null,
          routineId: payload.routineId,
          backendRoutineId: payload.backendRoutineId ?? null,
          diseaseName: payload.diseaseName,
          subjectName: payload.subjectName,
          dotColor: payload.dotColor,
          transcript: payload.transcript,
          sections: normalizeSections(recordId, payload.sections || []),
          summary: payload.summary || "",
          notes: payload.notes || "",
          recordedDate: payload.recordedDate ?? formatRecordDate(now),
          createdAt,
          displayDate: formatRecordDisplayDate(createdAt),
        };

        set((state) => ({
          records: [record, ...state.records],
        }));

        return record;
      },

      saveApiRecord: ({ apiRecord, routine, transcript }) => {
        const nextRecord = mapApiRecordToLocalRecord({
          apiRecord,
          routine,
          transcript,
        });

        set((state) => ({
          records: [
            nextRecord,
            ...state.records.filter((record) => record.id !== nextRecord.id),
          ],
        }));

        return nextRecord;
      },

      hydrateApiRecord: ({ apiRecord, routine, transcript }) => {
        const nextRecord = mapApiRecordToLocalRecord({
          apiRecord,
          routine,
          transcript,
        });

        set((state) => ({
          records: [
            nextRecord,
            ...state.records.filter((record) => record.id !== nextRecord.id),
          ],
        }));

        return nextRecord;
      },

      hydrateApiRecords: ({ apiRecords, routines = [], date = null }) => {
        const nextRecords = apiRecords.map((apiRecord) => {
          const linkedRoutine =
            routines.find(
              (routine) =>
                routine.id === apiRecord.routineId ||
                routine.backendRoutineId === apiRecord.routineId
            ) ?? null;

          return mapApiRecordToLocalRecord({
            apiRecord,
            routine: linkedRoutine,
            transcript: "",
          });
        });

        set((state) => ({
          records: [
            ...nextRecords,
            ...state.records.filter(
              (record) =>
                !nextRecords.some((nextRecord) => nextRecord.id === record.id) &&
                !(date && record.backendId && record.recordedDate === date)
            ),
          ],
        }));

        return nextRecords;
      },

      updateRecordSections: (recordId, sections) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, sections: normalizeSections(recordId, sections) }
              : record
          ),
        })),

      removeRecord: (recordId) =>
        set((state) => ({
          records: state.records.filter(
            (record) => record.id !== recordId && record.backendId !== recordId
          ),
        })),
    }),
    {
      name: "record-storage",
      storage: createJSONStorage(createBrowserStorage),
      partialize: (state) => ({
        records: state.records,
      }),
    }
  )
);

export { useRecordStore, formatRecordDate, getSubjectRecordLabel };

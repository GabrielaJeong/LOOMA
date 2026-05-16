"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  MoreVertical,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import {
  formatRecordDate,
  getSubjectRecordLabel,
  useRecordStore,
} from "@/stores/recordStore";
import { useRoutineStore } from "@/stores/routineStore";

function formatHomeDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatCalendarTitle(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthMatrix(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  const cells = [];

  for (let index = 0; index < firstDate.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function EmptyCard() {
  return (
    <div className="flex h-[128px] items-center justify-center rounded-[26px] border border-[#D4DEEF] bg-white">
      <p className="text-[16px] font-medium text-[#9BAFD6]">아직 오늘 기록이 없어요</p>
    </div>
  );
}

function TodayRecordCard({ record, onOpenMenu }) {
  const previewSection = record.sections[0];
  const previewItems = previewSection?.items?.slice(0, 3) ?? [];

  return (
    <div className="relative rounded-[24px] border border-[#D4DEEF] bg-white px-5 pb-6 pt-4 transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/record/${record.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: record.dotColor }}
            />
            <p className="text-[17px] font-bold tracking-[-0.02em] text-[#1F2733]">
              {record.diseaseName}
            </p>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-[#8EA4D1]">
              {getSubjectRecordLabel(record.subjectName)}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium tracking-[-0.02em] text-[#B0BED9]">
            {record.displayDate}
          </p>
        </Link>
        <button
          type="button"
          aria-label={`${record.diseaseName} 기록 옵션`}
          onClick={() => onOpenMenu(record)}
          className="mt-1 text-[#B9C7E0]"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {previewSection ? (
        <Link href={`/record/${record.id}`} className="mt-4 block">
          <span className="inline-flex rounded-full border border-[#C9D8F2] px-3 py-[6px] text-[13px] font-bold text-[#5F78B0]">
            {previewSection.title}
          </span>
          <div className="mt-4 space-y-3">
            {previewItems.map((item) => (
              <p
                key={item}
                className="text-[15px] font-medium leading-[1.5] tracking-[-0.02em] text-[#1F2733]"
              >
                {item}
              </p>
            ))}
          </div>
        </Link>
      ) : null}
    </div>
  );
}

function CalendarPanel({
  monthDate,
  selectedDateKey,
  todayKey,
  recordDates,
  onMoveMonth,
  onSelectDate,
}) {
  const monthCells = useMemo(() => getMonthMatrix(monthDate), [monthDate]);
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const canMoveNextMonth = getMonthKey(monthDate) < currentMonthKey;
  const recordDateSet = useMemo(() => new Set(recordDates), [recordDates]);

  return (
    <div className="mt-4 rounded-[18px] bg-white px-5 pb-5 pt-5 shadow-[0_14px_34px_rgba(45,63,96,0.10)]">
      <div className="flex items-center justify-between">
        <p className="text-[17px] font-extrabold tracking-[-0.03em] text-[#273142]">
          {formatCalendarTitle(monthDate)}
        </p>
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => onMoveMonth(-1)}
            className="text-[#1F2733]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.3} />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => onMoveMonth(1)}
            disabled={!canMoveNextMonth}
            className={!canMoveNextMonth ? "cursor-not-allowed text-[#C1CEE3]" : "text-[#1F2733]"}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.3} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 text-center text-[14px] font-extrabold tracking-[-0.02em] text-[#273142]">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-3 text-center">
        {monthCells.map((date, index) => {
          if (!date) {
            return <div key={`blank-${index}`} className="h-9" />;
          }

          const dateKey = formatRecordDate(date);
          const isSelected = dateKey === selectedDateKey;
          const isFuture = dateKey > todayKey;
          const hasRecord = recordDateSet.has(dateKey);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(date)}
              disabled={isFuture}
              className={cn(
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-medium transition",
                isSelected ? "bg-[#3F69F6] font-extrabold text-white" : "text-[#273142]",
                isFuture && "cursor-not-allowed text-[#C1CEE3]"
              )}
            >
              <span>{date.getDate()}</span>
              {hasRecord ? (
                <span
                  className={cn(
                    "absolute bottom-[-5px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                    isSelected ? "bg-[#3F69F6]" : "bg-[#3F69F6]"
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SheetFrame({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] bg-[#1F2733]/48" onClick={onClose}>
      <div
        className="absolute bottom-0 left-1/2 w-full max-w-[393px] -translate-x-1/2 rounded-t-[28px] bg-white px-7 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#E8EEF7]" />
        {children}
      </div>
    </div>
  );
}

function RoutineCard({ routine, onOpenMenu }) {
  return (
    <div className="rounded-[24px] border border-[#D4DEEF] bg-white px-5 pb-6 pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: routine.dotColor }}
            />
            <p className="text-[17px] font-bold tracking-[-0.02em] text-[#1F2733]">
              {routine.diseaseName}
            </p>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-[#8EA4D1]">
              {getSubjectRecordLabel(routine.subjectName)}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label={`${routine.diseaseName} 옵션`}
          onClick={() => onOpenMenu(routine)}
          className="mt-1 text-[#B9C7E0]"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <Link
        href={`/record/new?routineId=${routine.id}`}
        className="mt-5 flex items-center gap-3 text-[#93A7D2]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECF1F8]">
          <Plus className="h-5 w-5 text-[#6E84B4]" />
        </span>
        <span className="text-[17px] font-medium tracking-[-0.02em]">
          오늘의 기록 시작하기
        </span>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const routines = useRoutineStore((state) => state.routines);
  const hydrateApiRoutines = useRoutineStore((state) => state.hydrateApiRoutines);
  const saveApiRoutine = useRoutineStore((state) => state.saveApiRoutine);
  const removeRoutine = useRoutineStore((state) => state.removeRoutine);
  const renameRoutine = useRoutineStore((state) => state.renameRoutine);
  const records = useRecordStore((state) => state.records);
  const hydrateApiRecords = useRecordStore((state) => state.hydrateApiRecords);
  const removeRecord = useRecordStore((state) => state.removeRecord);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarRecordDates, setCalendarRecordDates] = useState([]);
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [routineSheetMode, setRoutineSheetMode] = useState(null);
  const [routineNameDraft, setRoutineNameDraft] = useState("");
  const [routinesError, setRoutinesError] = useState("");
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  const [isDeletingRoutine, setIsDeletingRoutine] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [recordSheetMode, setRecordSheetMode] = useState(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  const todayKey = useMemo(() => formatRecordDate(new Date()), []);
  const titleDate = useMemo(() => formatHomeDate(selectedDate), [selectedDate]);
  const selectedDateKey = useMemo(() => formatRecordDate(selectedDate), [selectedDate]);
  const canMoveToNextDate = selectedDateKey < todayKey;
  const recordsForSelectedDate = useMemo(
    () => records.filter((record) => record.recordedDate === selectedDateKey),
    [records, selectedDateKey]
  );

  useEffect(() => {
    let ignore = false;

    async function loadRoutines() {
      try {
        setRoutinesError("");

        const response = await apiClient.get("/routines");

        if (!ignore) {
          hydrateApiRoutines(response.routines || []);
        }
      } catch (error) {
        if (!ignore) {
          setRoutinesError(error.message || "루틴을 불러오지 못했어요.");
        }
      }
    }

    loadRoutines();

    return () => {
      ignore = true;
    };
  }, [hydrateApiRoutines]);

  useEffect(() => {
    let ignore = false;

    async function loadRecordsForDate() {
      try {
        setIsRecordsLoading(true);
        setRecordsError("");

        const response = await apiClient.get("/records", {
          params: { date: selectedDateKey },
        });

        if (!ignore) {
          hydrateApiRecords({
            apiRecords: response.records || [],
            routines,
            date: selectedDateKey,
          });
        }
      } catch (error) {
        if (!ignore) {
          setRecordsError(error.message || "기록을 불러오지 못했어요.");
        }
      } finally {
        if (!ignore) {
          setIsRecordsLoading(false);
        }
      }
    }

    loadRecordsForDate();

    return () => {
      ignore = true;
    };
  }, [hydrateApiRecords, routines, selectedDateKey]);

  useEffect(() => {
    let ignore = false;

    async function loadCalendarDates() {
      if (!isCalendarOpen) {
        return;
      }

      try {
        const response = await apiClient.get("/records/calendar", {
          params: {
            year: calendarMonth.getFullYear(),
            month: calendarMonth.getMonth() + 1,
          },
        });

        if (!ignore) {
          setCalendarRecordDates(response.dates || []);
        }
      } catch {
        if (!ignore) {
          setCalendarRecordDates([]);
        }
      }
    }

    loadCalendarDates();

    return () => {
      ignore = true;
    };
  }, [calendarMonth, isCalendarOpen]);

  const moveDate = (offset) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + offset);

      if (formatRecordDate(next) > todayKey) {
        return current;
      }

      return next;
    });
  };

  const toggleCalendar = () => {
    setIsCalendarOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      }

      return nextOpen;
    });
  };

  const moveCalendarMonth = (offset) => {
    setCalendarMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);

      if (getMonthKey(next) > getMonthKey(new Date())) {
        return current;
      }

      return next;
    });
  };

  const selectCalendarDate = (date) => {
    if (formatRecordDate(date) > todayKey) {
      return;
    }

    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const openRoutineMenu = (routine) => {
    setActiveRoutine(routine);
    setRoutineSheetMode("menu");
    setRoutineNameDraft(routine.diseaseName);
  };

  const closeRoutineSheet = () => {
    setActiveRoutine(null);
    setRoutineSheetMode(null);
    setRoutineNameDraft("");
    setIsSavingRoutine(false);
    setIsDeletingRoutine(false);
  };

  const openRenameRoutine = () => {
    if (!activeRoutine) return;
    setRoutineNameDraft(activeRoutine.diseaseName);
    setRoutineSheetMode("rename");
  };

  const saveRoutineName = async () => {
    if (!activeRoutine || !routineNameDraft.trim() || isSavingRoutine) {
      return;
    }

    const nextName = routineNameDraft.trim();

    try {
      setIsSavingRoutine(true);
      setRoutinesError("");

      if (activeRoutine.backendRoutineId) {
        const response = await apiClient.patch(
          `/routines/${activeRoutine.backendRoutineId}`,
          { diseaseName: nextName }
        );
        saveApiRoutine({
          apiRoutine: response.routine,
          fallbackRoutine: activeRoutine,
        });
      } else {
        renameRoutine(activeRoutine.id, nextName);
      }

      closeRoutineSheet();
    } catch (error) {
      setRoutinesError(error.message || "루틴명을 변경하지 못했어요.");
      setIsSavingRoutine(false);
    }
  };

  const openDeleteRoutine = () => {
    setRoutineSheetMode("delete");
  };

  const confirmDeleteRoutine = async () => {
    if (!activeRoutine || isDeletingRoutine) {
      return;
    }

    try {
      setIsDeletingRoutine(true);
      setRoutinesError("");

      if (activeRoutine.backendRoutineId) {
        await apiClient.delete(`/routines/${activeRoutine.backendRoutineId}`);
      }

      removeRoutine(activeRoutine.id);
      closeRoutineSheet();
    } catch (error) {
      setRoutinesError(error.message || "루틴을 삭제하지 못했어요.");
      setIsDeletingRoutine(false);
    }
  };

  const openRecordMenu = (record) => {
    setActiveRecord(record);
    setRecordSheetMode("menu");
  };

  const closeRecordSheet = () => {
    setActiveRecord(null);
    setRecordSheetMode(null);
    setIsDeletingRecord(false);
  };

  const openDeleteRecord = () => {
    setRecordSheetMode("delete");
  };

  const confirmDeleteRecord = async () => {
    if (!activeRecord || isDeletingRecord) {
      return;
    }

    try {
      setIsDeletingRecord(true);

      if (activeRecord.backendId) {
        await apiClient.delete(`/records/${activeRecord.backendId}`);
      }

      removeRecord(activeRecord.id);
      closeRecordSheet();
    } catch (error) {
      setRecordsError(error.message || "기록 삭제 중 문제가 생겼어요.");
      setIsDeletingRecord(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#EFF4FC] px-5 pb-8 pt-[72px] text-[#1F2733]">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black tracking-[-0.03em] text-[#1B2230]">
          LOOMA
        </h1>
        <button type="button" aria-label="알림" className="text-[#1F2733]">
          <Bell className="h-6 w-6" strokeWidth={1.9} />
        </button>
      </div>

      <div className="mt-4 rounded-[24px] bg-white px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#181E29]">
            <Send className="h-5 w-5 fill-white text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[19px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
              피드백 보내기
            </p>
            <p className="mt-1 text-[16px] font-medium tracking-[-0.02em] text-[#6F8EC9]">
              사용하면서 아쉬웠던 점을 알려주세요
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={toggleCalendar}
          className="flex h-[38px] items-center gap-1 rounded-full bg-white px-4 text-[17px] font-bold text-[#1F2733]"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition", isCalendarOpen && "rotate-180")}
            strokeWidth={2.4}
          />
          캘린더
        </button>
        <Link
          href="/routines/new"
          className="flex h-[38px] items-center gap-1 rounded-full bg-[#D4E1FF] px-4 text-[17px] font-bold text-[#3F69F6]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          루틴 추가
        </Link>
      </div>

      {isCalendarOpen ? (
        <CalendarPanel
          monthDate={calendarMonth}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
          recordDates={calendarRecordDates}
          onMoveMonth={moveCalendarMonth}
          onSelectDate={selectCalendarDate}
        />
      ) : null}

      <div className="mt-7 flex items-center justify-between px-5">
        <button type="button" aria-label="이전 날짜" onClick={() => moveDate(-1)}>
          <ChevronLeft className="h-5 w-5 text-[#1F2733]" strokeWidth={2.2} />
        </button>
        <p className="text-[17px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
          {titleDate}
        </p>
        <button
          type="button"
          aria-label="다음 날짜"
          onClick={() => moveDate(1)}
          disabled={!canMoveToNextDate}
          className={!canMoveToNextDate ? "cursor-not-allowed" : ""}
        >
          <ChevronRight
            className={cn(
              "h-5 w-5",
              canMoveToNextDate ? "text-[#1F2733]" : "text-[#C1CEE3]"
            )}
            strokeWidth={2.2}
          />
        </button>
      </div>

      <section className="mt-5">
        <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
          오늘의 기록
        </h2>
        {recordsError ? (
          <p className="mt-3 text-[13px] font-medium tracking-[-0.02em] text-[#F25F5C]">
            {recordsError}
          </p>
        ) : null}
        <div className={cn("mt-5", recordsForSelectedDate.length > 0 && "space-y-4")}>
          {recordsForSelectedDate.length > 0 ? (
            recordsForSelectedDate.map((record) => (
              <TodayRecordCard
                key={record.id}
                record={record}
                onOpenMenu={openRecordMenu}
              />
            ))
          ) : isRecordsLoading ? (
            <div className="flex h-[128px] items-center justify-center rounded-[26px] border border-[#D4DEEF] bg-white">
              <p className="text-[16px] font-medium text-[#9BAFD6]">기록을 불러오는 중이에요</p>
            </div>
          ) : (
            <EmptyCard />
          )}
        </div>
      </section>

      <div className="mt-5 h-px bg-[#D7E0ED]" />

      <section className="mt-6">
        <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
          기록 루틴
        </h2>
        {routinesError ? (
          <p className="mt-3 text-[13px] font-medium tracking-[-0.02em] text-[#F25F5C]">
            {routinesError}
          </p>
        ) : null}
        <div className="mt-5 space-y-5">
          {routines.length > 0 ? (
            routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onOpenMenu={openRoutineMenu}
              />
            ))
          ) : (
            <EmptyCard />
          )}
        </div>
      </section>

      {activeRoutine && routineSheetMode === "menu" ? (
        <SheetFrame onClose={closeRoutineSheet}>
          <h2 className="mt-6 text-center text-[18px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
            {activeRoutine.diseaseName}
          </h2>
          <div className="mt-8 space-y-6">
            <button
              type="button"
              onClick={openRenameRoutine}
              className="flex items-center gap-5 text-[17px] font-extrabold tracking-[-0.02em] text-[#1F2733]"
            >
              <Pencil className="h-5 w-5" strokeWidth={2.2} />
              루틴명 변경
            </button>
            <button
              type="button"
              onClick={openDeleteRoutine}
              className="flex items-center gap-5 text-[17px] font-extrabold tracking-[-0.02em] text-[#FF4F3D]"
            >
              <Trash2 className="h-5 w-5" strokeWidth={2.2} />
              삭제하기
            </button>
          </div>
        </SheetFrame>
      ) : null}

      {activeRoutine && routineSheetMode === "rename" ? (
        <SheetFrame onClose={closeRoutineSheet}>
          <h2 className="mt-6 text-center text-[18px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
            루틴명 변경
          </h2>
          <input
            value={routineNameDraft}
            onChange={(event) => setRoutineNameDraft(event.target.value)}
            className="mt-8 h-[50px] w-full rounded-full border border-[#D3DDEC] px-5 text-[16px] font-medium tracking-[-0.02em] text-[#273142] outline-none placeholder:text-[#AFC0DD] focus:border-[#4A6CF7]"
            placeholder={activeRoutine.diseaseName}
          />
          <div className="mt-7 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={closeRoutineSheet}
              className="h-[48px] rounded-full bg-[#E3EBF7] text-[17px] font-bold text-[#8EA4D1]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveRoutineName}
              disabled={!routineNameDraft.trim() || isSavingRoutine}
              className="h-[48px] rounded-full bg-[#3F69F6] text-[17px] font-bold text-white disabled:bg-[#9DB5FA]"
            >
              저장
            </button>
          </div>
        </SheetFrame>
      ) : null}

      {activeRoutine && routineSheetMode === "delete" ? (
        <SheetFrame onClose={closeRoutineSheet}>
          <h2 className="mt-8 text-[22px] font-extrabold leading-[1.35] tracking-[-0.03em] text-[#1F2733]">
            <span className="text-[#FF4F3D]">'{activeRoutine.diseaseName}'</span>{" "}
            루틴 삭제하기
          </h2>
          <p className="mt-4 text-[17px] font-medium leading-[1.55] tracking-[-0.02em] text-[#6F8EC9]">
            더이상 {activeRoutine.diseaseName}을 기록하지 않습니다
            <br />
            이전 날짜의 기록은 삭제 되지 않습니다
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={closeRoutineSheet}
              className="h-[48px] rounded-full bg-[#E3EBF7] text-[17px] font-bold text-[#8EA4D1]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmDeleteRoutine}
              disabled={isDeletingRoutine}
              className="h-[48px] rounded-full bg-[#FF5A44] text-[17px] font-bold text-white disabled:bg-[#FF9D8F]"
            >
              삭제
            </button>
          </div>
        </SheetFrame>
      ) : null}

      {activeRecord && recordSheetMode === "menu" ? (
        <SheetFrame onClose={closeRecordSheet}>
          <h2 className="mt-6 text-center text-[18px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
            {activeRecord.diseaseName}
          </h2>
          <div className="mt-8 space-y-6">
            <Link
              href={`/record/${activeRecord.id}`}
              className="flex items-center gap-5 text-[17px] font-extrabold tracking-[-0.02em] text-[#1F2733]"
            >
              <Pencil className="h-5 w-5" strokeWidth={2.2} />
              기록 수정하기
            </Link>
            <button
              type="button"
              onClick={openDeleteRecord}
              className="flex items-center gap-5 text-[17px] font-extrabold tracking-[-0.02em] text-[#FF4F3D]"
            >
              <Trash2 className="h-5 w-5" strokeWidth={2.2} />
              삭제하기
            </button>
          </div>
        </SheetFrame>
      ) : null}

      {activeRecord && recordSheetMode === "delete" ? (
        <SheetFrame onClose={closeRecordSheet}>
          <h2 className="mt-8 text-[22px] font-extrabold leading-[1.35] tracking-[-0.03em] text-[#1F2733]">
            <span className="text-[#FF4F3D]">'{activeRecord.diseaseName}'</span>{" "}
            기록 삭제하기
          </h2>
          <p className="mt-4 text-[17px] font-medium leading-[1.55] tracking-[-0.02em] text-[#6F8EC9]">
            오늘 기록한 내용에 대해 삭제합니다
            <br />
            루틴은 삭제 되지 않습니다
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={closeRecordSheet}
              disabled={isDeletingRecord}
              className="h-[48px] rounded-full bg-[#E3EBF7] text-[17px] font-bold text-[#8EA4D1]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmDeleteRecord}
              disabled={isDeletingRecord}
              className="h-[48px] rounded-full bg-[#FF5A44] text-[17px] font-bold text-white disabled:bg-[#FF9D8F]"
            >
              {isDeletingRecord ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </SheetFrame>
      ) : null}
    </div>
  );
}

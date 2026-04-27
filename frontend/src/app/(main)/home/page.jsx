"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useRoutineStore } from "@/stores/routineStore";

function formatHomeDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function EmptyCard() {
  return (
    <div className="flex h-[124px] items-center justify-center rounded-[22px] border border-[#D4DEEF] bg-white">
      <p className="text-[16px] font-medium text-[#9BAFD6]">아직 오늘 기록이 없어요</p>
    </div>
  );
}

function RoutineCard({ routine }) {
  return (
    <div className="rounded-[22px] border border-[#D4DEEF] bg-white px-5 pb-5 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: routine.dotColor }}
          />
          <p className="text-[17px] font-bold tracking-[-0.02em] text-[#1F2733]">
            {routine.diseaseName}
          </p>
        </div>
        <button
          type="button"
          aria-label={`${routine.diseaseName} 옵션`}
          className="text-[#B9C7E0]"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <Link
        href={`/record/new?routineId=${routine.id}`}
        className="mt-4 flex items-center gap-3 text-[#93A7D2]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECF1F8]">
          <Plus className="h-5 w-5 text-[#6E84B4]" />
        </span>
        <span className="text-[18px] font-medium tracking-[-0.02em]">
          오늘의 기록 시작하기
        </span>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const routines = useRoutineStore((state) => state.routines);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const titleDate = useMemo(() => formatHomeDate(selectedDate), [selectedDate]);
  const hasRoutines = routines.length > 0;

  const moveDate = (offset) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + offset);
      return next;
    });
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

      <div className="mt-4 rounded-[22px] bg-white px-5 py-5">
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
          className="flex h-[38px] items-center gap-1 rounded-full bg-white px-4 text-[17px] font-bold text-[#1F2733]"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
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

      <div className="mt-7 flex items-center justify-between px-5">
        <button type="button" aria-label="이전 날짜" onClick={() => moveDate(-1)}>
          <ChevronLeft className="h-5 w-5 text-[#1F2733]" strokeWidth={2.2} />
        </button>
        <p className="text-[17px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
          {titleDate}
        </p>
        <button type="button" aria-label="다음 날짜" onClick={() => moveDate(1)}>
          <ChevronRight className="h-5 w-5 text-[#C1CEE3]" strokeWidth={2.2} />
        </button>
      </div>

      <section className="mt-5">
        <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
          오늘의 기록
        </h2>
        <div className="mt-5">
          <EmptyCard />
        </div>
      </section>

      <div className="mt-5 h-px bg-[#D7E0ED]" />

      <section className="mt-6">
        <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
          기록 루틴
        </h2>
        <div className="mt-5 space-y-5">
          {hasRoutines ? routines.map((routine) => <RoutineCard key={routine.id} routine={routine} />) : <EmptyCard />}
        </div>
      </section>
    </div>
  );
}

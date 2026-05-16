"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, LogOut } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";

function MenuRow({ href, children }) {
  return (
    <Link
      href={href}
      className="flex h-[54px] items-center justify-between px-4 text-[15px] font-bold tracking-[-0.03em] text-[#1F2733]"
    >
      <span>{children}</span>
      <ChevronRight className="h-5 w-5 text-[#91A6CC]" strokeWidth={2.2} />
    </Link>
  );
}

export default function MypagePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const onboardingNickname = useAuthStore((state) => state.onboarding.nickname);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const [recordDayCount, setRecordDayCount] = useState(user?.recordDayCount || 0);

  const nickname = useMemo(
    () => user?.nickname || user?.name || onboardingNickname || "LOOMA",
    [onboardingNickname, user?.name, user?.nickname]
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchMe() {
      try {
        const response = await apiClient.get("/users/me");

        if (!isMounted) return;

        if (response.user) {
          updateUser(response.user);
          setRecordDayCount(response.user.recordDayCount || 0);
        }
      } catch {
        // 로그인 전 로컬 MVP 상태에서는 기존 스토어 값으로 표시합니다.
      }
    }

    fetchMe();

    return () => {
      isMounted = false;
    };
  }, [updateUser]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // 로그아웃은 클라이언트 세션 정리가 우선입니다.
    }

    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-[100dvh] bg-[#EFF4FC] text-[#101928]">
      <header className="flex h-[120px] items-center justify-between bg-[#EFF4FC] px-7 pt-6">
        <div className="flex-1 text-center text-[15px] font-extrabold tracking-[-0.02em]">
          My Page
        </div>
        <Bell className="h-5 w-5 text-[#101928]" strokeWidth={2} />
      </header>

      <section className="bg-white px-5 py-5">
        <h1 className="text-[20px] font-extrabold tracking-[-0.04em]">
          {nickname}님, 반가워요!
        </h1>
        <p className="mt-2 text-[13px] font-bold tracking-[-0.03em] text-[#3F69F6]">
          총 {recordDayCount}일 기록했어요
        </p>
      </section>

      <div className="h-4 bg-[#EFF4FC]" />

      <section className="bg-white py-2">
        <MenuRow href="/mypage/edit">내 정보 수정</MenuRow>
        <button
          type="button"
          onClick={() => alert("1:1 문의 기능은 곧 연결할게요.")}
          className="flex h-[54px] w-full items-center justify-between px-4 text-left text-[15px] font-bold tracking-[-0.03em] text-[#1F2733]"
        >
          <span>1:1 문의하기</span>
          <ChevronRight className="h-5 w-5 text-[#91A6CC]" strokeWidth={2.2} />
        </button>
        <MenuRow href="/mypage/notifications">알림 설정</MenuRow>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-[54px] items-center gap-3 px-4 text-[15px] font-bold tracking-[-0.03em] text-[#FF4E3D]"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.2} />
          로그아웃
        </button>
      </section>
    </div>
  );
}

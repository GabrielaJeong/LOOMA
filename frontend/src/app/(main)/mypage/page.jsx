"use client";

import { useAuthStore } from "@/stores/authStore";

export default function MypagePage() {
  const nickname = useAuthStore((state) => state.onboarding.nickname || state.user?.nickname || "LOOMA");

  return (
    <div className="min-h-[100dvh] bg-[#EFF4FC] px-5 pt-[72px] text-[#1F2733]">
      <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">내 정보</h1>
      <div className="mt-5 rounded-[22px] border border-[#D4DEEF] bg-white px-5 py-6">
        <p className="text-[15px] font-medium text-[#6F8EC9]">가입 닉네임</p>
        <p className="mt-2 text-[22px] font-extrabold tracking-[-0.03em]">
          {nickname}
        </p>
      </div>
    </div>
  );
}

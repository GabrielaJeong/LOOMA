"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

export default function MypageEditPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const onboardingNickname = useAuthStore((state) => state.onboarding.nickname);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  const initialName = useMemo(
    () => user?.nickname || user?.name || onboardingNickname || "",
    [onboardingNickname, user?.name, user?.nickname]
  );
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && trimmedName !== initialName && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      const response = await apiClient.patch("/users/me", { name: trimmedName });

      if (response.user) {
        updateUser(response.user);
      } else {
        updateUser({ name: trimmedName, nickname: trimmedName });
      }

      router.back();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      await apiClient.delete("/users/me");
    } catch {
      // 탈퇴 실패 시에도 로컬 세션은 정리해서 사용자를 막히지 않게 합니다.
    }

    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-[100dvh] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+28px)] text-[#101928]">
      <header className="flex h-[96px] items-center justify-between pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="flex h-10 w-10 items-center justify-start text-[#8AA0C7]"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.2} />
        </button>
        <h1 className="text-[16px] font-extrabold tracking-[-0.03em]">
          내 정보 수정
        </h1>
        <Bell className="h-5 w-5 text-[#101928]" strokeWidth={2} />
      </header>

      <section className="mt-2">
        <label
          htmlFor="nickname"
          className="text-[13px] font-extrabold tracking-[-0.03em]"
        >
          이름/닉네임
        </label>
        <input
          id="nickname"
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 20))}
          className="mt-3 h-[52px] w-full rounded-[10px] border border-[#C4D2EA] px-4 text-[16px] font-semibold tracking-[-0.03em] outline-none transition focus:border-[#3F69F6]"
        />
      </section>

      <section className="mt-7">
        <h2 className="text-[13px] font-extrabold tracking-[-0.03em]">계정</h2>
        <div className="mt-3 flex h-[52px] items-center rounded-[8px] bg-[#FEE500] px-4 text-[15px] font-extrabold tracking-[-0.03em] text-[#1A1A2E]">
          카카오 계정으로 로그인 중
        </div>
      </section>

      <button
        type="button"
        onClick={() => setIsWithdrawOpen(true)}
        className="mt-7 text-[14px] font-semibold tracking-[-0.03em] text-[#6F8EC9] underline underline-offset-2"
      >
        회원 탈퇴
      </button>

      <button
        type="button"
        onClick={handleSave}
        aria-disabled={!canSave}
        className={cn(
          "mt-[248px] flex h-[58px] w-full items-center justify-center rounded-[10px] text-[17px] font-extrabold tracking-[-0.03em] text-white transition",
          canSave ? "bg-[#3F69F6] active:brightness-95" : "bg-[#B7C5E2]"
        )}
      >
        {isSaving ? "변경 중..." : "변경하기"}
      </button>

      {isWithdrawOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/48 px-8">
          <div className="w-full max-w-[280px] rounded-[8px] bg-white px-5 py-6 text-center">
            <h2 className="text-[17px] font-extrabold tracking-[-0.03em]">
              회원 탈퇴
            </h2>
            <p className="mt-5 whitespace-pre-line text-[13px] font-semibold leading-[1.7] tracking-[-0.03em] text-[#6F8EC9]">
              탈퇴하면 정보를 복구할 수 없어요.
              {"\n"}
              정말 탈퇴하시겠어요?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsWithdrawOpen(false)}
                className="h-[42px] rounded-[6px] bg-[#D7E0EF] text-[14px] font-extrabold text-[#6F8EC9]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                className="h-[42px] rounded-[6px] bg-[#3F69F6] text-[14px] font-extrabold text-white"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

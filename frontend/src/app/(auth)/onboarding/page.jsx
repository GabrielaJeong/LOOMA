"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";

const MAX_NICKNAME_LENGTH = 5;

function getNicknameText(value) {
  return value.slice(0, MAX_NICKNAME_LENGTH);
}

export default function OnboardingPage() {
  const onboarding = useAuthStore((state) => state.onboarding);
  const beginOnboarding = useAuthStore((state) => state.beginOnboarding);
  const saveOnboardingNickname = useAuthStore((state) => state.saveOnboardingNickname);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [nickname, setNickname] = useState(onboarding.nickname ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isComplete, setIsComplete] = useState(onboarding.isComplete);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!onboarding.provider) {
      beginOnboarding({ provider: "kakao" });
    }
  }, [beginOnboarding, onboarding.provider]);

  const trimmedNickname = useMemo(() => nickname.trim(), [nickname]);
  const canSubmit = trimmedNickname.length > 0;

  const syncNickname = (value) => {
    const nextValue = getNicknameText(value);
    setNickname(nextValue);
    saveOnboardingNickname(nextValue);
  };

  const handleChange = (event) => {
    syncNickname(event.target.value);
  };

  const handleInput = (event) => {
    syncNickname(event.currentTarget.value);
  };

  const handleSubmit = async () => {
    const rawNickname = inputRef.current?.value ?? nickname;
    const finalNickname = getNicknameText(rawNickname).trim();

    if (!finalNickname) {
      return;
    }

    completeOnboarding(finalNickname);
    try {
      const response = await apiClient.patch("/users/me", {
        name: finalNickname,
        onboardingCompleted: true,
      });

      if (response.user) {
        updateUser(response.user);
      }
    } catch {
      updateUser({
        name: finalNickname,
        nickname: finalNickname,
        onboardingCompleted: true,
      });
    }
    setNickname(finalNickname);
    setIsFocused(false);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#EFF4FC] px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[238px] text-[#273142]">
        <div className="flex flex-1 flex-col items-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#3F69F6]">
            <Check className="h-9 w-9 text-white" strokeWidth={3} />
          </div>

          <h1 className="mt-10 text-center text-[20px] font-extrabold leading-[1.45] tracking-[-0.02em]">
            만나서 반가워요, {trimmedNickname || onboarding.nickname} 님!
            <br />
            이제 기록을 시작해 볼까요?
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/home"
            className="flex h-[58px] items-center justify-center rounded-[14px] bg-[#A6B7D6] text-[17px] font-bold text-white transition active:brightness-95"
          >
            홈으로
          </Link>
          <Link
            href="/routines/new"
            className="flex h-[58px] items-center justify-center rounded-[14px] bg-[#3F69F6] text-[17px] font-bold text-white transition active:brightness-95"
          >
            시작하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#EFF4FC] px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[147px] text-[#1F2A3D]">
      <div>
        <h1 className="text-[22px] font-extrabold leading-[1.4] tracking-[-0.03em] text-[#1F2733]">
          가입을 축하드려요!
          <br />
          어떻게 불러드리면 될까요?
        </h1>
        <p className="mt-4 text-[15px] font-medium tracking-[-0.02em] text-[#6F8EC9]">
          이름은 나중에 변경할 수 있어요
        </p>
      </div>

      <div className="mt-[74px]">
        <label htmlFor="nickname" className="sr-only">
          닉네임 입력
        </label>
        <div
          className={cn(
            "flex h-[54px] items-center rounded-[14px] border bg-white px-4 transition",
            isFocused ? "border-[#1F2733]" : "border-[#B8C7E2]"
          )}
        >
          <input
            ref={inputRef}
            id="nickname"
            name="nickname"
            type="text"
            value={nickname}
            onChange={handleChange}
            onInput={handleInput}
            onCompositionEnd={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSubmit();
              }
            }}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="nickname"
            autoFocus
            placeholder="5글자 내로 입력해 주세요"
            className="h-full flex-1 border-0 bg-transparent text-[16px] font-semibold tracking-[-0.02em] text-[#1F2733] outline-none placeholder:text-[#BEC9DD]"
          />
          <span className="ml-3 text-[16px] font-semibold tracking-[-0.02em] text-[#BEC9DD]">
            {nickname.length}/{MAX_NICKNAME_LENGTH}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        aria-disabled={!canSubmit}
        className={cn(
          "mt-auto flex h-[58px] items-center justify-center rounded-[14px] text-[17px] font-bold text-white transition",
          canSubmit ? "bg-[#3F69F6] active:brightness-95" : "bg-[#B7C5E2]"
        )}
      >
        다음
      </button>
    </div>
  );
}

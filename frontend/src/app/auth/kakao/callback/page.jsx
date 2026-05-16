"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [message, setMessage] = useState("카카오 로그인을 확인하고 있어요.");

  useEffect(() => {
    let isMounted = true;

    async function completeLogin() {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        setMessage("카카오 로그인을 완료하지 못했어요. 다시 시도해 주세요.");
        setTimeout(() => router.replace("/"), 1200);
        return;
      }

      if (!accessToken || !refreshToken) {
        setMessage("로그인 정보가 부족해요. 다시 시도해 주세요.");
        setTimeout(() => router.replace("/"), 1200);
        return;
      }

      try {
        login({
          user: {
            id: searchParams.get("userId") || "",
            nickname: searchParams.get("nickname") || "",
            name: searchParams.get("nickname") || "",
            onboardingCompleted:
              searchParams.get("onboardingCompleted") === "true",
          },
          accessToken,
          refreshToken,
        });

        const response = await apiClient.get("/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const user = response.user;

        login({ user, accessToken, refreshToken });

        if (!isMounted) return;

        router.replace(user?.onboardingCompleted ? "/home" : "/onboarding");
      } catch {
        if (!isMounted) return;
        setMessage("로그인은 되었지만 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        setTimeout(() => router.replace("/"), 1400);
      }
    }

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [login, router, searchParams]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#EFF4FC] px-8 text-center text-[18px] font-extrabold leading-[1.5] tracking-[-0.03em] text-[#1F2733]">
      {message}
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#EFF4FC] text-[18px] font-extrabold text-[#1F2733]">
          카카오 로그인을 확인하고 있어요.
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}

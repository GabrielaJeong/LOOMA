import { MessageCircle } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const KAKAO_AUTH_START_PATH = `${API_ORIGIN}/auth/kakao`;
const ONBOARDING_START_PATH = "/onboarding";

export default function LoginPage() {
  const startHref =
    process.env.NEXT_PUBLIC_KAKAO_AUTH_ENABLED === "false"
      ? ONBOARDING_START_PATH
      : KAKAO_AUTH_START_PATH;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+48px)] pt-[96px]">
      <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
        <h1 className="text-[38px] font-black tracking-wider text-[#1A1A2E]">
          LOOMA
        </h1>
        <p className="text-[15px] font-medium text-[#6B7CED]">
          꾸준히 기록하며 회복 흐름을 만들어요
        </p>
      </div>

      <a
        href={startHref}
        className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500]
                   text-[17px] font-semibold text-[#1A1A2E] transition-all active:brightness-95"
      >
        <MessageCircle size={20} fill="#1A1A2E" strokeWidth={0} />
        카카오로 시작하기
      </a>
    </div>
  );
}

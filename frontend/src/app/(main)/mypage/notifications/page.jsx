"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const DEFAULT_NOTIFICATIONS = {
  push: true,
  event: false,
  sms: true,
  email: false,
};

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-[14px] font-extrabold tracking-[-0.03em] text-[#101928]">
          {label}
        </p>
        {description && (
          <p className="mt-2 text-[12px] font-semibold leading-[1.45] tracking-[-0.03em] text-[#6F8EC9]">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[26px] w-[46px] shrink-0 rounded-full transition",
          checked ? "bg-[#3F69F6]" : "bg-[#C7D2E6]"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-[23px]" : "left-[3px]"
          )}
        />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [notifications, setNotifications] = useState(
    user?.notifications || DEFAULT_NOTIFICATIONS
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.notifications) {
      setNotifications(user.notifications);
    }
  }, [user?.notifications]);

  const setValue = (key) => (value) => {
    setNotifications((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.patch("/users/me/notifications", {
        notifications,
      });

      if (response.user) {
        updateUser(response.user);
      } else {
        updateUser({ notifications });
      }

      router.back();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
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
          알림 설정
        </h1>
        <Bell className="h-5 w-5 text-[#101928]" strokeWidth={2} />
      </header>

      <section className="mt-8">
        <h2 className="mb-2 text-[13px] font-extrabold tracking-[-0.03em] text-[#6F8EC9]">
          푸시 알림
        </h2>
        <Toggle
          checked={notifications.push}
          onChange={setValue("push")}
          label="서비스 알림"
          description="주요 서비스에 대한 알림을 받습니다"
        />
        <Toggle
          checked={notifications.event}
          onChange={setValue("event")}
          label="혜택 및 이벤트 알림"
          description="루마가 제공하는 혜택과 이벤트 알림을 받습니다"
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-[13px] font-extrabold tracking-[-0.03em] text-[#6F8EC9]">
          마케팅 수신 동의
        </h2>
        <Toggle
          checked={notifications.sms}
          onChange={setValue("sms")}
          label="SMS 수신 동의"
        />
        <Toggle
          checked={notifications.email}
          onChange={setValue("email")}
          label="E-mail 수신 동의"
        />
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-[178px] flex h-[58px] w-full items-center justify-center rounded-[10px] bg-[#3F69F6] text-[17px] font-extrabold tracking-[-0.03em] text-white transition active:brightness-95 disabled:bg-[#B7C5E2]"
      >
        {isSaving ? "변경 중..." : "변경하기"}
      </button>
    </div>
  );
}

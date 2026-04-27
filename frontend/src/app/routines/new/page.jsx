"use client";

import { Check, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { useRoutineStore } from "@/stores/routineStore";

const SUBJECT_OPTIONS = ["본인", "부모님", "배우자", "자녀", "친구", "기타 (직접 입력)"];

function StepHeader({ title, progress, onBack }) {
  return (
    <div className="px-5 pt-[52px]">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="이전"
          className="absolute left-0 text-[#9FB1D5]"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.4} />
        </button>
        <h1 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#273142]">
          {title}
        </h1>
      </div>

      <div className="mt-7 h-1.5 rounded-full bg-[#C6D3EA]">
        <div
          className="h-full rounded-full bg-[#3F69F6] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function SubjectCard({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-[74px] w-full items-center justify-between rounded-[16px] border bg-white px-6 text-left transition",
        selected ? "border-[#3F69F6] bg-[#DCE6FF]" : "border-[#BFD0EA]"
      )}
    >
      <span className="text-[18px] font-bold tracking-[-0.02em] text-[#1F2733]">
        {label}
      </span>
      {selected ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3F69F6]">
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

function formatBirthDate(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  const parts = [];

  if (numbers.length > 0) parts.push(numbers.slice(0, 4));
  if (numbers.length > 4) parts.push(numbers.slice(4, 6));
  if (numbers.length > 6) parts.push(numbers.slice(6, 8));

  return parts.join(".");
}

function formatMeasure(value, suffix) {
  const numbers = value.replace(/\D/g, "").slice(0, 3);
  return numbers ? `${numbers} ${suffix}` : "";
}

function isValidBirthDate(value) {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const today = new Date();
  const maxYear = today.getFullYear();

  if (year < 1900 || year > maxYear) {
    return false;
  }

  const parsed = new Date(year, month - 1, day);
  const isRealDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  if (!isRealDate) {
    return false;
  }

  parsed.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return parsed <= today;
}

export default function NewRoutinePage() {
  const router = useRouter();
  const createRoutine = useRoutineStore((state) => state.createRoutine);

  const [step, setStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [gender, setGender] = useState("남성");
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [diseaseName, setDiseaseName] = useState("");

  const isCustomSubjectStep = step === 1 && selectedSubject === "기타 (직접 입력)";

  const subjectName = useMemo(() => {
    if (selectedSubject === "기타 (직접 입력)") {
      return customSubject.trim();
    }

    return selectedSubject;
  }, [customSubject, selectedSubject]);

  const birthDateHasError = birthDate.length === 10 && !isValidBirthDate(birthDate);

  const isStepOneValid =
    !!selectedSubject &&
    (selectedSubject !== "기타 (직접 입력)" || customSubject.trim().length > 0);
  const isStepTwoValid =
    !!gender &&
    birthDate.length === 10 &&
    !birthDateHasError &&
    !!heightCm.trim() &&
    !!weightKg.trim();
  const isStepThreeValid = diseaseName.trim().length > 0;

  const handleBack = () => {
    if (step === 4) {
      router.push("/home");
      return;
    }

    if (isCustomSubjectStep) {
      setSelectedSubject("");
      setCustomSubject("");
      return;
    }

    if (step === 1) {
      router.push("/home");
      return;
    }

    setStep((current) => current - 1);
  };

  const handleNext = () => {
    if (step === 1 && isStepOneValid) {
      setStep(2);
      return;
    }

    if (step === 2 && isStepTwoValid) {
      setStep(3);
      return;
    }

    if (step === 3 && isStepThreeValid) {
      const finalDiseaseName = diseaseName.trim();
      createRoutine({
        subjectType: selectedSubject,
        subjectName,
        gender,
        birthDate,
        heightCm: heightCm.replace(/\D/g, ""),
        weightKg: weightKg.replace(/\D/g, ""),
        diseaseName: finalDiseaseName,
      });
      setStep(4);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#EFF4FC] text-[#1F2733]">
      {step < 4 ? (
        <StepHeader
          title={step === 1 ? "기록 대상" : step === 2 ? "기본 정보" : "질병 기록"}
          progress={step === 1 ? 33.333 : step === 2 ? 66.666 : 100}
          onBack={handleBack}
        />
      ) : (
        <div className="px-5 pt-[52px]">
          <button
            type="button"
            onClick={handleBack}
            aria-label="이전"
            className="text-[#9FB1D5]"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={2.4} />
          </button>
        </div>
      )}

      {step === 1 ? (
        <div className="flex min-h-[calc(100dvh-108px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-10">
          <div>
            <h2 className="text-[22px] font-extrabold leading-[1.4] tracking-[-0.03em] text-[#1F2733]">
              누구의 질병을 기록할까요?
            </h2>
            <p className="mt-4 text-[15px] font-medium leading-[1.5] tracking-[-0.02em] text-[#6F8EC9]">
              본인 뿐만 아니라
              <br />
              가족/지인의 기록을 관리할 수 있어요
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {isCustomSubjectStep ? (
              <>
                <SubjectCard
                  label="기타 (직접 입력)"
                  selected
                  onSelect={() => setSelectedSubject("기타 (직접 입력)")}
                />
                <input
                  type="text"
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                  placeholder="텍스트를 입력해 주세요"
                  className="h-[74px] w-full rounded-[16px] border border-[#BFD0EA] bg-white px-6 text-[18px] font-medium text-[#1F2733] outline-none placeholder:text-[#B8C7E2]"
                />
              </>
            ) : (
              SUBJECT_OPTIONS.map((option) => (
                <SubjectCard
                  key={option}
                  label={option}
                  selected={selectedSubject === option}
                  onSelect={() => setSelectedSubject(option)}
                />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepOneValid}
            className={cn(
              "mt-auto flex h-[58px] items-center justify-center rounded-[14px] text-[17px] font-bold text-white transition",
              isStepOneValid ? "bg-[#3F69F6] active:brightness-95" : "bg-[#B7C5E2]"
            )}
          >
            다음
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex min-h-[calc(100dvh-108px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-10">
          <div>
            <h2 className="text-[22px] font-extrabold leading-[1.4] tracking-[-0.03em] text-[#1F2733]">
              <span className="text-[#3F69F6]">{subjectName || "본인"}</span>에 대해 알려주세요
            </h2>
            <p className="mt-4 text-[15px] font-medium leading-[1.5] tracking-[-0.02em] text-[#6F8EC9]">
              질병 기록 관리에 도움이 돼요
              <br />
              이 내용은 절대로 외부에 공개 되지 않아요
            </p>
          </div>

          <div className="mt-11 space-y-7">
            <div className="flex items-center justify-between">
              <span className="text-[18px] font-extrabold text-[#1F2733]">성별</span>
              <div className="flex items-center gap-5">
                {["남성", "여성"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(option)}
                    className="flex items-center gap-2 text-[16px] font-bold text-[#1F2733]"
                  >
                    <span
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        gender === option
                          ? "border-[#3F69F6] shadow-[inset_0_0_0_4px_white,inset_0_0_0_100px_#3F69F6]"
                          : "border-[#BFD0EA] bg-white"
                      )}
                    />
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[18px] font-extrabold text-[#1F2733]">생년월일</span>
              <input
                type="text"
                inputMode="numeric"
                value={birthDate}
                onChange={(event) => setBirthDate(formatBirthDate(event.target.value))}
                placeholder="YYYY.MM.DD"
                className={cn(
                  "h-[42px] w-[140px] rounded-[10px] bg-white px-4 text-right text-[16px] font-medium text-[#1F2733] outline-none placeholder:text-[#C0CCE0]",
                  birthDateHasError ? "border border-[#F25F5C]" : "border border-[#BFD0EA]"
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[18px] font-extrabold text-[#1F2733]">키</span>
              <input
                type="text"
                inputMode="numeric"
                value={heightCm}
                onChange={(event) => setHeightCm(formatMeasure(event.target.value, "cm"))}
                placeholder="cm"
                className="h-[42px] w-[140px] rounded-[10px] border border-[#BFD0EA] bg-white px-4 text-right text-[16px] font-medium text-[#1F2733] outline-none placeholder:text-[#C0CCE0]"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[18px] font-extrabold text-[#1F2733]">체중</span>
              <input
                type="text"
                inputMode="numeric"
                value={weightKg}
                onChange={(event) => setWeightKg(formatMeasure(event.target.value, "kg"))}
                placeholder="kg"
                className="h-[42px] w-[140px] rounded-[10px] border border-[#BFD0EA] bg-white px-4 text-right text-[16px] font-medium text-[#1F2733] outline-none placeholder:text-[#C0CCE0]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepTwoValid}
            className={cn(
              "mt-auto flex h-[58px] items-center justify-center rounded-[14px] text-[17px] font-bold text-white transition",
              isStepTwoValid ? "bg-[#3F69F6] active:brightness-95" : "bg-[#B7C5E2]"
            )}
          >
            다음
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex min-h-[calc(100dvh-108px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-10">
          <div>
            <h2 className="text-[22px] font-extrabold leading-[1.4] tracking-[-0.03em] text-[#1F2733]">
              무엇을 기록해 볼까요?
            </h2>
            <p className="mt-4 text-[15px] font-medium leading-[1.5] tracking-[-0.02em] text-[#6F8EC9]">
              관리하려는 질병명 혹은 증상을
              <br />
              적어주세요.
            </p>
          </div>

          <div className="mt-11">
            <label className="text-[18px] font-extrabold text-[#1F2733]">기록지 제목</label>
            <input
              type="text"
              value={diseaseName}
              onChange={(event) => setDiseaseName(event.target.value)}
              placeholder="ex. 역류성 식도염"
              className="mt-6 h-[54px] w-full rounded-[14px] border border-[#BFD0EA] bg-white px-4 text-[18px] font-semibold text-[#1F2733] outline-none placeholder:text-[#B9C7E0]"
            />
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepThreeValid}
            className={cn(
              "mt-auto flex h-[58px] items-center justify-center rounded-[14px] text-[17px] font-bold text-white transition",
              isStepThreeValid ? "bg-[#3F69F6] active:brightness-95" : "bg-[#B7C5E2]"
            )}
          >
            다음
          </button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="flex min-h-[calc(100dvh-52px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[210px] text-center">
          <div className="flex flex-1 flex-col items-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#3F69F6]">
              <Check className="h-9 w-9 text-white" strokeWidth={3} />
            </div>
            <h2 className="mt-10 text-[24px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
              기록 루틴을 만들었어요
            </h2>
            <p className="mt-4 text-[16px] font-medium tracking-[-0.02em] text-[#6F8EC9]">
              이제부터 꾸준히 기록하며 관리해 볼까요?
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/home")}
            className="flex h-[58px] items-center justify-center rounded-[14px] bg-[#3F69F6] text-[17px] font-bold text-white transition active:brightness-95"
          >
            확인
          </button>
        </div>
      ) : null}
    </div>
  );
}

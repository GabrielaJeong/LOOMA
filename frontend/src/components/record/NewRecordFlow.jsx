"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, ChevronLeft, Mic, Square } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useRecordStore } from "@/stores/recordStore";
import { useRoutineStore } from "@/stores/routineStore";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getPreferredAudioMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return (
    ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    ) || ""
  );
}

function buildMockSections(routine) {
  return [
    {
      id: "section-symptom",
      title: "주요 증상",
      items: [
        `${routine?.diseaseName ?? "현재 증상"} 관련 불편함이 계속 있었음.`,
        "식사 전후로 증상 변화를 느꼈음.",
      ],
    },
    {
      id: "section-medicine",
      title: "투약 기록",
      items: ["약을 복용했지만 바로 좋아지는 느낌은 아직 크지 않았음."],
    },
  ];
}

function VoiceWave() {
  return (
    <div className="mt-8 flex items-end justify-center gap-[7px]">
      {[12, 20, 28, 20, 12].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-[5px] animate-pulse rounded-full bg-[#4A6CF7]"
          style={{
            height,
            animationDelay: `${index * 120}ms`,
            animationDuration: "900ms",
          }}
        />
      ))}
    </div>
  );
}

function ComposerBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitDisabled = false,
  multiline = false,
  readOnly = false,
}) {
  return (
    <div className="rounded-[24px] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(155,175,214,0.18)]">
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className="min-h-[76px] w-full resize-none bg-transparent text-[15px] font-medium leading-[1.55] tracking-[-0.02em] text-[#273142] outline-none placeholder:text-[#A8B9D7]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className="h-[28px] w-full bg-transparent text-[15px] font-medium tracking-[-0.02em] text-[#273142] outline-none placeholder:text-[#A8B9D7]"
        />
      )}

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full p-0 transition",
            submitDisabled ? "bg-[#D2DEEF] text-white" : "bg-[#3F69F6] text-white"
          )}
        >
          <ArrowUp className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

function Header({ onBack, blockBack = false }) {
  return (
    <div className="flex items-center justify-between px-5 pt-[52px]">
      <button
        type="button"
        aria-label="뒤로가기"
        onClick={blockBack ? undefined : onBack}
        className={cn("text-[#9FB1D5]", blockBack && "opacity-40")}
      >
        <ChevronLeft className="h-7 w-7" strokeWidth={2.4} />
      </button>
      <h1 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#273142]">
        오늘의 기록
      </h1>
      <div className="h-7 w-7" />
    </div>
  );
}

function RecordShell({ children }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#EFF4FC] via-[#ECF2FC] to-[#DDE7FB] text-[#1F2733]">
      <div className="px-5 pt-7">
        <p className="text-[16px] font-medium leading-[1.55] tracking-[-0.02em] text-[#273142]">
          안녕하세요, 기록하고 싶은 증상을
          <br />
          말씀해 주시면 정리해서 요약해 드릴게요.
        </p>
      </div>
      {children}
    </div>
  );
}

export default function NewRecordFlow({ routineId }) {
  const router = useRouter();
  const routines = useRoutineStore((state) => state.routines);
  const saveApiRecord = useRecordStore((state) => state.saveApiRecord);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [phase, setPhase] = useState("initial");
  const [draftText, setDraftText] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [sections, setSections] = useState([]);
  const [savedRecordId, setSavedRecordId] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const routine = useMemo(
    () =>
      routines.find(
        (item) => item.id === routineId || item.backendRoutineId === routineId
      ) ??
      routines[0] ??
      null,
    [routineId, routines]
  );

  useEffect(() => {
    if (!routine) {
      router.replace("/home");
    }
  }, [router, routine]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (phase !== "analyzing" || !routine || !reviewText.trim()) {
      return undefined;
    }

    let ignore = false;

    async function createRecordFromServer() {
      try {
        setSaveError("");

        const response = await apiClient.post("/records", {
          routineId: routine.backendRoutineId ?? routine.id,
          routineContext: {
            subjectType: routine.subjectType,
            subjectName: routine.subjectName,
            gender: routine.gender,
            birthDate: routine.birthDate,
            heightCm: routine.heightCm,
            weightKg: routine.weightKg,
            diseaseName: routine.diseaseName,
            dotColor: routine.dotColor,
          },
          transcript: reviewText.trim(),
        });

        const createdRecord = saveApiRecord({
          apiRecord: response.record,
          routine,
          transcript: reviewText.trim(),
        });

        if (!ignore) {
          setSections(createdRecord.sections);
          setSavedRecordId(createdRecord.id);
          setPhase("result");
        }
      } catch (error) {
        if (!ignore) {
          setSaveError(error.message || "기록 생성 중 문제가 생겼어요.");
          setSections(buildMockSections(routine));
          setPhase("result");
        }
      }
    }

    createRecordFromServer();

    return () => {
      ignore = true;
    };
  }, [phase, reviewText, routine, saveApiRecord]);

  if (!routine) {
    return null;
  }

  const canSendDraft = draftText.trim().length > 0;
  const resultSections = sections.slice(0, 2);

  const stopActiveStream = () => {
    mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
  };

  const transcribeAudioBlob = async (audioBlob) => {
    const audioBase64 = await blobToBase64(audioBlob);
    const response = await apiClient.post("/speech/transcribe", {
      audioBase64,
      mimeType: audioBlob.type || "audio/webm",
    });
    const transcript = String(response.transcript || "").trim();

    if (!transcript) {
      throw new Error("음성을 텍스트로 변환하지 못했어요.");
    }

    setDraftText(transcript);
    setReviewText(transcript);
    setPhase("review");
  };

  const startRecording = async () => {
    try {
      setSaveError("");

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setSaveError("이 브라우저에서는 음성 녹음을 사용할 수 없어요.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = getPreferredAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        preferredMimeType ? { mimeType: preferredMimeType } : undefined
      );

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || preferredMimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        stopActiveStream();
        setPhase("transcribing");
        transcribeAudioBlob(audioBlob).catch((error) => {
          setSaveError(error.message || "음성을 텍스트로 바꾸지 못했어요.");
          setPhase("initial");
        });
      };

      recorder.start();
      setPhase("recording");
    } catch (error) {
      setSaveError(
        error?.name === "NotAllowedError"
          ? "마이크 권한이 필요해요. 브라우저에서 마이크를 허용해 주세요."
          : "녹음을 시작하지 못했어요."
      );
      stopActiveStream();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    stopActiveStream();
    setPhase("initial");
  };

  const handleBack = () => {
    if (phase === "recording") {
      setShowExitModal(true);
      return;
    }

    if (phase === "review") {
      setDraftText(reviewText);
      setPhase("initial");
      return;
    }

    if (phase === "result" || phase === "saved") {
      router.push("/home");
      return;
    }

    if (phase === "analyzing" || phase === "transcribing") {
      return;
    }

    router.push("/home");
  };

  const handleDraftSend = () => {
    if (!canSendDraft) {
      return;
    }

    setSaveError("");
    setReviewText(draftText.trim());
    setPhase("analyzing");
  };

  const handleSaveRecord = async () => {
    if (savedRecordId) {
      setPhase("saved");
      return;
    }

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");

      const response = await apiClient.post("/records", {
        routineId: routine.backendRoutineId ?? routine.id,
        routineContext: {
          subjectType: routine.subjectType,
          subjectName: routine.subjectName,
          gender: routine.gender,
          birthDate: routine.birthDate,
          heightCm: routine.heightCm,
          weightKg: routine.weightKg,
          diseaseName: routine.diseaseName,
          dotColor: routine.dotColor,
        },
        transcript: reviewText,
      });

      const createdRecord = saveApiRecord({
        apiRecord: response.record,
        routine,
        transcript: reviewText,
      });

      setSections(createdRecord.sections);
      setSavedRecordId(createdRecord.id);
      setPhase("saved");
    } catch (error) {
      setSaveError(error.message || "기록 저장 중 문제가 생겼어요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#EFF4FC]">
      <Header
        onBack={handleBack}
        blockBack={phase === "analyzing" || phase === "transcribing"}
      />

      {phase === "initial" ? (
        <RecordShell>
          <div className="flex min-h-[calc(100dvh-151px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+14px)]">
            {saveError ? (
              <p className="mt-6 text-center text-[14px] font-medium tracking-[-0.02em] text-[#F25F5C]">
                {saveError}
              </p>
            ) : null}
            <div className="flex-1" />
            <button
              type="button"
              onClick={startRecording}
              className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#273142] text-white shadow-[0_18px_30px_rgba(39,49,66,0.18)]"
            >
              <Mic className="h-6 w-6" strokeWidth={2.2} />
            </button>

            <div className="mt-7">
              <ComposerBar
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                onSubmit={handleDraftSend}
                placeholder="증상, 약 복용, 운동 상태 등을 말씀해 주세요"
                submitDisabled={!canSendDraft}
              />
            </div>
          </div>
        </RecordShell>
      ) : null}

      {phase === "recording" ? (
        <RecordShell>
          <div className="relative flex min-h-[calc(100dvh-151px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+22px)]">
            <div className="flex-1" />
            <p className="text-center text-[24px] font-bold tracking-[-0.03em] text-[#273142]">
              중지
            </p>
            <button
              type="button"
              onClick={stopRecording}
              className="mx-auto mt-4 flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white shadow-[0_18px_30px_rgba(63,105,246,0.16)]"
            >
              <Square className="h-5 w-5 fill-[#F1604F] text-[#F1604F]" />
            </button>
            <VoiceWave />
            <div className="mt-6 flex justify-center">
              <div className="rounded-full border border-[#4A6CF7] bg-white px-6 py-2 text-[15px] font-bold text-[#4A6CF7] shadow-[0_10px_30px_rgba(74,108,247,0.14)]">
                지금 듣고 있어요
              </div>
            </div>
          </div>

          {showExitModal ? (
            <div className="fixed inset-0 z-50 bg-[#273142]/35">
              <div className="absolute bottom-0 left-1/2 w-full max-w-[393px] -translate-x-1/2 rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-[#E6ECF5]" />
                <h2 className="mt-7 text-[22px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
                  오늘의 기록 종료하기?
                </h2>
                <p className="mt-3 text-[15px] font-medium leading-[1.55] text-[#7A8FB7]">
                  기록을 종료하시겠어요?
                  <br />
                  지금 종료하면 저장되지 않아요.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowExitModal(false)}
                    className="h-[50px] rounded-full bg-[#E8EDF5] text-[16px] font-bold text-[#7A8FB7]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopRecording();
                      router.push("/home");
                    }}
                    className="h-[50px] rounded-full bg-[#FF6C53] text-[16px] font-bold text-white"
                  >
                    종료
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </RecordShell>
      ) : null}

      {phase === "transcribing" ? (
        <RecordShell>
          <div className="px-5 pt-8">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#273142]">
              방금 말한 내용을 텍스트로 바꾸는 중이에요.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[#B0BED9]">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#B0BED9]" />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-[#B0BED9]"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-[#B0BED9]"
                style={{ animationDelay: "240ms" }}
              />
              <span className="ml-1">말씀하신 내용을 확인 중이에요.</span>
            </div>
          </div>
        </RecordShell>
      ) : null}

      {phase === "review" ? (
        <RecordShell>
          <div className="flex min-h-[calc(100dvh-151px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+14px)]">
            <div className="flex-1" />
            <button
              type="button"
              onClick={startRecording}
              className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#273142] text-white shadow-[0_18px_30px_rgba(39,49,66,0.16)]"
            >
              <Mic className="h-6 w-6" strokeWidth={2.2} />
            </button>
            <div className="mt-7">
              <ComposerBar
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                onSubmit={() => {
                  if (!reviewText.trim()) return;
                  setPhase("analyzing");
                }}
                placeholder="계속 수정하거나 바로 전송할 수 있어요"
                submitDisabled={!reviewText.trim()}
                multiline
              />
            </div>
          </div>
        </RecordShell>
      ) : null}

      {phase === "analyzing" ? (
        <RecordShell>
          <div className="px-5 pt-6">
            <div className="max-w-[315px] rounded-[18px] rounded-tl-[8px] bg-[#273142] px-5 py-4 text-[15px] font-medium leading-[1.6] tracking-[-0.02em] text-white">
              {reviewText}
            </div>
            <p className="mt-5 text-[15px] font-semibold tracking-[-0.02em] text-[#273142]">
              말씀하신 내용을 기반으로 기록지를 생성할게요.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[14px] font-medium text-[#B0BED9]">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#B0BED9]" />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-[#B0BED9]"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-[#B0BED9]"
                style={{ animationDelay: "240ms" }}
              />
              <span className="ml-1">기록지를 생성 중이에요.</span>
            </div>
          </div>
        </RecordShell>
      ) : null}

      {phase === "result" ? (
        <RecordShell>
          <div className="flex min-h-[calc(100dvh-151px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-4">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#273142]">
              기록지를 생성했습니다.
            </p>
            <div className="mt-4 space-y-4">
              {resultSections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-[20px] border border-[#C7D6EF] bg-white px-5 py-4"
                >
                  <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-2.5">
                    {section.items.map((item) => (
                      <p
                        key={item}
                        className="flex gap-2 text-[14px] font-medium leading-[1.65] tracking-[-0.02em] text-[#273142]"
                      >
                        <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-[#273142]" />
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveRecord}
              disabled={isSaving}
              className={cn(
                "mt-7 h-[50px] rounded-full text-[17px] font-bold text-white",
                isSaving ? "bg-[#9DB5FA]" : "bg-[#3F69F6]"
              )}
            >
              {isSaving ? "저장 중..." : "기록 완료"}
            </button>

            {saveError ? (
              <p className="mt-3 text-center text-[14px] font-medium tracking-[-0.02em] text-[#F25F5C]">
                {saveError}
              </p>
            ) : null}

            <div className="mt-auto pt-7">
              <button
                type="button"
                onClick={startRecording}
                className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#273142] text-white shadow-[0_18px_30px_rgba(39,49,66,0.16)]"
              >
                <Mic className="h-6 w-6" strokeWidth={2.2} />
              </button>
              <div className="mt-7">
                <ComposerBar
                  value=""
                  onSubmit={() => {}}
                  placeholder="증상, 약 복용, 운동 상태 등을 말씀해 주세요"
                  submitDisabled
                  readOnly
                />
              </div>
            </div>
          </div>
        </RecordShell>
      ) : null}

      {phase === "saved" ? (
        <div className="flex min-h-[100dvh] flex-col bg-[#EFF4FC] px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[150px] text-[#1F2733]">
          <div className="flex flex-1 flex-col items-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#3F69F6]">
              <Check className="h-9 w-9 text-white" strokeWidth={3} />
            </div>
            <h1 className="mt-10 text-center text-[22px] font-extrabold leading-[1.45] tracking-[-0.03em] text-[#273142]">
              오늘의 기록을 완료했어요
            </h1>
            <p className="mt-3 text-center text-[15px] font-medium tracking-[-0.02em] text-[#6F8EC9]">
              기록지를 확인하고 수정할 수 있어요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-6">
            <Link
              href="/home"
              className="flex h-[56px] items-center justify-center rounded-[14px] bg-[#A6B7D6] text-[16px] font-bold text-white"
            >
              홈으로
            </Link>
            <Link
              href={savedRecordId ? `/record/${savedRecordId}` : "/home"}
              className="flex h-[56px] items-center justify-center rounded-[14px] bg-[#3F69F6] text-[16px] font-bold text-white"
            >
              확인하기
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

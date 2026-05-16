"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2, X } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { getSubjectRecordLabel, useRecordStore } from "@/stores/recordStore";
import { useRoutineStore } from "@/stores/routineStore";

function isObjectIdLike(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

export default function RecordDetailPage({ params }) {
  const router = useRouter();
  const records = useRecordStore((state) => state.records);
  const updateRecordSections = useRecordStore((state) => state.updateRecordSections);
  const hydrateApiRecord = useRecordStore((state) => state.hydrateApiRecord);
  const routines = useRoutineStore((state) => state.routines);

  const record = useMemo(
    () => records.find((item) => item.id === params.recordId) ?? null,
    [params.recordId, records]
  );
  const linkedRoutine = useMemo(
    () =>
      record
        ? routines.find(
            (item) =>
              item.id === record.routineId ||
              item.backendRoutineId === record.backendRoutineId
          ) ?? null
        : null,
    [record, routines]
  );

  const [sections, setSections] = useState([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [sheetStep, setSheetStep] = useState("title");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [newSectionItems, setNewSectionItems] = useState([]);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionItems, setEditSectionItems] = useState([]);
  const [showDeleteSectionConfirm, setShowDeleteSectionConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const hasLocalDraftChangesRef = useRef(false);

  useEffect(() => {
    let ignore = false;

    async function loadRecord() {
      try {
        setPageError("");

        if (record && !hasLocalDraftChangesRef.current) {
          setSections(record.sections);
        }

        const backendRecordId =
          record?.backendId ||
          (isObjectIdLike(params.recordId) ? params.recordId : null);

        if (!backendRecordId) {
          if (!record && !ignore) {
            setPageError("기록을 찾을 수 없어요.");
          }
          return;
        }

        const response = await apiClient.get(`/records/${backendRecordId}`);
        const hydratedRecord = hydrateApiRecord({
          apiRecord: response.record,
          routine: linkedRoutine || record || null,
          transcript: record?.transcript || "",
        });

        if (!ignore && !hasLocalDraftChangesRef.current) {
          setSections(hydratedRecord.sections);
        }
      } catch (error) {
        if (!ignore && !record) {
          setPageError(error.message || "기록을 불러오지 못했어요.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadRecord();

    return () => {
      ignore = true;
    };
  }, [hydrateApiRecord, linkedRoutine, params.recordId, record]);

  if (isLoading && !record) {
    return (
      <div className="min-h-[100dvh] bg-[#EFF4FC] px-5 pt-[52px] text-[#1F2733]">
        <p className="mt-10 text-[18px] font-bold">기록을 불러오는 중이에요.</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-[100dvh] bg-[#EFF4FC] px-5 pt-[52px] text-[#1F2733]">
        <Link href="/home" className="inline-flex text-[#9FB1D5]">
          <ChevronLeft className="h-7 w-7" strokeWidth={2.4} />
        </Link>
        <p className="mt-10 text-[18px] font-bold">{pageError || "기록을 찾을 수 없어요."}</p>
      </div>
    );
  }

  const isTitleStep = sheetStep === "title";
  const canGoNext = newSectionTitle.trim().length > 0;
  const canAddContent = newSectionContent.trim().length > 0;
  const pendingNewSectionItems = [
    ...newSectionItems,
    ...(newSectionContent.trim() ? [newSectionContent.trim()] : []),
  ];
  const canSaveSection = pendingNewSectionItems.length > 0;
  const canSaveEditedSection =
    editSectionTitle.trim().length > 0 &&
    editSectionItems.some((item) => item.trim().length > 0);
  const hasPendingChanges =
    JSON.stringify(sections) !== JSON.stringify(record.sections);

  const resetSheet = () => {
    setShowAddSheet(false);
    setSheetStep("title");
    setNewSectionTitle("");
    setNewSectionContent("");
    setNewSectionItems([]);
  };

  const handleSheetNext = () => {
    if (!canGoNext) {
      return;
    }

    setSheetStep("content");
  };

  const handleSheetSave = () => {
    if (!canSaveSection) {
      return;
    }

    const nextSection = {
      id: `section-added-${Date.now()}`,
      title: newSectionTitle.trim(),
      items: pendingNewSectionItems,
    };

    hasLocalDraftChangesRef.current = true;
    setSections((current) => [nextSection, ...current]);
    resetSheet();
  };

  const handleAddContentItem = () => {
    if (!canAddContent) {
      return;
    }

    setNewSectionItems((current) => [...current, newSectionContent.trim()]);
    setNewSectionContent("");
  };

  const handleRemoveContentItem = (targetIndex) => {
    setNewSectionItems((current) =>
      current.filter((_, index) => index !== targetIndex)
    );
  };

  const handleRecordSave = async () => {
    if (isSaving) {
      return;
    }

    if (!record.backendId) {
      updateRecordSections(record.id, sections);
      hasLocalDraftChangesRef.current = false;
      router.push("/home");
      return;
    }

    try {
      setIsSaving(true);
      setPageError("");

      const response = await apiClient.put(`/records/${record.backendId}`, {
        sections,
      });

      hydrateApiRecord({
        apiRecord: response.record,
        routine: linkedRoutine || record,
        transcript: record.transcript || "",
      });
      hasLocalDraftChangesRef.current = false;
      router.push("/home");
    } catch (error) {
      setPageError(error.message || "기록 수정 중 문제가 생겼어요.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditSheet = (section) => {
    setEditingSectionId(section.id);
    setEditSectionTitle(section.title);
    setEditSectionItems(section.items);
    setShowDeleteSectionConfirm(false);
  };

  const closeEditSheet = () => {
    setEditingSectionId(null);
    setEditSectionTitle("");
    setEditSectionItems([]);
    setShowDeleteSectionConfirm(false);
  };

  const handleEditItemChange = (targetIndex, value) => {
    setEditSectionItems((current) =>
      current.map((item, index) => (index === targetIndex ? value : item))
    );
  };

  const handleAddEditItem = () => {
    setEditSectionItems((current) => [...current, ""]);
  };

  const handleRemoveEditItem = (targetIndex) => {
    setEditSectionItems((current) =>
      current.filter((_, index) => index !== targetIndex)
    );
  };

  const handleEditSheetSave = () => {
    if (!canSaveEditedSection || !editingSectionId) {
      return;
    }

    const cleanedItems = editSectionItems
      .map((item) => item.trim())
      .filter(Boolean);

    hasLocalDraftChangesRef.current = true;
    setSections((current) =>
      current.map((section) =>
        section.id === editingSectionId
          ? {
              ...section,
              title: editSectionTitle.trim(),
              items: cleanedItems,
            }
          : section
      )
    );
    closeEditSheet();
  };

  const handleDeleteSection = () => {
    if (!editingSectionId) {
      return;
    }

    hasLocalDraftChangesRef.current = true;
    setSections((current) =>
      current.filter((section) => section.id !== editingSectionId)
    );
    closeEditSheet();
  };

  return (
    <div className="min-h-[100dvh] bg-[#EFF4FC] px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-[52px] text-[#1F2733]">
      <div className="flex items-center justify-between">
        <div className="h-7 w-7" />
        <h1 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#273142]">오늘의 기록</h1>
        <Link href="/home" aria-label="닫기" className="text-[#9FB1D5]">
          <X className="h-6 w-6" strokeWidth={2.2} />
        </Link>
      </div>

      <div className="mt-6 rounded-[20px] border border-[#D4DEEF] bg-white px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: record.dotColor }}
          />
          <p className="text-[17px] font-bold tracking-[-0.02em] text-[#1F2733]">
            {record.diseaseName}
          </p>
          <span className="text-[13px] font-medium tracking-[-0.02em] text-[#8EA4D1]">
            {getSubjectRecordLabel(record.subjectName)}
          </span>
        </div>
        <p className="mt-2 text-[11px] font-medium tracking-[-0.02em] text-[#B0BED9]">
          {record.displayDate}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => openEditSheet(section)}
            className="w-full rounded-[20px] border border-[#D4DEEF] bg-white px-4 py-4 text-left transition active:border-[#4A6CF7] active:bg-[#DDE7FF]"
          >
            <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#1F2733]">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.items.map((item) => (
                <p
                  key={item}
                  className="pl-4 text-[14px] font-medium leading-[1.6] tracking-[-0.02em] text-[#273142] before:-ml-4 before:mr-2 before:inline-block before:content-['•']"
                >
                  {item}
                </p>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          disabled={isSaving}
          className="h-[56px] rounded-[14px] bg-[#A6B7D6] text-[17px] font-bold text-white"
        >
          추가하기
        </button>
        <button
          type="button"
          onClick={handleRecordSave}
          disabled={isSaving}
          className="h-[56px] rounded-[14px] bg-[#3F69F6] text-[17px] font-bold text-white disabled:bg-[#9DB5FA]"
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </button>
      </div>

      {hasPendingChanges ? (
        <p className="mt-3 text-center text-[13px] font-medium tracking-[-0.02em] text-[#7B91BA]">
          새 항목을 추가했어요. 저장하기를 누르면 기록지에 반영돼요.
        </p>
      ) : null}

      {pageError ? (
        <p className="mt-3 text-center text-[14px] font-medium tracking-[-0.02em] text-[#F25F5C]">
          {pageError}
        </p>
      ) : null}

      {showAddSheet ? (
        <div className="fixed inset-0 z-50 bg-[#273142]/24">
          <div className="absolute bottom-0 left-1/2 w-full max-w-[393px] -translate-x-1/2 rounded-t-[32px] bg-white px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-[#E9EEF6]" />
            <h2 className="mt-11 text-center text-[17px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
              {isTitleStep
                ? "추가할 항목명을 입력해 주세요"
                : "항목에 기록할 내용을 입력해 주세요"}
            </h2>

            {!isTitleStep && newSectionItems.length > 0 ? (
              <div className="mt-8 space-y-3">
                {newSectionItems.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="grid grid-cols-[12px_minmax(0,1fr)_16px] items-start gap-x-3 border-b border-[#E5EBF5] pb-3"
                  >
                    <span className="text-[15px] font-semibold leading-[1.6] text-[#273142]">
                      •
                    </span>
                    <p className="flex-1 whitespace-pre-wrap break-words text-[15px] font-medium leading-[1.6] tracking-[-0.02em] text-[#273142]">
                      {item}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveContentItem(index)}
                      aria-label={`${index + 1}번째 항목 삭제`}
                      className="mt-[2px] text-[#BCC8DB]"
                    >
                      <X className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-8 border-b-2 border-[#4A6CF7] pb-2">
              {isTitleStep ? (
                <input
                  value={newSectionTitle}
                  onChange={(event) => setNewSectionTitle(event.target.value)}
                  placeholder="ex. 운동 및 활동량"
                  className="w-full bg-transparent text-[15px] font-medium tracking-[-0.02em] text-[#273142] outline-none placeholder:text-[#BBC8DE]"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <textarea
                    value={newSectionContent}
                    onChange={(event) => setNewSectionContent(event.target.value)}
                    onInput={(event) => {
                      event.currentTarget.style.height = "28px";
                      event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                    }}
                    placeholder={
                      newSectionItems.length > 0
                        ? "내용을 추가로 입력해 주세요"
                        : "ex. 30분 정도 가벼운 산책을 했음."
                    }
                    rows={1}
                    className="min-h-[28px] flex-1 resize-none overflow-hidden bg-transparent text-[15px] font-medium leading-[1.6] tracking-[-0.02em] text-[#273142] outline-none placeholder:text-[#BBC8DE]"
                  />
                  <button
                    type="button"
                    onClick={handleAddContentItem}
                    disabled={!canAddContent}
                    aria-label="내용 항목 추가"
                    className={`flex h-5 w-5 shrink-0 translate-y-[1px] items-center justify-center rounded-full transition ${
                      canAddContent ? "bg-[#CDD7E9] text-white" : "bg-[#E3E9F4] text-white"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={resetSheet}
                className="h-[48px] rounded-full bg-[#E3EBF7] text-[17px] font-bold text-[#8EA4D1]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={isTitleStep ? handleSheetNext : handleSheetSave}
                disabled={isTitleStep ? !canGoNext : !canSaveSection}
                className={`h-[48px] rounded-full text-[17px] font-bold text-white transition ${
                  isTitleStep
                    ? canGoNext
                      ? "bg-[#3F69F6]"
                      : "bg-[#9DB5FA]"
                    : canSaveSection
                      ? "bg-[#3F69F6]"
                      : "bg-[#9DB5FA]"
                }`}
              >
                {isTitleStep ? "다음" : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingSectionId ? (
        <div className="fixed inset-0 z-50 bg-[#273142]/36">
          <div className="absolute bottom-0 left-1/2 w-full max-w-[393px] -translate-x-1/2 rounded-t-[32px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-[#E9EEF6]" />

            <div className="mt-8 rounded-[14px] bg-[#EFF4FF] px-4 py-3">
              <div className="flex items-center gap-3">
                <input
                  value={editSectionTitle}
                  onChange={(event) => setEditSectionTitle(event.target.value)}
                  className="flex-1 bg-transparent text-[17px] font-extrabold tracking-[-0.02em] text-[#1F2733] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowDeleteSectionConfirm(true)}
                  aria-label="항목 삭제"
                  className="text-[#AEBEDE]"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {editSectionItems.map((item, index) => (
                <div
                  key={`edit-item-${index}`}
                  className="rounded-[14px] bg-[#EFF4FF] px-4 py-3"
                >
                  <div className="grid grid-cols-[14px_minmax(0,1fr)_18px] items-start gap-x-3">
                    <span className="flex h-[22px] items-center justify-center text-[14px] font-semibold leading-none text-[#273142]">
                      •
                    </span>
                    <textarea
                      value={item}
                      onChange={(event) => handleEditItemChange(index, event.target.value)}
                      onInput={(event) => {
                        event.currentTarget.style.height = "26px";
                        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                      }}
                      rows={1}
                      className="min-h-[22px] w-full resize-none overflow-hidden bg-transparent text-[14px] font-medium leading-[22px] tracking-[-0.02em] text-[#273142] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEditItem(index)}
                      aria-label={`${index + 1}번째 상세 내용 삭제`}
                      className="flex h-[22px] items-center justify-center text-[#AEBEDE]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddEditItem}
              className="mt-4 flex items-center gap-2 text-[16px] font-medium tracking-[-0.02em] text-[#7C91BA]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E6EDF8]">
                <Plus className="h-4 w-4 text-[#5E79B0]" strokeWidth={2.6} />
              </span>
              기록 추가하기
            </button>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={closeEditSheet}
                className="h-[48px] rounded-full bg-[#E3EBF7] text-[17px] font-bold text-[#8EA4D1]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleEditSheetSave}
                disabled={!canSaveEditedSection}
                className={`h-[48px] rounded-full text-[17px] font-bold text-white transition ${
                  canSaveEditedSection ? "bg-[#3F69F6]" : "bg-[#9DB5FA]"
                }`}
              >
                저장
              </button>
            </div>
          </div>

          {showDeleteSectionConfirm ? (
            <div className="absolute inset-0 flex items-end justify-center bg-[#273142]/18">
              <div className="w-full max-w-[393px] rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-[#E9EEF6]" />
                <p className="mt-8 text-[22px] font-extrabold tracking-[-0.03em] text-[#1F2733]">
                  <span className="text-[#FF5E43]">{editSectionTitle}</span>{" "}
                  항목을 삭제하시겠어요?
                </p>
                <p className="mt-4 text-[15px] font-medium leading-[1.55] tracking-[-0.02em] text-[#7E92B8]">
                  항목에 있는 상세 내용도 함께 삭제돼요
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteSectionConfirm(false)}
                    className="h-[48px] rounded-full bg-[#E3EBF7] text-[17px] font-bold text-[#8EA4D1]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSection}
                    className="h-[48px] rounded-full bg-[#FF6A4F] text-[17px] font-bold text-white"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

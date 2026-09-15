"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createReport, getMyReportStatus } from "@/lib/api/reports";
import { ApiError } from "@/lib/api/axios";
import { REPORT_REASONS, type ReportReasonType, type ReportTargetType } from "@/types/api/report";

const MAX_REASON_LENGTH = 500;

const TITLE: Record<ReportTargetType, string> = {
  POST: "게시물 신고",
  COMMENT: "댓글 신고",
  USER: "사용자 신고",
};

const ALREADY_REPORTED: Record<ReportTargetType, string> = {
  POST: "이미 신고한 게시물이에요.",
  COMMENT: "이미 신고한 댓글이에요.",
  USER: "이미 신고한 사용자예요.",
};

const GONE: Record<ReportTargetType, string> = {
  POST: "이미 삭제된 게시물이에요.",
  COMMENT: "이미 삭제된 댓글이에요.",
  USER: "탈퇴한 사용자예요.",
};

export default function ReportSheet({
  targetType,
  targetId,
  onClose,
}: {
  targetType: ReportTargetType;
  targetId: number;
  onClose: () => void;
}) {
  // 이미 신고한 대상이면 사유를 다시 고르게 하지 않는다. 확인이 끝나기 전에는 사유를 보여주지 않는다.
  const [checked, setChecked] = useState(false);
  const [reasonType, setReasonType] = useState<ReportReasonType | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 부모가 매번 새 함수를 넘겨도 확인 요청을 다시 보내지 않게 최신 값만 들고 있는다.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let cancelled = false;
    getMyReportStatus(targetType, targetId)
      .then((res) => {
        if (cancelled) return;
        if (res.reported) {
          toast.info(ALREADY_REPORTED[targetType]);
          onCloseRef.current();
          return;
        }
        setChecked(true);
      })
      .catch(() => {
        // 확인에 실패해도 신고는 막지 않는다. 중복이면 제출할 때 서버가 409 로 알려준다.
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  const needsDetail = reasonType === "OTHER";
  const canSubmit =
    checked && reasonType != null && (!needsDetail || reason.trim().length > 0) && !submitting;

  async function submit() {
    if (!canSubmit || reasonType == null) return;
    setSubmitting(true);
    try {
      await createReport({ targetType, targetId, reasonType, reason: reason.trim() || undefined });
      toast.success("신고를 접수했어요. 확인 후 조치할게요.");
      onClose();
    } catch (err) {
      // 같은 대상을 두 번 누른 경우와 그 사이 지워진 경우는 실패가 아니다. 안내하고 닫는다.
      if (err instanceof ApiError && err.payload.code === "ALREADY_REPORTED") {
        toast.info(ALREADY_REPORTED[targetType]);
        onClose();
      } else if (err instanceof ApiError && err.payload.code === "CANNOT_REPORT_OWN_TARGET") {
        toast.error("내 글이나 나 자신은 신고할 수 없어요.");
        onClose();
      } else if (err instanceof ApiError && err.status === 404) {
        toast.error(GONE[targetType]);
        onClose();
      } else {
        toast.error("신고하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // body 에 붙인다. 피드 모달처럼 transform 이 걸린 부모 안에서는 fixed 가 화면이 아니라 부모 기준이 된다.
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={TITLE[targetType]}
        className="flex w-full max-w-md flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]"
        style={{ maxHeight: "85dvh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b px-4 py-3">
          <h3 className="flex-1 text-base font-bold">{TITLE[targetType]}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        {!checked ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-red-500" />
            <p className="text-sm text-zinc-400">신고 내역을 확인하는 중...</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-sm text-zinc-500">신고 사유를 골라주세요. 신고 내용은 운영자만 확인해요.</p>

              <ul className="mt-3 flex flex-col gap-1">
                {REPORT_REASONS.map((option) => {
                  const selected = reasonType === option.value;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => setReasonType(option.value)}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                          selected ? "bg-red-50 font-semibold text-red-600" : "text-zinc-800 hover:bg-zinc-50"
                        }`}
                      >
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                            selected ? "border-red-500" : "border-zinc-300"
                          }`}
                        >
                          {selected && <span className="size-2.5 rounded-full bg-red-500" />}
                        </span>
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {reasonType != null && (
                <div className="mt-3">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
                    rows={3}
                    placeholder={needsDetail ? "어떤 문제인지 적어주세요 (필수)" : "더 알릴 내용이 있으면 적어주세요 (선택)"}
                    className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-red-400"
                  />
                  <p className="mt-1 text-right text-xs text-zinc-400">
                    {reason.length}/{MAX_REASON_LENGTH}
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              >
                {submitting ? "신고하는 중..." : "신고하기"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { scheduleV2Mode } from "@/lib/api/config";
import type { SchedulePreview, TripDraftState } from "@/types/api/schedule-preview";

export const TRIP_DRAFT_STORAGE_KEY = `tour:trip-draft:v2:${scheduleV2Mode}`;

const INITIAL_DRAFT: TripDraftState = {
  lodgingPlan: { mode: "UNDECIDED" },
  selectedAnswers: [],
  mustVisitPlaceIds: [],
  selectedPlaces: [],
  fixedEvents: [],
  dayOverrides: [],
};

type TripDraftContextValue = {
  draft: TripDraftState;
  hydrated: boolean;
  updateDraft: (patch: Partial<TripDraftState>) => void;
  setAnswer: (questionId: string, answerIds: string[]) => void;
  setPreview: (preview: SchedulePreview) => void;
  setIdempotencyKey: (key: string) => void;
  resetDraft: () => void;
};

const TripDraftContext = createContext<TripDraftContextValue | null>(null);

function invalidatePreview(draft: TripDraftState): TripDraftState {
  const next = { ...draft };
  delete next.previewId;
  delete next.previewExpiresAt;
  delete next.idempotencyKey;
  return next;
}

export function TripDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<TripDraftState>(INITIAL_DRAFT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = sessionStorage.getItem(TRIP_DRAFT_STORAGE_KEY);
      if (stored) {
        try {
          setDraft({ ...INITIAL_DRAFT, ...(JSON.parse(stored) as TripDraftState) });
        } catch {
          sessionStorage.removeItem(TRIP_DRAFT_STORAGE_KEY);
        }
      }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(TRIP_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  const updateDraft = useCallback((patch: Partial<TripDraftState>) => {
    setDraft((current) => invalidatePreview({ ...current, ...patch }));
  }, []);

  const setAnswer = useCallback((questionId: string, answerIds: string[]) => {
    setDraft((current) => {
      const selectedAnswers = current.selectedAnswers.filter(
        (answer) => answer.questionId !== questionId,
      );
      if (answerIds.length > 0) selectedAnswers.push({ questionId, answerIds });
      return invalidatePreview({ ...current, selectedAnswers });
    });
  }, []);

  const setPreview = useCallback((preview: SchedulePreview) => {
    setDraft((current) => ({
      ...current,
      previewId: preview.previewId,
      previewExpiresAt: preview.expiresAt,
      idempotencyKey: undefined,
    }));
  }, []);

  const setIdempotencyKey = useCallback((key: string) => {
    setDraft((current) => ({ ...current, idempotencyKey: key }));
  }, []);

  const resetDraft = useCallback(() => {
    sessionStorage.removeItem(TRIP_DRAFT_STORAGE_KEY);
    setDraft(INITIAL_DRAFT);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      hydrated,
      updateDraft,
      setAnswer,
      setPreview,
      setIdempotencyKey,
      resetDraft,
    }),
    [draft, hydrated, resetDraft, setAnswer, setIdempotencyKey, setPreview, updateDraft],
  );

  return (
    <TripDraftContext.Provider value={value}>
      {children}
    </TripDraftContext.Provider>
  );
}

export function useTripDraft() {
  const context = useContext(TripDraftContext);
  if (!context) throw new Error("useTripDraft must be used inside TripDraftProvider");
  return context;
}

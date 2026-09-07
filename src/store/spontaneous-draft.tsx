"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  StartLocationItem,
  DestinationsRequest,
  Destination,
  CourseResponse,
} from "@/types/api/spontaneous-trip";

const STORAGE_KEY = "tour:spontaneous-draft:v1";

type SpontaneousDraft = {
  startLocation: StartLocationItem | null;
  conditions: Omit<DestinationsRequest, "startLocation"> | null;
  destinations: Destination[] | null;
  selectedDestinationId: string | null;
  course: CourseResponse | null;
};

const INITIAL_DRAFT: SpontaneousDraft = {
  startLocation: null,
  conditions: null,
  destinations: null,
  selectedDestinationId: null,
  course: null,
};

type SpontaneousDraftContextValue = {
  draft: SpontaneousDraft;
  hydrated: boolean;
  setStartLocation: (location: StartLocationItem) => void;
  setConditions: (conditions: Omit<DestinationsRequest, "startLocation">) => void;
  setDestinations: (destinations: Destination[]) => void;
  setSelectedDestinationId: (id: string) => void;
  setCourse: (course: CourseResponse) => void;
  resetDraft: () => void;
};

const SpontaneousDraftContext = createContext<SpontaneousDraftContextValue | null>(null);

export function SpontaneousDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SpontaneousDraft>(INITIAL_DRAFT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDraft(JSON.parse(stored) as SpontaneousDraft);
      }
    } catch {
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
    }
  }, [draft, hydrated]);

  const setStartLocation = useCallback((location: StartLocationItem) => {
    setDraft((prev) => ({
      ...prev,
      startLocation: location,
      conditions: null,
      destinations: null,
      selectedDestinationId: null,
      course: null,
    }));
  }, []);

  const setConditions = useCallback((conditions: Omit<DestinationsRequest, "startLocation">) => {
    setDraft((prev) => ({
      ...prev,
      conditions,
      destinations: null,
      selectedDestinationId: null,
      course: null,
    }));
  }, []);

  const setDestinations = useCallback((destinations: Destination[]) => {
    setDraft((prev) => ({ ...prev, destinations }));
  }, []);

  const setSelectedDestinationId = useCallback((id: string) => {
    setDraft((prev) => ({ ...prev, selectedDestinationId: id, course: null }));
  }, []);

  const setCourse = useCallback((course: CourseResponse) => {
    setDraft((prev) => ({ ...prev, course }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(INITIAL_DRAFT);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }, []);

  const value = useMemo(
    () => ({
      draft,
      hydrated,
      setStartLocation,
      setConditions,
      setDestinations,
      setSelectedDestinationId,
      setCourse,
      resetDraft,
    }),
    [draft, hydrated, setStartLocation, setConditions, setDestinations, setSelectedDestinationId, setCourse, resetDraft],
  );

  return (
    <SpontaneousDraftContext.Provider value={value}>
      {children}
    </SpontaneousDraftContext.Provider>
  );
}

export function useSpontaneousDraft() {
  const ctx = useContext(SpontaneousDraftContext);
  if (!ctx) throw new Error("useSpontaneousDraft must be used within SpontaneousDraftProvider");
  return ctx;
}

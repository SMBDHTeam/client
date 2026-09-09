"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ImagePlus, X, ChevronRight, MapPin, ChevronDown } from "lucide-react";
import { COMMUNITY_TAGS, type CommunityTagId } from "@/mocks/community-tags";
import { createPost, uploadMedia } from "@/lib/api/posts";
import { getSchedules, getSchedule } from "@/lib/api/schedules";
import { searchPlaces, resolvePlace } from "@/lib/api/places";
import NaverMap from "@/components/map/NaverMap";
import { placeCategoryLabel } from "@/utils/place-category";
import type { ScheduleSummary, ScheduleResponse, SchedulePlace } from "@/types/api/schedule";
import type { PlaceSearchItem } from "@/types/api/place";
import { toast } from "sonner";

type SelectedPlace = {
  placeId: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

function formatDuration(dayCount: number) {
  if (dayCount <= 1) return "당일";
  return `${dayCount - 1}박${dayCount}일`;
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const startLabel = `${start.getMonth() + 1}.${start.getDate()}`;
  if (startDate === endDate) return startLabel;
  const end = new Date(`${endDate}T00:00:00`);
  return `${startLabel} - ${end.getMonth() + 1}.${end.getDate()}`;
}

function searchItemKey(item: PlaceSearchItem) {
  return item.placeId !== null ? `place:${item.placeId}` : `${item.source}:${item.externalId}`;
}

export default function CommunityNewPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaItems, setMediaItems] = useState<{ file: File; previewUrl: string }[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<CommunityTagId[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<"idle" | "trip" | "place">("idle");
  const [pickerTab, setPickerTab] = useState<"trip" | "search">("trip");

  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleSummary | null>(null);
  const [scheduleDetail, setScheduleDetail] = useState<ScheduleResponse | null>(null);
  const [scheduleDetailLoading, setScheduleDetailLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const [activeSearchPlace, setActiveSearchPlace] = useState<PlaceSearchItem | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);

  useEffect(() => {
    getSchedules()
      .then((res) => setSchedules(res.items))
      .catch(() => setSchedules([]))
      .finally(() => setSchedulesLoading(false));
  }, []);

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (keyword.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchPlaces(keyword, controller.signal);
        if (!controller.signal.aborted) setSearchResults(res.items);
      } catch {
        if (!controller.signal.aborted) setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const places = useMemo(() => {
    if (!scheduleDetail) return [];
    const map = new Map<number, SchedulePlace>();
    scheduleDetail.days.forEach((day) => day.stops.forEach((stop) => map.set(stop.place.id, stop.place)));
    return Array.from(map.values());
  }, [scheduleDetail]);

  function toggleTag(id: CommunityTagId) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newItems: { file: File; previewUrl: string }[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
      newItems.push({ file, previewUrl: URL.createObjectURL(file) });
    });
    setMediaItems((prev) => [...prev, ...newItems].slice(0, 10));
  }

  function removeMedia(index: number) {
    setMediaItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      const next = prev.filter((_, i) => i !== index);
      setImgIndex((cur) => Math.min(cur, Math.max(next.length - 1, 0)));
      return next;
    });
  }

  function openPicker() {
    setPickerTab("trip");
    setStep("trip");
  }

  function pickTrip(schedule: ScheduleSummary) {
    setSelectedSchedule(schedule);
    setStep("place");
    setScheduleDetailLoading(true);
    getSchedule(schedule.id)
      .then(setScheduleDetail)
      .catch(() => setScheduleDetail(null))
      .finally(() => setScheduleDetailLoading(false));
  }

  function pickPlace(place: SchedulePlace) {
    setSelectedPlace({
      placeId: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setStep("idle");
  }

  function focusSearchPlace(item: PlaceSearchItem) {
    setActiveSearchPlace(item);
    setMapCenter({ lat: item.latitude, lng: item.longitude });
  }

  async function selectSearchPlace(item: PlaceSearchItem) {
    const key = searchItemKey(item);
    setResolvingKey(key);
    try {
      const resolved = item.placeId !== null && item.resolved ? item : await resolvePlace(item);
      if (resolved.placeId == null) throw new Error("장소를 확인하지 못했어요.");
      setSelectedPlace({
        placeId: resolved.placeId,
        name: resolved.name,
        address: resolved.address ?? null,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      });
      setStep("idle");
    } catch {
      toast.error("장소를 선택하지 못했어요. 다시 시도해주세요.");
    } finally {
      setResolvingKey(null);
    }
  }

  function clearLocation() {
    setSelectedSchedule(null);
    setScheduleDetail(null);
    setSelectedPlace(null);
    setStep("idle");
  }

  const canSubmit = text.trim().length > 0 && mediaItems.length > 0 && !submitting;

  async function handleSubmit() {
    if (submitting || !session?.user?.id) return;
    if (mediaItems.length === 0) {
      toast.error("사진이나 동영상을 1개 이상 추가해주세요.");
      return;
    }
    if (text.trim().length === 0) {
      toast.error("게시글 내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await uploadMedia(mediaItems.map((item) => item.file));
      await createPost({
        content: text.trim(),
        mediaList: uploaded.map((m, i) => ({ url: m.url, mediaType: m.mediaType, sortOrder: i })),
        placeTags: selectedPlace
          ? [{ placeId: selectedPlace.placeId, latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }]
          : [],
        categories: selectedTags.map((id) => COMMUNITY_TAGS.find((t) => t.id === id)!.label),
      });
      router.back();
    } catch {
      toast.error("게시물을 등록하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            if (step === "place") { setStep("trip"); return; }
            if (step === "trip") { setStep("idle"); return; }
            router.back();
          }}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">
          {step === "trip" ? "장소 태그" : step === "place" ? "장소 선택" : "새 게시물"}
        </h1>
        <button
          type="button"
          disabled={!canSubmit || step !== "idle"}
          onClick={handleSubmit}
          className="rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] px-4 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {submitting ? "게시 중..." : "게시"}
        </button>
      </header>

      {/* 장소 태그 시트: 내 일정 / 장소 검색 탭 */}
      {step === "trip" && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-4 mt-4 flex gap-1 rounded-full bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setPickerTab("trip")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                pickerTab === "trip" ? "bg-white text-[#2E7DF2] shadow-sm" : "text-zinc-400"
              }`}
            >
              내 일정에서
            </button>
            <button
              type="button"
              onClick={() => setPickerTab("search")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                pickerTab === "search" ? "bg-white text-[#2E7DF2] shadow-sm" : "text-zinc-400"
              }`}
            >
              장소 검색
            </button>
          </div>

          {pickerTab === "trip" ? (
            schedulesLoading ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <div className="size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-[#2E7DF2]" />
              </div>
            ) : schedules.length === 0 ? (
              <p className="px-4 py-16 text-center text-sm text-zinc-400">아직 만든 일정이 없어요</p>
            ) : (
              <>
                <p className="px-4 pt-4 pb-2 text-xs text-zinc-400">내 일정에서 선택하세요</p>
                <ul className="flex flex-col divide-y divide-zinc-100">
                  {schedules.map((schedule) => (
                    <li key={schedule.id}>
                      <button
                        type="button"
                        onClick={() => pickTrip(schedule)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50"
                      >
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-[10px] font-bold text-white">
                          {formatDuration(schedule.dayCount)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{schedule.styleSummary}</p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {formatDateRange(schedule.startDate, schedule.endDate)} · {schedule.stopCount}곳
                          </p>
                        </div>
                        <ChevronDown size={16} className="-rotate-90 shrink-0 text-zinc-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )
          ) : (
            <div className="flex flex-1 flex-col px-4 pt-4">
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5">
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length < 2) setSearchResults([]);
                  }}
                  placeholder="가고 싶은 장소를 검색해보세요"
                  className="w-full text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
                />
              </div>

              <div className="relative mt-3 h-[min(16rem,32dvh)] w-full shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5">
                <NaverMap
                  center={mapCenter}
                  zoom={activeSearchPlace ? 17 : undefined}
                  place={
                    activeSearchPlace
                      ? {
                          name: activeSearchPlace.name,
                          tag: `${activeSearchPlace.categoryLabel || placeCategoryLabel(activeSearchPlace.category)} · ${activeSearchPlace.address ?? ""}`,
                          alreadyAdded:
                            selectedPlace != null &&
                            activeSearchPlace.placeId != null &&
                            selectedPlace.placeId === activeSearchPlace.placeId,
                        }
                      : null
                  }
                  onAddPlace={() => activeSearchPlace && void selectSearchPlace(activeSearchPlace)}
                  className="h-full w-full"
                />
              </div>

              <ul className="mt-2 flex flex-col divide-y divide-zinc-100">
                {searchLoading && (
                  <p className="py-8 text-center text-sm text-zinc-400">검색 중...</p>
                )}
                {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="py-8 text-center text-sm text-zinc-400">검색 결과가 없어요</p>
                )}
                {!searchLoading && searchResults.map((item) => {
                  const key = searchItemKey(item);
                  const resolving = resolvingKey === key;
                  return (
                    <li key={key} className="flex w-full items-center gap-3 py-3.5">
                      <button
                        type="button"
                        onClick={() => focusSearchPlace(item)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-[#2E7DF2]">
                          <MapPin size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="mt-0.5 truncate text-xs text-zinc-400">
                            {item.categoryLabel || placeCategoryLabel(item.category)}{item.address ? ` · ${item.address}` : ""}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectSearchPlace(item)}
                        disabled={Boolean(resolvingKey)}
                        className="shrink-0 rounded-full bg-[#EAF2FE] px-3 py-1.5 text-xs font-semibold text-[#2E7DF2] disabled:opacity-50"
                      >
                        {resolving ? "확인 중" : "선택"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 장소 선택 시트 */}
      {step === "place" && selectedSchedule && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <p className="px-4 pt-4 pb-2 text-xs text-zinc-400">
            <span className="font-medium text-zinc-700">{selectedSchedule.styleSummary}</span>의 장소를 선택하세요
          </p>
          {scheduleDetailLoading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <div className="size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-[#2E7DF2]" />
            </div>
          ) : places.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-zinc-400">등록된 장소가 없어요</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100">
              {places.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => pickPlace(place)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-[#2E7DF2]">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{place.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{place.address}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 메인 작성 화면 */}
      {step === "idle" && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {mediaItems.length > 0 ? (
            <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
              <div
                className="flex h-full transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${imgIndex * 100}%)` }}
              >
                {mediaItems.map((item, i) => (
                  item.file.type.startsWith("video/") ? (
                    <video key={i} src={item.previewUrl} className="h-full w-full shrink-0 object-cover" muted controls />
                  ) : (
                    <img key={i} src={item.previewUrl} alt="" className="h-full w-full shrink-0 object-cover" />
                  )
                ))}
              </div>

              <button
                type="button"
                onClick={() => removeMedia(imgIndex)}
                className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-black/50 text-white"
              >
                <X size={14} />
              </button>

              {imgIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setImgIndex((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/80 text-zinc-800 shadow"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              {imgIndex < mediaItems.length - 1 && (
                <button
                  type="button"
                  onClick={() => setImgIndex((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/80 text-zinc-800 shadow"
                >
                  <ChevronRight size={16} />
                </button>
              )}

              {mediaItems.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                  {mediaItems.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIndex(i)}
                      className={`size-1.5 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              )}

              {mediaItems.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <ImagePlus size={13} />
                  {mediaItems.length}/10
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-4 mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-zinc-400 transition-colors hover:border-[#2E7DF2]/40 hover:bg-blue-50/30"
            >
              <ImagePlus size={32} strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-sm font-medium">사진·동영상 추가</p>
                <p className="mt-0.5 text-xs text-zinc-400">1개 이상, 최대 10개</p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col gap-4 px-4 py-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="여행 후기를 남겨보세요..."
              rows={5}
              className="w-full resize-none text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            />

            <div className="h-px bg-zinc-100" />

            {/* 태그 */}
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">태그 선택 (복수 가능)</p>
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        active ? "bg-[#2E7DF2] text-white" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-zinc-100" />

            {/* 장소 */}
            <div className="flex items-center gap-2">
              <MapPin size={15} className={`shrink-0 ${selectedPlace ? "text-[#2E7DF2]" : "text-zinc-400"}`} />
              {selectedPlace ? (
                <div className="flex flex-1 items-center justify-between">
                  <button type="button" onClick={openPicker} className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-zinc-800">{selectedPlace.name}</p>
                    {selectedPlace.address && <p className="text-xs text-zinc-400">{selectedPlace.address}</p>}
                  </button>
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={openPicker} className="text-sm text-zinc-400">
                  내 일정에서 장소 태그
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

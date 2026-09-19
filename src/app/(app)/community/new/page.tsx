"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import heic2any from "heic2any";
import { ChevronLeft, ImagePlus, X, ChevronRight, MapPin, ChevronDown, Check } from "lucide-react";
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

const MAX_MEDIA_COUNT = 10;
const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024;
const MAX_MEDIA_TOTAL_SIZE = 50 * 1024 * 1024;
const HEIC_CONVERT_QUALITY = 0.85;
const SUPPORTED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
]);
const UNSUPPORTED_HEIC_TYPES = new Set(["image/heic", "image/heif"]);
const SUPPORTED_MEDIA_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  ".heic",
  ".heif",
  "video/mp4",
  "video/quicktime",
].join(",");

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

function formatMegabytes(bytes: number) {
  return `${Math.floor(bytes / 1024 / 1024)}MB`;
}

function fileExtension(file: File) {
  const filename = file.name.toLowerCase();
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex < 0 ? "" : filename.slice(dotIndex + 1);
}

function isHeicFile(file: File) {
  const extension = fileExtension(file);
  return UNSUPPORTED_HEIC_TYPES.has(file.type) || extension === "heic" || extension === "heif";
}

function isSupportedMediaFile(file: File) {
  if (SUPPORTED_MEDIA_TYPES.has(file.type)) return true;

  // 일부 모바일 브라우저는 카메라롤 파일의 MIME 타입을 비워서 넘긴다.
  if (file.type !== "") return false;
  return ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"].includes(fileExtension(file));
}

function moveArrayItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

async function convertHeicToJpeg(file: File) {
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: HEIC_CONVERT_QUALITY,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const filename = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], filename === file.name ? `${file.name}.jpg` : filename, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
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
  const [mediaProcessing, setMediaProcessing] = useState(false);

  const [step, setStep] = useState<"idle" | "photos" | "trip" | "place">("idle");
  const [pickerTab, setPickerTab] = useState<"trip" | "search">("trip");
  const [pickerSelection, setPickerSelection] = useState<Set<number>>(new Set());

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

  const [mediaPlaces, setMediaPlaces] = useState<(SelectedPlace | null)[]>([]);

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

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const newItems: { file: File; previewUrl: string }[] = [];
    const rejectedReasons = new Set<
      "type" | "convertFailed" | "convertedFileSize" | "count" | "fileSize" | "totalSize"
    >();
    let nextTotalSize = mediaItems.reduce((sum, item) => sum + item.file.size, 0);
    let nextCount = mediaItems.length;
    let convertedCount = 0;

    setMediaProcessing(true);
    for (const selectedFile of Array.from(files)) {
      let file = selectedFile;
      if (isHeicFile(file)) {
        try {
          file = await convertHeicToJpeg(file);
          convertedCount += 1;
        } catch {
          rejectedReasons.add("convertFailed");
          continue;
        }
        if (file.size > MAX_MEDIA_FILE_SIZE) {
          rejectedReasons.add("convertedFileSize");
          continue;
        }
      }
      if (!isSupportedMediaFile(file)) {
        rejectedReasons.add("type");
        continue;
      }
      if (file.size > MAX_MEDIA_FILE_SIZE) {
        rejectedReasons.add("fileSize");
        continue;
      }
      if (nextCount >= MAX_MEDIA_COUNT) {
        rejectedReasons.add("count");
        continue;
      }
      if (nextTotalSize + file.size > MAX_MEDIA_TOTAL_SIZE) {
        rejectedReasons.add("totalSize");
        continue;
      }

      newItems.push({ file, previewUrl: URL.createObjectURL(file) });
      nextTotalSize += file.size;
      nextCount += 1;
    }
    setMediaProcessing(false);

    if (rejectedReasons.has("convertFailed")) {
      toast.error("HEIC/HEIF 사진을 JPG로 변환하지 못했어요. JPG, PNG, WEBP 형식으로 다시 올려주세요.");
    } else if (rejectedReasons.has("convertedFileSize")) {
      toast.error(`변환 후 파일이 ${formatMegabytes(MAX_MEDIA_FILE_SIZE)}를 넘어 업로드할 수 없어요.`);
    } else if (rejectedReasons.has("type")) {
      toast.error("JPG, PNG, GIF, WEBP, MP4, MOV 파일만 업로드할 수 있어요.");
    } else if (rejectedReasons.has("fileSize")) {
      toast.error(`파일은 1개당 최대 ${formatMegabytes(MAX_MEDIA_FILE_SIZE)}까지 업로드할 수 있어요.`);
    } else if (rejectedReasons.has("totalSize")) {
      toast.error(`한 게시글에는 최대 ${formatMegabytes(MAX_MEDIA_TOTAL_SIZE)}까지 첨부할 수 있어요.`);
    } else if (rejectedReasons.has("count")) {
      toast.error(`사진이나 동영상은 최대 ${MAX_MEDIA_COUNT}개까지 첨부할 수 있어요.`);
    }

    if (newItems.length > 0) {
      setMediaItems((prev) => [...prev, ...newItems]);
      setMediaPlaces((prev) => [...prev, ...newItems.map(() => null)]);
      if (convertedCount > 0) {
        toast.success("HEIC/HEIF 사진을 JPG로 변환했어요.");
      }
    }
  }

  function removeMedia(index: number) {
    setMediaItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      const next = prev.filter((_, i) => i !== index);
      setImgIndex((cur) => Math.min(cur, Math.max(next.length - 1, 0)));
      return next;
    });
    setMediaPlaces((prev) => prev.filter((_, i) => i !== index));
    setPickerSelection((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  function moveMedia(from: number, to: number) {
    if (to < 0 || to >= mediaItems.length || from === to) return;
    setMediaItems((prev) => moveArrayItem(prev, from, to));
    setMediaPlaces((prev) => moveArrayItem(prev, from, to));
    setImgIndex(to);
  }

  function togglePhotoSelection(index: number) {
    setPickerSelection((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function openPhotoTagger() {
    setPickerSelection(new Set());
    setStep("photos");
  }

  function openPicker() {
    setPickerTab("trip");
    setStep("trip");
  }

  function applyPlaceToSelection(place: SelectedPlace) {
    setMediaPlaces((prev) => prev.map((p, i) => (pickerSelection.has(i) ? place : p)));
    setPickerSelection(new Set());
    setStep("photos");
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
    applyPlaceToSelection({
      placeId: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
    });
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
      applyPlaceToSelection({
        placeId: resolved.placeId,
        name: resolved.name,
        address: resolved.address ?? null,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      });
    } catch {
      toast.error("장소를 선택하지 못했어요. 다시 시도해주세요.");
    } finally {
      setResolvingKey(null);
    }
  }

  function clearPhotoPlace(index: number) {
    setMediaPlaces((prev) => prev.map((p, i) => (i === index ? null : p)));
  }

  const canSubmit = text.trim().length > 0 && mediaItems.length > 0 && !submitting && !mediaProcessing;
  const taggedPhotoCount = mediaPlaces.filter(Boolean).length;

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
        mediaList: uploaded.map((m, i) => ({
          url: m.url,
          mediaType: m.mediaType,
          sortOrder: i,
          placeId: mediaPlaces[i]?.placeId ?? null,
        })),
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
            if (step === "trip") { setStep("photos"); return; }
            if (step === "photos") { setStep("idle"); return; }
            router.back();
          }}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">
          {step === "photos"
            ? "사진 선택"
            : step === "trip"
              ? "장소 태그"
              : step === "place"
                ? "장소 선택"
                : "새 게시물"}
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

      {step === "photos" && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs text-zinc-400">
              장소를 태그할 사진을 선택하세요
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">태그하지 않아도 게시할 수 있어요</p>
          </div>
          <div className="grid grid-cols-3 gap-0.5 px-0.5">
            {mediaItems.map((item, index) => {
              const taggedPlace = mediaPlaces[index];
              const selected = pickerSelection.has(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => togglePhotoSelection(index)}
                  className="relative aspect-square overflow-hidden bg-zinc-100"
                >
                  {item.file.type.startsWith("video/") ? (
                    <video src={item.previewUrl} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  )}
                  <div
                    className={`absolute inset-0 transition-colors ${selected ? "bg-[#2E7DF2]/25" : "bg-black/0"}`}
                  />

                  {taggedPlace && (
                    <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-[#17B89B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Check size={10} strokeWidth={3} />
                      완료
                    </div>
                  )}

                  <div
                    className={`absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full border-2 ${
                      selected ? "border-[#2E7DF2] bg-[#2E7DF2] text-white" : "border-white bg-black/20 text-transparent"
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>

                  {taggedPlace && (
                    <p className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-1 text-center text-[10px] font-medium text-white">
                      {taggedPlace.name}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-auto flex items-center gap-2 border-t border-zinc-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-zinc-500"
            >
              완료
            </button>
            <button
              type="button"
              disabled={pickerSelection.size === 0}
              onClick={openPicker}
              className="flex-1 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              장소 선택 ({pickerSelection.size})
            </button>
          </div>
        </div>
      )}

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
                          alreadyAdded: false,
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
                    <img key={i} src={item.previewUrl} alt="" className="h-full w-full shrink-0 object-contain bg-black" />
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

              {mediaItems.length > 1 && (
                <div className="absolute left-3 top-3 flex gap-1">
                  <button
                    type="button"
                    disabled={imgIndex === 0}
                    onClick={() => moveMedia(imgIndex, imgIndex - 1)}
                    className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-30"
                  >
                    앞으로
                  </button>
                  <button
                    type="button"
                    disabled={imgIndex === mediaItems.length - 1}
                    onClick={() => moveMedia(imgIndex, imgIndex + 1)}
                    className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-30"
                  >
                    뒤로
                  </button>
                </div>
              )}

              {mediaPlaces[imgIndex] && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/55 py-1 pl-2.5 pr-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
                  <MapPin size={12} className="shrink-0" />
                  <span className="max-w-32 truncate">{mediaPlaces[imgIndex]!.name}</span>
                  <button
                    type="button"
                    onClick={() => clearPhotoPlace(imgIndex)}
                    className="grid size-4 shrink-0 place-items-center rounded-full hover:bg-white/20"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

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

              {mediaItems.length < MAX_MEDIA_COUNT && (
                <button
                  type="button"
                  disabled={mediaProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <ImagePlus size={13} />
                  {mediaProcessing ? "변환 중" : `${mediaItems.length}/${MAX_MEDIA_COUNT}`}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={mediaProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="mx-4 mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-zinc-400 transition-colors hover:border-[#2E7DF2]/40 hover:bg-blue-50/30 disabled:opacity-60"
            >
              <ImagePlus size={32} strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-sm font-medium">{mediaProcessing ? "사진 변환 중..." : "사진·동영상 추가"}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  1개 이상, 최대 {MAX_MEDIA_COUNT}개 · 파일당 {formatMegabytes(MAX_MEDIA_FILE_SIZE)}
                </p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_MEDIA_ACCEPT}
            multiple
            disabled={mediaProcessing}
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
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

            {mediaItems.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin size={15} className={`shrink-0 ${taggedPhotoCount > 0 ? "text-[#2E7DF2]" : "text-zinc-400"}`} />
                <button type="button" onClick={openPhotoTagger} className="text-sm text-zinc-500">
                  {taggedPhotoCount > 0
                    ? `사진별 장소 태그 (${taggedPhotoCount}/${mediaItems.length}장)`
                    : "사진별로 장소 태그"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

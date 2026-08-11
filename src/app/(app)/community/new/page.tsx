"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus, X, ChevronRight, MapPin, ChevronDown } from "lucide-react";
import { ALL_TRIPS, PAST_TRIPS, type MockPlace, type MockTrip } from "@/mocks/trips";
import { COMMUNITY_TAGS, type CommunityTagId } from "@/mocks/community-tags";

const ALL = [...ALL_TRIPS, ...PAST_TRIPS];

export default function CommunityNewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<CommunityTagId[]>([]);

  const [step, setStep] = useState<"idle" | "trip" | "place">("idle");
  const [selectedTrip, setSelectedTrip] = useState<MockTrip | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MockPlace | null>(null);

  function toggleTag(id: CommunityTagId) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      newUrls.push(URL.createObjectURL(file));
    });
    setImages((prev) => [...prev, ...newUrls].slice(0, 10));
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setImgIndex((cur) => Math.min(cur, Math.max(next.length - 1, 0)));
      return next;
    });
  }

  function pickTrip(trip: MockTrip) {
    setSelectedTrip(trip);
    setSelectedPlace(null);
    setStep("place");
  }

  function pickPlace(place: MockPlace) {
    setSelectedPlace(place);
    setStep("idle");
  }

  function clearLocation() {
    setSelectedTrip(null);
    setSelectedPlace(null);
    setStep("idle");
  }

  const canSubmit = text.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            if (step !== "idle") { setStep("idle"); return; }
            router.back();
          }}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">
          {step === "trip" ? "일정 선택" : step === "place" ? "장소 선택" : "새 게시물"}
        </h1>
        <button
          type="button"
          disabled={!canSubmit || step !== "idle"}
          className="rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] px-4 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          게시
        </button>
      </header>

      {/* 일정 선택 시트 */}
      {step === "trip" && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <p className="px-4 pt-4 pb-2 text-xs text-zinc-400">내 일정에서 선택하세요</p>
          <ul className="flex flex-col divide-y divide-zinc-100">
            {ALL.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  onClick={() => pickTrip(trip)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50"
                >
                  <div className={`grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br text-xs font-bold text-white ${trip.gradient}`}>
                    {trip.duration}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{trip.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{trip.date} · {trip.places}</p>
                  </div>
                  <ChevronDown size={16} className="-rotate-90 shrink-0 text-zinc-400" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 장소 선택 시트 */}
      {step === "place" && selectedTrip && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <p className="px-4 pt-4 pb-2 text-xs text-zinc-400">
            <span className="font-medium text-zinc-700">{selectedTrip.title}</span>의 장소를 선택하세요
          </p>
          <ul className="flex flex-col divide-y divide-zinc-100">
            {selectedTrip.placeList.map((place) => (
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
        </div>
      )}

      {/* 메인 작성 화면 */}
      {step === "idle" && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {images.length > 0 ? (
            <div className="relative aspect-square w-full bg-zinc-100">
              <div
                className="flex h-full transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${imgIndex * 100}%)` }}
              >
                {images.map((src, i) => (
                  <img key={i} src={src} alt="" className="h-full w-full shrink-0 object-cover" />
                ))}
              </div>

              <button
                type="button"
                onClick={() => removeImage(imgIndex)}
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
              {imgIndex < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => setImgIndex((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/80 text-zinc-800 shadow"
                >
                  <ChevronRight size={16} />
                </button>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIndex(i)}
                      className={`size-1.5 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              )}

              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <ImagePlus size={13} />
                  {images.length}/10
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
                <p className="text-sm font-medium">사진 추가</p>
                <p className="mt-0.5 text-xs text-zinc-400">최대 10장</p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
                  <button type="button" onClick={() => setStep("trip")} className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-zinc-800">{selectedPlace.name}</p>
                    <p className="text-xs text-zinc-400">{selectedPlace.address}</p>
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
                <button type="button" onClick={() => setStep("trip")} className="text-sm text-zinc-400">
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

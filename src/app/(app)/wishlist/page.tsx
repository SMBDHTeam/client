"use client";

import { useState } from "react";
import { Heart, MapPin } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { WISHLIST_PLACES } from "@/mocks/wishlist";

export default function WishlistPage() {
  const [savedIds, setSavedIds] = useState(new Set(WISHLIST_PLACES.map((p) => p.id)));

  function toggle(id: number) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const places = WISHLIST_PLACES.filter((p) => savedIds.has(p.id));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="저장한 장소" />

      <div className="flex flex-1 flex-col gap-4 px-5 pt-2 pb-8">
        <p className="text-sm text-zinc-400">
          위시리스트 <span className="font-semibold text-[#2E7DF2]">{places.length}</span>
        </p>

        {places.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center text-sm text-zinc-400">
            찜한 장소가 없어요
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
              >
                <div
                  className={`grid size-16 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white ${place.gradient}`}
                >
                  <MapPin size={22} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{place.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{place.address}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                    {place.category}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="찜 해제"
                  onClick={() => toggle(place.id)}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[#F16E5E] hover:bg-black/5"
                >
                  <Heart size={20} fill="currentColor" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

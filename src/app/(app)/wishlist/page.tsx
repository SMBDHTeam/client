"use client";

import { useEffect, useState } from "react";
import { Heart, MapPin } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";
import PlaceDetailSheet from "@/components/sheet/PlaceDetailSheet";
import { getMyWishlist, removeWishlist, WISHLIST_MAX_PAGE_SIZE } from "@/lib/api/wishlists";
import type { WishlistPlace } from "@/types/api/wishlist";
import { placeCategoryDisplay } from "@/utils/place-category";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: WishlistPlace[] };

export default function WishlistPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [removing, setRemoving] = useState<ReadonlySet<number>>(new Set());
  const [detailPlaceId, setDetailPlaceId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyWishlist()
      .then((res) => {
        if (!cancelled) setState({ status: "ready", items: res.items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  async function remove(place: WishlistPlace) {
    if (state.status !== "ready" || removing.has(place.placeId)) return;
    const index = state.items.findIndex((item) => item.placeId === place.placeId);

    // 먼저 목록에서 뺀다. 하트를 누른 즉시 사라져야 느리게 느껴지지 않는다.
    setState({ status: "ready", items: state.items.filter((item) => item.placeId !== place.placeId) });
    setRemoving((prev) => new Set(prev).add(place.placeId));
    try {
      await removeWishlist(place.placeId);
    } catch {
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        const items = [...prev.items];
        items.splice(Math.min(index, items.length), 0, place);
        return { status: "ready", items };
      });
      toast.error("찜을 해제하지 못했어요. 다시 시도해주세요.");
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(place.placeId);
        return next;
      });
    }
  }

  function handleWishlistChange(placeId: number, wishlisted: boolean) {
    if (wishlisted) {
      // 상세에서 다시 담으면 최근 순 위치를 서버가 정하므로 조용히 새로 받는다.
      setReloadKey((key) => key + 1);
      return;
    }
    setState((prev) =>
      prev.status === "ready"
        ? { status: "ready", items: prev.items.filter((item) => item.placeId !== placeId) }
        : prev,
    );
  }

  const count = state.status === "ready" ? state.items.length : null;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="찜한 장소" />

      <div className="flex flex-1 flex-col gap-4 px-5 pt-2 pb-8">
        {count != null && (
          <p className="text-sm text-zinc-400">
            찜한 장소{" "}
            <span className="font-semibold text-[#2E7DF2]">
              {count >= WISHLIST_MAX_PAGE_SIZE ? `${WISHLIST_MAX_PAGE_SIZE}+` : count}
            </span>
          </p>
        )}

        {state.status === "loading" && (
          <div className="grid flex-1 place-items-center">
            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-zinc-500">찜한 장소를 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={retry}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              다시 시도
            </button>
          </div>
        )}

        {state.status === "ready" && state.items.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-zinc-500">찜한 장소가 없어요</p>
            <p className="text-xs text-zinc-400">장소 상세에서 하트를 눌러 담아보세요</p>
          </div>
        )}

        {state.status === "ready" && state.items.length > 0 && (
          <ul className="flex flex-col gap-3">
            {state.items.map((place) => (
              <li
                key={place.placeId}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
              >
                <button
                  type="button"
                  onClick={() => setDetailPlaceId(place.placeId)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {place.primaryImageUrl ? (
                    <img
                      src={place.primaryImageUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="size-16 shrink-0 rounded-xl bg-zinc-100 object-cover"
                    />
                  ) : (
                    <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white">
                      <MapPin size={22} aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{place.name}</p>
                    {place.address && (
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{place.address}</p>
                    )}
                    {placeCategoryDisplay(place.category, place.categoryLabel) && (
                      <span className="mt-1.5 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                        {placeCategoryDisplay(place.category, place.categoryLabel)}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`${place.name} 찜 해제`}
                  onClick={() => remove(place)}
                  disabled={removing.has(place.placeId)}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[#F16E5E] hover:bg-black/5 disabled:opacity-40"
                >
                  <Heart size={20} fill="currentColor" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {detailPlaceId != null && (
        <PlaceDetailSheet
          placeId={detailPlaceId}
          onClose={() => setDetailPlaceId(null)}
          onWishlistChange={handleWishlistChange}
        />
      )}
    </div>
  );
}

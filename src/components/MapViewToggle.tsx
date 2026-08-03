"use client";

export type MapView = "2d" | "3d";

export default function MapViewToggle({
  view,
  onChange,
}: {
  view: MapView;
  onChange: (view: MapView) => void;
}) {
  return (
    <div className="absolute top-3 right-3 z-10 flex gap-0.5 rounded-full bg-white/90 p-1 shadow-md backdrop-blur">
      {(["2d", "3d"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors ${
            view === v ? "bg-[#2E7DF2] text-white" : "text-zinc-500 hover:bg-zinc-100"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

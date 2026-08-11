"use client";

import { useState } from "react";

export default function OptionChips({
  options,
  multi = false,
}: {
  options: readonly string[];
  multi?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (opt: string) => {
    setSelected((prev) => {
      if (prev.includes(opt)) return prev.filter((o) => o !== opt);
      return multi ? [...prev, opt] : [opt];
    });
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              on
                ? "border-transparent bg-[#2E7DF2] text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

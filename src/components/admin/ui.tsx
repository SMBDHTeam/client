"use client";

/**
 * 관리자 화면 공통 규격.
 *
 * <p>같은 역할의 컨트롤이 화면마다 다른 크기로 있으면 훑을 때 걸린다. 버튼 높이,
 * 글자 크기, 좌우 여백을 여기서만 정한다.
 *
 * <p>관리자는 목록과 표를 오래 본다. 사용자 앱보다 한 단계 크게 잡았다.
 */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7DF2]";

const VARIANT = {
  /** 그 화면에서 하려는 일. 한 영역에 하나만 둔다. */
  primary: "bg-zinc-900 text-white hover:bg-zinc-700",
  /** 되돌릴 수 있는 보조 동작. */
  secondary: "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
  /** 되돌릴 수 없는 동작. 색으로 한 번 더 멈추게 한다. */
  danger: "bg-rose-600 text-white hover:bg-rose-500",
  /** 예산을 쓰거나 여파가 있는 동작. */
  caution: "bg-amber-600 text-white hover:bg-amber-500",
  ghost: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
} as const;

const SIZE = {
  md: "h-9 px-4 text-sm",
  sm: "h-8 px-3 text-[13px]",
} as const;

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: {
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`${BUTTON_BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    />
  );
}

/** 목록 위의 필터. 네 화면이 같은 모양을 쓴다. */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1">
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={`h-8 shrink-0 rounded-lg px-3.5 text-[13px] font-medium transition-colors ${
            option.value === value
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** 화면 제목. 무엇을 보는 곳인지 한 줄로 말한다. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function TextInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 rounded-xl bg-white px-3.5 text-sm text-zinc-900 ring-1 ring-zinc-200 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-[#2E7DF2] ${className}`}
    />
  );
}

/** 상태 배지. 목록에서 상태는 글자보다 형태로 먼저 읽힌다. */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad" | "strong";
  children: React.ReactNode;
}) {
  const TONE = {
    neutral: "bg-zinc-100 text-zinc-600",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    strong: "bg-zinc-900 text-white",
  } as const;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
